package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/singl3focus/uniflow/internal/adapters/http/middleware"
	"github.com/singl3focus/uniflow/internal/adapters/http/response"
	"github.com/singl3focus/uniflow/internal/core/models"
	"github.com/singl3focus/uniflow/internal/core/usecase"
	"github.com/singl3focus/uniflow/pkg/logger"
)

type ContextHandler struct {
	uc  *usecase.Usecase
	log logger.Logger
}

func NewContextHandler(uc *usecase.Usecase, log logger.Logger) *ContextHandler {
	return &ContextHandler{uc: uc, log: log}
}

type CreateContextRequest struct {
	Type        string  `json:"type"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	SubjectID   *string `json:"subject_id"`
	Color       string  `json:"color"`
	DeadlineAt  *string `json:"deadline_at"` // ISO 8601 format
}

type UpdateContextRequest struct {
	Type        *string `json:"type"`
	Title       *string `json:"title"`
	Description *string `json:"description"`
	SubjectID   *string `json:"subject_id"`
	Color       *string `json:"color"`
	DeadlineAt  *string `json:"deadline_at"` // ISO 8601 format
}

// GetContexts godoc
// @Summary      Получить все контексты пользователя
// @Description  Возвращает список всех контекстов (учеба, проекты, личное) текущего пользователя
// @Tags         contexts
// @Success      200 {object} map[string]interface{} "contexts: array of Context objects"
// @Failure      401 {object} response.ErrorResponse
// @Failure      500 {object} response.ErrorResponse
// @Router       /contexts [get]
// @Security     BearerAuth
func (h *ContextHandler) GetContexts(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	log := h.log.WithContext(ctx)

	userIDStr, ok := middleware.GetUserIDFromContext(ctx)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	contexts, err := h.uc.GetContextsByUserID(ctx, userIDStr)
	if err != nil {
		log.Error("failed to get contexts", "error", err)
		handleUsecaseError(w, err)
		return
	}

	response.Success(w, http.StatusOK, map[string]interface{}{
		"contexts": contexts,
	})
}

// CreateContext godoc
// @Summary      Создать новый контекст
// @Description  Создает новый контекст (например, "Математика", "Курсовая работа")
// @Tags         contexts
// @Param        request body CreateContextRequest true "Данные контекста"
// @Success      201 {object} models.Context
// @Failure      400 {object} response.ErrorResponse "Некорректный запрос"
// @Failure      401 {object} response.ErrorResponse "Неавторизованный доступ"
// @Failure      500 {object} response.ErrorResponse "Внутренняя ошибка сервера"
// @Router       /contexts [post]
// @Security     BearerAuth
func (h *ContextHandler) CreateContext(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	log := h.log.WithContext(ctx)

	userIDStr, ok := middleware.GetUserIDFromContext(ctx)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req CreateContextRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	context, err := h.uc.CreateContext(ctx, userIDStr, models.ContextType(req.Type), req.Title, req.Description, req.Color, req.SubjectID, req.DeadlineAt)
	if err != nil {
		log.Error("failed to create context", "error", err)
		handleUsecaseError(w, err)
		return
	}

	response.Success(w, http.StatusCreated, context)
}

// GetContext godoc
// @Summary      Получить контекст по ID
// @Description  Возвращает подробную информацию о контексте
// @Tags         contexts
// @Param        id query string true "Context ID"
// @Success      200 {object} models.Context
// @Failure      400 {object} response.ErrorResponse "Некорректный запрос"
// @Failure      404 {object} response.ErrorResponse "Контекст не найден"
// @Failure      501 {object} response.ErrorResponse "Метод не реализован"
// @Router       /contexts/{id} [get]
// @Security     BearerAuth
func (h *ContextHandler) GetContext(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	log := h.log.WithContext(ctx)

	contextIDStr := r.URL.Query().Get("id")
	if contextIDStr == "" {
		response.Error(w, http.StatusBadRequest, "context 'id' required")
		return
	}

	context, err := h.uc.GetContextByID(ctx, contextIDStr)
	if err != nil {
		log.Error("failed to get context", "error", err)
		handleUsecaseError(w, err)
		return
	}

	response.Success(w, http.StatusOK, context)
}

// UpdateContext godoc
// @Summary      Обновить контекст
// @Description  Обновляет информацию о контексте. Все поля опциональны, обновляются только переданные
// @Tags         contexts
// @Accept       json
// @Produce      json
// @Param        id path string true "Context ID"
// @Param        request body UpdateContextRequest true "Данные для обновления"
// @Success      200 {object} models.Context
// @Failure      400 {object} response.ErrorResponse
// @Failure      401 {object} response.ErrorResponse
// @Failure      404 {object} response.ErrorResponse
// @Failure      500 {object} response.ErrorResponse
// @Router       /contexts/{id} [patch]
// @Security     BearerAuth
func (h *ContextHandler) UpdateContext(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	log := h.log.WithContext(ctx)

	contextIDStr := chi.URLParam(r, "id")
	if contextIDStr == "" {
		response.Error(w, http.StatusBadRequest, "context id required")
		return
	}

	var req UpdateContextRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Error("failed to decode request", "error", err)
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	var contextType string
	if req.Type != nil {
		contextType = *req.Type
	}

	context, err := h.uc.UpdateContext(ctx, contextIDStr, contextType, req.Title, req.Description, req.Color, req.SubjectID, req.DeadlineAt)
	if err != nil {
		log.Error("failed to update context", "error", err)
		handleUsecaseError(w, err)
		return
	}

	response.Success(w, http.StatusOK, context)
}

// DeleteContext godoc
// @Summary      Удалить контекст
// @Description  Удаляет контекст по ID
// @Tags         contexts
// @Accept       json
// @Produce      json
// @Param        id path string true "Context ID"
// @Success      200 {object} map[string]string
// @Failure      400 {object} response.ErrorResponse
// @Failure      401 {object} response.ErrorResponse
// @Failure      404 {object} response.ErrorResponse
// @Failure      500 {object} response.ErrorResponse
// @Router       /contexts/{id} [delete]
// @Security     BearerAuth
func (h *ContextHandler) DeleteContext(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	log := h.log.WithContext(ctx)

	contextIDStr := r.URL.Query().Get("id")
	if contextIDStr == "" {
		response.Error(w, http.StatusBadRequest, "context id required")
		return
	}

	if err := h.uc.DeleteContext(ctx, contextIDStr); err != nil {
		log.Error("failed to delete context", "error", err)
		handleUsecaseError(w, err)
		return
	}

	response.Success(w, http.StatusOK, map[string]string{"status": "deleted"})
}
