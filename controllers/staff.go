package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/adityjoshi/aavinya/database"
	kafkamanager "github.com/adityjoshi/aavinya/kafka/kafkaManager"
	"github.com/adityjoshi/aavinya/utils"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func StaffLogin(c *gin.Context) {
	var loginRequest struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Region   string `json:"region"`
	}
	if err := c.BindJSON(&loginRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// region check

	var staff database.HospitalStaff
	db, err := database.GetDBForRegion(loginRequest.Region)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get database for region"})
		return
	}
	if err = db.Where("email = ?", loginRequest.Email).First(&staff).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Compare the provided password with the hashed password in the database
	if err := bcrypt.CompareHashAndPassword([]byte(staff.Password), []byte(loginRequest.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid password"})
		return
	}

	// Generate and send OTP
	otp, err := GenerateAndSendOTP(loginRequest.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate or send OTP" + otp})
		return
	}

	// Generate JWT token
	token, err := utils.GenerateJwt(staff.StaffID, "Staff", string(staff.Position), loginRequest.Region)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Respond with message to enter OTP
	c.JSON(http.StatusOK, gin.H{"message": "OTP sent to email. Please verify the OTP.", "token": token})
}
func VerifyStaffOTP(c *gin.Context) {
	var otpRequest struct {
		Email string `json:"email"`
		OTP   string `json:"otp"`
	}
	if err := c.BindJSON(&otpRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify the OTP
	isValid, err := VerifyOtp(otpRequest.Email, otpRequest.OTP)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error verifying OTP"})
		return
	}
	if !isValid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid OTP"})
		return
	}

	// Retrieve user information after OTP verification
	var staff database.HospitalStaff
	region, exists := c.Get("region")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Region not specified"})
		return
	}
	regionStr, ok := region.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid region type"})
		return
	}
	db, err := database.GetDBForRegion(regionStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get database for region"})
		return
	}
	if err = db.Where("email = ?", otpRequest.Email).First(&staff).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Staff not found"})
		return
	}

	// Set OTP verification status in Redis
	redisClient := database.GetRedisClient()
	err = redisClient.Set(context.Background(), "otp_verified:"+strconv.Itoa(int(staff.StaffID)), "verified", 0).Err()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error setting OTP verification status"})
		return
	}

	tokenString := c.GetHeader("Authorization")
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

	c.JSON(http.StatusOK, gin.H{"loggedin": "success", "user": userType, "staff": database.Staff})
}

func RegisterPatient(c *gin.Context) {
	km, exists := c.Get("km")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "KafkaManager not found"})
		return
	}

	kafkaManager, ok := km.(*kafkamanager.KafkaManager)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid KafkaManager"})
		return
	}

	var patient database.Patients
	if err := c.BindJSON(&patient); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get staff ID from JWT or context
	staffID, exists := c.Get("staff_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	staffIDUint, ok := staffID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid staff ID"})
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
	var staff database.HospitalStaff
	db, err := database.GetDBForRegion(regionStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get database for region"})
		return
	}
	if err = db.Where("staff_id = ?", staffIDUint).First(&staff).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve staff details"})
		return
	}

	// Set the HospitalID based on the staff's hospital
	patient.HospitalID = staff.HospitalID
	patient.Region = regionStr

	patientRegistrationMessage, err := json.Marshal(patient)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal hospital admin data to JSON"})
		return
	}
	// Send the registration message to Kafka based on the region
	var errKafka error
	switch region {
	case "north":
		// Send to North region's Kafka topic (you provide the topic name)
		errKafka = kafkaManager.SendUserRegistrationMessage(regionStr, "patient_registration", string(patientRegistrationMessage))
	case "south":
		// Send to South region's Kafka topic (you provide the topic name)
		errKafka = kafkaManager.SendUserRegistrationMessage(regionStr, "patient_registration", string(patientRegistrationMessage))
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid region: %s", region)})
		return
	}

	// Check if there was an error sending the message to Kafka
	if errKafka != nil {
		log.Printf("Failed to send registration data to Kafka: %v", errKafka)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send data to Kafka"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Patient registered successfully",
		"patient": patient,
		"StaffID": staffIDUint,
	})
}

