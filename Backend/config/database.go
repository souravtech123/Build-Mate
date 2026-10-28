
package config

import (
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func ConnectDatabase() *gorm.DB {
	dsn := os.Getenv("DATABASE_URL")

	if dsn == "" {
		host := os.Getenv("DB_HOST")
		port := os.Getenv("DB_PORT")
		user := os.Getenv("DB_USER")
		password := os.Getenv("DB_PASSWORD")
		dbname := os.Getenv("DB_NAME")
		sslmode := os.Getenv("DB_SSLMODE")

		if host == "" || port == "" || user == "" ||
			password == "" || dbname == "" {
			log.Fatal("Database configuration is incomplete. Provide DATABASE_URL or DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME")
		}

		if sslmode == "" {
			sslmode = "disable"
		}

		dsn = fmt.Sprintf(
			"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
			host, port, user, password, dbname, sslmode,
		)
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to initialize PostgreSQL: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("Failed to access database connection: %v", err)
	}

	sqlDB.SetMaxOpenConns(10)
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)

	// Verify the actual database connection.
	if err := sqlDB.Ping(); err != nil {
		sqlDB.Close()
		log.Fatalf("PostgreSQL ping failed: %v", err)
	}

	log.Println("PostgreSQL connected successfully")
	return db
}
