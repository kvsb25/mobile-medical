package routes

import (
	"github.com/kvsb25/mobile-medical/controllers"
	"github.com/kvsb25/mobile-medical/middleware"
	"github.com/gin-gonic/gin"
)

func DoctorRoutes(incomingRoutes *gin.Engine) {

	doctorRouting := incomingRoutes.Group("/doctor")
	doctorRouting.POST("/doctorLogin", controllers.DoctorLogin)
	doctorRouting.Use(middleware.AuthRequired("Doctor", ""))
	{
		doctorRouting.POST("/patientAppointed", controllers.MarkAppointmentAsDone)
		// to do: add the otp verification for the doctor
		// doctorRouting.POST("/doctorOtp", controllers.VerifyDoctorOTP)

	}
}
