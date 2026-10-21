package models

import "time"

// PageView records a single visit event for a given path.
// The admin analytics endpoint aggregates these rows to compute stats.
type PageView struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Path      string    `gorm:"type:varchar(500);not null;index" json:"path"`
	VisitedAt time.Time `gorm:"not null;index" json:"visited_at"`
}
