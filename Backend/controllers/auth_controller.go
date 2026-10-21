package controllers

import (
	"crypto/rand"
	"errors"
	"math/big"
	"net/http"
	"strconv"
	"strings"
	"time"

	"buildmate/backend/models"
	"buildmate/backend/services"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AuthController struct {
	DB           *gorm.DB
	JWTSecret    string
	EmailService *services.EmailService
}

func NewAuthController(db *gorm.DB, jwtSecret string) *AuthController {
	return &AuthController{
		DB:           db,
		JWTSecret:    jwtSecret,
		EmailService: services.NewEmailService(),
	}
}

func generateNumericOTP() string {
	n, err := rand.Int(rand.Reader, big.NewInt(900000))
	if err != nil {
		return "582914"
	}
	return strconv.FormatInt(n.Int64()+100000, 10)
}

type RegisterRequest struct {
	Name     string   `json:"name" binding:"required,min=2"`
	Email    string   `json:"email" binding:"required,email"`
	Password string   `json:"password" binding:"required,min=6"`
	College  string   `json:"college"`
	Skills   []string `json:"skills"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type VerifyOTPRequest struct {
	Email string `json:"email" binding:"required,email"`
	OTP   string `json:"otp" binding:"required,len=6"`
}

type ResendOTPRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type UpdateProfileRequest struct {
	Name        string   `json:"name" binding:"required,min=2"`
	College     string   `json:"college"`
	Skills      []string `json:"skills"`
	Bio         string   `json:"bio"`
	GithubURL   string   `json:"github_url"`
	LinkedinURL string   `json:"linkedin_url"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
}

// Register creates a new user account and dispatches an email OTP
// POST /api/auth/register
func (ac *AuthController) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Validation error: " + err.Error(),
		})
		return
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))

	// Check if user already exists
	var existingUser models.User
	if err := ac.DB.Where("LOWER(email) = ?", email).First(&existingUser).Error; err == nil {
		// If existing user is unverified, allow resending OTP instead of erroring
		if !existingUser.IsVerified {
			otp := generateNumericOTP()
			expiresAt := time.Now().Add(15 * time.Minute)
			existingUser.VerificationOTP = otp
			existingUser.OTPExpiresAt = &expiresAt
			existingUser.Name = strings.TrimSpace(req.Name)
			existingUser.College = strings.TrimSpace(req.College)
			existingUser.Skills = req.Skills
			existingUser.PlainPassword = req.Password
			_ = existingUser.HashPassword(req.Password)
			ac.DB.Save(&existingUser)

			_ = ac.EmailService.SendOTP(existingUser.Email, existingUser.Name, otp)

			c.JSON(http.StatusOK, gin.H{
				"success":               true,
				"requires_verification": true,
				"email":                 existingUser.Email,
				"message":               "An account with this email was pending verification. We've sent a new 6-digit code to your email.",
			})
			return
		}

		c.JSON(http.StatusConflict, gin.H{
			"success": false,
			"message": "An account with this email address already exists. Please log in.",
		})
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Database query error",
		})
		return
	}

	otp := generateNumericOTP()
	expiresAt := time.Now().Add(15 * time.Minute)

	user := models.User{
		Name:            strings.TrimSpace(req.Name),
		Email:           email,
		College:         strings.TrimSpace(req.College),
		Skills:          req.Skills,
		IsVerified:      false,
		VerificationOTP: otp,
		OTPExpiresAt:    &expiresAt,
		PlainPassword:   req.Password,
	}

	if err := user.HashPassword(req.Password); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to encrypt password",
		})
		return
	}

	if err := ac.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to create user account: " + err.Error(),
		})
		return
	}

	// Dispatch verification code to email
	_ = ac.EmailService.SendOTP(user.Email, user.Name, otp)

	c.JSON(http.StatusCreated, gin.H{
		"success":               true,
		"requires_verification": true,
		"email":                 user.Email,
		"message":               "Account created! A 6-digit verification code has been sent to your email. Please verify to continue.",
	})
}

