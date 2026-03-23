package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/kvsb25/mobile-medical/consumer"
	"github.com/kvsb25/mobile-medical/controllers"
	"github.com/kvsb25/mobile-medical/database"
	"github.com/kvsb25/mobile-medical/initiliazers"
	kafkamanager "github.com/kvsb25/mobile-medical/kafka/kafkaManager"
	"github.com/kvsb25/mobile-medical/routes"
	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

var km *kafkamanager.KafkaManager

func init() {
	initiliazers.LoadEnvVariable()
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Printf("optional .env not loaded: %v", err)
	}

	database.InitDatabase()
	defer database.CloseDatabase()
	database.InitializeRedisClient()

	kafkaBroker := os.Getenv("KAFKA_BROKER")
	if kafkaBroker == "" {
		kafkaBroker = "localhost:9092"
	}
	brokers := strings.Split(kafkaBroker, ",")
	for i := range brokers {
		brokers[i] = strings.TrimSpace(brokers[i])
	}
	northBrokers := brokers
	southBrokers := brokers

	var err error
	km, err = kafkamanager.NewKafkaManager(northBrokers, southBrokers)
	if err != nil {
		log.Fatal("Failed to initialize Kafka Manager:", err)
	}

	regions := []string{"north", "south"}
	for _, region := range regions {
		go func(r string) {
			log.Printf("Starting Kafka consumer for region: %s\n", r)
			consumer.StartConsumer(r)
		}(region)
		go func(r string) {
			log.Printf("Starting ambulance Kafka consumer for region: %s\n", r)
			consumer.StartAmbulanceConsumer(r)
		}(region)
	}

	go controllers.SubscribeToPaymentUpdates()
	go controllers.SubscribeToHospitalizationUpdates()
	go controllers.SubscribeToHospitaliztionUpdates()
	go controllers.SubscribeToAppointmentUpdates()
	go controllers.CheckAppointmentsQueue()
	go controllers.SubscribeToAppointmentUpdates()
	go controllers.StartPatientCountSubscriber()

	// Setup the HTTP server with Gin
	router := gin.Default()
	router.Use(setupCORS())
	setupSessions(router)
	setupRoutes(router)

	// Start server
	server := &http.Server{
		Addr:    ":2426",
		Handler: router,
	}
	log.Println("Server is running at :2426...")

	// Keep main function running indefinitely
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
	select {}
}

func setupCORS() gin.HandlerFunc {
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{
		"http://localhost:5173",
	}
	config.AllowHeaders = []string{"Authorization", "Content-Type", "credentials", "region"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"} // Allow OPTIONS
	config.AllowHeaders = append(config.AllowHeaders, "Authorization", "Content-Type", "credentials", "region")
	config.AllowCredentials = true
	return cors.New(config)
}

// setupSessions configures session management
func setupSessions(router *gin.Engine) {
	store := cookie.NewStore([]byte("secret"))
	router.Use(sessions.Sessions("session", store))
}

func setupRoutes(router *gin.Engine) {
	routes.UserRoutes(router)
	routes.UserInfoRoutes(router)
	routes.HospitalAdmin(router, km)
	routes.StaffRoutes(router, km)
	routes.DoctorRoutes(router)
	routes.AmbulanceRoutes(router, km)
}
