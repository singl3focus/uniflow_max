package models

import (
	"errors"
	"time"

	"github.com/google/uuid"

	"github.com/singl3focus/uniflow/pkg/errs"
)

type NoteID = uuid.UUID

func ParseNoteID(id string) (NoteID, error) {
	return uuid.Parse(id)
}

type NoteType string

const (
	NoteTypeText  NoteType = "text"
	NoteTypeImage NoteType = "image"
	NoteTypeAudio NoteType = "audio"
	NoteTypeFile  NoteType = "file"
)

type Note struct {
	ID         NoteID
	UserID     UserID
	ContextID  *ContextID // Опционально: привязка к контексту
	Type       NoteType
	ContentURL string // URL для медиа-файлов
	Text       string // Текстовое содержимое
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

var (
	ErrInvalidNoteType = errs.New("invalid note type")
)

func NewNote(userID UserID, contextID *ContextID, noteType NoteType, contentURL, text string) (Note, error) {
	const op = "models.NewNote"

	if !isValidNoteType(noteType) {
		return Note{}, ErrInvalidNoteType.SetPlace(op).SetCause(errors.New("invalid note type"))
	}

	now := time.Now()

	return Note{
		ID:         NoteID(uuid.New()),
		UserID:     userID,
		ContextID:  contextID,
		Type:       noteType,
		ContentURL: contentURL,
		Text:       text,
		CreatedAt:  now,
		UpdatedAt:  now,
	}, nil
}

func isValidNoteType(t NoteType) bool {
	switch t {
	case NoteTypeText, NoteTypeImage, NoteTypeAudio, NoteTypeFile:
		return true
	default:
		return false
	}
}

func (n *Note) Update(text *string, contentURL *string) {
	if text != nil {
		n.Text = *text
	}
	if contentURL != nil {
		n.ContentURL = *contentURL
	}
	n.UpdatedAt = time.Now()
}