// AdmitPatientForHospitalization handles bed assignment and patient data without marking hospitalization
func AdmitPatientForHospitalization(c *gin.Context) {
	// var reqData struct {
	// 	FullName      string `json:"full_name"`
	// 	ContactNumber string `json:"contact_number"`
	// 	BedType       string `json:"bed_type"`     // e.g., ICU, GeneralWard
	// 	DoctorName    string `json:"doctor_name"`  // Doctor responsible for the patient
	// 	PaymentFlag   bool   `json:"payment_flag"` // Payment status of the patient
	// }

	km, exists := c.Get("km")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "KafkaManager not found"})
		return
	}

	kafkaManager, ok := km.(*kafkamanager.KafkaManager)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid KafkaManager"})
		return
	}
	var patient_beds database.PatientBeds
	// Parse the JSON request body
	if err := c.BindJSON(&patient_beds); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}
	log.Printf("Received patient bed type: %s", patient_beds.PatientBedType)

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
	// Check if the patient exists in the system
	var patient database.Patients
	db, err := database.GetDBForRegion(regionStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get database for region"})
		return
	}
	if err = db.Where("full_name = ? AND contact_number = ?", patient_beds.FullName, patient_beds.ContactNumber).First(&patient).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
		return
	}

	// Use the passed payment flag for validation
	if !patient_beds.PaymentFlag {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment not completed"})
		return
	}
	var staff database.HospitalStaff
	if err := db.Where("hospital_id = ?", patient.HospitalID).First(&staff).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch hospital staff details"})
		return
	}

	// Check bed availability in the requested bed type
	var bedCount database.BedsCount
	bed := patient_beds.PatientBedType
	if bed == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bed type is required"})
		return
	}

	if err := db.Where("hospital_id = ? AND type_name = ?", staff.HospitalID, bed).First(&bedCount).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bed type not found in the hospital"})
		return
	}

	// Get the number of already assigned beds
	var assignedBedsCount int64
	if err := db.Model(&database.PatientBeds{}).Where("hospital_id = ? AND patient_bed_type = ?", patient.HospitalID, patient_beds.PatientBedType).Count(&assignedBedsCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count assigned beds"})
		return
	}

	// Check if there's any available bed
	if uint(assignedBedsCount) >= bedCount.TotalBeds {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No available beds"})
		return
	}

	// Fetch the available room for the given bed type
	var availableRoom database.Room
	if err := db.Where("hospital_id = ? AND bed_type = ? AND is_occupied = ?", patient.HospitalID, patient_beds.PatientBedType, false).First(&availableRoom).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No available room for the given bed type"})
		return
	}

	// Fetch the hospital details (assuming the staff is authorized)

	patient_beds.Email = patient.Email
	patient_beds.Address = patient.Address
	patient_beds.City = patient.City
	patient_beds.State = patient.City
	patient_beds.PinCode = patient.PinCode
	patient_beds.Gender = patient.Gender
	patient_beds.Adhar = patient.Adhar
	patient_beds.HospitalID = staff.HospitalID
	patient_beds.HospitalName = staff.HospitalName
	patient_beds.HospitalUsername = staff.Username
	patient_beds.PatientRoomNo = availableRoom.RoomNumber

	patientAdmit, err := json.Marshal(patient_beds)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal hospital admin data to JSON"})
		return
	}
	// Send the registration message to Kafka based on the region
	var errKafka error
	switch region {
	case "north":
		// Send to North region's Kafka topic (you provide the topic name)
		errKafka = kafkaManager.SendUserRegistrationMessage(regionStr, "patient_Admit", string(patientAdmit))
	case "south":
		// Send to South region's Kafka topic (you provide the topic name)
		errKafka = kafkaManager.SendUserRegistrationMessage(regionStr, "patient_Admit", string(patientAdmit))
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid region: %s", region)})
		return
	}

	// Check if there was an error sending the message to Kafka
	if errKafka != nil {
		log.Printf("Failed to send registration data to Kafka: %v", errKafka)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send data to Kafka"})
		return
	}

	// Mark the room as occupied
	availableRoom.IsOccupied = true
	if err := database.DB.Save(&availableRoom).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update room status"})
		return
	}

	// message := fmt.Sprintf("Patient %s with ID %d has completed the payment.", patient.FullName, patient.PatientID)
	// if err := database.RedisClient.Publish(database.Ctx, "patient_updates", message).Err(); err != nil {
	// 	c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to notify compounder"})
	// 	return
	// }

	c.JSON(http.StatusOK, gin.H{
		"message":       "Patient admitted successfully",
		"bed_type":      patient_beds.PatientBedType,
		"assigned_room": availableRoom.RoomNumber,
		"hospital_name": staff.HospitalName,
	})
}

