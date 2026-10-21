package routes

import (
	"buildmate/backend/controllers"
	"buildmate/backend/middleware"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SetupAuthRoutes sets up all authentication endpoints
func SetupAuthRoutes(router *gin.Engine, db *gorm.DB, jwtSecret string) {
	authController := controllers.NewAuthController(db, jwtSecret)

	api := router.Group("/api/auth")
	{
		api.POST("/register", authController.Register)
		api.POST("/verify-otp", authController.VerifyOTP)
		api.POST("/resend-otp", authController.ResendOTP)
		api.POST("/login", authController.Login)

		// Protected routes
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(jwtSecret))
		{
			protected.GET("/me", authController.GetMe)
			protected.PUT("/profile", authController.UpdateProfile)
			protected.PUT("/password", authController.ChangePassword)
			protected.GET("/dashboard-summary", authController.GetUserDashboardSummary)
		}
	}
}
