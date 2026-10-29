package services

import (
	"errors"
	"fmt"
	"strconv"
	"strings"

	"buildmate/backend/models"

	"gorm.io/gorm"
)

var (
	ErrIdeaNotFound     = errors.New("project idea not found")
	ErrUnauthorized     = errors.New("you are not authorized to perform this action")
	ErrRequestNotFound  = errors.New("join request not found")
	ErrAlreadyJoined    = errors.New("you have already sent a join request or are a team member")
	ErrCannotJoinOwn    = errors.New("you cannot request to join your own project")
)

type IdeaService struct {
	DB *gorm.DB
}

func NewIdeaService(db *gorm.DB) *IdeaService {
	return &IdeaService{DB: db}
}

type IdeaFilters struct {
	Search     string
	Category   string
	Difficulty string
	OwnerID    string
	Page       int
	Limit      int
}

type IdeaListResult struct {
	Ideas      []models.ProjectIdea `json:"ideas"`
	Total      int64                `json:"total"`
	Page       int                  `json:"page"`
	Limit      int                  `json:"limit"`
	TotalPages int64                `json:"total_pages"`
}

// ListIdeas retrieves ideas based on filters
func (s *IdeaService) ListIdeas(filters IdeaFilters) (*IdeaListResult, error) {
	var ideas []models.ProjectIdea

	query := s.DB.Model(&models.ProjectIdea{}).
		Where("status = ?", "approved")

	if ownerID := strings.TrimSpace(filters.OwnerID); ownerID != "" {
		query = query.Where("owner_id = ?", ownerID)
	}

	search := strings.TrimSpace(filters.Search)
	if search != "" {
		keyword := "%" + search + "%"

		query = query.Where(
			`(
				title ILIKE ?
				OR description ILIKE ?
				OR category ILIKE ?
				OR technologies ILIKE ?
				OR required_skills ILIKE ?
			)`,
			keyword,
			keyword,
			keyword,
			keyword,
			keyword,
		)
	}

	if category := strings.TrimSpace(filters.Category); category != "" {
		query = query.Where("category ILIKE ?", category)
	}

	if difficulty := strings.TrimSpace(filters.Difficulty); difficulty != "" {
		query = query.Where("difficulty ILIKE ?", difficulty)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("count project ideas: %w", err)
	}

	offset := (filters.Page - 1) * filters.Limit

	if err := query.
		Order("created_at DESC").
		Limit(filters.Limit).
		Offset(offset).
		Find(&ideas).Error; err != nil {
		return nil, fmt.Errorf("list project ideas: %w", err)
	}

	totalPages := int64(0)
	if filters.Limit > 0 {
		totalPages = (total + int64(filters.Limit) - 1) / int64(filters.Limit)
	}

	return &IdeaListResult{
		Ideas:      ideas,
		Total:      total,
		Page:       filters.Page,
		Limit:      filters.Limit,
		TotalPages: totalPages,
	}, nil
}

// GetIdeaByID retrieves one approved idea
func (s *IdeaService) GetIdeaByID(id uint) (*models.ProjectIdea, error) {
	var idea models.ProjectIdea

	err := s.DB.
		Where("id = ?", id).
		First(&idea).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrIdeaNotFound
	}

	if err != nil {
		return nil, fmt.Errorf("get project idea: %w", err)
	}

	if idea.OwnerEmail == "" && idea.OwnerID != "" {
		var u models.User
		if err := s.DB.Select("email").Where("id = ?", idea.OwnerID).First(&u).Error; err == nil {
			idea.OwnerEmail = u.Email
		}
	}

	return &idea, nil
}

// CreateIdea inserts a new project idea
func (s *IdeaService) CreateIdea(idea *models.ProjectIdea) (*models.ProjectIdea, error) {
	if idea.Status == "" {
		idea.Status = "approved"
	}

	if err := s.DB.Create(idea).Error; err != nil {
		return nil, fmt.Errorf("create project idea: %w", err)
	}

	return idea, nil
}

