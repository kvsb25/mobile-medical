package controllers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/gin-gonic/gin"
	"github.com/kvsb25/mobile-medical/database"
	kafkamanager "github.com/kvsb25/mobile-medical/kafka/kafkaManager"
	"github.com/kvsb25/mobile-medical/utils"
	"golang.org/x/crypto/bcrypt"
)

const (
	ambulanceMetaKeyPrefix = "ambulances:meta:"
	ambulanceGeoKeyPrefix  = "ambulances:geo:"
	defaultSSEIntervalSec  = 60
)

type ambulanceUpdatePayload struct {
	DriverID  uint `json:"driverID"`
	Location  struct {
		Lat float64 `json:"lat"`
		Lng float64 `json:"lng"`
	} `json:"location"`
	Occupancy string `json:"occupancy"`
}

func RegisterAmbulanceDriver(c *gin.Context) {
	var req struct {
		FullName  string `json:"full_name"`
		Email     string `json:"email"`
		Password  string `json:"password"`
		VehicleNo string `json:"vehicle_no"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	adminIDAny, ok := c.Get("admin_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "admin context missing"})
		return
	}
	adminID, ok := adminIDAny.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid admin id"})
		return
	}
	regionAny, _ := c.Get("region")
	region, _ := regionAny.(string)
	db, err := database.GetDBForRegion(region)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to resolve region database"})
		return
	}

	var hospital database.Hospitals
	if err := db.Where("admin_id = ?", adminID).First(&hospital).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "hospital not found for admin"})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	driver := database.AmbulanceDriver{
		FullName:   req.FullName,
		Email:      strings.TrimSpace(strings.ToLower(req.Email)),
		Password:   string(hashed),
		VehicleNo:  strings.TrimSpace(req.VehicleNo),
		HospitalID: hospital.HospitalId,
		Region:     region,
		UserType:   string(database.Driver),
	}
	if err := db.Create(&driver).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to register ambulance driver"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":   "ambulance driver registered",
		"driver_id": driver.DriverID,
	})
}

func AmbulanceDriverLogin(c *gin.Context) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Region   string `json:"region"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db, err := database.GetDBForRegion(req.Region)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid region"})
		return
	}
	var driver database.AmbulanceDriver
	if err := db.Where("email = ?", strings.TrimSpace(strings.ToLower(req.Email))).First(&driver).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(driver.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	token, err := utils.GenerateJwt(driver.DriverID, string(database.Driver), string(database.Driver), req.Region)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"token":     token,
		"region":    req.Region,
		"driver_id": driver.DriverID,
		"role":      string(database.Driver),
	})
}

func UpdateAmbulanceState(c *gin.Context) {
	kmAny, exists := c.Get("km")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "KafkaManager not found"})
		return
	}
	km, ok := kmAny.(*kafkamanager.KafkaManager)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid KafkaManager"})
		return
	}

	var payload ambulanceUpdatePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	regionAny, _ := c.Get("region")
	region, _ := regionAny.(string)
	userIDAny, _ := c.Get("user_id")
	driverIDFromToken, _ := userIDAny.(uint)
	if payload.DriverID == 0 || payload.DriverID != driverIDFromToken {
		c.JSON(http.StatusForbidden, gin.H{"error": "driver id mismatch"})
		return
	}
	if payload.Occupancy != "available" && payload.Occupancy != "occupied" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "occupancy must be available or occupied"})
		return
	}

	msg := map[string]interface{}{
		"driverID":  payload.DriverID,
		"region":    region,
		"location":  payload.Location,
		"occupancy": payload.Occupancy,
		"timestamp": time.Now().Unix(),
	}
	raw, err := json.Marshal(msg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "marshal failed"})
		return
	}
	if err := km.SendAmbulanceLocationMessage(region, string(raw)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ambulance update queued"})
}

