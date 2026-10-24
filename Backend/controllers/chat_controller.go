package controllers

import (
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	"buildmate/backend/models"
	"buildmate/backend/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ChatController struct {
	ChatHub   *services.ChatHub
	DB        *gorm.DB
	JWTSecret string
}

func NewChatController(chatHub *services.ChatHub, db *gorm.DB, jwtSecret string) *ChatController {
	return &ChatController{
		ChatHub:   chatHub,
		DB:        db,
		JWTSecret: jwtSecret,
	}
}

// verifyMembership checks if the user is the project owner or has an accepted join request
func (cc *ChatController) verifyMembership(projectID uint, userID uint) (bool, string, error) {
	var project models.ProjectIdea
	if err := cc.DB.Where("id = ?", projectID).First(&project).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, "", errors.New("project not found")
		}
		return false, "", err
	}

	// Owner is automatically a member (Project Lead)
	if project.OwnerID == strconv.Itoa(int(userID)) {
		return true, "Project Lead", nil
	}

	// Check if user has an accepted join request
	var joinReq models.JoinRequest
	err := cc.DB.Where("project_id = ? AND user_id = ? AND status = ?", projectID, userID, "accepted").First(&joinReq).Error
	if err == nil {
		role := joinReq.Role
		if role == "" {
			role = "Contributor"
		}
		return true, role, nil
	}

	return false, "", nil
}

// GET /api/v1/ideas/:id/chat/messages
func (cc *ChatController) GetChatHistory(c *gin.Context) {
	projectIDVal, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || projectIDVal == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid project ID",
		})
		return
	}
	projectID := uint(projectIDVal)

	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}
	userID := userIDVal.(uint)

	// Verify user is team member
	isMember, _, err := cc.verifyMembership(projectID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "You must be a team member of this project to view team chat",
		})
		return
	}

	var messages []models.ChatMessage
	if err := cc.DB.
		Where("project_id = ?", projectID).
		Order("created_at ASC").
		Limit(100).
		Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to retrieve chat history",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    messages,
	})
}

// GET /api/v1/ideas/:id/chat/ws
func (cc *ChatController) HandleWebSocket(c *gin.Context) {
	projectIDVal, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || projectIDVal == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}
	projectID := uint(projectIDVal)

	// Extract token from query param or header
	token := c.Query("token")
	if token == "" {
		authHeader := c.GetHeader("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			token = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}

	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing authentication token"})
		return
	}

	claims, err := services.ValidateToken(token, cc.JWTSecret)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
		return
	}
	userID := claims.UserID

	// Verify project team membership
	isMember, role, err := cc.verifyMembership(projectID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	if !isMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "Access denied: team members only"})
		return
	}

	// Fetch user for name
	var user models.User
	if err := cc.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User record not found"})
		return
	}

	// Upgrade HTTP request to WebSocket
	conn, err := cc.ChatHub.UpgradeConnection(c.Writer, c.Request)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}

	client := &services.Client{
		Hub:       cc.ChatHub,
		Conn:      conn,
		Send:      make(chan []byte, 256),
		ProjectID: projectID,
		UserID:    userID,
		UserName:  user.Name,
		UserRole:  role,
	}

	cc.ChatHub.Register <- client

	go client.WritePump()
	go client.ReadPump()
}
