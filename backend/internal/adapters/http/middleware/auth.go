package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/singl3focus/uniflow/internal/adapters/http/response"
	jwtpkg "github.com/singl3focus/uniflow/pkg/jwt"
)

type contextKey string

const UserIDKey contextKey = "user_id"

// RequireAuth middleware для обязательной аутентификации (JWT или X-User-ID)
func RequireAuth(jwtManager *jwtpkg.JWTManager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Проверяем JWT токен
			authHeader := r.Header.Get("Authorization")
			if authHeader != "" {
				parts := strings.Split(authHeader, " ")
				if len(parts) == 2 && parts[0] == "Bearer" {
					tokenString := parts[1]
					userID, err := jwtManager.ExtractUserID(tokenString)
					if err == nil {
						ctx := context.WithValue(r.Context(), UserIDKey, userID.String())
						next.ServeHTTP(w, r.WithContext(ctx))
						return
					}
				}
			}

			// Если нет JWT, пробуем X-User-ID (для обратной совместимости)
			userIDStr := r.Header.Get("X-User-ID")
			if userIDStr != "" {
				ctx := context.WithValue(r.Context(), UserIDKey, userIDStr)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}

			response.Error(w, http.StatusUnauthorized, "unauthorized")
		})
	}
}

// GetUserIDFromContext извлекает user_id из контекста
func GetUserIDFromContext(ctx context.Context) (string, bool) {
	userID, ok := ctx.Value(UserIDKey).(string)
	return userID, ok
}
