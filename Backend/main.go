package main

import (
	"log"
	"net/http"

	"buildmate/backend/config"
	"buildmate/backend/middleware"
	"buildmate/backend/models"
	"buildmate/backend/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load application configuration
	cfg := config.LoadConfig()

	// Connect to PostgreSQL
	db := config.ConnectDatabase()

	// Run database migrations
	if err := db.AutoMigrate(
		&models.User{},
		&models.ProjectIdea{},
		&models.JoinRequest{},
		&models.PageView{},
		&models.Feedback{},
	); err != nil {
		log.Fatalf("Failed to run database migrations: %v", err)
	}

	log.Println("Database migrations completed successfully")

	// Set Gin mode
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize Gin router
	router := gin.Default()

	// Enable CORS for frontend requests
	router.Use(middleware.CORSMiddleware())

	// Health check route
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "BuildMate API is running",
		})
	})

	// Authentication routes
	routes.SetupAuthRoutes(router, db, cfg.JWTSecret)

	// Project Idea Portal routes
	routes.RegisterIdeaRoutes(router, db, cfg.JWTSecret)

	// Feedback and Suggestions routes
	routes.RegisterFeedbackRoutes(router, db)

	// Admin moderation routes
	routes.RegisterAdminRoutes(router, db, cfg.JWTSecret)

	// Start server
	log.Printf("%s starting on port %s", cfg.AppName, cfg.Port)

	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatal("Failed to start server: ", err)
	}
}
