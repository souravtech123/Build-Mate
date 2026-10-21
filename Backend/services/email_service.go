package services

import (
	"fmt"
	"log"
	"net/smtp"
	"os"
	"strings"
)

type EmailService struct {
	Host     string
	Port     string
	Username string
	Password string
	From     string
}

func NewEmailService() *EmailService {
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	if port == "" {
		port = "587"
	}
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")
	from := os.Getenv("SMTP_FROM")
	if from == "" {
		from = "no-reply@buildmate.app"
	}

	return &EmailService{
		Host:     host,
		Port:     port,
		Username: user,
		Password: pass,
		From:     from,
	}
}

// SendOTP dispatches the 6-digit verification code to the user's email address.
func (e *EmailService) SendOTP(toEmail, toName, otp string) error {
	subject := "Your Build-Mate Verification Code"
	body := fmt.Sprintf(`Hello %s,

Welcome to Build-Mate!

Your 6-digit verification code is:

    %s

This code is valid for 15 minutes. Please enter it on the verification screen to activate your account.

If you did not request this account, please disregard this email.

Happy Building!
Team Build-Mate
`, toName, otp)

	// Always print to console so it is instantly readable in development and logs
	log.Printf("========================================================\n")
	log.Printf("[BUILDMATE OTP DISPATCH] To: %s (%s)\n", toEmail, toName)
	log.Printf("[BUILDMATE OTP CODE]     >>> %s <<<\n", otp)
	log.Printf("========================================================\n")

	// If SMTP is not configured, we successfully complete in development mode
	if e.Host == "" || e.Username == "" {
		log.Printf("[BUILDMATE EMAIL] SMTP_HOST or SMTP_USER not set; using local console delivery.")
		return nil
	}

	// Prepare email headers and message
	msg := strings.Builder{}
	msg.WriteString(fmt.Sprintf("From: %s\r\n", e.From))
	msg.WriteString(fmt.Sprintf("To: %s\r\n", toEmail))
	msg.WriteString(fmt.Sprintf("Subject: %s\r\n", subject))
	msg.WriteString("MIME-Version: 1.0\r\n")
	msg.WriteString("Content-Type: text/plain; charset=\"utf-8\"\r\n")
	msg.WriteString("\r\n")
	msg.WriteString(body)

	auth := smtp.PlainAuth("", e.Username, e.Password, e.Host)
	addr := fmt.Sprintf("%s:%s", e.Host, e.Port)

	err := smtp.SendMail(addr, auth, e.From, []string{toEmail}, []byte(msg.String()))
	if err != nil {
		log.Printf("[BUILDMATE EMAIL WARNING] Failed to send via SMTP (%s): %v. Code logged above.", addr, err)
		return nil
	}

	log.Printf("[BUILDMATE EMAIL] Verification email successfully sent to %s via SMTP\n", toEmail)
	return nil
}
