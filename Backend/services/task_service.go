package services

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"buildmate/backend/models"

	"gorm.io/gorm"
)

var (
	ErrTaskNotFound       = errors.New("task not found")
	ErrAssigneeNotMember   = errors.New("assigned user is not an accepted member of this project")
	ErrInvalidDeadline     = errors.New("deadline must be in the future")
	ErrTaskAlreadyDone     = errors.New("task has already been marked as completed")
)

type TaskService struct {
	DB *gorm.DB
}

func NewTaskService(db *gorm.DB) *TaskService {
	return &TaskService{DB: db}
}

type CreateTaskInput struct {
	Title            string    `json:"title"`
	Description      string    `json:"description"`
	AssignedToUserID uint      `json:"assigned_to_user_id"`
	Deadline         time.Time `json:"deadline"`
	Priority         string    `json:"priority"`
	RewardPoints     int       `json:"reward_points"`
	RewardTitle      string    `json:"reward_title"`
}

func generateTicketCode() string {
	bytes := make([]byte, 3)
	if _, err := rand.Read(bytes); err != nil {
		return fmt.Sprintf("BM-TKT-%d", time.Now().UnixNano()%1000000)
	}
	suffix := strings.ToUpper(hex.EncodeToString(bytes))
	return fmt.Sprintf("BM-TKT-%04d-%s", time.Now().YearDay()*10+time.Now().Hour(), suffix)
}

// CreateTask assigns a new task with a deadline and reward to a project member (Owner only)
func (s *TaskService) CreateTask(projectID uint, ownerID string, input CreateTaskInput) (*models.ProjectTask, error) {
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

	if input.Title == "" {
		return nil, errors.New("task title is required")
	}

	if input.Deadline.IsZero() || input.Deadline.Before(time.Now()) {
		return nil, ErrInvalidDeadline
	}

	// Verify assignee exists
	var assignee models.User
	if err := s.DB.Where("id = ?", input.AssignedToUserID).First(&assignee).Error; err != nil {
		return nil, errors.New("assigned user does not exist")
	}

	// Verify assignee is an accepted member or the project owner
	assigneeIDStr := strconv.Itoa(int(input.AssignedToUserID))
	if project.OwnerID != assigneeIDStr {
		var member models.JoinRequest
		err := s.DB.Where("project_id = ? AND user_id = ? AND status = ?", projectID, input.AssignedToUserID, "accepted").First(&member).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAssigneeNotMember
		} else if err != nil {
			return nil, err
		}
	}

	priority := strings.ToLower(input.Priority)
	if priority != "low" && priority != "medium" && priority != "high" && priority != "urgent" {
		priority = "medium"
	}

	rewardPoints := input.RewardPoints
	if rewardPoints <= 0 {
		rewardPoints = 50
	}

	rewardTitle := strings.TrimSpace(input.RewardTitle)
	if rewardTitle == "" {
		rewardTitle = "On-Time Completion Pass"
	}

	task := models.ProjectTask{
		ProjectID:        projectID,
		Title:            strings.TrimSpace(input.Title),
		Description:      strings.TrimSpace(input.Description),
		AssignedToUserID: input.AssignedToUserID,
		CreatedByUserID:  uint(mustParseUint(ownerID)),
		Deadline:         input.Deadline,
		Priority:         priority,
		RewardPoints:     rewardPoints,
		RewardTitle:      rewardTitle,
		Status:           "assigned",
	}

	if err := s.DB.Create(&task).Error; err != nil {
		return nil, fmt.Errorf("create task: %w", err)
	}

	s.DB.Preload("AssignedTo").First(&task, task.ID)
	return &task, nil
}

// GetProjectTasks fetches all tasks for a specific project
func (s *TaskService) GetProjectTasks(projectID uint) ([]models.ProjectTask, error) {
	var tasks []models.ProjectTask
	if err := s.DB.
		Where("project_id = ?", projectID).
		Preload("AssignedTo").
		Preload("Ticket").
		Order("deadline ASC, id DESC").
		Find(&tasks).Error; err != nil {
		return nil, fmt.Errorf("find project tasks: %w", err)
	}

	now := time.Now()
	for i := range tasks {
		if tasks[i].Status != "completed" && now.After(tasks[i].Deadline) {
			tasks[i].Status = "overdue"
		}
	}

	return tasks, nil
}