// UpdateIdea updates a project idea if the caller is the owner
func (s *IdeaService) UpdateIdea(id uint, ownerID string, updateData *models.ProjectIdea) (*models.ProjectIdea, error) {
	var idea models.ProjectIdea
	err := s.DB.Where("id = ?", id).First(&idea).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrIdeaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find project: %w", err)
	}

	if idea.OwnerID != ownerID {
		return nil, ErrUnauthorized
	}

	updates := map[string]interface{}{
		"title":             updateData.Title,
		"description":       updateData.Description,
		"category":          updateData.Category,
		"difficulty":        updateData.Difficulty,
		"technologies":      updateData.Technologies,
		"required_skills":   updateData.RequiredSkills,
		"team_requirements": updateData.TeamRequirements,
		"goal":              updateData.Goal,
		"fund_plans":        updateData.FundPlans,
		"target_fund":       updateData.TargetFund,
		"github_url":        updateData.GithubURL,
		"live_demo_url":     updateData.LiveDemoURL,
	}

	if err := s.DB.Model(&idea).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("update project: %w", err)
	}

	if err := s.DB.Where("id = ?", id).First(&idea).Error; err != nil {
		return nil, fmt.Errorf("reload project: %w", err)
	}

	return &idea, nil
}

// DeleteIdea removes a project idea if the caller is the owner
func (s *IdeaService) DeleteIdea(id uint, ownerID string) error {
	var idea models.ProjectIdea
	err := s.DB.Where("id = ?", id).First(&idea).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrIdeaNotFound
	}
	if err != nil {
		return fmt.Errorf("find project: %w", err)
	}

	if idea.OwnerID != ownerID {
		return ErrUnauthorized
	}

	// Delete chat messages
	_ = s.DB.Where("project_id = ?", id).Delete(&models.ChatMessage{}).Error
	// Delete reward tickets
	_ = s.DB.Where("project_id = ?", id).Delete(&models.RewardTicket{}).Error
	// Delete tasks
	_ = s.DB.Where("project_id = ?", id).Delete(&models.ProjectTask{}).Error
	// Delete join requests for this project
	if err := s.DB.Where("project_id = ?", id).Delete(&models.JoinRequest{}).Error; err != nil {
		return fmt.Errorf("delete join requests: %w", err)
	}

	// Delete the project
	if err := s.DB.Delete(&idea).Error; err != nil {
		return fmt.Errorf("delete project: %w", err)
	}

	return nil
}

// CreateJoinRequest submits an application to join a project
func (s *IdeaService) CreateJoinRequest(projectID uint, userID uint, role string, message string) (*models.JoinRequest, error) {
	var project models.ProjectIdea
	if err := s.DB.Where("id = ?", projectID).First(&project).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrIdeaNotFound
		}
		return nil, err
	}

	// Cannot apply to your own project
	if project.OwnerID == strconv.Itoa(int(userID)) {
		return nil, ErrCannotJoinOwn
	}

	// Check existing request
	var existing models.JoinRequest
	err := s.DB.Where("project_id = ? AND user_id = ?", projectID, userID).First(&existing).Error
	if err == nil {
		if existing.Status == "pending" || existing.Status == "accepted" {
			return nil, ErrAlreadyJoined
		}
		// If previously rejected, allow re-applying by updating
		existing.Role = role
		existing.Message = message
		existing.Status = "pending"
		if err := s.DB.Save(&existing).Error; err != nil {
			return nil, err
		}
		s.DB.Preload("User").First(&existing, existing.ID)
		return &existing, nil
	}

	joinReq := models.JoinRequest{
		ProjectID: projectID,
		UserID:    userID,
		Role:      role,
		Message:   message,
		Status:    "pending",
	}

	if err := s.DB.Create(&joinReq).Error; err != nil {
		return nil, fmt.Errorf("create join request: %w", err)
	}

	s.DB.Preload("User").First(&joinReq, joinReq.ID)
	return &joinReq, nil
}

