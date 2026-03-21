package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/kvsb25/mobile-medical/controllers"
	kafkamanager "github.com/kvsb25/mobile-medical/kafka/kafkaManager"
	"github.com/kvsb25/mobile-medical/middleware"
)

func AmbulanceRoutes(incomingRoutes *gin.Engine, km *kafkamanager.KafkaManager) {
	ambulanceDriver := incomingRoutes.Group("/ambulanceDriver")
	ambulanceDriver.POST("/login", controllers.AmbulanceDriverLogin)
	ambulanceDriver.Use(middleware.AuthRequired("AmbulanceDriver", ""))
	{
		ambulanceDriver.POST("/update", func(c *gin.Context) {
			c.Set("km", km)
			controllers.UpdateAmbulanceState(c)
		})
		ambulanceDriver.POST("/mark-available", controllers.MarkAmbulanceAvailable)
	}

	ambulanceUser := incomingRoutes.Group("/ambulances")
	ambulanceUser.Use(middleware.AuthRequired("Patient", ""))
	{
		ambulanceUser.GET("/stream", controllers.StreamNearbyAmbulances)
		ambulanceUser.POST("/request", controllers.RequestAmbulance)
	}
}

