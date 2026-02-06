package consumer

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/IBM/sarama"
	"github.com/adityjoshi/aavinya/database"
	"github.com/adityjoshi/aavinya/utils"
	"golang.org/x/crypto/bcrypt"
)

type NorthConsumer struct {
	Consumer sarama.Consumer
	Topics   []string
}

// NewNorthConsumer initializes a new Kafka consumer for the north region (multiple topics)
func NewNorthConsumer(broker string, topics []string) (*NorthConsumer, error) {
	config := sarama.NewConfig()
	config.Consumer.Return.Errors = true

	// Create the consumer
	consumer, err := sarama.NewConsumer([]string{broker}, config)
	if err != nil {
		log.Printf("Error creating consumer: %v", err)
		return nil, fmt.Errorf("error creating consumer: %v", err)
	}

	log.Printf("Kafka consumer created successfully, subscribing to topics: %v", topics)

	// Return a NorthConsumer instance with the list of topics
	return &NorthConsumer{Consumer: consumer, Topics: topics}, nil
}

// Listen starts the consumer and listens for messages on the specified topics
func (nc *NorthConsumer) Listen() {
	defer func() {
		if err := nc.Consumer.Close(); err != nil {
			log.Printf("Error closing consumer: %v\n", err)
		}
	}()

	// Create a consumer for each topic, listening to partition 0 for each one
	for _, topic := range nc.Topics {
		partitionConsumer, err := nc.Consumer.ConsumePartition(topic, 0, sarama.OffsetNewest)
		if err != nil {
			log.Fatalf("Failed to start consumer for partition 0 of topic %s: %v", topic, err)
		}
		defer partitionConsumer.Close()

		// Log that the consumer has started listening
		log.Printf("Consumer is now listening to topic: %s from partition 0\n", topic)

		// Start a goroutine for each topic to consume messages concurrently
		go nc.consumeMessages(partitionConsumer)
	}

	// Block indefinitely (since we're listening to multiple topics concurrently)
	select {}
}

// consumeMessages handles message consumption for each topic
func (nc *NorthConsumer) consumeMessages(partitionConsumer sarama.PartitionConsumer) {
	for msg := range partitionConsumer.Messages() {
		// Log received message and metadata
		log.Printf("Received message from topic %s: %s\n", msg.Topic, string(msg.Value))
		log.Printf("Message metadata - Partition: %d, Offset: %d\n", msg.Partition, msg.Offset)

		// Process the message (e.g., save data to the database or trigger further actions)
		if err := processMessage(msg.Topic, msg); err != nil {
			log.Printf("Error processing message: %v", err)
		} else {
			log.Printf("Message processed successfully")
		}
	}
}

