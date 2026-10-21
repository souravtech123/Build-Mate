package routes

import (
	"buildmate/backend/controllers"
	"buildmate/backend/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterAdminRoutes(router *gin.Engine, db *gorm.DB, jwtSecret string) {
	ideaService := services.NewIdeaService(db)
	ideaController := controllers.NewIdeaController(ideaService, db)
	authController := controllers.NewAuthController(db, jwtSecret)
	analyticsController := controllers.NewAnalyticsController(db)
	feedbackController := controllers.NewFeedbackController(db)

	// Public analytics recording endpoint
	router.POST("/api/v1/pageview", analyticsController.RecordPageView)

	// Admin routes
	adminRoutes := router.Group("/api/v1/admin")
	{
		// Ideas / Projects moderation and management
		adminRoutes.GET("/ideas", ideaController.AdminListIdeas)
		adminRoutes.PATCH("/ideas/:id/approve", ideaController.AdminApproveIdea)
		adminRoutes.PATCH("/ideas/:id/reject", ideaController.AdminRejectIdea)
		adminRoutes.DELETE("/ideas/:id", ideaController.AdminDeleteIdea)

		// User management
		adminRoutes.GET("/users", authController.AdminListUsers)
		adminRoutes.PATCH("/users/:id/block", authController.AdminBlockUser)
		adminRoutes.PATCH("/users/:id/unblock", authController.AdminUnblockUser)
		adminRoutes.DELETE("/users/:id", authController.AdminDeleteUser)

		// Analytics
		adminRoutes.GET("/analytics", analyticsController.AdminGetAnalytics)

		// Feedback / Suggestions / Applications
		adminRoutes.GET("/feedback", feedbackController.AdminListFeedback)
	}
}

