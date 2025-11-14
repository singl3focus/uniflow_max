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
	ID          TaskID     `json:"id"`
	UserID      UserID     `json:"user_id"`
	ContextID   *ContextID `json:"context_id,omitempty"` // Опционально: привязка к контексту
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Status      TaskStatus `json:"status"`
	DueAt       *time.Time `json:"due_at,omitempty"` // Опционально: дедлайн задачи
	CompletedAt *time.Time `json:"completed_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
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

// Validate checks if task has required fields
func (t *Task) Validate() error {
	const op = "models.Task.Validate"

	if t.Title == "" {
		return ErrInvalidTaskTitle.SetPlace(op).SetCause(errors.New("title is required"))
	}

	if !isValidTaskStatus(t.Status) {
		return ErrInvalidTaskStatus.SetPlace(op).SetCause(errors.New("invalid status"))
	}

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