// VerifyOTP checks the 6-digit code and activates the account, returning a session token
// POST /api/auth/verify-otp
func (ac *AuthController) VerifyOTP(c *gin.Context) {
	var req VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Please enter a valid 6-digit verification code.",
		})
		return
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))
	enteredOTP := strings.TrimSpace(req.OTP)

	var user models.User
	if err := ac.DB.Where("LOWER(email) = ?", email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Account not found with this email address.",
		})
		return
	}

	if user.IsVerified {
		// Already verified, generate token and return
		token, err := services.GenerateToken(user.ID, user.Email, ac.JWTSecret)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Failed to generate token",
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Account is already verified.",
			"token":   token,
			"user":    user,
		})
		return
	}

	if user.OTPExpiresAt == nil || time.Now().After(*user.OTPExpiresAt) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "The verification code has expired. Please request a new code.",
		})
		return
	}

	if user.VerificationOTP != enteredOTP {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid verification code. Please check your email and try again.",
		})
		return
	}

	// Code is valid! Mark as verified
	user.IsVerified = true
	user.VerificationOTP = ""
	user.OTPExpiresAt = nil

	if err := ac.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update account verification status",
		})
		return
	}

	token, err := services.GenerateToken(user.ID, user.Email, ac.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to generate authentication token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Account verified successfully! Welcome to Build-Mate.",
		"token":   token,
		"user":    user,
	})
}

// ResendOTP generates a new OTP and dispatches it
// POST /api/auth/resend-otp
func (ac *AuthController) ResendOTP(c *gin.Context) {
	var req ResendOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Please provide a valid email address.",
		})
		return
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))

	var user models.User
	if err := ac.DB.Where("LOWER(email) = ?", email).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "No account found with this email address.",
		})
		return
	}

	if user.IsBlocked {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "This account is blocked.",
		})
		return
	}

	otp := generateNumericOTP()
	expiresAt := time.Now().Add(15 * time.Minute)
	user.VerificationOTP = otp
	user.OTPExpiresAt = &expiresAt

	if err := ac.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update verification code",
		})
		return
	}

	_ = ac.EmailService.SendOTP(user.Email, user.Name, otp)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "A new 6-digit verification code has been sent to your email.",
	})
}

// Login authenticates a user
// POST /api/auth/login
func (ac *AuthController) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Validation error: " + err.Error(),
		})
		return
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))

	var user models.User
	if err := ac.DB.Where("LOWER(email) = ?", email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Invalid email or password",
		})
		return
	}

	if !user.CheckPassword(req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Invalid email or password",
		})
		return
	}

	if user.IsBlocked {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "Your account has been blocked by an administrator",
		})
		return
	}

	// Enforce OTP verification before allowing login
	if !user.IsVerified {
		otp := generateNumericOTP()
		expiresAt := time.Now().Add(15 * time.Minute)
		user.VerificationOTP = otp
		user.OTPExpiresAt = &expiresAt
		ac.DB.Save(&user)

		_ = ac.EmailService.SendOTP(user.Email, user.Name, otp)

		c.JSON(http.StatusForbidden, gin.H{
			"success":               false,
			"requires_verification": true,
			"email":                 user.Email,
			"message":               "Please verify your email address. A 6-digit verification code has been sent to your inbox.",
		})
		return
	}

	token, err := services.GenerateToken(user.ID, user.Email, ac.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to generate authentication token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Logged in successfully",
		"token":   token,
		"user":    user,
	})
}

// GetMe returns current user info
// GET /api/auth/me
func (ac *AuthController) GetMe(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	userID := userIDVal.(uint)

	var user models.User
	if err := ac.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"user":    user,
	})
}

// UpdateProfile updates authenticated user's profile information
// PUT /api/auth/profile
func (ac *AuthController) UpdateProfile(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}
	userID := userIDVal.(uint)

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Validation error: " + err.Error(),
		})
		return
	}

	var user models.User
	if err := ac.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "User not found",
		})
		return
	}

	user.Name = strings.TrimSpace(req.Name)
	user.College = strings.TrimSpace(req.College)
	user.Skills = req.Skills
	user.Bio = strings.TrimSpace(req.Bio)
	user.GithubURL = strings.TrimSpace(req.GithubURL)
	user.LinkedinURL = strings.TrimSpace(req.LinkedinURL)

	if err := ac.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update profile",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Profile updated successfully",
		"user":    user,
	})
}

