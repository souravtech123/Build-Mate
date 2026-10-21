package controllers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"buildmate/backend/models"
	"buildmate/backend/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type IdeaController struct {
	IdeaService *services.IdeaService
	DB          *gorm.DB
}

func NewIdeaController(ideaService *services.IdeaService, db *gorm.DB) *IdeaController {
	return &IdeaController{
		IdeaService: ideaService,
		DB:          db,
	}
}

// GET /api/v1/ideas
func (ic *IdeaController) ListIdeas(c *gin.Context) {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(c.DefaultQuery("limit", "9"))
	if err != nil || limit < 1 || limit > 100 {
		limit = 9
	}

	filters := services.IdeaFilters{
		Search:     strings.TrimSpace(c.Query("search")),
		Category:   strings.TrimSpace(c.Query("category")),
		Difficulty: strings.TrimSpace(c.Query("difficulty")),
		OwnerID:    strings.TrimSpace(c.Query("owner_id")),
		Page:       page,
		Limit:      limit,
	}

	result, err := ic.IdeaService.ListIdeas(filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch project ideas",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    result,
	})
}

// GET /api/v1/ideas/:id
func (ic *IdeaController) GetIdeaByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid project idea ID",
		})
		return
	}

	idea, err := ic.IdeaService.GetIdeaByID(uint(id))
	if err != nil {
		if errors.Is(err, services.ErrIdeaNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Project idea not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch project idea",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    idea,
	})
}

type CreateIdeaRequest struct {
	Title            string `json:"title" binding:"required,min=3,max=200"`
	Description      string `json:"description" binding:"required,min=10"`
	Category         string `json:"category"`
	Difficulty       string `json:"difficulty"`
	Technologies     string `json:"technologies"`
	RequiredSkills   string `json:"required_skills"`
	TeamRequirements string `json:"team_requirements"`
}

// POST /api/v1/ideas
func (ic *IdeaController) CreateIdea(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}
	userID := userIDVal.(uint)

	var req CreateIdeaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Validation error: " + err.Error(),
		})
		return
	}

	// Fetch user details for owner metadata
	var user models.User
	if err := ic.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "User not found",
		})
		return
	}

	idea := models.ProjectIdea{
		Title:            strings.TrimSpace(req.Title),
		Description:      strings.TrimSpace(req.Description),
		Category:         strings.TrimSpace(req.Category),
		Difficulty:       strings.TrimSpace(req.Difficulty),
		Technologies:     strings.TrimSpace(req.Technologies),
		RequiredSkills:   strings.TrimSpace(req.RequiredSkills),
		TeamRequirements: strings.TrimSpace(req.TeamRequirements),
		OwnerID:          strconv.Itoa(int(userID)),
		OwnerName:        user.Name,
		OwnerCollege:     user.College,
		OwnerEmail:       user.Email,
		Status:           "pending",
	}

	createdIdea, err := ic.IdeaService.CreateIdea(&idea)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to create project: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Project submitted successfully! It will be visible after admin approval.",
		"data":    createdIdea,
	})
}

// DELETE /api/v1/ideas/:id
func (ic *IdeaController) DeleteIdea(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}
	userID := userIDVal.(uint)

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid project ID",
		})
		return
	}

	err = ic.IdeaService.DeleteIdea(uint(id), strconv.Itoa(int(userID)))
	if err != nil {
		if errors.Is(err, services.ErrIdeaNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Project not found",
			})
			return
		}
		if errors.Is(err, services.ErrUnauthorized) {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "You can only delete projects you created",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to delete project: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Project deleted successfully",
	})
}

type JoinProjectRequest struct {
	Role    string `json:"role" binding:"required"`
	Message string `json:"message"`
}

// POST /api/v1/ideas/:id/join
func (ic *IdeaController) ApplyToJoin(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}
	userID := userIDVal.(uint)

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid project ID",
		})
		return
	}

	var req JoinProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Please specify your role",
		})
		return
	}

	joinReq, err := ic.IdeaService.CreateJoinRequest(uint(id), userID, req.Role, req.Message)
	if err != nil {
		if errors.Is(err, services.ErrIdeaNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Project not found",
			})
			return
		}
		if errors.Is(err, services.ErrCannotJoinOwn) {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "You are already the owner of this project",
			})
			return
		}
		if errors.Is(err, services.ErrAlreadyJoined) {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "You have already applied to or joined this project",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to submit join request: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Application sent successfully! The project owner will review it.",
		"data":    joinReq,
	})
}

// GET /api/v1/ideas/:id/requests
func (ic *IdeaController) GetJoinRequests(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}
	userID := userIDVal.(uint)

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid project ID",
		})
		return
	}

	requests, err := ic.IdeaService.GetProjectJoinRequests(uint(id), strconv.Itoa(int(userID)))
	if err != nil {
		if errors.Is(err, services.ErrUnauthorized) {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "Only the project owner can view applicant requests",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch join requests",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    requests,
	})
}

type UpdateStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=accepted rejected pending"`
}

// PATCH /api/v1/ideas/:id/requests/:requestId
func (ic *IdeaController) UpdateJoinRequestStatus(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}
	userID := userIDVal.(uint)

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid project ID",
		})
		return
	}

	requestID, err := strconv.ParseUint(c.Param("requestId"), 10, 32)
	if err != nil || requestID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request ID",
		})
		return
	}

	var req UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Status must be 'accepted' or 'rejected'",
		})
		return
	}

	err = ic.IdeaService.UpdateJoinRequestStatus(uint(id), uint(requestID), strconv.Itoa(int(userID)), req.Status)
	if err != nil {
		if errors.Is(err, services.ErrUnauthorized) {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "Only the project owner can update applicant status",
			})
			return
		}
		if errors.Is(err, services.ErrRequestNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Join request not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update request: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Applicant status updated to " + req.Status,
	})
}

// GET /api/v1/ideas/:id/members
func (ic *IdeaController) GetProjectMembers(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid project ID",
		})
		return
	}

	members, err := ic.IdeaService.GetProjectMembers(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch project members",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    members,
	})
}

// GET /api/v1/admin/ideas
func (ic *IdeaController) AdminListIdeas(c *gin.Context) {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if err != nil || limit < 1 || limit > 100 {
		limit = 20
	}

	status := strings.TrimSpace(c.Query("status")) // "pending", "approved", "rejected", or "" for all

	result, err := ic.IdeaService.AdminListIdeas(status, page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch ideas",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    result,
	})
}

// PATCH /api/v1/admin/ideas/:id/approve
func (ic *IdeaController) AdminApproveIdea(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid idea ID",
		})
		return
	}

	if err := ic.IdeaService.SetIdeaStatus(uint(id), "approved"); err != nil {
		if errors.Is(err, services.ErrIdeaNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Idea not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to approve idea: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Idea approved successfully",
	})
}

// PATCH /api/v1/admin/ideas/:id/reject
func (ic *IdeaController) AdminRejectIdea(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid idea ID",
		})
		return
	}

	if err := ic.IdeaService.SetIdeaStatus(uint(id), "rejected"); err != nil {
		if errors.Is(err, services.ErrIdeaNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Idea not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to reject idea: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Idea rejected",
	})
}

// DELETE /api/v1/admin/ideas/:id
func (ic *IdeaController) AdminDeleteIdea(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid idea ID",
		})
		return
	}

	if err := ic.IdeaService.AdminDeleteIdea(uint(id)); err != nil {
		if errors.Is(err, services.ErrIdeaNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Idea not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to delete idea: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Project deleted successfully by admin",
	})
}

