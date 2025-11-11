-- +goose Up

-- 000_init_schema.up.sql
CREATE SCHEMA IF NOT EXISTS uniflow;

-- 001_create_users.up.sql
CREATE TABLE IF NOT EXISTS uniflow.users (
    id           UUID PRIMARY KEY,
    max_user_id  VARCHAR(255) UNIQUE NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_max_user_id ON uniflow.users(max_user_id);

-- 002_create_contexts.up.sql
CREATE TABLE IF NOT EXISTS uniflow.contexts (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES uniflow.users(id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id  VARCHAR(255),
    color       VARCHAR(7),
    deadline_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contexts_user_id ON uniflow.contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_contexts_deadline ON uniflow.contexts(deadline_at);

-- 003_create_tasks.up.sql
CREATE TABLE IF NOT EXISTS uniflow.tasks (
    id           UUID PRIMARY KEY,
    user_id      UUID NOT NULL REFERENCES uniflow.users(id) ON DELETE CASCADE,
    context_id   UUID REFERENCES uniflow.contexts(id) ON DELETE SET NULL,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    status       VARCHAR(50) NOT NULL DEFAULT 'todo',
    due_at       TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON uniflow.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_context_id ON uniflow.tasks(context_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON uniflow.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON uniflow.tasks(due_at);

-- 004_create_schedule_entries.up.sql
CREATE TABLE IF NOT EXISTS uniflow.schedule_entries (
    id         UUID PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES uniflow.users(id) ON DELETE CASCADE,
    context_id UUID REFERENCES uniflow.contexts(id) ON DELETE SET NULL,
    title      VARCHAR(255) NOT NULL,
    weekday    INTEGER NOT NULL,
    start_at   TIME NOT NULL,
    end_at     TIME NOT NULL,
    location   TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedule_entries_user_id ON uniflow.schedule_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_entries_weekday ON uniflow.schedule_entries(weekday);

-- 005_create_notifications.up.sql
CREATE TABLE IF NOT EXISTS uniflow.notifications (
    id         UUID PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES uniflow.users(id) ON DELETE CASCADE,
    task_id    UUID REFERENCES uniflow.tasks(id) ON DELETE CASCADE,
    notify_at  TIMESTAMPTZ NOT NULL,
    channel    VARCHAR(50) NOT NULL DEFAULT 'max',
    status     VARCHAR(50) NOT NULL DEFAULT 'pending',
    message    TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON uniflow.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON uniflow.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_notify_at ON uniflow.notifications(notify_at);

-- 006_create_notes.up.sql
CREATE TABLE IF NOT EXISTS uniflow.notes (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES uniflow.users(id) ON DELETE CASCADE,
    context_id  UUID REFERENCES uniflow.contexts(id) ON DELETE SET NULL,
    type        VARCHAR(50) NOT NULL,
    content_url TEXT,
    text        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON uniflow.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_context_id ON uniflow.notes(context_id);

-- 007_create_focus_sessions.up.sql
CREATE TABLE IF NOT EXISTS uniflow.focus_sessions (
    id               UUID PRIMARY KEY,
    user_id          UUID NOT NULL REFERENCES uniflow.users(id) ON DELETE CASCADE,
    context_id       UUID REFERENCES uniflow.contexts(id) ON DELETE SET NULL,
    duration_minutes INTEGER NOT NULL,
    started_at       TIMESTAMPTZ NOT NULL,
    ended_at         TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON uniflow.focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_context_id ON uniflow.focus_sessions(context_id);


-- +goose StatementBegin
SELECT 'up SQL query';
-- +goose StatementEnd

-- +goose Down

-- 007_create_focus_sessions.down.sql
DROP TABLE IF EXISTS uniflow.focus_sessions CASCADE;

-- 006_create_notes.down.sql
DROP TABLE IF EXISTS uniflow.notes CASCADE;

-- 005_create_notifications.down.sql
DROP TABLE IF EXISTS uniflow.notifications CASCADE;

-- 004_create_schedule_entries.down.sql
DROP TABLE IF EXISTS uniflow.schedule_entries CASCADE;

-- 003_create_tasks.down.sql
DROP TABLE IF EXISTS uniflow.tasks CASCADE;

-- 002_create_contexts.down.sql
DROP TABLE IF EXISTS uniflow.contexts CASCADE;

-- 001_create_users.down.sql
DROP TABLE IF EXISTS uniflow.users CASCADE;

-- 000_init_schema.down.sql
DROP SCHEMA IF EXISTS uniflow CASCADE;

-- +goose StatementBegin
SELECT 'down SQL query';
-- +goose StatementEnd
