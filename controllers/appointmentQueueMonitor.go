package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/adityjoshi/aavinya/database"
	"github.com/adityjoshi/aavinya/utils"
	"gorm.io/gorm"
)

func CheckAppointmentsQueue() {
	departments := []string{"Cardiology", "Neurology", "Orthopedics", "Pediatrics", "General"}
	regions := []string{"North", "South", "East", "West"}
	hospitalIDs := []string{"1", "2", "3"}

	for _, region := range regions {
		for _, department := range departments {
			for _, hospitalID := range hospitalIDs {
				// Start the process for each region, department, and hospital
				go monitorQueueForDepartment(region, hospitalID, department)
			}
		}
	}

	select {}
}

func monitorQueueForDepartment(region, hospitalID, department string) {
	redisKey := fmt.Sprintf("appointments:%s:%s:%s", region, hospitalID, department)

	for {
		result, err := database.RedisClient.LRange(context.Background(), redisKey, 0, -1).Result()
		if err != nil {
			log.Printf("Error fetching appointments from Redis queue: %v", err)
			continue
		}

		for _, item := range result {
			var appointment database.Appointment
			if err := json.Unmarshal([]byte(item), &appointment); err != nil {
				log.Printf("Error unmarshalling appointment data: %v", err)
				continue
			}

			if appointment.IsDone {
				continue
			}

			checkAndNotifyAppointment(region, hospitalID, department, appointment, redisKey)
		}

		time.Sleep(10 * time.Second)
	}
}

func checkAndNotifyAppointment(region, hospitalID, department string, appointment database.Appointment, redisKey string) {
	var db *gorm.DB
	switch region {
	case "North":
		db = database.NorthDB
	case "South":
		db = database.SouthDB
	case "East":
		db = database.DB
	case "West":
		db = database.DB
	default:
		log.Printf("Unknown region: %v", region)
		return
	}

	count, err := database.RedisClient.LLen(context.Background(), redisKey).Result()
	if err != nil {
		log.Printf("Error counting appointments in Redis queue: %v", err)
		return
	}

	log.Printf("Number of appointments in the queue for %s:%s:%s: %d", region, hospitalID, department, count)

	position := count - 1
	log.Printf("Position of the current patient in the queue: %d", position)

	if position <= 2 {
		notifyPatientOfUpcomingAppointment(db, &appointment, region)
	}
}

func notifyPatientOfUpcomingAppointment(db *gorm.DB, appointment *database.Appointment, region string) {

	if appointment.IsDone {
		return
	}

	redisNotificationKey := fmt.Sprintf("sent_notifications:%s", region)

	alreadyNotified, err := database.RedisClient.SIsMember(context.Background(), redisNotificationKey, appointment.PatientID).Result()
	if err != nil {
		log.Printf("Error checking Redis for patient notification status: %v", err)
		return
	}

	if alreadyNotified {
		log.Printf("Patient ID %d has already been notified, skipping email.", appointment.PatientID)
		return
	}

	var patient database.Patients
	if err := db.Where("patient_id = ?", appointment.PatientID).First(&patient).Error; err != nil {
		log.Printf("Error fetching patient details for PatientID %d: %v", appointment.PatientID, err)
		return
	}

	var doctor database.Doctors
	if err := db.Where("doctor_id = ?", appointment.DoctorID).First(&doctor).Error; err != nil {
		log.Printf("Error fetching doctor details for DoctorID %d: %v", appointment.DoctorID, err)
		return
	}

	// Send the email
	fmt.Printf("Sending email to patient %s: %s, with doctor %s: %s\n", patient.FullName, patient.Email, doctor.FullName, doctor.FullName)

	err = utils.SendAppointmentComingEmail(patient.Email, doctor.FullName, appointment.AppointmentDate.Format("2006-01-02"), appointment.AppointmentTime.Format("15:04"), "December")
	if err != nil {
		log.Printf("Error sending appointment email: %v", err)
		return
	}

	fmt.Printf("Patient %s, your appointment with Dr. %s is approaching!\n", patient.FullName, doctor.FullName)

	appointment.IsDone = true

	if err := db.Save(appointment).Error; err != nil {
		log.Printf("Error updating appointment status to done for PatientID %d: %v", appointment.PatientID, err)
	}

	if err := database.RedisClient.SAdd(context.Background(), redisNotificationKey, appointment.PatientID).Err(); err != nil {
		log.Printf("Error adding PatientID %d to Redis notification set: %v", appointment.PatientID, err)
	}

	if err := database.RedisClient.Expire(context.Background(), redisNotificationKey, 10*time.Minute).Err(); err != nil {
		log.Printf("Error setting expiration for Redis notification set: %v", err)
	}
}
