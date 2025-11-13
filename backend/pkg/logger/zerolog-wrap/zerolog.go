package zerologger

import (
	"context"
	"fmt"
	"io"
	"os"
	"sync"

	"github.com/rs/zerolog"

	"github.com/singl3focus/uniflow/pkg/logger"
	logctx "github.com/singl3focus/uniflow/pkg/logger/context"
)

type ZeroLogger struct {
	logger  zerolog.Logger
	logFile *os.File
	mu      sync.RWMutex
}

func NewZeroLogger(out io.Writer, levelStr string) *ZeroLogger {
	level, err := zerolog.ParseLevel(levelStr)
	if err != nil {
		level = zerolog.InfoLevel
	}
	zerolog.SetGlobalLevel(level)

	zl := zerolog.New(out).With().Timestamp().Logger()
	return &ZeroLogger{logger: zl}
}

func NewZeroLoggerFile(path string, levelStr string) (*ZeroLogger, error) {
	f, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		return nil, err
	}
	l := NewZeroLogger(f, levelStr)
	l.logFile = f
	return l, nil
}

// --- Реализация интерфейса Logger ---

func (l *ZeroLogger) Debug(msg string, fields ...interface{}) {
	l.logger.Debug().Fields(toMap(fields...)).Msg(msg)
}

func (l *ZeroLogger) Info(msg string, fields ...interface{}) {
	l.logger.Info().Fields(toMap(fields...)).Msg(msg)
}

func (l *ZeroLogger) Warn(msg string, fields ...interface{}) {
	l.logger.Warn().Fields(toMap(fields...)).Msg(msg)
}

func (l *ZeroLogger) Error(msg string, fields ...interface{}) {
	l.logger.Error().Fields(toMap(fields...)).Msg(msg)
}

func (l *ZeroLogger) Fatal(msg string, fields ...interface{}) {
	l.logger.Fatal().Fields(toMap(fields...)).Msg(msg)
}

func (l *ZeroLogger) Log(level string, msg string, fields ...interface{}) {
	parsed, err := zerolog.ParseLevel(level)
	if err != nil {
		l.logger.Warn().Str("invalid_level", level).Msg(msg)
		return
	}
	e := l.logger.WithLevel(parsed).Fields(toMap(fields...))
	e.Msg(msg)
}

func (l *ZeroLogger) SetLevel(level string) error {
	parsed, err := zerolog.ParseLevel(level)
	if err != nil {
		return fmt.Errorf("invalid log level: %w", err)
	}
	l.mu.Lock()
	defer l.mu.Unlock()
	zerolog.SetGlobalLevel(parsed)
	return nil
}

func (l *ZeroLogger) Shutdown() error {
	if l.logFile != nil {
		return l.logFile.Close()
	}
	return nil
}

func (l *ZeroLogger) Flush() error {
	if l.logFile != nil {
		return l.logFile.Sync()
	}
	return nil
}

func (l *ZeroLogger) With(fields ...interface{}) logger.Logger {
	newLogger := l.logger.With().Fields(toMap(fields...)).Logger()
	return &ZeroLogger{logger: newLogger, logFile: l.logFile}
}

func (l *ZeroLogger) WithContext(ctx context.Context) logger.Logger {
	if reqID, ok := logctx.ExtractRequestID(ctx); ok {
		newLogger := l.logger.With().Str("request_id", reqID).Logger()
		return &ZeroLogger{logger: newLogger, logFile: l.logFile}
	}
	return l
}

// --- Вспомогательная функция ---

func toMap(fields ...interface{}) map[string]interface{} {
	m := make(map[string]interface{})
	for i := 0; i < len(fields)-1; i += 2 {
		key, ok := fields[i].(string)
		if !ok {
			continue
		}
		m[key] = fields[i+1]
	}
	return m
}
