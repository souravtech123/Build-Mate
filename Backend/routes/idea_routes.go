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
	chatHub := services.NewChatHub(db)

	// Initialize controllers
	ideaController := controllers.NewIdeaController(ideaService, db)
	chatController := controllers.NewChatController(chatHub, db, jwtSecret)

	// Define routes
	ideaRoutes := router.Group("/api/v1/ideas")
	{
		// Public routes
		ideaRoutes.GET("", ideaController.ListIdeas)
		ideaRoutes.GET("/:id", ideaController.GetIdeaByID)
		ideaRoutes.GET("/:id/members", ideaController.GetProjectMembers)

		// WebSocket team chat connection (authenticates via query token or auth header)
		ideaRoutes.GET("/:id/chat/ws", chatController.HandleWebSocket)

		// Protected routes (require JWT authentication)
		protected := ideaRoutes.Group("")
		protected.Use(middleware.AuthMiddleware(jwtSecret))
		{
			protected.POST("", ideaController.CreateIdea)
			protected.DELETE("/:id", ideaController.DeleteIdea)
			protected.POST("/:id/join", ideaController.ApplyToJoin)
			protected.GET("/:id/requests", ideaController.GetJoinRequests)
			protected.PATCH("/:id/requests/:requestId", ideaController.UpdateJoinRequestStatus)

			// Chat history
			protected.GET("/:id/chat/messages", chatController.GetChatHistory)
		}
	}
}