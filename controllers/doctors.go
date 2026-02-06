package controllers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/adityjoshi/aavinya/database"
	"github.com/adityjoshi/aavinya/utils"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
)

func RegisterDoctor(c *gin.Context) {

	var doctorData database.Doctors

	if err := c.BindJSON(&doctorData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	adminID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	adminIDUint, ok := adminID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid admin ID"})
		return
	}
	region, exists := c.Get("region")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized region"})
		return
	}
	regionStr, ok := region.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid region type"})
		return
	}

	var hospital database.Hospitals
	db, err := database.GetDBForRegion(regionStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get database for region"})
		return
	}
	if err = db.Where("admin_id = ?", adminIDUint).First(&hospital).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Hospital not found for the admin"})
		return
	}

	password := generatePassword(doctorData.FullName, regionStr)
	doctorData.Password = password
	fmt.Print(doctorData.Password)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(doctorData.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Failed to hash password: %v", err)

	}
	doctorData.Password = string(hashedPassword)
	doctor := database.Doctors{
		FullName:      doctorData.FullName,
		Description:   doctorData.Description,
		ContactNumber: doctorData.ContactNumber,
		Email:         doctorData.Email,
		HospitalID:    hospital.HospitalId,   // Correctly set HospitalID from fetched hospital
		Hospital:      hospital.HospitalName, // Set HospitalName
		Department:    doctorData.Department,
		Password:      doctorData.Password,
		Region:        regionStr,
	}

	doctor.Username = generateDoctorUsername(doctor.HospitalID, doctor.FullName)

	if err := db.Create(&doctor).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register doctor"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Doctor registered successfully", "hospital_name": hospital.HospitalName})
}
func generatePassword(fullName, region string) string {
	return fmt.Sprintf("%s%s", fullName, region)
}

func generateDoctorUsername(hospitalID uint, doctorFullName string) string {

	doctorFullName = strings.ReplaceAll(doctorFullName, " ", "")
	return fmt.Sprintf("%d%s", hospitalID, doctorFullName)
}

func GetDoctor(c *gin.Context) {
	doctorID := c.Param("doctor_id")
	region, exists := c.Get("region")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized region"})
		return
	}
	regionStr, ok := region.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid region type"})
		return
	}

	var doctor database.Doctors
	db, err := database.GetDBForRegion(regionStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get database for region"})
		return
	}
	if err = db.First(&doctor, doctorID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Doctor not found"})
		return
	}

	var hospital database.Hospitals
	if err := db.First(&hospital, doctor.HospitalID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Hospital not found for the doctor"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"doctor_id":      doctor.DoctorID,
		"full_name":      doctor.FullName,
		"description":    doctor.Description,
		"contact_number": doctor.ContactNumber,
		"email":          doctor.Email,
		"hospital_id":    doctor.HospitalID,
		"hospital_name":  hospital.HospitalName,
		"department":     doctor.Department,
		"username":       doctor.Username,
		"region":         doctor.Region,
	})
}

func DoctorLogin(c *gin.Context) {
	var loginRequest struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Region   string `json:"region"`
	}
	if err := c.BindJSON(&loginRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var doctor database.Doctors
	db, err := database.GetDBForRegion(loginRequest.Region)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get database for region"})
		return
	}
	if err := db.Where("email = ?", loginRequest.Email).First(&doctor).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(doctor.Password), []byte(loginRequest.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Password"})
		return
	}
	otp, err := GenerateAndSendOTP(loginRequest.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate or send OTP" + otp})
		return
	}
	// func GenerateJwt(userID uint, userType, role, region string)
	token, err := utils.GenerateDoctorJwt(doctor.DoctorID, "Doctor", "Doctor", string(doctor.Department), loginRequest.Region)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Respond with message to enter OTP
	c.JSON(http.StatusOK, gin.H{"message": "OTP sent to email. Please verify the OTP.", "token": token, "region": loginRequest.Region})
}

