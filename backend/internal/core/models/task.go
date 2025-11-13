package models

import (
	"errors"
	"time"

	"github.com/google/uuid"

	"github.com/singl3focus/uniflow/pkg/errs"
)

type TaskID = uuid.UUID

func ParseTaskID(id string) (TaskID, error) {
	return uuid.Parse(id)
}

type TaskStatus string

const (
	TaskStatusTodo       TaskStatus = "todo"
	TaskStatusInProgress TaskStatus = "in_progress"
	TaskStatusCompleted  TaskStatus = "completed"
	TaskStatusCancelled  TaskStatus = "cancelled"
)

type Task struct {
	ID          TaskID
	UserID      UserID
	ContextID   *ContextID // Опционально: привязка к контексту
	Title       string
	Description string
	Status      TaskStatus
	DueAt       *time.Time // Опционально: дедлайн задачи
	CompletedAt *time.Time
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

var (
	ErrInvalidTaskTitle  = errs.New("invalid task title")
	ErrInvalidTaskStatus = errs.New("invalid task status")
)

func NewTask(userID UserID, contextID *ContextID, title, description string, dueAt *time.Time) (Task, error) {
	const op = "models.NewTask"

	if title == "" {
		return Task{}, ErrInvalidTaskTitle.SetPlace(op).SetCause(errors.New("title cannot be empty"))
	}

	now := time.Now()

	return Task{
		ID:          TaskID(uuid.New()),
		UserID:      userID,
		ContextID:   contextID,
		Title:       title,
		Description: description,
		Status:      TaskStatusTodo,
		DueAt:       dueAt,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

func (t *Task) Update(title, description *string, contextID *ContextID, dueAt *time.Time) {
	if title != nil {
		t.Title = *title
	}
	if description != nil {
		t.Description = *description
	}
	if contextID != nil {
		t.ContextID = contextID
	}
	if dueAt != nil {
		t.DueAt = dueAt
	}
	t.UpdatedAt = time.Now()
}

func (t *Task) ChangeStatus(status TaskStatus) error {
	if !isValidTaskStatus(status) {
		return ErrInvalidTaskStatus
	}

	t.Status = status
	if status == TaskStatusCompleted {
		now := time.Now()
		t.CompletedAt = &now
	}
	t.UpdatedAt = time.Now()
	return nil
}

func isValidTaskStatus(s TaskStatus) bool {
	switch s {
	case TaskStatusTodo, TaskStatusInProgress, TaskStatusCompleted, TaskStatusCancelled:
		return true
	default:
		return false
	}
}
