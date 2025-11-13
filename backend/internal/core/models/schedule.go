package models

import (
	"errors"
	"time"

	"github.com/google/uuid"

	"github.com/singl3focus/uniflow/pkg/errs"
)

type ScheduleEntryID = uuid.UUID

func ParseScheduleEntryID(id string) (ScheduleEntryID, error) {
	return uuid.Parse(id)
}

type Weekday int

const (
	Monday Weekday = iota
	Tuesday
	Wednesday
	Thursday
	Friday
	Saturday
	Sunday
)

type ScheduleEntry struct {
	ID        ScheduleEntryID
	UserID    UserID
	ContextID *ContextID // Опционально: привязка к контексту
	Title     string
	Weekday   Weekday
	StartAt   time.Time // Время начала в формате HH:MM
	EndAt     time.Time // Время окончания в формате HH:MM
	Location  string
	CreatedAt time.Time
	UpdatedAt time.Time
}

var (
	ErrInvalidScheduleTitle = errs.New("invalid schedule title")
	ErrInvalidWeekday       = errs.New("invalid weekday")
	ErrInvalidTimeRange     = errs.New("invalid time range")
)

func NewScheduleEntry(userID UserID, contextID *ContextID, title string, weekday Weekday, startAt, endAt time.Time, location string) (ScheduleEntry, error) {
	const op = "models.NewScheduleEntry"

	if title == "" {
		return ScheduleEntry{}, ErrInvalidScheduleTitle.SetPlace(op).SetCause(errors.New("title cannot be empty"))
	}

	if !isValidWeekday(weekday) {
		return ScheduleEntry{}, ErrInvalidWeekday.SetPlace(op).SetCause(errors.New("weekday must be 0-6"))
	}

	if !startAt.Before(endAt) {
		return ScheduleEntry{}, ErrInvalidTimeRange.SetPlace(op).SetCause(errors.New("start time must be before end time"))
	}

	now := time.Now()

	return ScheduleEntry{
		ID:        ScheduleEntryID(uuid.New()),
		UserID:    userID,
		ContextID: contextID,
		Title:     title,
		Weekday:   weekday,
		StartAt:   startAt,
		EndAt:     endAt,
		Location:  location,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}

func isValidWeekday(w Weekday) bool {
	return w >= Monday && w <= Sunday
}

func (s *ScheduleEntry) Update(title *string, contextID *ContextID, weekday *Weekday, startAt, endAt *time.Time, location *string) {
	if title != nil {
		s.Title = *title
	}
	if contextID != nil {
		s.ContextID = contextID
	}
	if weekday != nil {
		s.Weekday = *weekday
	}
	if startAt != nil {
		s.StartAt = *startAt
	}
	if endAt != nil {
		s.EndAt = *endAt
	}
	if location != nil {
		s.Location = *location
	}
	s.UpdatedAt = time.Now()
}
