package postgres

import (
	"context"
	"errors"

	sq "github.com/Masterminds/squirrel"
	"github.com/jackc/pgx/v5"

	"github.com/singl3focus/uniflow/internal/core/models"
	"github.com/singl3focus/uniflow/internal/core/ports/repository"
)

func (d *Database) CreateContext(ctx context.Context, context models.Context) error {
	const op = "postgres.CreateContext"

	query, args, err := sqBuilder.
		Insert(tblContexts).
		Columns("id", "user_id", "type", "title", "description", "subject_id", "color", "deadline_at", "created_at", "updated_at").
		Values(context.ID, context.UserID, context.Type, context.Title, context.Description, context.SubjectID, context.Color, context.DeadlineAt, context.CreatedAt, context.UpdatedAt).
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

func (d *Database) GetContextByID(ctx context.Context, id models.ContextID) (models.Context, error) {
	const op = "postgres.GetContextByID"

	query, args, err := sqBuilder.
		Select("id", "user_id", "type", "title", "description", "subject_id", "color", "deadline_at", "created_at", "updated_at").
		From(tblContexts).
		Where(sq.Eq{"id": id}).
		ToSql()

	if err != nil {
		return models.Context{}, repository.ErrBuildQuery.SetPlace(op).SetCause(err)
	}

	var context models.Context
	err = d.pool.QueryRow(ctx, query, args...).Scan(
		&context.ID,
		&context.UserID,
		&context.Type,
		&context.Title,
		&context.Description,
		&context.SubjectID,
		&context.Color,
		&context.DeadlineAt,
		&context.CreatedAt,
		&context.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return models.Context{}, repository.ErrNotFound.SetPlace(op).SetCause(err)
		}
		return models.Context{}, repository.ErrQueryFailed.SetPlace(op).SetCause(err)
	}

	return context, nil
}

func (d *Database) GetContextsByUserID(ctx context.Context, userID models.UserID) ([]models.Context, error) {
	const op = "postgres.GetContextsByUserID"

	query, args, err := sqBuilder.
		Select("id", "user_id", "type", "title", "description", "subject_id", "color", "deadline_at", "created_at", "updated_at").
		From(tblContexts).
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

	var contexts []models.Context
	for rows.Next() {
		var context models.Context
		err = rows.Scan(
			&context.ID,
			&context.UserID,
			&context.Type,
			&context.Title,
			&context.Description,
			&context.SubjectID,
			&context.Color,
			&context.DeadlineAt,
			&context.CreatedAt,
			&context.UpdatedAt,
		)
		if err != nil {
			return nil, repository.ErrQueryFailed.SetPlace(op).SetCause(err)
		}
		contexts = append(contexts, context)
	}

	return contexts, nil
}

func (d *Database) SearchContexts(ctx context.Context, userID models.UserID, query string) ([]models.Context, error) {
	const op = "postgres.SearchContexts"

	searchQuery := "%" + query + "%"

	sqlQuery, args, err := sqBuilder.
		Select("id", "user_id", "type", "title", "description", "subject_id", "color", "deadline_at", "created_at", "updated_at").
		From(tblContexts).
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

	var contexts []models.Context
	for rows.Next() {
		var context models.Context
		err = rows.Scan(
			&context.ID,
			&context.UserID,
			&context.Type,
			&context.Title,
			&context.Description,
			&context.SubjectID,
			&context.Color,
			&context.DeadlineAt,
			&context.CreatedAt,
			&context.UpdatedAt,
		)
		if err != nil {
			return nil, repository.ErrQueryFailed.SetPlace(op).SetCause(err)
		}
		contexts = append(contexts, context)
	}

	return contexts, nil
}

func (d *Database) UpdateContext(ctx context.Context, context models.Context) error {
	const op = "postgres.UpdateContext"

	query, args, err := sqBuilder.
		Update(tblContexts).
		Set("type", context.Type).
		Set("title", context.Title).
		Set("description", context.Description).
		Set("subject_id", context.SubjectID).
		Set("color", context.Color).
		Set("deadline_at", context.DeadlineAt).
		Set("updated_at", context.UpdatedAt).
		Where(sq.Eq{"id": context.ID}).
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

func (d *Database) DeleteContext(ctx context.Context, id models.ContextID) error {
	const op = "postgres.DeleteContext"

	query, args, err := sqBuilder.
		Delete(tblContexts).
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
