package routes

import (
	"github.com/adityjoshi/aavinya/controllers"
	"github.com/adityjoshi/aavinya/middleware"
	"github.com/gin-gonic/gin"
)

func DoctorRoutes(incomingRoutes *gin.Engine) {

	doctorRouting := incomingRoutes.Group("/doctor")
	doctorRouting.Use(middleware.AuthRequired("Doctor", ""))
	{
		doctorRouting.POST("/doctorLogin", controllers.DoctorLogin)
		doctorRouting.POST("/patientAppointed", controllers.MarkAppointmentAsDone)
		// to do: add the otp verification for the doctor
		// doctorRouting.POST("/doctorOtp", controllers.VerifyDoctorOTP)

	}
}