func CompounderLogin(c *gin.Context) {
	var reqData struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		Region   string `json:"region"`
	}

	// Parse login credentials
	if err := c.BindJSON(&reqData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Find the compounder by email
	var compounder database.HospitalStaff
	db, err := database.GetDBForRegion(reqData.Region)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get database for region"})
		return
	}
	if err = db.Where("email = ?", reqData.Email).First(&compounder).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Verify password (assuming passwords are hashed)
	if err := bcrypt.CompareHashAndPassword([]byte(compounder.Password), []byte(reqData.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// Generate JWT token
	token, err := utils.GenerateJwt(compounder.StaffID, "Staff", "Compounder", reqData.Region)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Send the token to the client
	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"token":   token,
	})
}
func MarkPatientAsHospitalized(c *gin.Context) {
	var reqData struct {
		PatientID uint `json:"patient_id"`
	}

	// Parse the JSON request body
	if err := c.BindJSON(&reqData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Get compounder ID from the JWT claims
	staffID, exists := c.Get("staff_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Check if the patient bed record exists
	var patientBed database.PatientBeds
	if err := database.DB.Where("patient_id = ?", reqData.PatientID).First(&patientBed).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Patient bed record not found"})
		return
	}

	// Mark the patient as hospitalized
	patientBed.Hospitalized = true
	if err := database.DB.Save(&patientBed).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update hospitalization status"})
		return
	}

	// Publish event to Redis to notify other services (e.g., admin or notifications)
	redisClient := database.GetRedisClient()
	err := redisClient.Publish(database.Ctx, "hospitalized_updates", fmt.Sprintf("Patient %d has been hospitalized by Compounder %d", reqData.PatientID, staffID)).Err()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to publish hospitalization event"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Patient successfully marked as hospitalized", "compunderid": staffID})
}

