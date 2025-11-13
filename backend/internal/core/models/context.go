package models

import (
	"errors"
	"time"

	"github.com/google/uuid"

	"github.com/singl3focus/uniflow/pkg/errs"
)

type ContextID = uuid.UUID

func ParseContextID(id string) (ContextID, error) {
	return uuid.Parse(id)
}

type ContextType string

const (
	ContextTypeSubject  ContextType = "subject"  // Учебный предмет
	ContextTypeProject  ContextType = "project"  // Проект
	ContextTypePersonal ContextType = "personal" // Личное
	ContextTypeWork     ContextType = "work"     // Работа
	ContextTypeOther    ContextType = "other"    // Другое
)

type Context struct {
	ID          ContextID
	UserID      UserID
	Type        ContextType
	Title       string
	Description string
	SubjectID   *string    // Опционально: ID предмета в расписании
	Color       string     // Цвет для UI (HEX)
	DeadlineAt  *time.Time // Опционально: дедлайн контекста
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

var (
	ErrInvalidContextTitle = errs.New("invalid context title")
	ErrInvalidContextType  = errs.New("invalid context type")
)

func NewContext(userID UserID, contextType ContextType, title, description, color string, subjectID *string, deadlineAt *time.Time) (Context, error) {
	const op = "models.NewContext"

	if title == "" {
		return Context{}, ErrInvalidContextTitle.SetPlace(op).SetCause(errors.New("title cannot be empty"))
	}

	if !isValidContextType(contextType) {
		return Context{}, ErrInvalidContextType.SetPlace(op).SetCause(errors.New("invalid type"))
	}

	now := time.Now()

	return Context{
		ID:          ContextID(uuid.New()),
		UserID:      userID,
		Type:        contextType,
		Title:       title,
		Description: description,
		SubjectID:   subjectID,
		Color:       color,
		DeadlineAt:  deadlineAt,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

func isValidContextType(t ContextType) bool {
	switch t {
	case ContextTypeSubject, ContextTypeProject, ContextTypePersonal, ContextTypeWork, ContextTypeOther:
		return true
	default:
		return false
	}
}

func (c *Context) Update(title, description, color *string, deadlineAt *time.Time) {
	if title != nil {
		c.Title = *title
	}
	if description != nil {
		c.Description = *description
	}
	if color != nil {
		c.Color = *color
	}
	if deadlineAt != nil {
		c.DeadlineAt = deadlineAt
	}
	
	c.UpdatedAt = time.Now()
}
