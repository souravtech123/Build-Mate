
package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Env       string
	AppName   string
	Port      string
	JWTSecret string
}

func LoadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println(".env file not found; using system environment variables")
	}

port := os.Getenv("PORT")
if port == "" {
    port = os.Getenv("APP_PORT")
}
if port == "" {
    port = "8081"
}

	env := os.Getenv("APP_ENV")
	if env == "" {
		env = "development"
	}

	appName := os.Getenv("APP_NAME")
	if appName == "" {
		appName = "BuildMate API"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "buildmate_default_jwt_secret_key"
	}

	return &Config{
		Env:       env,
		AppName:   appName,
		Port:      port,
		JWTSecret: jwtSecret,
	}
}
