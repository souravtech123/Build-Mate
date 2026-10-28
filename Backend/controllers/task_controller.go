package controllers

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"buildmate/backend/services"

	"github.com/gin-gonic/gin"
)

type TaskController struct {
	TaskService *services.TaskService
}

func NewTaskController(taskService *services.TaskService) *TaskController {
	return &TaskController{TaskService: taskService}
}

type CreateTaskPayload struct {
	Title            string    `json:"title" binding:"required"`
	Description      string    `json:"description"`
	AssignedToUserID uint      `json:"assigned_to_user_id" binding:"required"`
	Deadline         time.Time `json:"deadline" binding:"required"`
	Priority         string    `json:"priority"`
	RewardPoints     int       `json:"reward_points"`
	RewardTitle      string    `json:"reward_title"`
}

// POST /api/v1/ideas/:id/tasks
func (tc *TaskController) CreateTask(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)

	projectID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || projectID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid project ID"})
		return
	}

	var req CreateTaskPayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Validation error: " + err.Error()})
		return
	}

	task, err := tc.TaskService.CreateTask(uint(projectID), strconv.Itoa(int(userID)), services.CreateTaskInput{
		Title:            req.Title,
		Description:      req.Description,
		AssignedToUserID: req.AssignedToUserID,
		Deadline:         req.Deadline,
		Priority:         req.Priority,
		RewardPoints:     req.RewardPoints,
		RewardTitle:      req.RewardTitle,
	})
	if err != nil {
		if errors.Is(err, services.ErrIdeaNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Project not found"})
			return
		}
		if errors.Is(err, services.ErrUnauthorized) {
			c.JSON(http.StatusForbidden, gin.H{"success": false, "message": "Only the project owner can create and assign tasks"})
			return
		}
		if errors.Is(err, services.ErrAssigneeNotMember) {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "The assigned user is not an accepted member of this project"})
			return
		}
		if errors.Is(err, services.ErrInvalidDeadline) {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Task deadline must be a future date and time"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Task assigned successfully!",
		"data":    task,
	})
}

// GET /api/v1/ideas/:id/tasks
func (tc *TaskController) GetProjectTasks(c *gin.Context) {
	projectID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || projectID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid project ID"})
		return
	}

	tasks, err := tc.TaskService.GetProjectTasks(uint(projectID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch tasks: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    tasks,
	})
}

type UpdateTaskStatusPayload struct {
	Status string `json:"status" binding:"required"` // in_progress, completed
	Note   string `json:"note"`
}

// PATCH /api/v1/ideas/:id/tasks/:taskId/status
func (tc *TaskController) UpdateTaskStatus(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)

	projectID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || projectID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid project ID"})
		return
	}

	taskID, err := strconv.ParseUint(c.Param("taskId"), 10, 32)
	if err != nil || taskID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid task ID"})
		return
	}

	var req UpdateTaskStatusPayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Status must be 'in_progress' or 'completed'"})
		return
	}

	task, ticket, err := tc.TaskService.UpdateTaskStatus(uint(projectID), uint(taskID), userID, req.Status, req.Note)
	if err != nil {
		if errors.Is(err, services.ErrTaskNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Task not found"})
			return
		}
		if errors.Is(err, services.ErrUnauthorized) {
			c.JSON(http.StatusForbidden, gin.H{"success": false, "message": "You can only update tasks assigned to you"})
			return
		}
		if errors.Is(err, services.ErrTaskAlreadyDone) {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Task has already been completed"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	msg := "Task status updated"
	if req.Status == "completed" {
		if ticket != nil {
			msg = "Congratulations! Task completed on time. Reward ticket issued!"
		} else {
			msg = "Task completed after deadline. Marked as completed without reward ticket."
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": msg,
		"data": gin.H{
			"task":   task,
			"ticket": ticket,
		},
	})
}

// DELETE /api/v1/ideas/:id/tasks/:taskId
func (tc *TaskController) DeleteTask(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)

	projectID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || projectID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid project ID"})
		return
	}

	taskID, err := strconv.ParseUint(c.Param("taskId"), 10, 32)
	if err != nil || taskID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Invalid task ID"})
		return
	}

	if err := tc.TaskService.DeleteTask(uint(projectID), uint(taskID), strconv.Itoa(int(userID))); err != nil {
		if errors.Is(err, services.ErrUnauthorized) {
			c.JSON(http.StatusForbidden, gin.H{"success": false, "message": "Only project owner can delete tasks"})
			return
		}
		if errors.Is(err, services.ErrTaskNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Task not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Task deleted successfully",
	})
}

// GET /api/v1/user/tasks
func (tc *TaskController) GetUserTasks(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)

	tasks, err := tc.TaskService.GetUserTasks(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch user tasks: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    tasks,
	})
}

// GET /api/v1/user/tickets
func (tc *TaskController) GetUserTickets(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)

	tickets, err := tc.TaskService.GetUserTickets(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Failed to fetch reward tickets: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    tickets,
	})
}
