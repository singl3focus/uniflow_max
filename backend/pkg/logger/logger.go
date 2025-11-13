package logger

import "context"

// Logger описывает интерфейс для логирования
type Logger interface {
	// Уровни логирования
	Debug(msg string, fields ...interface{})
	Info(msg string, fields ...interface{})
	Warn(msg string, fields ...interface{})
	Error(msg string, fields ...interface{})
	Fatal(msg string, fields ...interface{})

	// Универсальный метод
	Log(level string, msg string, fields ...interface{})

	// Управление
	SetLevel(level string) error
	Shutdown() error
	Flush() error

	// Обогащение
	With(fields ...interface{}) Logger
	WithContext(ctx context.Context) Logger
}
