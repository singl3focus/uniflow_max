package postgres

import (
	"context"
	"errors"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/jackc/pgx/v5"

	"github.com/singl3focus/uniflow/internal/core/models"
	"github.com/singl3focus/uniflow/internal/core/ports/repository"
)

func (d *Database) CreateTask(ctx context.Context, task models.Task) error {
	const op = "postgres.CreateTask"

	query, args, err := sqBuilder.
		Insert(tblTasks).
		Columns("id", "user_id", "context_id", "title", "description", "status", "due_at", "completed_at", "created_at", "updated_at").
		Values(task.ID, task.UserID, task.ContextID, task.Title, task.Description, task.Status, task.DueAt, task.CompletedAt, task.CreatedAt, task.UpdatedAt).
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

func (d *Database) GetTaskByID(ctx context.Context, id models.TaskID) (models.Task, error) {
	const op = "postgres.GetTaskByID"

	query, args, err := sqBuilder.
		Select("id", "user_id", "context_id", "title", "description", "status", "due_at", "completed_at", "created_at", "updated_at").
		From(tblTasks).
		Where(sq.Eq{"id": id}).
		ToSql()

	if err != nil {
		return models.Task{}, repository.ErrBuildQuery.SetPlace(op).SetCause(err)
	}

	var task models.Task
	err = d.pool.QueryRow(ctx, query, args...).Scan(
		&task.ID,
		&task.UserID,
		&task.ContextID,
		&task.Title,
		&task.Description,
		&task.Status,
		&task.DueAt,
		&task.CompletedAt,
		&task.CreatedAt,
		&task.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return models.Task{}, repository.ErrNotFound.SetPlace(op).SetCause(
				errors.New("task not found: id=" + id.String()),
			)
		}
		return models.Task{}, repository.ErrQueryFailed.SetPlace(op).SetCause(
			errors.New("failed to get task: id=" + id.String() + ", err=" + err.Error()),
		)
	}

	return task, nil
}

func (d *Database) GetTasksByUserID(ctx context.Context, userID models.UserID) ([]models.Task, error) {
	const op = "postgres.GetTasksByUserID"

	query, args, err := sqBuilder.
		Select("id", "user_id", "context_id", "title", "description", "status", "due_at", "completed_at", "created_at", "updated_at").
		From(tblTasks).
		Where(sq.Eq{"user_id": userID}).
		OrderBy("created_at DESC").
		ToSql()

	if err != nil {
		return nil, repository.ErrBuildQuery.SetPlace(op).SetCause(err)
	}

	rows, err := d.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, repository.ErrQueryFailed.SetPlace(op).SetCause(err)
	}
	defer rows.Close()

	return d.scanTasks(rows, op)
}

func (d *Database) GetTasksByContextID(ctx context.Context, contextID models.ContextID) ([]models.Task, error) {
	const op = "postgres.GetTasksByContextID"

	query, args, err := sqBuilder.
		Select("id", "user_id", "context_id", "title", "description", "status", "due_at", "completed_at", "created_at", "updated_at").
		From(tblTasks).
		Where(sq.Eq{"context_id": contextID}).
		OrderBy("created_at DESC").
		ToSql()

	if err != nil {
		return nil, repository.ErrBuildQuery.SetPlace(op).SetCause(err)
	}

	rows, err := d.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, repository.ErrQueryFailed.SetPlace(op).SetCause(err)
	}
	defer rows.Close()

	return d.scanTasks(rows, op)
}

func (d *Database) GetTasksDueToday(ctx context.Context, userID models.UserID) ([]models.Task, error) {
	const op = "postgres.GetTasksDueToday"

	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	query, args, err := sqBuilder.
		Select("id", "user_id", "context_id", "title", "description", "status", "due_at", "completed_at", "created_at", "updated_at").
		From(tblTasks).
		Where(sq.And{
			sq.Eq{"user_id": userID},
			sq.GtOrEq{"due_at": startOfDay},
			sq.Lt{"due_at": endOfDay},
		}).
		OrderBy("due_at ASC").
		ToSql()

	if err != nil {
		return nil, repository.ErrBuildQuery.SetPlace(op).SetCause(err)
	}

	rows, err := d.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, repository.ErrQueryFailed.SetPlace(op).SetCause(err)
	}
	defer rows.Close()

	return d.scanTasks(rows, op)
}

func (d *Database) SearchTasks(ctx context.Context, userID models.UserID, query string) ([]models.Task, error) {
	const op = "postgres.SearchTasks"

	searchQuery := "%" + query + "%"

	sqlQuery, args, err := sqBuilder.
		Select("id", "user_id", "context_id", "title", "description", "status", "due_at", "completed_at", "created_at", "updated_at").
		From(tblTasks).
		Where(sq.And{
			sq.Eq{"user_id": userID},
			sq.Or{
				sq.ILike{"title": searchQuery},
				sq.ILike{"description": searchQuery},
			},
		}).
		OrderBy("created_at DESC").
		ToSql()

	if err != nil {
		return nil, repository.ErrBuildQuery.SetPlace(op).SetCause(err)
	}

	rows, err := d.pool.Query(ctx, sqlQuery, args...)
	if err != nil {
		return nil, repository.ErrQueryFailed.SetPlace(op).SetCause(err)
	}
	defer rows.Close()

	return d.scanTasks(rows, op)
}

func (d *Database) UpdateTask(ctx context.Context, task models.Task) error {
	const op = "postgres.UpdateTask"

	query, args, err := sqBuilder.
		Update(tblTasks).
		Set("context_id", task.ContextID).
		Set("title", task.Title).
		Set("description", task.Description).
		Set("status", task.Status).
		Set("due_at", task.DueAt).
		Set("completed_at", task.CompletedAt).
		Set("updated_at", task.UpdatedAt).
		Where(sq.Eq{"id": task.ID}).
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

func (d *Database) DeleteTask(ctx context.Context, id models.TaskID) error {
	const op = "postgres.DeleteTask"

	query, args, err := sqBuilder.
		Delete(tblTasks).
		Where(sq.Eq{"id": id}).
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

func (d *Database) scanTasks(rows pgx.Rows, op string) ([]models.Task, error) {
	var tasks []models.Task
	for rows.Next() {
		var task models.Task
		err := rows.Scan(
			&task.ID,
			&task.UserID,
			&task.ContextID,
			&task.Title,
			&task.Description,
			&task.Status,
			&task.DueAt,
			&task.CompletedAt,
			&task.CreatedAt,
			&task.UpdatedAt,
		)
		if err != nil {
			return nil, repository.ErrQueryFailed.SetPlace(op).SetCause(err)
		}
		tasks = append(tasks, task)
	}

	return tasks, nil
}