func MarkAppointmentAsDone(c *gin.Context) {
	// Retrieve the JWT token from the Authorization header
	tokenString := c.GetHeader("Authorization")
	if tokenString == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token is missing"})
		return
	}

	// Decode the JWT token
	claims, err := utils.DecodeJwt(tokenString)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid JWT"})
		return
	}

	// Extract user_type from JWT claims
	userType, ok := claims["user_type"].(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user type"})
		return
	}

	// Ensure that only doctors are allowed to mark appointments as done
	if userType != "Doctor" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied. Only doctors can mark appointments as done."})
		return
	}

	// Extract and validate doctor-specific information from JWT claims
	doctorID, doctorIDExists := claims["doctor_id"].(float64)
	department, departmentExists := claims["department"].(string)
	region, regionExists := claims["region"].(string)

	if !doctorIDExists || !departmentExists || !regionExists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Doctor credentials are incomplete in token"})
		return
	}

	doctorIDUint := uint(doctorID) // Convert from float64 to uint

	// Set doctor info in the context for further use if needed
	c.Set("doctor_id", doctorIDUint)
	c.Set("department", department)
	c.Set("region", region)

	// Get the appointment ID from the request parameters
	appointmentIDParam := c.Param("appointment_id")
	appointmentID, err := strconv.ParseUint(appointmentIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	// Select the correct database based on the region from JWT claims
	db, err := database.GetDBForRegion(region)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect to regional database"})
		return
	}

	var hospital database.Doctors
	if err := db.Where("doctor_id = ? AND region = ?", doctorIDUint, region).First(&hospital).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve hospital ID for doctor"})
		return
	}

	hospitalID := hospital.HospitalID

	var appointment database.Appointment
	if err := db.Where("appointment_id = ? AND doctor_id = ?", appointmentID, doctorIDUint).First(&appointment).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	// Mark the appointment as done
	appointment.Appointed = true
	if err := db.Save(&appointment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update appointment status"})
		return
	}

	// Redis operations
	redisKey := fmt.Sprintf("appointments:%s:%d:%s", region, hospitalID, department)
	redisClient := database.RedisClient

	// Fetch the appointment data from Redis
	queueData, err := redisClient.LRange(c, redisKey, 0, -1).Result()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch appointments from Redis"})
		return
	}

	// Update the appointment in Redis
	for _, item := range queueData {
		var redisAppointment database.Appointment
		if err := json.Unmarshal([]byte(item), &redisAppointment); err != nil {
			continue
		}

		if redisAppointment.AppointmentID == uint(appointmentID) {
			redisAppointment.Appointed = true

			updatedData, err := json.Marshal(redisAppointment)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal updated appointment"})
				return
			}

			// Remove the old record and push the updated one
			redisClient.LRem(c, redisKey, 0, item)
			redisClient.RPush(c, redisKey, updatedData)

			break
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Appointment marked as done successfully"})
}

// Handler to check and remove a patient from the Redis queue
func RemoveAppointmentFromQueue(c *gin.Context) {
	// Extract the appointment ID from the URL or request body
	appointID := c.Param("appointment_id") // Expecting appointment ID as a URL parameter or in the request body

	if appointID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Appointment ID is required"})
		return
	}

	// Convert the appointment ID to uint (since it should be a positive integer)
	appointmentID, err := strconv.ParseUint(appointID, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	// Construct the Redis key for the queue (modify as needed)
	redisKey := fmt.Sprintf("appointments:%s:%s:%s", "North", "2", "Cardiology") // Modify as per your actual use case

	// Call the function to remove the appointment from the Redis queue
	err = removeAppointmentFromQueue(redisKey, uint(appointmentID)) // Convert to uint
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Appointment removed from queue successfully"})
}

// Function to remove an appointment from the Redis queue
func removeAppointmentFromQueue(redisKey string, appointID uint) error {
	// Get the list from Redis
	result, err := database.RedisClient.LRange(database.Ctx, redisKey, 0, -1).Result()
	if err != nil {
		return fmt.Errorf("failed to fetch data from Redis: %v", err)
	}

	// Search for the appointment ID in the list
	var found bool
	var indexToRemove int
	for i, item := range result {
		// Assuming the item is a JSON string that contains an appointment ID
		var appointment database.Appointment
		err := json.Unmarshal([]byte(item), &appointment)
		if err != nil {
			continue // Skip this item if it can't be unmarshalled
		}

		if appointment.AppointmentID == appointID { // Now comparing with uint AppointmentID
			found = true
			indexToRemove = i
			break
		}
	}

	if !found {
		return fmt.Errorf("appointment with ID %d not found in queue", appointID)
	}

	// Remove the appointment from the queue using LREM
	err = database.RedisClient.LRem(database.Ctx, redisKey, 0, result[indexToRemove]).Err()
	if err != nil {
		return fmt.Errorf("failed to remove appointment from Redis queue: %v", err)
	}

	return nil
}

func GetAllDoctorsData(c *gin.Context) {
	region, exists := c.Get("region")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized region"})
		return
	}
	regionStr, ok := region.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid region type"})
		return
	}
	var doctors []database.Doctors
	db, err := database.GetDBForRegion(regionStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get database for region"})
		return
	}
	if err = db.Find(&doctors).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Doctors not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"doctors": doctors,
	})
}
