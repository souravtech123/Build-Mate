package middleware

import (
	"net/http"

	"buildmate/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AdminMiddleware ensures the authenticated user has is_admin = true.
// Must be used AFTER AuthMiddleware (requires userID in context).
func AdminMiddleware(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDVal, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Unauthorized",
			})
			c.Abort()
			return
		}

		userID := userIDVal.(uint)

		var user models.User
		if err := db.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "User not found",
			})
			c.Abort()
			return
		}

		if !user.IsAdmin {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "Access denied: admin privileges required",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
