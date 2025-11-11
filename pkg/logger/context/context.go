package logger

import (
	"context"
)

type ctxKey string

const requestIDKey ctxKey = "request_id"

// InjectRequestID кладёт request_id в контекст
func InjectRequestID(ctx context.Context, reqID string) context.Context {
	return context.WithValue(ctx, requestIDKey, reqID)
}

// ExtractRequestID достаёт request_id из контекста
func ExtractRequestID(ctx context.Context) (string, bool) {
	val := ctx.Value(requestIDKey)
	if v, ok := val.(string); ok {
		return v, true
	}
	return "", false
}
