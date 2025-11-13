package http

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	httpSwagger "github.com/swaggo/http-swagger"

	"github.com/singl3focus/uniflow/internal/adapters/http/handlers"
	"github.com/singl3focus/uniflow/internal/adapters/http/middleware"
	"github.com/singl3focus/uniflow/internal/core/usecase"
	jwtpkg "github.com/singl3focus/uniflow/pkg/jwt"
	"github.com/singl3focus/uniflow/pkg/logger"
)

func NewHandler(log logger.Logger, uc *usecase.Usecase, maxWebhook http.Handler, jwtSecret string) http.Handler {
	r := chi.NewRouter()

	// Настройка CORS - разрешаем все источники
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Use(middleware.RequestID)
	r.Use(middleware.Recover(log))
	r.Use(middleware.Logger(log))

	jwtManager := jwtpkg.NewJWTManager(jwtSecret, 24*time.Hour)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		logger := log.WithContext(r.Context())
		logger.Info("handling /health request")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("OK"))
	})

	r.Get("/swagger/*", httpSwagger.Handler(
		httpSwagger.URL("/swagger/doc.json"),
	))

	r.Route("/api", func(r chi.Router) {
		authHandler := handlers.NewAuthHandler(uc, log)
		r.Post("/auth/max", authHandler.AuthWithMAX)

		// Protected routes (требуют аутентификацию)
		r.Group(func(r chi.Router) {
			r.Use(middleware.RequireAuth(jwtManager))

			// Contexts
			contextHandler := handlers.NewContextHandler(uc, log)
			r.Get("/contexts", contextHandler.GetContexts)
			r.Post("/contexts", contextHandler.CreateContext)
			r.Get("/contexts/{id}", contextHandler.GetContext)
			r.Patch("/contexts/{id}", contextHandler.UpdateContext)
			r.Delete("/contexts/{id}", contextHandler.DeleteContext)

			// Tasks
			taskHandler := handlers.NewTaskHandler(uc, log)
			r.Get("/tasks", taskHandler.GetTasks)
			r.Get("/tasks/today", taskHandler.GetTasksToday)
			r.Post("/tasks", taskHandler.CreateTask)
			r.Get("/tasks/{id}", taskHandler.GetTask)
			r.Patch("/tasks/{id}", taskHandler.UpdateTask)
			r.Patch("/tasks/{id}/status", taskHandler.UpdateTaskStatus)
			r.Delete("/tasks/{id}", taskHandler.DeleteTask)

			// Search
			searchHandler := handlers.NewSearchHandler(uc, log)
			r.Get("/search", searchHandler.Search)
		})
	})

	// MAX webhook
	if maxWebhook != nil {
		r.Post("/max/webhook", maxWebhook.ServeHTTP)
	} else {
		r.Post("/max/webhook", func(w http.ResponseWriter, r *http.Request) {
			log.Info("MAX webhook received (no handler configured)")
			w.WriteHeader(http.StatusOK)
		})
	}

	return r
}
