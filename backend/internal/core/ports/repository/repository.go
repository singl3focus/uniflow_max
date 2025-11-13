package repository

import (
	"context"
	"time"

	"github.com/singl3focus/uniflow/internal/core/models"
	"github.com/singl3focus/uniflow/pkg/errs"
)

var (
	ErrBuildQuery    = errs.New("bad query build")
	ErrQueryFailed   = errs.New("query failed")
	ErrDuplicateData = errs.New("duplicate data")
	ErrAlreadyExists = errs.New("already exists")
	ErrNotFound      = errs.New("not found")
)

// Repository описывает главный интерфейс для работы с БД
type Repository interface {
	UserRepository
	ContextRepository
	TaskRepository
	ScheduleRepository
	NotificationRepository
	NoteRepository
	FocusSessionRepository

	// Управление
	Ping(ctx context.Context) error
	Close() error
}

// UserRepository - интерфейс для работы с пользователями
type UserRepository interface {
	CreateUser(ctx context.Context, user models.User) error
	GetUserByMaxUserID(ctx context.Context, maxUserID string) (models.User, error)
	GetUserByID(ctx context.Context, id models.UserID) (models.User, error)
}

// ContextRepository - интерфейс для работы с контекстами
type ContextRepository interface {
	CreateContext(ctx context.Context, context models.Context) error
	GetContextByID(ctx context.Context, id models.ContextID) (models.Context, error)
	GetContextsByUserID(ctx context.Context, userID models.UserID) ([]models.Context, error)
	SearchContexts(ctx context.Context, userID models.UserID, query string) ([]models.Context, error)
	UpdateContext(ctx context.Context, context models.Context) error
	DeleteContext(ctx context.Context, id models.ContextID) error
}

// TaskRepository - интерфейс для работы с задачами
type TaskRepository interface {
	CreateTask(ctx context.Context, task models.Task) error
	GetTaskByID(ctx context.Context, id models.TaskID) (models.Task, error)
	GetTasksByUserID(ctx context.Context, userID models.UserID) ([]models.Task, error)
	GetTasksByContextID(ctx context.Context, contextID models.ContextID) ([]models.Task, error)
	GetTasksDueToday(ctx context.Context, userID models.UserID) ([]models.Task, error)
	SearchTasks(ctx context.Context, userID models.UserID, query string) ([]models.Task, error)
	UpdateTask(ctx context.Context, task models.Task) error
	DeleteTask(ctx context.Context, id models.TaskID) error
}

// ScheduleRepository - интерфейс для работы с расписанием
type ScheduleRepository interface {
	CreateScheduleEntry(ctx context.Context, entry models.ScheduleEntry) error
	GetScheduleEntryByID(ctx context.Context, id models.ScheduleEntryID) (models.ScheduleEntry, error)
	GetScheduleEntriesByUserID(ctx context.Context, userID models.UserID) ([]models.ScheduleEntry, error)
	GetScheduleEntriesByWeekday(ctx context.Context, userID models.UserID, weekday models.Weekday) ([]models.ScheduleEntry, error)
	UpdateScheduleEntry(ctx context.Context, entry models.ScheduleEntry) error
	DeleteScheduleEntry(ctx context.Context, id models.ScheduleEntryID) error
}

// NotificationRepository - интерфейс для работы с уведомлениями
type NotificationRepository interface {
	CreateNotification(ctx context.Context, notification models.Notification) error
	GetNotificationByID(ctx context.Context, id models.NotificationID) (models.Notification, error)
	GetPendingNotifications(ctx context.Context, before time.Time) ([]models.Notification, error)
	UpdateNotification(ctx context.Context, notification models.Notification) error
	DeleteNotification(ctx context.Context, id models.NotificationID) error
}

// NoteRepository - интерфейс для работы с заметками
type NoteRepository interface {
	CreateNote(ctx context.Context, note models.Note) error
	GetNoteByID(ctx context.Context, id models.NoteID) (models.Note, error)
	GetNotesByUserID(ctx context.Context, userID models.UserID) ([]models.Note, error)
	GetNotesByContextID(ctx context.Context, contextID models.ContextID) ([]models.Note, error)
	SearchNotes(ctx context.Context, userID models.UserID, query string) ([]models.Note, error)
	UpdateNote(ctx context.Context, note models.Note) error
	DeleteNote(ctx context.Context, id models.NoteID) error
}

// FocusSessionRepository - интерфейс для работы с фокус-сессиями
type FocusSessionRepository interface {
	CreateFocusSession(ctx context.Context, session models.FocusSession) error
	GetFocusSessionByID(ctx context.Context, id models.FocusSessionID) (models.FocusSession, error)
	GetFocusSessionsByUserID(ctx context.Context, userID models.UserID) ([]models.FocusSession, error)
	UpdateFocusSession(ctx context.Context, session models.FocusSession) error
}
