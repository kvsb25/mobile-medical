package routes

import (
	"github.com/adityjoshi/aavinya/controllers"
	kafkamanager "github.com/adityjoshi/aavinya/kafka/kafkaManager"
	"github.com/adityjoshi/aavinya/middleware"
	"github.com/gin-gonic/gin"
)

func StaffRoutes(incomingRoutes *gin.Engine, km *kafkamanager.KafkaManager) {

	/*

		Compounder routes group

	*/

	compounderRoutes := incomingRoutes.Group("/compounder")
	compounderRoutes.POST("/staffLogin", controllers.StaffLogin)
	compounderRoutes.Use(middleware.AuthRequired("Staff", "Compounder"))
	{

		compounderRoutes.POST("/staffOtp", controllers.VerifyStaffOTP)
		compounderRoutes.POST("/markCompounder", controllers.MarkPatientAsHospitalized)
		compounderRoutes.GET("/get", controllers.GetRoomAssignments)
		compounderRoutes.GET("/getPatientDetails", controllers.GetAllPatientDetails)
	}

	/*

		Receptionist routes group

	*/
	receptionistRoutes := incomingRoutes.Group("/receptionist")
	receptionistRoutes.POST("/staffLogin", controllers.StaffLogin)
	receptionistRoutes.Use(middleware.AuthRequired("Staff", "Receptionist"))
	{

		receptionistRoutes.POST("/staffOtp", controllers.VerifyStaffOTP)
		receptionistRoutes.POST("/patientRegistration", func(c *gin.Context) {
			c.Set("km", km)
			controllers.RegisterPatient(c)
		})
		receptionistRoutes.POST("/patientHospitaliseRequest", func(c *gin.Context) {
			c.Set("km", km)
			controllers.AdmitPatientForHospitalization(c)
		})
		receptionistRoutes.GET("/getDoctorsDetails", controllers.GetAllDoctorsData)
		receptionistRoutes.GET("/getPatientDetails", middleware.OtpAuthRequireed, controllers.GetAllPatientDetails)
		receptionistRoutes.GET("/getDoctorDetails", controllers.GetAllDoctorsDetails)
	}
}
