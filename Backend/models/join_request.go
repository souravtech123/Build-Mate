package models

import (
	"time"

	"gorm.io/gorm"
)

type JoinRequest struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	ProjectID uint           `gorm:"not null;index" json:"project_id"`
	UserID    uint           `gorm:"not null;index" json:"user_id"`
	User      User           `gorm:"foreignKey:UserID" json:"user"`
	Role      string         `gorm:"type:varchar(100);not null" json:"role"`
	Message   string         `gorm:"type:text" json:"message"`
	Status    string         `gorm:"type:varchar(30);not null;default:'pending';index" json:"status"` // 'pending', 'accepted', 'rejected'
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