func RequestAmbulance(c *gin.Context) {
	var req struct {
		Lat      float64 `json:"lat"`
		Lng      float64 `json:"lng"`
		RadiusKm float64 `json:"radiusKm"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	regionAny, _ := c.Get("region")
	region, _ := regionAny.(string)
	if req.RadiusKm != 5 && req.RadiusKm != 10 {
		req.RadiusKm = 5
	}
	nearest, err := nearestAvailableAmbulance(region, req.Lat, req.Lng, req.RadiusKm)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "no available ambulance in radius"})
		return
	}

	metaKey := ambulanceMetaKeyPrefix + region
	client := database.GetRedisClient()
	nearest.RequestStatus = "accepted"
	nearest.Occupancy = "occupied"
	buf, _ := json.Marshal(nearest)
	_ = client.HSet(database.Ctx, metaKey, strconv.FormatUint(uint64(nearest.DriverID), 10), string(buf)).Err()

	c.JSON(http.StatusOK, gin.H{
		"message":   "ambulance assigned",
		"ambulance": nearest,
	})
}

func MarkAmbulanceAvailable(c *gin.Context) {
	regionAny, _ := c.Get("region")
	region, _ := regionAny.(string)
	userIDAny, _ := c.Get("user_id")
	driverID, _ := userIDAny.(uint)
	metaKey := ambulanceMetaKeyPrefix + region
	client := database.GetRedisClient()
	field := strconv.FormatUint(uint64(driverID), 10)
	data, err := client.HGet(database.Ctx, metaKey, field).Result()
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "driver state not found"})
		return
	}
	var meta ambulanceMeta
	if err := json.Unmarshal([]byte(data), &meta); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid metadata"})
		return
	}
	meta.Occupancy = "available"
	meta.RequestStatus = "closed"
	meta.LastSeen = time.Now().Unix()
	buf, _ := json.Marshal(meta)
	_ = client.HSet(database.Ctx, metaKey, field, string(buf)).Err()
	c.JSON(http.StatusOK, gin.H{"message": "ambulance marked available"})
}

func StreamNearbyAmbulances(c *gin.Context) {
	region := c.Query("region")
	if region == "" {
		regionAny, _ := c.Get("region")
		region, _ = regionAny.(string)
	}
	lat, err := strconv.ParseFloat(c.Query("lat"), 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid lat"})
		return
	}
	lng, err := strconv.ParseFloat(c.Query("lng"), 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid lng"})
		return
	}
	radiusKm, _ := strconv.ParseFloat(c.DefaultQuery("radiusKm", "5"), 64)
	if radiusKm != 5 && radiusKm != 10 {
		radiusKm = 5
	}
	intervalSec, _ := strconv.Atoi(c.DefaultQuery("intervalSec", strconv.Itoa(defaultSSEIntervalSec)))
	if intervalSec < 20 {
		intervalSec = 20
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Stream(func(w io.Writer) bool {
		results, _ := getNearbyAvailableAmbulances(region, lat, lng, radiusKm)
		payload, _ := json.Marshal(gin.H{
			"ambulances": results,
			"radiusKm":   radiusKm,
			"region":     region,
			"timestamp":  time.Now().Unix(),
		})
		c.SSEvent("ambulances", string(payload))
		time.Sleep(time.Duration(intervalSec) * time.Second)
		return true
	})
}

type ambulanceMeta struct {
	DriverID      uint    `json:"driverID"`
	HospitalID    uint    `json:"hospitalID"`
	Region        string  `json:"region"`
	Occupancy     string  `json:"occupancy"`
	RequestStatus string  `json:"requestStatus"`
	LastSeen      int64   `json:"lastSeen"`
	Lat           float64 `json:"lat"`
	Lng           float64 `json:"lng"`
}

func getNearbyAvailableAmbulances(region string, lat, lng, radiusKm float64) ([]ambulanceMeta, error) {
	client := database.GetRedisClient()
	geoKey := ambulanceGeoKeyPrefix + region
	metaKey := ambulanceMetaKeyPrefix + region

	entries, err := client.GeoRadius(database.Ctx, geoKey, lng, lat, &redis.GeoRadiusQuery{
		Radius:      radiusKm,
		Unit:        "km",
		Count:       50,
		Sort:        "ASC",
		WithCoord:   true,
		WithDist:    true,
	}).Result()
	if err != nil {
		return nil, err
	}

	out := make([]ambulanceMeta, 0, len(entries))
	now := time.Now().Unix()
	for _, e := range entries {
		metaJSON, err := client.HGet(database.Ctx, metaKey, e.Name).Result()
		if err != nil {
			continue
		}
		var meta ambulanceMeta
		if err := json.Unmarshal([]byte(metaJSON), &meta); err != nil {
			continue
		}
		if meta.Occupancy != "available" {
			continue
		}
		// stale pruning: 3 x 60s
		if now-meta.LastSeen > 180 {
			continue
		}
		out = append(out, meta)
	}
	return out, nil
}

func nearestAvailableAmbulance(region string, lat, lng, radiusKm float64) (ambulanceMeta, error) {
	list, err := getNearbyAvailableAmbulances(region, lat, lng, radiusKm)
	if err != nil || len(list) == 0 {
		return ambulanceMeta{}, fmt.Errorf("no available ambulance")
	}
	return list[0], nil
}

