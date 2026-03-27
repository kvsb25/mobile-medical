package utils

import (
	"fmt"
	"os"
	"gopkg.in/gomail.v2"
)
var MAILPASS = []byte(os.Getenv("MAILPASS"))

func OtpRegistration(to, otp string) error {
	message := gomail.NewMessage()
	message.SetHeader("From", "kovidhvsb7724@gmail.com")
	message.SetHeader("To", to, "elitetitanofficial@gmail.com")
	message.SetHeader("Subject", "Otp Verification")

	htmlBody := `
    <html>
    <body>
        <h1>Your OTP Code</h1>
        <p>Dear User,</p>
        <p>Your One-Time Password (OTP) is <strong>` + otp + `</strong>.</p>
        <p>Please use this OTP to complete your verification.</p>
        <p>If you did not request this OTP, please ignore this email.</p>
        <p>Best regards,<br>Swaasthya</p>
    </body>
    </html>
    `
	body := htmlBody
	body += "*Best regards*\n"
	body += "*Team Swaasthaya*"
	message.SetBody("text/html", htmlBody)

	//message.Attach("/home/Alex/lolcat.jpg")

	dialer := gomail.NewDialer("smtp.gmail.com", 587, "kovidhvsb7724@gmail.com", MAILPASS) // Update with your SMTP server details

	// Send email
	if err := dialer.DialAndSend(message); err != nil {
		panic(err)
	}

	fmt.Println("Email sent successfully!")
	return nil
}
func SendAppointmentEmail(patientEmail, doctorName, appointmentDate, appointmentTime, bookingTime string) error {
	message := gomail.NewMessage()
	message.SetHeader("From", "kovidhvsb7724@gmail.com")
	message.SetHeader("To", patientEmail)
	message.SetHeader("Subject", "Appointment Confirmation")

	htmlBody := `
    <html>
    <body>
        <h1>Appointment Confirmation</h1>
        <p>Dear Patient,</p>
        <p>Your appointment with Dr. ` + doctorName + ` has been successfully booked.</p>
        <p><strong>Appointment Date:</strong> ` + appointmentDate + `</p>
        <p><strong>Appointment Time:</strong> ` + appointmentTime + `</p>
        <p><strong>Booking Time:</strong> ` + bookingTime + `</p>
        <p>If you have any questions, please contact us.</p>
        <p>Best regards,<br>Swaasthya</p>
    </body>
    </html>
    `
	message.SetBody("text/html", htmlBody)

	// Initialize SMTP dialer
	dialer := gomail.NewDialer("smtp.gmail.com", 587, "kovidhvsb7724@gmail.com", MAILPASS) // Update with your SMTP server details

	// Send email
	if err := dialer.DialAndSend(message); err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	fmt.Println("Email sent successfully!")
	return nil
}

func SendAppointmentComingEmail(patientEmail, doctorName, appointmentDate, appointmentTime, bookingTime string) error {
	message := gomail.NewMessage()
	message.SetHeader("From", "kovidhvsb7724@gmail.com")
	message.SetHeader("To", patientEmail)
	message.SetHeader("Subject", "Appointment Coming")

	htmlBody := `
    <html>
    <body>
        <h1>Appointment Confirmation</h1>
        <p>Dear Patient,</p>
        <p>Your appointment with Dr. ` + doctorName + ` is about to come.</p>
        <p><strong>Appointment Date:</strong> ` + appointmentDate + `</p>
        <p><strong>Appointment Time:</strong> ` + appointmentTime + `</p>
        <p><strong>Booking Time:</strong> ` + bookingTime + `</p>
        <p>If you have any questions, please contact us.</p>
        <p>Best regards,<br>Swaasthya</p>
    </body>
    </html>
    `
	message.SetBody("text/html", htmlBody)

	// Initialize SMTP dialer
	dialer := gomail.NewDialer("smtp.gmail.com", 587, "kovidhvsb7724@gmail.com", MAILPASS) // Update with your SMTP server details

	// Send email
	if err := dialer.DialAndSend(message); err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	fmt.Println("Email sent successfully!")
	return nil
}

func SendLoginDetailsEmail(patientEmail, patientName, password string) error {
	message := gomail.NewMessage()
	message.SetHeader("From", "kovidhvsb7724@gmail.com")
	message.SetHeader("To", patientEmail)
	message.SetHeader("Subject", "Login Details")

	htmlBody := `
    <html>
    <body>
        <h1>Login Details</h1>
        <p>Dear ` + patientName + ` </p>
        <p>Your Login details are : </p>
        <p><strong>Email/Username</strong> ` + patientEmail + `</p>
        <p><strong>Password</strong> ` + password + `</p>
        <p>Don't share your password with anyone.</p>
        <p>Best regards,<br>Swaasthya</p>
    </body>
    </html>
    `
	message.SetBody("text/html", htmlBody)

	dialer := gomail.NewDialer("smtp.gmail.com", 587, "kovidhvsb7724@gmail.com", MAILPASS)

	if err := dialer.DialAndSend(message); err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	fmt.Println("Email sent successfully!")
	return nil
}
