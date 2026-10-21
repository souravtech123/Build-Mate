package models

import (
	"time"
)

type Feedback struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Type      string    `gorm:"size:50;not null" json:"type"`
	Message   string    `gorm:"type:text;not null" json:"message"`
	Email     string    `gorm:"size:255" json:"email"`
	Name      string    `gorm:"size:255" json:"name"`
	CreatedAt time.Time `json:"created_at"`
}
