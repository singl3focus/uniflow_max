package models

import (
	"time"

	"github.com/google/uuid"
)

type NotificationID = uuid.UUID

func ParseNotificationID(id string) (NotificationID, error) {
	return uuid.Parse(id)
}

type NotificationChannel string

const (
	NotificationChannelMax NotificationChannel = "max"
)

type NotificationStatus string

const (
	NotificationStatusPending NotificationStatus = "pending"
	NotificationStatusSent    NotificationStatus = "sent"
	NotificationStatusFailed  NotificationStatus = "failed"
)

type Notification struct {
	ID        NotificationID
	UserID    UserID
	TaskID    *TaskID // Опционально: связанная задача
	NotifyAt  time.Time
	Channel   NotificationChannel
	Status    NotificationStatus
	Message   string
	CreatedAt time.Time
	UpdatedAt time.Time
	SentAt    *time.Time
}

func NewNotification(userID UserID, taskID *TaskID, notifyAt time.Time, channel NotificationChannel, message string) Notification {
	now := time.Now()

	return Notification{
		ID:        NotificationID(uuid.New()),
		UserID:    userID,
		TaskID:    taskID,
		NotifyAt:  notifyAt,
		Channel:   channel,
		Status:    NotificationStatusPending,
		Message:   message,
		CreatedAt: now,
		UpdatedAt: now,
	}
}

func (n *Notification) MarkAsSent() {
	n.Status = NotificationStatusSent
	now := time.Now()
	n.SentAt = &now
	n.UpdatedAt = now
}

func (n *Notification) MarkAsFailed() {
	n.Status = NotificationStatusFailed
	n.UpdatedAt = time.Now()
}
