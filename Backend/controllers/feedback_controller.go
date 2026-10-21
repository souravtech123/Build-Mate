package controllers

import (
	"net/http"
	"strings"

	"buildmate/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type FeedbackController struct {
	DB *gorm.DB
}

func NewFeedbackController(db *gorm.DB) *FeedbackController {
	return &FeedbackController{DB: db}
}

type CreateFeedbackRequest struct {
	Type    string `json:"type" binding:"required"`
	Message string `json:"message" binding:"required,min=5"`
	Email   string `json:"email"`
	Name    string `json:"name"`
}

// POST /api/v1/feedback
func (fc *FeedbackController) SubmitFeedback(c *gin.Context) {
	var req CreateFeedbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid input: message must be at least 5 characters",
		})
		return
	}

	feedbackType := strings.TrimSpace(req.Type)
	if feedbackType == "" {
		feedbackType = "suggestion"
	}

	feedback := models.Feedback{
		Type:    feedbackType,
		Message: strings.TrimSpace(req.Message),
		Email:   strings.TrimSpace(req.Email),
		Name:    strings.TrimSpace(req.Name),
	}

	if err := fc.DB.Create(&feedback).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to save feedback",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Thank you! Your feedback has been received.",
		"data":    feedback,
	})
}

// GET /api/v1/feedback
func (fc *FeedbackController) ListFeedback(c *gin.Context) {
	var list []models.Feedback
	if err := fc.DB.Order("created_at DESC").Limit(100).Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch feedback",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    list,
	})
}

// GET /api/v1/admin/feedback
func (fc *FeedbackController) AdminListFeedback(c *gin.Context) {
	typeFilter := strings.TrimSpace(c.Query("type"))

	var list []models.Feedback
	q := fc.DB.Order("created_at DESC").Limit(500)
	if typeFilter != "" {
		q = q.Where("type = ?", typeFilter)
	}
	if err := q.Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch feedback",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    list,
		"total":   len(list),
	})
}
