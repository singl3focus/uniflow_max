package max

import (
	"context"
	"fmt"
	"time"

	"github.com/singl3focus/uniflow/internal/core/models"
)

// NotificationService сервис для отправки уведомлений через MAX
type NotificationService struct {
	client *Client
}

// NewNotificationService создает новый сервис уведомлений
func NewNotificationService(client *Client) *NotificationService {
	return &NotificationService{
		client: client,
	}
}

// SendTaskReminder отправляет напоминание о задаче
func (s *NotificationService) SendTaskReminder(ctx context.Context, userID int64, task *models.Task) error {
	var text string
	if task.DueAt != nil {
		text = fmt.Sprintf(
			"⏰ Напоминание о задаче:\n\n"+
				"📝 %s\n"+
				"📅 Срок: %s\n"+
				"📊 Статус: %s",
			task.Title,
			task.DueAt.Format("02.01.2006 15:04"),
			task.Status,
		)
	} else {
		text = fmt.Sprintf(
			"⏰ Напоминание о задаче:\n\n"+
				"📝 %s\n"+
				"📊 Статус: %s",
			task.Title,
			task.Status,
		)
	}

	return s.client.SendMessage(ctx, userID, text)
}

// SendDailySummary отправляет ежедневную сводку
func (s *NotificationService) SendDailySummary(ctx context.Context, userID int64, tasks []*models.Task) error {
	text := "📊 Ваши задачи на сегодня:\n\n"

	if len(tasks) == 0 {
		text += "✅ Нет запланированных задач"
	} else {
		for i, task := range tasks {
			status := "⬜"
			if task.Status == models.TaskStatusCompleted {
				status = "✅"
			}
			text += fmt.Sprintf("%d. %s %s\n", i+1, status, task.Title)
		}
	}

	return s.client.SendMessage(ctx, userID, text)
}

// SendFocusSessionStart отправляет уведомление о начале фокус-сессии
func (s *NotificationService) SendFocusSessionStart(ctx context.Context, userID int64, session *models.FocusSession) error {
	var contextInfo string
	if session.ContextID != nil {
		contextInfo = fmt.Sprintf("📂 Контекст: %s\n", session.ContextID.String())
	}

	text := fmt.Sprintf(
		"🎯 Начинается фокус-сессия!\n\n"+
			"⏱ Длительность: %d минут\n"+
			"%s\n"+
			"Сконцентрируйтесь на выполнении задачи. Удачи!",
		session.DurationMinutes,
		contextInfo,
	)

	return s.client.SendMessage(ctx, userID, text)
}

// SendFocusSessionEnd отправляет уведомление о завершении фокус-сессии
func (s *NotificationService) SendFocusSessionEnd(ctx context.Context, userID int64, session *models.FocusSession) error {
	var text string
	if session.EndedAt != nil {
		text = fmt.Sprintf(
			"✅ Фокус-сессия завершена!\n\n"+
				"⏱ Время работы: %d минут\n"+
				"💪 Отличная работа! Не забудьте сделать перерыв.",
			int(session.EndedAt.Sub(session.StartedAt).Minutes()),
		)
	} else {
		text = "⏰ Время фокус-сессии истекло!\n\nСделайте перерыв и вернитесь с новыми силами."
	}

	return s.client.SendMessage(ctx, userID, text)
}

// SendCustomNotification отправляет произвольное уведомление
func (s *NotificationService) SendCustomNotification(ctx context.Context, userID int64, title, message string, scheduledFor time.Time) error {
	text := fmt.Sprintf(
		"🔔 %s\n\n%s",
		title,
		message,
	)

	return s.client.SendMessage(ctx, userID, text)
}