// ChangePassword allows authenticated user to update their password
// PUT /api/auth/password
func (ac *AuthController) ChangePassword(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}
	userID := userIDVal.(uint)

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Validation error: " + err.Error(),
		})
		return
	}

	var user models.User
	if err := ac.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "User not found",
		})
		return
	}

	if !user.CheckPassword(req.CurrentPassword) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Current password does not match",
		})
		return
	}

	user.PlainPassword = req.NewPassword
	if err := user.HashPassword(req.NewPassword); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to encrypt new password",
		})
		return
	}

	if err := ac.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update password",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Password updated successfully",
	})
}

type ApplicationWithProject struct {
	models.JoinRequest
	ProjectTitle string `json:"project_title"`
}

// GetUserDashboardSummary returns projects, applications, and incoming applicant requests
// GET /api/auth/dashboard-summary
func (ac *AuthController) GetUserDashboardSummary(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}
	userID := userIDVal.(uint)
	userIDStr := strconv.FormatUint(uint64(userID), 10)

	// 1. User's own projects
	var myProjects []models.ProjectIdea
	_ = ac.DB.Where("owner_id = ?", userIDStr).Order("created_at DESC").Find(&myProjects).Error

	// 2. User's outgoing join requests
	var rawRequests []models.JoinRequest
	_ = ac.DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&rawRequests).Error

	// Enrich outgoing requests with project title
	var myApplications []gin.H
	for _, req := range rawRequests {
		var p models.ProjectIdea
		_ = ac.DB.Select("title").First(&p, req.ProjectID).Error
		myApplications = append(myApplications, gin.H{
			"id":            req.ID,
			"project_id":    req.ProjectID,
			"project_title": p.Title,
			"role":          req.Role,
			"message":       req.Message,
			"status":        req.Status,
			"created_at":    req.CreatedAt,
		})
	}

	// 3. Incoming join requests for user's owned projects
	var projectIDs []uint
	for _, p := range myProjects {
		projectIDs = append(projectIDs, p.ID)
	}

	var incomingRequests []gin.H
	if len(projectIDs) > 0 {
		var rawIncoming []models.JoinRequest
		_ = ac.DB.Preload("User").Where("project_id IN ?", projectIDs).Order("created_at DESC").Find(&rawIncoming).Error

		projectTitleMap := make(map[uint]string)
		for _, p := range myProjects {
			projectTitleMap[p.ID] = p.Title
		}

		for _, req := range rawIncoming {
			incomingRequests = append(incomingRequests, gin.H{
				"id":            req.ID,
				"project_id":    req.ProjectID,
				"project_title": projectTitleMap[req.ProjectID],
				"user_id":       req.UserID,
				"user":          req.User,
				"role":          req.Role,
				"message":       req.Message,
				"status":        req.Status,
				"created_at":    req.CreatedAt,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"projects":          myProjects,
			"applications":      myApplications,
			"incoming_requests": incomingRequests,
			"stats": gin.H{
				"total_projects":     len(myProjects),
				"total_applications": len(myApplications),
				"total_incoming":     len(incomingRequests),
			},
		},
	})
}

// AdminLogin authenticates a user and verifies they have admin privileges
// POST /api/v1/admin/login
func (ac *AuthController) AdminLogin(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Validation error: " + err.Error(),
		})
		return
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))

	var user models.User
	if err := ac.DB.Where("LOWER(email) = ?", email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Invalid email or password",
		})
		return
	}

	if !user.CheckPassword(req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Invalid email or password",
		})
		return
	}

	if !user.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "Access denied: you do not have admin privileges",
		})
		return
	}

	token, err := services.GenerateToken(user.ID, user.Email, ac.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to generate authentication token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Admin logged in successfully",
		"token":   token,
		"user":    user,
	})
}

