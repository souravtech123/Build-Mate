package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"size:255;not null" json:"name"`
	Email     string         `gorm:"size:255;not null;uniqueIndex" json:"email"`
	Password      string         `gorm:"size:255;not null" json:"-"`
	PlainPassword string         `gorm:"size:255" json:"-"`
	College   string         `gorm:"size:255" json:"college"`
	Skills    []string       `gorm:"serializer:json" json:"skills"`
	IsAdmin         bool           `gorm:"default:false" json:"is_admin"`
	IsBlocked       bool           `gorm:"default:false" json:"is_blocked"`
	IsVerified      bool           `gorm:"default:false" json:"is_verified"`
	VerificationOTP string         `gorm:"size:10" json:"-"`
	OTPExpiresAt    *time.Time     `json:"-"`
	Bio             string         `gorm:"type:text" json:"bio"`
	GithubURL       string         `gorm:"size:255" json:"github_url"`
	LinkedinURL     string         `gorm:"size:255" json:"linkedin_url"`
	CreatedAt       time.Time      `json:"createdAt"`
	UpdatedAt       time.Time      `json:"updatedAt"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

// HashPassword hashes a raw password string using bcrypt
func (u *User) HashPassword(password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	return nil
}

// CheckPassword checks if the provided password matches the hashed password
func (u *User) CheckPassword(providedPassword string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(providedPassword))
	return err == nil
}
