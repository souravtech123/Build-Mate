package routes

import (
	"buildmate/backend/controllers"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterFeedbackRoutes(router *gin.Engine, db *gorm.DB) {
	feedbackController := controllers.NewFeedbackController(db)

	feedbackRoutes := router.Group("/api/v1/feedback")
	{
		feedbackRoutes.POST("", feedbackController.SubmitFeedback)
		feedbackRoutes.GET("", feedbackController.ListFeedback)
	}
}
