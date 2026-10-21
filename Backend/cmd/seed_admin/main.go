package main

import (
	"fmt"
	"log"

	"buildmate/backend/config"
	"buildmate/backend/models"
)

func main() {
	db := config.ConnectDatabase()

	// Auto-migrate to ensure is_admin column exists
	if err := db.AutoMigrate(&models.User{}); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	// Admin credentials — change these if you want
	adminEmail := "admin@buildmate.com"
	adminPassword := "Admin@1234"
	adminName := "BuildMate Admin"

	// Check if admin already exists
	var existing models.User
	if err := db.Where("email = ?", adminEmail).First(&existing).Error; err == nil {
		// Already exists — just ensure is_admin is true
		db.Model(&existing).Update("is_admin", true)
		fmt.Println("✅ Admin user already exists. Ensured is_admin = true.")
		fmt.Printf("📧 Email    : %s\n", adminEmail)
		fmt.Printf("🔑 Password : %s  (your original password)\n", adminPassword)
		return
	}

	admin := models.User{
		Name:    adminName,
		Email:   adminEmail,
		College: "BuildMate HQ",
		Skills:  []string{"admin"},
		IsAdmin: true,
	}

	if err := admin.HashPassword(adminPassword); err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	if err := db.Create(&admin).Error; err != nil {
		log.Fatalf("Failed to create admin user: %v", err)
	}

	fmt.Println()
	fmt.Println("✅ Admin user created successfully!")
	fmt.Println("─────────────────────────────────")
	fmt.Printf("📧 Email    : %s\n", adminEmail)
	fmt.Printf("🔑 Password : %s\n", adminPassword)
	fmt.Println("─────────────────────────────────")
	fmt.Println("👉 Login at: http://localhost:3001 (admin panel)")
	fmt.Println()
}
