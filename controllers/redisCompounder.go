package controllers

import (
	"context"
	"fmt"
	"log"

	"github.com/adityjoshi/aavinya/database"
)

// SubscribeToPaymentUpdates listens for payment updates from Redis.
func SubscribeToPaymentUpdates() {
	redisClient := database.GetRedisClient()
	pubsub := redisClient.Subscribe(context.Background(), "patient_payment_updates")
	defer pubsub.Close()

	fmt.Println("Compounder subscribed to patient payment updates...")

	for {
		msg, err := pubsub.ReceiveMessage(context.Background())
		if err != nil {
			log.Println("Error receiving message:", err)
			continue
		}

		// Process the received message
		fmt.Printf("Received payment update: %s\n", msg.Payload)
		// Example: Notify the compounder, update the UI, etc.
	}
}

// SubscribeToHospitalizationUpdates listens for Redis messages about patient hospitalization
func SubscribeToHospitalizationUpdates() {
	pubsub := database.GetRedisClient().Subscribe(context.Background(), "hospitalized-patients")

	// Infinite loop to listen for messages
	for {
		msg, err := pubsub.ReceiveMessage(context.Background())
		if err != nil {
			log.Printf("Error receiving Redis message: %v", err)
			continue
		}

		// Log or process the received message
		fmt.Printf("Hospitalization Update: %s\n", msg.Payload)

		// You can trigger any action here, such as updating the frontend
	}
}

func SubscribeToHospitaliztionUpdates() {
	pubsub := database.GetRedisClient().Subscribe(context.Background(), "patient_admission")

	// Infinite loop to listen for messages
	for {
		msg, err := pubsub.ReceiveMessage(context.Background())
		if err != nil {
			log.Printf("Error receiving Redis message: %v", err)
			continue
		}

		// Log or process the received message
		fmt.Printf("Hospitalization Update: %s\n", msg.Payload)

		// You can trigger any action here, such as updating the frontend
	}
}

func SubscribeToAppointmentUpdates() {
	pubsub := database.GetRedisClient().Subscribe(context.Background(), "patient_admission")

	// Infinite loop to listen for messages
	for {
		msg, err := pubsub.ReceiveMessage(context.Background())
		if err != nil {
			log.Printf("Error receiving Redis message: %v", err)
			continue
		}

		// Log or process the received message
		fmt.Printf("Hospitalization Update: %s\n", msg.Payload)

		// You can trigger any action here, such as updating the frontend
	}
}

func StartPatientCountSubscriber() {
	// Subscribe to the "patient_count_update" channel
	pubsub := database.RedisClient.Subscribe(context.Background(), "patient_count_update")
	defer pubsub.Close()

	// Log the subscription
	log.Println("Subscribed to patient count update channel")

	// Get the channel to listen for messages
	ch := pubsub.Channel()

	for msg := range ch {
		log.Printf("Received patient count update: %s", msg.Payload)

		fmt.Printf("Processed patient count update: %s\n", msg.Payload)
	}
}
