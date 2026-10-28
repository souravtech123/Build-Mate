package models

import (
	"time"

	"gorm.io/gorm"
)

type ProjectTask struct {
	ID                uint           `gorm:"primaryKey" json:"id"`
	ProjectID         uint           `gorm:"not null;index" json:"project_id"`
	Project           *ProjectIdea   `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	Title             string         `gorm:"type:varchar(255);not null" json:"title"`
	Description       string         `gorm:"type:text" json:"description"`
	AssignedToUserID  uint           `gorm:"not null;index" json:"assigned_to_user_id"`
	AssignedTo        User           `gorm:"foreignKey:AssignedToUserID" json:"assigned_to"`
	CreatedByUserID   uint           `gorm:"not null;index" json:"created_by_user_id"`
	Deadline          time.Time      `gorm:"not null" json:"deadline"`
	Priority          string         `gorm:"type:varchar(20);not null;default:'medium'" json:"priority"` // low, medium, high, urgent
	RewardPoints      int            `gorm:"default:50" json:"reward_points"`
	RewardTitle       string         `gorm:"type:varchar(255);default:'Task Completion Pass'" json:"reward_title"`
	Status            string         `gorm:"type:varchar(30);not null;default:'assigned';index" json:"status"` // assigned, in_progress, completed, overdue
	CompletedAt       *time.Time     `json:"completed_at,omitempty"`
	IsCompletedOnTime bool           `gorm:"default:false" json:"is_completed_on_time"`
	CompletionNote    string         `gorm:"type:text" json:"completion_note,omitempty"`
	Ticket            *RewardTicket  `gorm:"foreignKey:TaskID" json:"ticket,omitempty"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-"`
}

type RewardTicket struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	TicketNumber string         `gorm:"type:varchar(64);uniqueIndex;not null" json:"ticket_number"`
	ProjectID    uint           `gorm:"not null;index" json:"project_id"`
	Project      *ProjectIdea   `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	TaskID       uint           `gorm:"not null;uniqueIndex" json:"task_id"`
	UserID       uint           `gorm:"not null;index" json:"user_id"`
	User         User           `gorm:"foreignKey:UserID" json:"user"`
	TaskTitle    string         `gorm:"type:varchar(255);not null" json:"task_title"`
	RewardTitle  string         `gorm:"type:varchar(255);not null" json:"reward_title"`
	RewardPoints int            `gorm:"not null;default:50" json:"reward_points"`
	Deadline     time.Time      `gorm:"not null" json:"deadline"`
	CompletedAt  time.Time      `gorm:"not null" json:"completed_at"`
	Status       string         `gorm:"type:varchar(30);not null;default:'valid'" json:"status"` // valid, claimed, redeemed
	BadgeColor   string         `gorm:"type:varchar(30);not null;default:'emerald'" json:"badge_color"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}
