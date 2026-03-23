package consumer

import (
	"encoding/json"
	"log"
	"strconv"
	"time"

	"github.com/IBM/sarama"
	"github.com/go-redis/redis/v8"
	"github.com/kvsb25/mobile-medical/database"
)

type ambulanceConsumerMessage struct {
	DriverID  uint `json:"driverID"`
	Region    string `json:"region"`
	Location  struct {
		Lat float64 `json:"lat"`
		Lng float64 `json:"lng"`
	} `json:"location"`
	Occupancy string `json:"occupancy"`
	Timestamp int64  `json:"timestamp"`
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

func StartAmbulanceConsumer(region string) {
	topic := region + "-ambulances"
	cfg := sarama.NewConfig()
	cfg.Consumer.Return.Errors = true
	client, err := sarama.NewConsumer(KafkaBrokerAddrs(), cfg)
	if err != nil {
		log.Printf("ambulance consumer init failed for %s: %v", region, err)
		return
	}
	partition, err := client.ConsumePartition(topic, 0, sarama.OffsetNewest)
	if err != nil {
		log.Printf("ambulance consume partition failed %s: %v", topic, err)
		return
	}
	defer partition.Close()
	defer client.Close()

	for msg := range partition.Messages() {
		var payload ambulanceConsumerMessage
		if err := json.Unmarshal(msg.Value, &payload); err != nil {
			continue
		}
		if payload.DriverID == 0 {
			continue
		}
		if payload.Timestamp == 0 {
			payload.Timestamp = time.Now().Unix()
		}
		metaKey := "ambulances:meta:" + region
		geoKey := "ambulances:geo:" + region
		driverField := strconv.FormatUint(uint64(payload.DriverID), 10)
		meta := ambulanceMeta{
			DriverID:      payload.DriverID,
			Region:        region,
			Occupancy:     payload.Occupancy,
			RequestStatus: "pending",
			LastSeen:      payload.Timestamp,
			Lat:           payload.Location.Lat,
			Lng:           payload.Location.Lng,
		}
		raw, _ := json.Marshal(meta)
		clientRedis := database.GetRedisClient()
		_ = clientRedis.HSet(database.Ctx, metaKey, driverField, string(raw)).Err()
		_ = clientRedis.GeoAdd(database.Ctx, geoKey, &redis.GeoLocation{
			Name:      driverField,
			Longitude: payload.Location.Lng,
			Latitude:  payload.Location.Lat,
		}).Err()
	}
}

