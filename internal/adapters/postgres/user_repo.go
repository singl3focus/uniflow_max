package postgres

import (
	"context"
	"errors"

	sq "github.com/Masterminds/squirrel"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"github.com/singl3focus/uniflow/internal/core/models"
	"github.com/singl3focus/uniflow/internal/core/ports/repository"
)

func (d *Database) CreateUser(ctx context.Context, user models.User) error {
	const op = "postgres.CreateUser"

	query, args, err := sqBuilder.
		Insert(tblUsers).
		Columns("id", "max_user_id", "created_at", "updated_at").
		Values(user.ID, user.MaxUserID, user.CreatedAt, user.UpdatedAt).
		ToSql()

	if err != nil {
		return repository.ErrBuildQuery.SetPlace(op).SetCause(err)
	}

	_, err = d.pool.Exec(ctx, query, args...)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return repository.ErrAlreadyExists.SetPlace(op).SetCause(err)
		}
		return repository.ErrQueryFailed.SetPlace(op).SetCause(err)
	}

	return nil
}

func (d *Database) GetUserByMaxUserID(ctx context.Context, maxUserID string) (models.User, error) {
	const op = "postgres.GetUserByMaxUserID"

	query, args, err := sqBuilder.
		Select("id", "max_user_id", "created_at", "updated_at").
		From(tblUsers).
		Where(sq.Eq{"max_user_id": maxUserID}).
		ToSql()

	if err != nil {
		return models.User{}, repository.ErrBuildQuery.SetPlace(op).SetCause(err)
	}

	var user models.User
	err = d.pool.QueryRow(ctx, query, args...).Scan(
		&user.ID,
		&user.MaxUserID,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return models.User{}, repository.ErrNotFound.SetPlace(op).SetCause(err)
		}
		return models.User{}, repository.ErrQueryFailed.SetPlace(op).SetCause(err)
	}

	return user, nil
}

func (d *Database) GetUserByID(ctx context.Context, id models.UserID) (models.User, error) {
	const op = "postgres.GetUserByID"

	query, args, err := sqBuilder.
		Select("id", "max_user_id", "created_at", "updated_at").
		From(tblUsers).
		Where(sq.Eq{"id": id}).
		ToSql()

	if err != nil {
		return models.User{}, repository.ErrBuildQuery.SetPlace(op).SetCause(err)
	}

	var user models.User
	err = d.pool.QueryRow(ctx, query, args...).Scan(
		&user.ID,
		&user.MaxUserID,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return models.User{}, repository.ErrNotFound.SetPlace(op).SetCause(err)
		}
		return models.User{}, repository.ErrQueryFailed.SetPlace(op).SetCause(err)
	}

	return user, nil
}
