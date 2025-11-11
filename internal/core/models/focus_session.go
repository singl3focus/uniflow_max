package models

import (
	"time"

	"github.com/google/uuid"
)

type FocusSessionID = uuid.UUID

func ParseFocusSessionID(id string) (FocusSessionID, error) {
	return uuid.Parse(id)
}

type FocusSession struct {
	ID              FocusSessionID
	UserID          UserID
	ContextID       *ContextID // Опционально: привязка к контексту
	DurationMinutes int
	StartedAt       time.Time
	EndedAt         *time.Time
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

func NewFocusSession(userID UserID, contextID *ContextID, durationMinutes int) FocusSession {
	now := time.Now()

	return FocusSession{
		ID:              FocusSessionID(uuid.New()),
		UserID:          userID,
		ContextID:       contextID,
		DurationMinutes: durationMinutes,
		StartedAt:       now,
		CreatedAt:       now,
		UpdatedAt:       now,
	}
}

func (f *FocusSession) End() {
	now := time.Now()
	f.EndedAt = &now
	f.UpdatedAt = now
}