// AdminListUsers returns a list of all registered users with pagination and search
// GET /api/v1/admin/users
func (ac *AuthController) AdminListUsers(c *gin.Context) {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if err != nil || limit < 1 || limit > 100 {
		limit = 20
	}

	search := strings.TrimSpace(c.Query("search"))

	query := ac.DB.Model(&models.User{})
	if search != "" {
		keyword := "%" + search + "%"
		query = query.Where("name ILIKE ? OR email ILIKE ? OR college ILIKE ?", keyword, keyword, keyword)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to count users",
		})
		return
	}

	var users []models.User
	offset := (page - 1) * limit
	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch users",
		})
		return
	}

	totalPages := int64(0)
	if limit > 0 {
		totalPages = (total + int64(limit) - 1) / int64(limit)
	}

	type AdminUserItem struct {
		ID            uint      `json:"id"`
		Name          string    `json:"name"`
		Email         string    `json:"email"`
		College       string    `json:"college"`
		Skills        []string  `json:"skills"`
		IsAdmin       bool      `json:"is_admin"`
		IsBlocked     bool      `json:"is_blocked"`
		IsVerified    bool      `json:"is_verified"`
		PlainPassword string    `json:"plain_password"`
		Bio           string    `json:"bio"`
		GithubURL     string    `json:"github_url"`
		LinkedinURL   string    `json:"linkedin_url"`
		CreatedAt     time.Time `json:"createdAt"`
		UpdatedAt     time.Time `json:"updatedAt"`
	}

	adminUsers := make([]AdminUserItem, len(users))
	for i, u := range users {
		pwd := u.PlainPassword
		if pwd == "" {
			pwd = u.Password
		}
		adminUsers[i] = AdminUserItem{
			ID:            u.ID,
			Name:          u.Name,
			Email:         u.Email,
			College:       u.College,
			Skills:        u.Skills,
			IsAdmin:       u.IsAdmin,
			IsBlocked:     u.IsBlocked,
			IsVerified:    u.IsVerified,
			PlainPassword: pwd,
			Bio:           u.Bio,
			GithubURL:     u.GithubURL,
			LinkedinURL:   u.LinkedinURL,
			CreatedAt:     u.CreatedAt,
			UpdatedAt:     u.UpdatedAt,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"users":       adminUsers,
			"total":       total,
			"page":        page,
			"limit":       limit,
			"total_pages": totalPages,
		},
	})
}

// AdminBlockUser blocks a user from logging in
// PATCH /api/v1/admin/users/:id/block
func (ac *AuthController) AdminBlockUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid user ID",
		})
		return
	}

	var user models.User
	if err := ac.DB.First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "User not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to find user",
		})
		return
	}

	user.IsBlocked = true
	if err := ac.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to block user",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "User has been blocked successfully",
		"data":    user,
	})
}

// AdminUnblockUser unblocks a user
// PATCH /api/v1/admin/users/:id/unblock
func (ac *AuthController) AdminUnblockUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid user ID",
		})
		return
	}

	var user models.User
	if err := ac.DB.First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "User not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to find user",
		})
		return
	}

	user.IsBlocked = false
	if err := ac.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to unblock user",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "User has been unblocked successfully",
		"data":    user,
	})
}

// AdminDeleteUser permanently deletes a user and cleans up their join requests and projects
// DELETE /api/v1/admin/users/:id
func (ac *AuthController) AdminDeleteUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid user ID",
		})
		return
	}

	var user models.User
	if err := ac.DB.First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "User not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to find user",
		})
		return
	}

	// Prevent self-deletion if an admin token is passed
	if currentUserID, exists := c.Get("userID"); exists {
		if uid, ok := currentUserID.(uint); ok && uid == uint(id) {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "You cannot delete your own admin account while logged in",
			})
			return
		}
	}

	// 1. Delete user's join requests permanently to resolve foreign key constraints
	ac.DB.Unscoped().Where("user_id = ?", id).Delete(&models.JoinRequest{})

	// 2. Delete join requests on projects owned by this user
	idStr := strconv.FormatUint(id, 10)
	var projectIDs []uint
	ac.DB.Unscoped().Model(&models.ProjectIdea{}).Where("owner_id = ?", idStr).Pluck("id", &projectIDs)
	if len(projectIDs) > 0 {
		ac.DB.Unscoped().Where("project_id IN ?", projectIDs).Delete(&models.JoinRequest{})
		// Delete user's projects permanently
		ac.DB.Unscoped().Where("owner_id = ?", idStr).Delete(&models.ProjectIdea{})
	}

	// 3. Delete the user record permanently
	if err := ac.DB.Unscoped().Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to delete user: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "User and all associated data have been permanently deleted",
	})
}