// processMessage is a placeholder function for processing the received Kafka message
func processMessage(topic string, msg *sarama.ConsumerMessage) error {
	if database.NorthDB == nil {
		log.Fatal("NorthDB is not initialized!")
		return fmt.Errorf("NorthDB is not initialized")
	}

	log.Printf("Processing message: %s \n", string(msg.Value))
	switch topic {
	case "hospital_admin":
		// Process hospital admin messages
		log.Printf("Processing hospital_admin message: %s", string(msg.Value))

		var admin database.HospitalAdmin
		if err := json.Unmarshal(msg.Value, &admin); err != nil {
			log.Printf("Failed to unmarshal hospital_admin message: %v", err)
			return err
		}
		if err := database.NorthDB.Create(&admin); err != nil {
			log.Printf("Failed to save hospital_admin data: %v", err.Error)
			return fmt.Errorf("Failed to write to the DB", err.Error, err)
		}
		// Add your logic for processing hospital_admin messages here

	case "hospital_registration":
		log.Printf("Processing hospital_registration message: %s", string(msg.Value))

		var hospital database.Hospitals
		if err := json.Unmarshal(msg.Value, &hospital); err != nil {
			log.Printf("Error unmarshalling hospital data: %v", err)
			return err

		}
		hospital.Username = fmt.Sprintf("DEL%d", hospital.HospitalId)

		if err := database.NorthDB.Create(&hospital).Error; err != nil {
			log.Printf("Error creating hospital in database: %v", err)
			return fmt.Errorf(err.Error(), err)
		}

	case "hospital_staff":
		log.Printf("Processing hospital_staff registration message: %s", string(msg.Value))

		var staff database.HospitalStaff
		err := json.Unmarshal(msg.Value, &staff)
		if err != nil {
			log.Printf("Failed to unmarshal hospital staff data: %v", err)
			return fmt.Errorf("failed to unmarshal staff data: %v", err)
		}

		password := generatePassword(staff.FullName, staff.ContactNumber)
		staff.Password = password

		utils.SendLoginDetailsEmail(staff.Email, staff.FullName, staff.Password)
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(staff.Password), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("Failed to hash password: %v", err)
			return fmt.Errorf("failed to hash password: %v", err)
		}
		staff.Password = string(hashedPassword)
		staff.Username = fmt.Sprintf("%s%s", staff.ContactNumber, strings.ReplaceAll(strings.ToLower(staff.FullName), " ", ""))

		// Save the staff to the database
		if err := database.NorthDB.Create(&staff).Error; err != nil {
			log.Printf("Failed to save staff data to database: %v", err)
			return fmt.Errorf("failed to save staff data to database: %v", err)
		}

		log.Printf("Staff member created successfully with ID: %d", staff.StaffID)
		return nil
	case "patient_registration":
		log.Printf("Processing patient_registration message: %s", string(msg.Value))

		var patients database.Patients
		if err := json.Unmarshal(msg.Value, &patients); err != nil {
			log.Printf("Error unmarshalling patients data: %v", err)
			return err

		}

		if err := database.NorthDB.Create(&patients).Error; err != nil {
			log.Printf("Error creating patients in database: %v", err)
			return fmt.Errorf(err.Error(), err)
		}
	case "patient_Admit":
		log.Printf("Processing patient_registration message: %s", string(msg.Value))

		var patient_Admit database.PatientBeds
		if err := json.Unmarshal(msg.Value, &patient_Admit); err != nil {
			log.Printf("Error unmarshalling patient_admit data: %v", err)
			return err

		}

		if err := database.NorthDB.Create(&patient_Admit).Error; err != nil {
			log.Printf("Error creating patients in database: %v", err)
			return fmt.Errorf(err.Error())
		}
		var availableRoom database.Room
		availableRoom.IsOccupied = true
		if err := database.NorthDB.Save(&availableRoom).Error; err != nil {
			log.Printf("Error saving patient_admit data: %v", err)
			return err
		}

		message := fmt.Sprintf("Patient %s with ID %d is coming for hospitalization and has been assigned bed number %d.", patient_Admit.PatientID, patient_Admit.FullName, patient_Admit.PatientRoomNo, patient_Admit.PatientRoomNo)
		publishPatientCountUpdate("North", 1)

		// Publish the message to Redis to notify other services (e.g., compounder, dashboard)
		if err := database.RedisClient.Publish(database.Ctx, "patient_admission", message).Err(); err != nil {
			log.Printf("Error publishing patient admission notification to Redis: %v", err)
			return fmt.Errorf("failed to notify compounder via Redis: %v", err)
		}

	case "patient_admission":
		log.Printf("Processing patient_admission message: %s", string(msg.Value))

		var patientAdmit struct {
			BedID      string `json:"patient_room_no"`
			BedType    string `json:"patient_bed_type"`
			IsAdmitted bool   `json:"is_admitted"`
		}

		// Unmarshal the Kafka message into patientAdmit struct
		if err := json.Unmarshal(msg.Value, &patientAdmit); err != nil {
			log.Printf("Error unmarshalling patient_admit data: %v", err)
			return err
		}

		// Find the bed based on BedID (patient_room_no) and BedType
		var bed database.PatientBeds
		if err := database.NorthDB.Where("patient_room_no = ? AND patient_bed_type = ?", patientAdmit.BedID, patientAdmit.BedType).First(&bed).Error; err != nil {
			// If no bed is found, log an error and return
			log.Printf("Error finding bed with room number %s and bed type %s: %v", patientAdmit.BedID, patientAdmit.BedType, err)
			return fmt.Errorf("Error finding bed with room number %s and bed type %s: %v", patientAdmit.BedID, patientAdmit.BedType, err)
		}

		// Update the 'Hospitalized' field to reflect admission status
		bed.Hospitalized = patientAdmit.IsAdmitted

		// Save the updated bed status to the database
		if err := database.NorthDB.Save(&bed).Error; err != nil {
			log.Printf("Error saving bed data for room %s and bed type %s: %v", patientAdmit.BedID, patientAdmit.BedType, err)
			return fmt.Errorf("Error saving bed data: %v", err)
		}

		log.Printf("Patient admission status updated successfully for bed %s (%s). Hospitalized: %v", patientAdmit.BedID, patientAdmit.BedType, bed.Hospitalized)
		return nil

	case "appointment_reg":
		log.Printf("Processing appointment registration message: %s", string(msg.Value))

		// Unmarshal the message into the appointment struct
		var appointment database.Appointment
		if err := json.Unmarshal(msg.Value, &appointment); err != nil {
			log.Printf("Error unmarshalling appointment data: %v", err)
			return err
		}

		// Save the appointment to the North region database
		if err := database.NorthDB.Create(&appointment).Error; err != nil {
			log.Printf("Error saving appointment for patient %d on %s at %s: %v", appointment.PatientID, appointment.AppointmentDate, appointment.AppointmentTime, err)
			return fmt.Errorf("error saving appointment: %v", err)
		}

		// Fetch doctor details from North region database
		var doctor database.Doctors
		if err := database.NorthDB.Where("doctor_id = ?", appointment.DoctorID).First(&doctor).Error; err != nil {
			return fmt.Errorf("error fetching doctor details: %v", err)
		}

		// Fetch patient details from North region database
		var user database.Patients
		if err := database.NorthDB.Where("patient_id = ?", appointment.PatientID).First(&user).Error; err != nil {
			return fmt.Errorf("error fetching patient details: %v", err)
		}

		// Create booking time (current time, real-time timestamp when the appointment is created)
		realTime := time.Now().Format("2006-01-02 15:04:05") // Current time as real-time timestamp

		// Send appointment confirmation email
		err := utils.SendAppointmentEmail(user.Email, doctor.FullName, appointment.AppointmentDate.Format("2006-01-02"), appointment.AppointmentTime.Format("15:04"), realTime)
		if err != nil {
			log.Fatalf("Error sending appointment email: %v", err)
		}

		// Construct the notification message to publish to Redis
		hospitalID := fmt.Sprintf("%d", user.HospitalID) // Convert hospital_id to string

		// Create the correct channel name for Redis
		channel := fmt.Sprintf("appointments:%s:%s", hospitalID, doctor.Department)

		// Now construct the notification message
		notificationMessage := fmt.Sprintf(`{
		"patient_name": "%s",
		"appointment_time": "%s",
		"doctor_name": "%s",
		"department": "%s",
		"appointment_date": "%s",
		"hospital_id": "%s",
		"real_time": "%s"
	}`,
			user.FullName,
			appointment.AppointmentTime.Format("15:04"), // Appointment time
			doctor.FullName,
			doctor.Department,
			appointment.AppointmentDate.Format("2006-01-02"),
			hospitalID, // Correctly formatted hospital_id
			realTime,   // Real-time timestamp
		)

		// Publish to Redis with the correct channel name
		if err := database.RedisClient.Publish(database.Ctx, channel, notificationMessage).Err(); err != nil {
			log.Printf("Error publishing appointment notification to Redis for hospital %s, department %s: %v", hospitalID, doctor.Department, err)
			return fmt.Errorf("failed to notify via Redis for hospital %s, department %s: %v", hospitalID, doctor.Department, err)
		}

		// Define the Redis key for the North region
		redisKey := fmt.Sprintf("appointments:%s:%s:%s", "North", hospitalID, doctor.Department)

		// Marshal the appointment data into JSON
		appointmentJSON, err := json.Marshal(appointment)
		if err != nil {
			log.Printf("Error marshaling appointment data: %v", err)
			return fmt.Errorf("error marshaling appointment: %v", err)
		}

		// Push the appointment to the Redis list (acting as a queue)
		err = database.RedisClient.LPush(database.Ctx, redisKey, appointmentJSON).Err()
		if err != nil {
			log.Printf("Error adding appointment to Redis queue: %v", err)
			return fmt.Errorf("error adding appointment to Redis queue: %v", err.Error())
		}

		fmt.Printf("Appointment for department %s added to Redis under key %s\n", doctor.Department, redisKey)

		log.Printf("Appointment successfully booked for patient %s with Dr. %s at %s", user.FullName, doctor.FullName, realTime)

		return nil

		log.Printf("appointment successfully booked for patient %s with Dr. %s at %s", user.FullName, doctor.FullName, realTime)

	default:
		// Handle any other topics or log an error if the topic is not recognized
		log.Printf("Received message from unknown topic: %s", topic)
		// Add your default logic here
	}
	return nil
}

func generatePassword(fullName, ContactNumber string) string {
	return fmt.Sprintf("%s%s", fullName, ContactNumber)
}
func publishPatientCountUpdate(region string, newCount int) {
	message := fmt.Sprintf("Patient count updated for region %s: %d", region, newCount)
	if err := database.RedisClient.Publish(context.Background(), "patient_count_update", message).Err(); err != nil {
		log.Printf("Error publishing patient count update to Redis: %v", err)
	}
}
