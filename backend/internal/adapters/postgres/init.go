package postgres

import (
	"context"

	sq "github.com/Masterminds/squirrel"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/singl3focus/uniflow/internal/core/ports/repository"
)

var sqBuilder = sq.StatementBuilder.PlaceholderFormat(sq.Dollar)

type Database struct {
	pool *pgxpool.Pool
}

var _ repository.Repository = &Database{}

func NewPostgres(dsn string) *Database {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		panic(err)
	}

	if err := pool.Ping(ctx); err != nil {
		panic(err)
	}

	return &Database{pool: pool}
}

func (d *Database) Ping(ctx context.Context) error {
	return d.pool.Ping(ctx)
}

func (d *Database) Close() error {
	d.pool.Close()
	return nil
}

const (
	tblUsers           = "uniflow.users"
	tblContexts        = "uniflow.contexts"
	tblTasks           = "uniflow.tasks"
	tblScheduleEntries = "uniflow.schedule_entries"
	tblNotifications   = "uniflow.notifications"
	tblNotes           = "uniflow.notes"
	tblFocusSessions   = "uniflow.focus_sessions"
)