func GetRoomAssignments(c *gin.Context) {

	// Fetch all room assignments
	var roomAssignments []database.PatientBeds
	if err := database.DB.Find(&roomAssignments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch room assignments"})
		return
	}

	var response []gin.H
	for _, assignment := range roomAssignments {
		response = append(response, gin.H{
			"patient_id":        assignment.PatientID,
			"full_name":         assignment.FullName,
			"contact_number":    assignment.ContactNumber,
			"email":             assignment.Email,
			"address":           assignment.Address,
			"city":              assignment.City,
			"state":             assignment.State,
			"pin_code":          assignment.PinCode,
			"gender":            assignment.Gender,
			"adhar":             assignment.Adhar,
			"hospital_id":       assignment.HospitalID,
			"hospital_name":     assignment.HospitalName,
			"hospital_username": assignment.HospitalUsername,
			"doctor_name":       assignment.DoctorName,
			"hospitalized":      assignment.Hospitalized,
			"patient_bed_type":  assignment.PatientBedType,
			"patient_room_no":   assignment.PatientRoomNo,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"rooms_assignments": response,
	})
}

/*

AdmitPatient:
Accepts a much simpler payload containing just BedID, BedType, and IsAdmitted.
Checks if the requested bed is available.
Only updates the bed’s occupied status without involving patient details.


*/

func AdmitPatient(c *gin.Context) {
	// Get KafkaManager from context
	km, exists := c.Get("km")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "KafkaManager not found"})
		return
	}

	kafkaManager, ok := km.(*kafkamanager.KafkaManager)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid KafkaManager"})
		return
	}

	// Define struct to capture the incoming JSON request
	var reqData struct {
		BedID      string `json:"patient_room_no"`
		BedType    string `json:"patient_bed_type"`
		IsAdmitted bool   `json:"is_admitted"`
	}

	// Parse the incoming JSON data
	if err := c.BindJSON(&reqData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Check for the region from the context
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

	// Retrieve the correct database connection for the region
	db, err := database.GetDBForRegion(regionStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get database for region"})
		return
	}

	// Find the bed based on both BedID and BedType
	var bed database.PatientBeds
	if err := db.Where("patient_room_no = ? AND patient_bed_type = ?", reqData.BedID, reqData.BedType).First(&bed).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bed not found"})
		return
	}
	if bed.Hospitalized {
		c.JSON(http.StatusConflict, gin.H{"error": fmt.Sprintf("Bed %s of type %s is already occupied", reqData.BedID, reqData.BedType)})
		return
	}

	// Check if patient is being admitted and update the bed status accordingly

	// Prepare the admission message for Kafka
	admitMessage := struct {
		BedID      string `json:"patient_room_no"`
		BedType    string `json:"patient_bed_type"`
		IsAdmitted bool   `json:"is_admitted"`
	}{
		BedID:      reqData.BedID,
		BedType:    reqData.BedType,
		IsAdmitted: reqData.IsAdmitted,
	}

	// Marshal the admission data into JSON format
	admitMessageJSON, err := json.Marshal(admitMessage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal admission data to JSON"})
		return
	}

	// Send the patient admission data to Kafka
	var errKafka error
	switch regionStr {
	case "north":
		errKafka = kafkaManager.SendUserRegistrationMessage(regionStr, "patient_admission", string(admitMessageJSON))
	case "south":
		errKafka = kafkaManager.SendUserRegistrationMessage(regionStr, "patient_admission", string(admitMessageJSON))
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid region: %s", regionStr)})
		return
	}

	// Check if there was an error sending the message to Kafka
	if errKafka != nil {
		log.Printf("Failed to send admission data to Kafka: %v", errKafka)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send data to Kafka"})
		return
	}

	// Save the updated bed status in the database

	// Return success response
	c.JSON(http.StatusOK, gin.H{"message": "Patient admitted successfully"})
}
func GetAllPatientDetails(c *gin.Context) {
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
	staffID, exists := c.Get("staff_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	staffIDUint, ok := staffID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid staff ID"})
		return
	}
	fmt.Print(staffIDUint)	//changed
	
	db, err := database.GetDBForRegion(regionStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get database for region"})
		return
	}

	var hospital database.HospitalStaff
	err = db.Select("hospital_id").Where("staff_id = ?", staffIDUint).First(&hospital).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Hospital not found for this staff ID"})
		return
	}

	fmt.Printf("Hospital ID: %d\n", hospital.HospitalID)	//changed

	var patients []database.Patients
	err = db.Where("hospital_id = ?", hospital.HospitalID).Find(&patients).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No patients found for this hospital"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"patients": patients})
	// var patientResponses []map[string]interface{}
	// for _, patient := range patients {
	// 	patientData := map[string]interface{}{
	// 		"patient_id":     patient.PatientID,
	// 		"full_name":      patient.FullName,
	// 		"contact_number": patient.ContactNumber,
	// 		"address":        patient.Address,
	// 		"city":           patient.City,
	// 		"state":          patient.State,
	// 		"pin_code":       patient.PinCode,
	// 		"gender":         patient.Gender,
	// 		"hospital_id":    patient.HospitalID,
	// 		"region":         patient.Region,
	// 	}
	// 	patientResponses = append(patientResponses, patientData)
	// }

	// c.JSON(http.StatusOK, gin.H{"patients": patientResponses})
}

func GetAllDoctorsDetails(c *gin.Context) {
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
	staffID, exists := c.Get("staff_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	staffIDUint, ok := staffID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid staff ID"})
		return
	}

	db, err := database.GetDBForRegion(regionStr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get database for region"})
		return
	}

	var hospital database.HospitalStaff
	err = db.Select("hospital_id").Where("staff_id = ?", staffIDUint).First(&hospital).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Hospital not found for this staff ID"})
		return
	}
	fmt.Printf("Hospital ID: %d\n", hospital.HospitalID)

	var doctors []database.Doctors
	err = db.Where("hospital_id = ?", hospital.HospitalID).Find(&doctors).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No patients found for this hospital"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"doctors": doctors})
}
