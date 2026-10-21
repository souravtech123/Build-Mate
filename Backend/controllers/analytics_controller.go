package controllers

import (
	"net/http"
	"strings"
	"time"

	"buildmate/backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AnalyticsController struct {
	DB *gorm.DB
}

func NewAnalyticsController(db *gorm.DB) *AnalyticsController {
	return &AnalyticsController{DB: db}
}

type RecordPageViewRequest struct {
	Path string `json:"path"`
}

// RecordPageView logs a visit event
// POST /api/v1/pageview
func (ac *AnalyticsController) RecordPageView(c *gin.Context) {
	var req RecordPageViewRequest
	// Binding is optional, if empty or invalid JSON, default path to "/"
	_ = c.ShouldBindJSON(&req)

	path := strings.TrimSpace(req.Path)
	if path == "" {
		path = "/"
	}

	// Limit path length
	if len(path) > 255 {
		path = path[:255]
	}

	pageView := models.PageView{
		Path:      path,
		VisitedAt: time.Now(),
	}

	if err := ac.DB.Create(&pageView).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to record page view",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Page view recorded",
	})
}

type PageStat struct {
	Path  string `json:"path"`
	Views int64  `json:"views"`
}

type DailyStat struct {
	Date  string `json:"date"`
	Views int64  `json:"views"`
}

// AdminGetAnalytics retrieves complete platform analytics
// GET /api/v1/admin/analytics
func (ac *AnalyticsController) AdminGetAnalytics(c *gin.Context) {
	var totalUsers int64
	var blockedUsers int64
	var totalProjects int64
	var pendingProjects int64
	var approvedProjects int64
	var rejectedProjects int64
	var totalPageViews int64
	var currentVisitors5m int64
	var viewsLast24h int64

	now := time.Now()
	fiveMinutesAgo := now.Add(-5 * time.Minute)
	twentyFourHoursAgo := now.Add(-24 * time.Hour)

	// User stats
	ac.DB.Model(&models.User{}).Count(&totalUsers)
	ac.DB.Model(&models.User{}).Where("is_blocked = ?", true).Count(&blockedUsers)

	// Project stats
	ac.DB.Model(&models.ProjectIdea{}).Count(&totalProjects)
	ac.DB.Model(&models.ProjectIdea{}).Where("status = ?", "pending").Count(&pendingProjects)
	ac.DB.Model(&models.ProjectIdea{}).Where("status = ?", "approved").Count(&approvedProjects)
	ac.DB.Model(&models.ProjectIdea{}).Where("status = ?", "rejected").Count(&rejectedProjects)

	// Page view stats
	ac.DB.Model(&models.PageView{}).Count(&totalPageViews)
	ac.DB.Model(&models.PageView{}).Where("visited_at >= ?", fiveMinutesAgo).Count(&currentVisitors5m)
	ac.DB.Model(&models.PageView{}).Where("visited_at >= ?", twentyFourHoursAgo).Count(&viewsLast24h)

	// Popular pages (top 10)
	var popularPages []PageStat
	ac.DB.Model(&models.PageView{}).
		Select("path, count(*) as views").
		Group("path").
		Order("views DESC").
		Limit(10).
		Scan(&popularPages)

	// Last 7 days breakdown
	sevenDaysAgo := now.AddDate(0, 0, -6).Truncate(24 * time.Hour)
	var dailyStats []DailyStat
	ac.DB.Model(&models.PageView{}).
		Select("TO_CHAR(visited_at, 'YYYY-MM-DD') as date, count(*) as views").
		Where("visited_at >= ?", sevenDaysAgo).
		Group("TO_CHAR(visited_at, 'YYYY-MM-DD')").
		Order("date ASC").
		Scan(&dailyStats)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"users": gin.H{
				"total":   totalUsers,
				"blocked": blockedUsers,
				"active":  totalUsers - blockedUsers,
			},
			"projects": gin.H{
				"total":    totalProjects,
				"pending":  pendingProjects,
				"approved": approvedProjects,
				"rejected": rejectedProjects,
			},
			"page_views": gin.H{
				"total":                totalPageViews,
				"current_visitors_5m":  currentVisitors5m,
				"last_24h":             viewsLast24h,
				"popular_pages":        popularPages,
				"daily_stats":          dailyStats,
			},
		},
	})
}
