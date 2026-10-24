package models

import (
	"time"

	"gorm.io/gorm"
)

type ChatMessage struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	ProjectID   uint           `gorm:"not null;index" json:"project_id"`
	SenderID    uint           `gorm:"not null;index" json:"sender_id"`
	SenderName  string         `gorm:"type:varchar(255);not null" json:"sender_name"`
	SenderRole  string         `gorm:"type:varchar(100)" json:"sender_role"`
	Message     string         `gorm:"type:text;not null" json:"message"`
	MessageType string         `gorm:"type:varchar(50);default:'text'" json:"message_type"` // 'text', 'system'
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}
