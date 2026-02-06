package routes

import (
	"github.com/adityjoshi/aavinya/controllers"
	"github.com/adityjoshi/aavinya/middleware"
	"github.com/gin-gonic/gin"
)

func UserInfoRoutes(incomingRoutes *gin.Engine) {
	incomingRoutes.POST("/updatePatientInfo/:id", middleware.AuthRequired("Patient", ""), middleware.OtpAuthRequireed, controllers.AddPatientDetails)

}
