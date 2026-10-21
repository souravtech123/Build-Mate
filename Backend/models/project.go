package models

import (
	"time"

	"gorm.io/gorm"
)

type ProjectIdea struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Title       string         `gorm:"type:varchar(200);not null" json:"title"`
	Description string         `gorm:"type:text;not null" json:"description"`

	Category       string `gorm:"type:varchar(100)" json:"category"`
	Difficulty     string `gorm:"type:varchar(20)" json:"difficulty"`
	Technologies   string `gorm:"type:text" json:"technologies"`
	RequiredSkills string `gorm:"type:text" json:"required_skills"`

	TeamRequirements string `gorm:"type:text" json:"team_requirements"`

	// User ID string of the idea owner.
	OwnerID      string `gorm:"type:varchar(64);not null;index" json:"owner_id"`
	OwnerName    string `gorm:"type:varchar(255)" json:"owner_name"`
	OwnerCollege string `gorm:"type:varchar(255)" json:"owner_college"`
	OwnerEmail   string `gorm:"type:varchar(255)" json:"owner_email,omitempty"`

	Status string `gorm:"type:varchar(30);not null;default:'pending';index" json:"status"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}