// UpdateTaskStatus handles progressing task status to in_progress or completed (with reward ticket generation)
func (s *TaskService) UpdateTaskStatus(projectID uint, taskID uint, userID uint, status string, note string) (*models.ProjectTask, *models.RewardTicket, error) {
	var task models.ProjectTask
	if err := s.DB.Where("id = ? AND project_id = ?", taskID, projectID).Preload("AssignedTo").Preload("Ticket").First(&task).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, ErrTaskNotFound
		}
		return nil, nil, err
	}

	var project models.ProjectIdea
	if err := s.DB.Where("id = ?", projectID).First(&project).Error; err != nil {
		return nil, nil, ErrIdeaNotFound
	}

	isOwner := project.OwnerID == strconv.Itoa(int(userID))
	isAssignee := task.AssignedToUserID == userID

	if !isOwner && !isAssignee {
		return nil, nil, ErrUnauthorized
	}

	status = strings.ToLower(status)
	var generatedTicket *models.RewardTicket

	switch status {
	case "in_progress":
		if task.Status == "completed" {
			return nil, nil, ErrTaskAlreadyDone
		}
		task.Status = "in_progress"
		if err := s.DB.Save(&task).Error; err != nil {
			return nil, nil, err
		}

	case "completed":
		if task.Status == "completed" {
			return &task, task.Ticket, nil
		}

		now := time.Now()
		task.CompletedAt = &now
		task.CompletionNote = strings.TrimSpace(note)
		task.Status = "completed"

		// Evaluate deadline
		if now.Before(task.Deadline) || now.Equal(task.Deadline) {
			task.IsCompletedOnTime = true

			badgeColor := "emerald"
			if task.RewardPoints >= 150 {
				badgeColor = "gold"
			} else if task.RewardPoints >= 100 {
				badgeColor = "indigo"
			}

			ticket := models.RewardTicket{
				TicketNumber: generateTicketCode(),
				ProjectID:    projectID,
				TaskID:       task.ID,
				UserID:       task.AssignedToUserID,
				TaskTitle:    task.Title,
				RewardTitle:  task.RewardTitle,
				RewardPoints: task.RewardPoints,
				Deadline:     task.Deadline,
				CompletedAt:  now,
				Status:       "valid",
				BadgeColor:   badgeColor,
			}

			if err := s.DB.Create(&ticket).Error; err != nil {
				return nil, nil, fmt.Errorf("create reward ticket: %w", err)
			}

			s.DB.Preload("User").First(&ticket, ticket.ID)
			generatedTicket = &ticket
			task.Ticket = generatedTicket
		} else {
			task.IsCompletedOnTime = false
		}

		if err := s.DB.Save(&task).Error; err != nil {
			return nil, nil, err
		}

	default:
		return nil, nil, errors.New("invalid status: must be 'in_progress' or 'completed'")
	}

	return &task, generatedTicket, nil
}

// DeleteTask removes a task (Owner only)
func (s *TaskService) DeleteTask(projectID uint, taskID uint, ownerID string) error {
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

	// Delete associated ticket if any
	s.DB.Where("task_id = ?", taskID).Delete(&models.RewardTicket{})

	res := s.DB.Where("id = ? AND project_id = ?", taskID, projectID).Delete(&models.ProjectTask{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrTaskNotFound
	}

	return nil
}

// GetUserTasks returns all tasks assigned to the current user
func (s *TaskService) GetUserTasks(userID uint) ([]models.ProjectTask, error) {
	var tasks []models.ProjectTask
	if err := s.DB.
		Where("assigned_to_user_id = ?", userID).
		Preload("Project").
		Preload("Ticket").
		Order("deadline ASC, id DESC").
		Find(&tasks).Error; err != nil {
		return nil, fmt.Errorf("find user tasks: %w", err)
	}

	now := time.Now()
	for i := range tasks {
		if tasks[i].Status != "completed" && now.After(tasks[i].Deadline) {
			tasks[i].Status = "overdue"
		}
	}

	return tasks, nil
}

// GetUserTickets returns all earned reward tickets for the current user
func (s *TaskService) GetUserTickets(userID uint) ([]models.RewardTicket, error) {
	var tickets []models.RewardTicket
	if err := s.DB.
		Where("user_id = ?", userID).
		Preload("Project").
		Order("created_at DESC").
		Find(&tickets).Error; err != nil {
		return nil, fmt.Errorf("find user tickets: %w", err)
	}

	return tickets, nil
}

func mustParseUint(s string) uint {
	v, _ := strconv.ParseUint(s, 10, 32)
	return uint(v)
}
