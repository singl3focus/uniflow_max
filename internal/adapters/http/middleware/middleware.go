package middleware

import (
	"fmt"
	"net/http"
	"sync/atomic"
	"time"

	"github.com/singl3focus/uniflow/pkg/logger"
	logctx "github.com/singl3focus/uniflow/pkg/logger/context"
)

// ========================
// Recover перехватывает панику и возвращает 500
// ========================

func Recover(l logger.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if rec := recover(); rec != nil {
					l.WithContext(r.Context()).Error("panic recovered", "error", rec)
					http.Error(w, "Internal Server Error", http.StatusInternalServerError)
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}

// ========================
// RequestID генерирует уникальный request_id и кладёт его в ctx
// ========================
const RequestIDHeader = "X-Request-Id"

var prefix string = "req"
var reqid uint64

func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID := r.Header.Get(RequestIDHeader)
		if requestID == "" {
			myid := atomic.AddUint64(&reqid, 1)
			requestID = fmt.Sprintf("%s-%06d", prefix, myid)
		}

		// Добавляем в контекст
		ctx := logctx.InjectRequestID(r.Context(), requestID)

		// Прокидываем в хедер ответа — удобно для трассировки
		w.Header().Set(RequestIDHeader, requestID)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// ========================
// Logger логирует начало и конец запроса
// ========================

func Logger(l logger.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			// Извлекаем логгер с контекстом (включая request_id)
			reqLog := l.WithContext(r.Context())

			reqLog.Info("incoming request",
				"method", r.Method,
				"url", r.URL.Path,
				"remote", r.RemoteAddr,
			)

			// Обрабатываем запрос
			next.ServeHTTP(w, r)

			duration := time.Since(start)
			reqLog.Info("request completed",
				"method", r.Method,
				"url", r.URL.Path,
				"duration_ms", duration.Milliseconds(),
			)
		})
	}
}