// GetProjectJoinRequests lists all applicants for a project (owner only)
func (s *IdeaService) GetProjectJoinRequests(projectID uint, ownerID string) ([]models.JoinRequest, error) {
	var project models.ProjectIdea
	if err := s.DB.Where("id = ?", projectID).First(&project).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrIdeaNotFound
		}
		return nil, err
	}

	if project.OwnerID != ownerID {
		return nil, ErrUnauthorized
	}

	var requests []models.JoinRequest
	if err := s.DB.
		Where("project_id = ?", projectID).
		Preload("User").
		Order("created_at DESC").
		Find(&requests).Error; err != nil {
		return nil, fmt.Errorf("list join requests: %w", err)
	}

	return requests, nil
}

// UpdateJoinRequestStatus accepts or rejects a join request
func (s *IdeaService) UpdateJoinRequestStatus(projectID uint, requestID uint, ownerID string, status string) error {
	var project models.ProjectIdea
	if err := s.DB.Where("id = ?", projectID).First(&project).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrIdeaNotFound
		}
		return err
	}

	if project.OwnerID != ownerID {
		return ErrUnauthorized
	}

	var joinReq models.JoinRequest
	if err := s.DB.Where("id = ? AND project_id = ?", requestID, projectID).First(&joinReq).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrRequestNotFound
		}
		return err
	}

	joinReq.Status = status
	if err := s.DB.Save(&joinReq).Error; err != nil {
		return fmt.Errorf("update join request: %w", err)
	}

	return nil
}

// GetProjectMembers lists all accepted members of a project
func (s *IdeaService) GetProjectMembers(projectID uint) ([]models.JoinRequest, error) {
	var members []models.JoinRequest
	if err := s.DB.
		Where("project_id = ? AND status = ?", projectID, "accepted").
		Preload("User").
		Order("updated_at ASC").
		Find(&members).Error; err != nil {
		return nil, fmt.Errorf("get project members: %w", err)
	}

	return members, nil
}

// AdminListIdeas retrieves ALL ideas (all statuses), optionally filtered by status
func (s *IdeaService) AdminListIdeas(statusFilter string, page, limit int) (*IdeaListResult, error) {
	var ideas []models.ProjectIdea

	query := s.DB.Model(&models.ProjectIdea{})

	if statusFilter != "" {
		query = query.Where("status = ?", statusFilter)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("count ideas: %w", err)
	}

	offset := (page - 1) * limit

	if err := query.
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&ideas).Error; err != nil {
		return nil, fmt.Errorf("admin list ideas: %w", err)
	}

	totalPages := int64(0)
	if limit > 0 {
		totalPages = (total + int64(limit) - 1) / int64(limit)
	}

	return &IdeaListResult{
		Ideas:      ideas,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

// SetIdeaStatus sets an idea's status (used by admin to approve or reject)
func (s *IdeaService) SetIdeaStatus(id uint, status string) error {
	var idea models.ProjectIdea
	if err := s.DB.Where("id = ?", id).First(&idea).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrIdeaNotFound
		}
		return fmt.Errorf("find idea: %w", err)
	}

	idea.Status = status
	if err := s.DB.Save(&idea).Error; err != nil {
		return fmt.Errorf("update idea status: %w", err)
	}

	return nil
}

// AdminDeleteIdea deletes a project idea and its associated join requests (admin override, no owner check)
func (s *IdeaService) AdminDeleteIdea(id uint) error {
	var idea models.ProjectIdea
	err := s.DB.Where("id = ?", id).First(&idea).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrIdeaNotFound
	}
	if err != nil {
		return fmt.Errorf("find project: %w", err)
	}

	// Delete chat messages
	_ = s.DB.Where("project_id = ?", id).Delete(&models.ChatMessage{}).Error
	// Delete reward tickets
	_ = s.DB.Where("project_id = ?", id).Delete(&models.RewardTicket{}).Error
	// Delete tasks
	_ = s.DB.Where("project_id = ?", id).Delete(&models.ProjectTask{}).Error
	// Delete join requests for this project
	if err := s.DB.Where("project_id = ?", id).Delete(&models.JoinRequest{}).Error; err != nil {
		return fmt.Errorf("delete join requests: %w", err)
	}

	// Delete the project
	if err := s.DB.Delete(&idea).Error; err != nil {
		return fmt.Errorf("delete project: %w", err)
	}

	return nil
}

