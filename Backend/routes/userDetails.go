package routes

import (
	"github.com/kvsb25/mobile-medical/controllers"
	"github.com/kvsb25/mobile-medical/middleware"
	"github.com/gin-gonic/gin"
)

func UserInfoRoutes(incomingRoutes *gin.Engine) {
	incomingRoutes.POST("/updatePatientInfo/:id", middleware.AuthRequired("Patient", ""), middleware.OtpAuthRequireed, controllers.AddPatientDetails)

}
