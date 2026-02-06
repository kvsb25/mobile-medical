package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/adityjoshi/aavinya/database"
	"github.com/adityjoshi/aavinya/utils"
	"github.com/gin-gonic/gin"
)

// func AuthRequired(userType, requiredRole string) gin.HandlerFunc {
// 	return func(c *gin.Context) {
// 		tokenString := c.GetHeader("Authorization")
// 		if tokenString == "" {
// 			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token is missing"})
// 			c.Abort()
// 			return
// 		}

// 		claims, err := utils.DecodeJwt(tokenString)
// 		if err != nil {
// 			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
// 			c.Abort()
// 			return
// 		}

// 		if claims["user_type"] != userType {
// 			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
// 			c.Abort()
// 			return
// 		}

// 		if userType == "Staff" {
// 			role, roleExists := claims["role"].(string)
// 			if !roleExists || role != requiredRole {
// 				c.JSON(http.StatusForbidden, gin.H{"error": "You do not have the required role to access this resource"})
// 				c.Abort()
// 				return
// 			}
// 		}
// 		userID, _ := claims["user_id"].(float64)
// 		c.Set("user_id", uint(userID))

// 		// Store AdminID in context if user type is Admin
// 		if userType == "Admin" {
// 			c.Set("admin_id", uint(userID))

// 		}
// 		if userType == "Staff" {
// 			c.Set("staff_id", uint(userID))
// 		}
// 		if region, regionExists := claims["region"].(string); regionExists {
// 			c.Set("region", region)
// 		} else {
// 			c.JSON(http.StatusUnauthorized, gin.H{"error": "Region not specified in token"})
// 			c.Abort()
// 			return
// 		}

// 		switch userType {
// 		case "Admin":
// 			c.Set("admin_id", uint(userID))
// 		case "Staff":
// 			c.Set("staff_id", uint(userID))
// 		case "Doctor":
// 			// Set doctor-specific fields
// 			doctorID, doctorIDExists := claims["doctor_id"].(float64)
// 			department, departmentExists := claims["department"].(string)
// 			region, regionExists := claims["region"].(string)

// 			if !doctorIDExists || !departmentExists || !regionExists {
// 				c.JSON(http.StatusUnauthorized, gin.H{"error": "Doctor credentials are incomplete in token"})
// 				c.Abort()
// 				return
// 			}

// 			// Set doctor-specific context values
// 			c.Set("doctor_id", uint(doctorID))
// 			c.Set("department", department)
// 			c.Set("region", region)
// 		default:
// 			// If an unknown user type is encountered
// 			c.JSON(http.StatusForbidden, gin.H{"error": "Unknown user type"})
// 			c.Abort()
// 			return
// 		}

// 		c.Next()
// 	}
// }

func AuthRequired(userType string, requiredRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token is missing"})
			c.Abort()
			return
		}

		claims, err := utils.DecodeJwt(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Ensure user_type matches
		if claims["user_type"] != userType {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			c.Abort()
			return
		}

		// Ensure user_id exists and is valid
		userIDFloat, ok := claims["user_id"].(float64)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user_id in token"})
			c.Abort()
			return
		}
		userID := uint(userIDFloat)
		c.Set("user_id", userID)

		// Handle role validation for Staff
		if userType == "Staff" {
			role, exists := claims["role"].(string)
			if !exists || (len(requiredRoles) > 0 && !contains(requiredRoles, role)) {
				c.JSON(http.StatusForbidden, gin.H{"error": "You do not have the required role to access this resource"})
				c.Abort()
				return
			}
			c.Set("staff_id", userID)
		}

		// Handle additional claims
		if region, exists := claims["region"].(string); exists {
			c.Set("region", region)
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Region not specified in token"})
			c.Abort()
			return
		}

		// Assign IDs based on userType
		switch userType {
		case "Admin":
			c.Set("admin_id", userID)
		case "Doctor":
			doctorIDFloat, doctorExists := claims["doctor_id"].(float64)
			department, deptExists := claims["department"].(string)

			if !doctorExists || !deptExists {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Doctor credentials are incomplete in token"})
				c.Abort()
				return
			}

			c.Set("doctor_id", uint(doctorIDFloat))
			c.Set("department", department)
		}

		c.Next()
	}
}

// Utility function to check if a role exists in the requiredRoles list
func contains(list []string, item string) bool {
	for _, v := range list {
		if v == item {
			return true
		}
	}
	return false
}

func OtpAuthRequireed(c *gin.Context) {
	// 	email, ok := c.Get("email")
	// 	if !ok {
	// 		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
	// 		c.Abort()
	// 		return
	// 	}

	// 	client := database.GetRedisClient()
	// 	otpVerified, err := client.Get(database.Ctx, "otp_verified:"+email.(string)).Result()
	// 	if err != nil || otpVerified != "true" {
	// 		c.JSON(http.StatusForbidden, gin.H{"error": "OTP not verified"})
	// 		c.Abort()
	// 		return
	// 	}

	// 	// Continue to next handler if OTP is verified
	// 	c.Next()
	// }

	token := c.GetHeader("Authorization")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No token provided"})
		c.Abort()
		return
	}

	claims, err := utils.DecodeJwt(strings.TrimPrefix(token, "Bearer "))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		c.Abort()
		return
	}

	userID, ok := claims["user_id"].(float64)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		c.Abort()
		return
	}

	userIDStr := fmt.Sprintf("%d", int(userID))

	// Fetch OTP verification status from Redis
	client := database.GetRedisClient()
	otpKey := "otp_verified:" + userIDStr
	otpVerified, err := client.Get(database.Ctx, otpKey).Result()
	if err != nil || otpVerified != "verified" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "OTP not verified"})
		c.Abort()
		return
	}

	c.Next()
}
