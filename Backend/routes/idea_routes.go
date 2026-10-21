package routes

import (
	"buildmate/backend/controllers"
	"buildmate/backend/middleware"
	"buildmate/backend/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterIdeaRoutes(router *gin.Engine, db *gorm.DB, jwtSecret string) {
	// Initialize service
	ideaService := services.NewIdeaService(db)

	// Initialize controller
	ideaController := controllers.NewIdeaController(ideaService, db)

	// Define routes
	ideaRoutes := router.Group("/api/v1/ideas")
	{
		// Public routes
		ideaRoutes.GET("", ideaController.ListIdeas)
		ideaRoutes.GET("/:id", ideaController.GetIdeaByID)
		ideaRoutes.GET("/:id/members", ideaController.GetProjectMembers)

		// Protected routes (require JWT authentication)
		protected := ideaRoutes.Group("")
		protected.Use(middleware.AuthMiddleware(jwtSecret))
		{
			protected.POST("", ideaController.CreateIdea)
			protected.DELETE("/:id", ideaController.DeleteIdea)
			protected.POST("/:id/join", ideaController.ApplyToJoin)
			protected.GET("/:id/requests", ideaController.GetJoinRequests)
			protected.PATCH("/:id/requests/:requestId", ideaController.UpdateJoinRequestStatus)
		}
	}
}