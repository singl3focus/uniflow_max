package postgres

import (
	"context"
	"time"

	sq "github.com/Masterminds/squirrel"

	"github.com/singl3focus/uniflow/internal/core/models"
	"github.com/singl3focus/uniflow/internal/core/ports/repository"
)

// Заглушки для остальных репозиториев

func (d *Database) CreateScheduleEntry(ctx context.Context, entry models.ScheduleEntry) error {
	return nil
}

func (d *Database) GetScheduleEntryByID(ctx context.Context, id models.ScheduleEntryID) (models.ScheduleEntry, error) {
	return models.ScheduleEntry{}, nil
}

func (d *Database) GetScheduleEntriesByUserID(ctx context.Context, userID models.UserID) ([]models.ScheduleEntry, error) {
	return []models.ScheduleEntry{}, nil
}

func (d *Database) GetScheduleEntriesByWeekday(ctx context.Context, userID models.UserID, weekday models.Weekday) ([]models.ScheduleEntry, error) {
	return []models.ScheduleEntry{}, nil
}

func (d *Database) UpdateScheduleEntry(ctx context.Context, entry models.ScheduleEntry) error {
	return nil
}

func (d *Database) DeleteScheduleEntry(ctx context.Context, id models.ScheduleEntryID) error {
	return nil
}

func (d *Database) CreateNotification(ctx context.Context, notification models.Notification) error {
	const op = "postgres.CreateNotification"

	query, args, err := sqBuilder.
		Insert(tblNotifications).
		Columns("id", "user_id", "task_id", "notify_at", "channel", "status", "message", "created_at", "updated_at", "sent_at").
		Values(notification.ID, notification.UserID, notification.TaskID, notification.NotifyAt, notification.Channel, notification.Status, notification.Message, notification.CreatedAt, notification.UpdatedAt, notification.SentAt).
		ToSql()

	if err != nil {
		return repository.ErrBuildQuery.SetPlace(op).SetCause(err)
	}

	_, err = d.pool.Exec(ctx, query, args...)
	if err != nil {
		return repository.ErrQueryFailed.SetPlace(op).SetCause(err)
	}

	return nil
}

func (d *Database) GetNotificationByID(ctx context.Context, id models.NotificationID) (models.Notification, error) {
	return models.Notification{}, nil
}

func (d *Database) GetPendingNotifications(ctx context.Context, before time.Time) ([]models.Notification, error) {
	const op = "postgres.GetPendingNotifications"

	query, args, err := sqBuilder.
		Select("id", "user_id", "task_id", "notify_at", "channel", "status", "message", "created_at", "updated_at", "sent_at").
		From(tblNotifications).
		Where(sq.And{
			sq.Eq{"status": models.NotificationStatusPending},
			sq.LtOrEq{"notify_at": before},
		}).
		OrderBy("notify_at ASC").
		ToSql()

	if err != nil {
		return nil, repository.ErrBuildQuery.SetPlace(op).SetCause(err)
	}

	rows, err := d.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, repository.ErrQueryFailed.SetPlace(op).SetCause(err)
	}
	defer rows.Close()

	var notifications []models.Notification
	for rows.Next() {
		var n models.Notification
		err = rows.Scan(&n.ID, &n.UserID, &n.TaskID, &n.NotifyAt, &n.Channel, &n.Status, &n.Message, &n.CreatedAt, &n.UpdatedAt, &n.SentAt)
		if err != nil {
			return nil, repository.ErrQueryFailed.SetPlace(op).SetCause(err)
		}
		notifications = append(notifications, n)
	}

	return notifications, nil
}

func (d *Database) UpdateNotification(ctx context.Context, notification models.Notification) error {
	const op = "postgres.UpdateNotification"

	query, args, err := sqBuilder.
		Update(tblNotifications).
		Set("status", notification.Status).
		Set("updated_at", notification.UpdatedAt).
		Set("sent_at", notification.SentAt).
		Where(sq.Eq{"id": notification.ID}).
		ToSql()

	if err != nil {
		return repository.ErrBuildQuery.SetPlace(op).SetCause(err)
	}

	_, err = d.pool.Exec(ctx, query, args...)
	if err != nil {
		return repository.ErrQueryFailed.SetPlace(op).SetCause(err)
	}

	return nil
}

func (d *Database) DeleteNotification(ctx context.Context, id models.NotificationID) error {
	return nil
}

func (d *Database) CreateNote(ctx context.Context, note models.Note) error {
	return nil
}

func (d *Database) GetNoteByID(ctx context.Context, id models.NoteID) (models.Note, error) {
	return models.Note{}, nil
}

func (d *Database) GetNotesByUserID(ctx context.Context, userID models.UserID) ([]models.Note, error) {
	return []models.Note{}, nil
}

func (d *Database) GetNotesByContextID(ctx context.Context, contextID models.ContextID) ([]models.Note, error) {
	return []models.Note{}, nil
}

func (d *Database) SearchNotes(ctx context.Context, userID models.UserID, query string) ([]models.Note, error) {
	return []models.Note{}, nil
}

func (d *Database) UpdateNote(ctx context.Context, note models.Note) error {
	return nil
}

func (d *Database) DeleteNote(ctx context.Context, id models.NoteID) error {
	return nil
}

func (d *Database) CreateFocusSession(ctx context.Context, session models.FocusSession) error {
	return nil
}

func (d *Database) GetFocusSessionByID(ctx context.Context, id models.FocusSessionID) (models.FocusSession, error) {
	return models.FocusSession{}, nil
}

func (d *Database) GetFocusSessionsByUserID(ctx context.Context, userID models.UserID) ([]models.FocusSession, error) {
	return []models.FocusSession{}, nil
}

func (d *Database) UpdateFocusSession(ctx context.Context, session models.FocusSession) error {
	return nil
}
