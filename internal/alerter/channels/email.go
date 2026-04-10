package channels

import (
	"context"
	"fmt"
	"log/slog"
	"net/smtp"

	"praveenchalla.local/ai-log-analyzer/internal/models"
)

type EmailChannel struct {
	host     string
	port     int
	user     string
	password string
	from     string
	to       []string
	logger   *slog.Logger
}

func NewEmailChannel(host string, port int, user, password, from string, to []string, logger *slog.Logger) *EmailChannel {
	return &EmailChannel{
		host:     host,
		port:     port,
		user:     user,
		password: password,
		from:     from,
		to:       to,
		logger:   logger,
	}
}

func (e *EmailChannel) Name() string {
	return string(models.Email)
}

func (e *EmailChannel) Send(ctx context.Context, alert models.Alert) error {
	addr := fmt.Sprintf("%s:%d", e.host, e.port)
	subject := fmt.Sprintf("Subject: [ALERT] %s - %s\n", alert.Severity, alert.Title)
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	
	body := fmt.Sprintf(`
		<html>
		<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
			<div style="background: #f4f4f4; padding: 20px; border-radius: 8px;">
				<h2 style="color: #d9534f;">🚨 Real-Time AI Alert Detected</h2>
				<hr/>
				<p><strong>Title:</strong> %s</p>
				<p><strong>Severity:</strong> %s</p>
				<p><strong>Message:</strong> %s</p>
				<p><strong>Detected At:</strong> %s</p>
				<div style="background: #fff; padding: 15px; border-left: 4px solid #d9534f; margin-top: 20px;">
					<h3>Incident Context:</h3>
					<pre style="white-space: pre-wrap;">%s</pre>
				</div>
				<p style="margin-top: 20px;">
					<a href="https://dashboard.ai-log-analyzer.com/alerts/%s" 
					   style="background: #0275d8; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
					   View in Dashboard
					</a>
				</p>
			</div>
		</body>
		</html>
	`, alert.Title, alert.Severity, alert.Message, alert.CreatedAt.Format("2006-01-02 15:04:05"), 
	   alert.Metadata["root_cause"], alert.AnomalyID)

	msg := []byte(subject + mime + body)
	auth := smtp.PlainAuth("", e.user, e.password, e.host)

	err := smtp.SendMail(addr, auth, e.from, e.to, msg)
	if err != nil {
		e.logger.Error("Failed to send email", "error", err)
		return err
	}

	return nil
}
