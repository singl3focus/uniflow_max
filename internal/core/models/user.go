package models

import (
	"errors"
	"time"

	"github.com/google/uuid"

	"github.com/singl3focus/uniflow/pkg/errs"
)

type UserID = uuid.UUID

func ParseUserID(id string) (UserID, error) {
	return uuid.Parse(id)
}

type User struct {
	ID        UserID
	MaxUserID string // ID пользователя в MAX
	CreatedAt time.Time
	UpdatedAt time.Time
}

var (
	ErrInvalidMaxUserID = errs.New("invalid max user id")
)

// NewUser создает нового пользователя
func NewUser(maxUserID string) (User, error) {
	const op = "models.NewUser"

	if maxUserID == "" {
		return User{}, ErrInvalidMaxUserID.SetPlace(op).SetCause(errors.New("cannot be empty"))
	}

	now := time.Now()

	return User{
		ID:        UserID(uuid.New()),
		MaxUserID: maxUserID,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}
