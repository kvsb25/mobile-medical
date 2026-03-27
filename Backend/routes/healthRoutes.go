package routes

import (
	"net/http"
	"github.com/gin-gonic/gin"
)

func HealthRoutes(route *gin.Engine){
	route.GET("/health", healthStatus)
}

func healthStatus(c *gin.Context){
	c.JSON(http.StatusOK, gin.H{"Health": "OK"})
}