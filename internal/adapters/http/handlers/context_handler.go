package handlers

import (
	"encoding/json"
	"net/http"
	"time"

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

// GetContexts godoc
// @Summary      Получить все контексты пользователя
// @Description  Возвращает список всех контекстов (учеба, проекты, личное) текущего пользователя
// @Tags         contexts
// @Accept       json
// @Produce      json
// @Param        X-User-ID header string true "User ID"
// @Success      200 {object} map[string]interface{} "contexts: array of Context objects"
// @Failure      401 {object} response.ErrorResponse
// @Failure      500 {object} response.ErrorResponse
// @Router       /contexts [get]
// @Security     BearerAuth
func (h *ContextHandler) GetContexts(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	log := h.log.WithContext(ctx)

	// TODO: Extract user ID from JWT token
	userIDStr := r.Header.Get("X-User-ID")
	if userIDStr == "" {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	userID, err := models.ParseUserID(userIDStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid user id")
		return
	}

	contexts, err := h.uc.GetContextsByUserID(ctx, userID)
	if err != nil {
		log.Error("failed to get contexts", "error", err)
		response.Error(w, http.StatusInternalServerError, "internal server error")
		return
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"contexts": contexts,
	})
}

// CreateContext godoc
// @Summary      Создать новый контекст
// @Description  Создает новый контекст (например, "Математика", "Курсовая работа")
// @Tags         contexts
// @Accept       json
// @Produce      json
// @Param        X-User-ID header string true "User ID"
// @Param        request body CreateContextRequest true "Данные контекста"
// @Success      201 {object} models.Context
// @Failure      400 {object} response.ErrorResponse
// @Failure      401 {object} response.ErrorResponse
// @Failure      500 {object} response.ErrorResponse
// @Router       /contexts [post]
// @Security     BearerAuth
func (h *ContextHandler) CreateContext(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	log := h.log.WithContext(ctx)

	userIDStr := r.Header.Get("X-User-ID")
	if userIDStr == "" {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	userID, err := models.ParseUserID(userIDStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid user id")
		return
	}

	var req CreateContextRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Error("failed to decode request", "error", err)
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	var deadlineAt *time.Time
	if req.DeadlineAt != nil {
		t, err := time.Parse(time.RFC3339, *req.DeadlineAt)
		if err == nil {
			deadlineAt = &t
		}
	}

	context, err := h.uc.CreateContext(ctx, userID, models.ContextType(req.Type), req.Title, req.Description, req.Color, req.SubjectID, deadlineAt)
	if err != nil {
		log.Error("failed to create context", "error", err)
		response.Error(w, http.StatusInternalServerError, "internal server error")
		return
	}

	response.JSON(w, http.StatusCreated, context)
}

// GetContext godoc
// @Summary      Получить контекст по ID
// @Description  Возвращает подробную информацию о контексте
// @Tags         contexts
// @Accept       json
// @Produce      json
// @Param        id query string true "Context ID"
// @Success      200 {object} models.Context
// @Failure      400 {object} response.ErrorResponse
// @Failure      404 {object} response.ErrorResponse
// @Failure      501 {object} response.ErrorResponse
// @Router       /contexts/{id} [get]
// @Security     BearerAuth
func (h *ContextHandler) GetContext(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	log := h.log.WithContext(ctx)

	// Получаем ID контекста из URL параметра
	contextIDStr := r.URL.Query().Get("id")
	if contextIDStr == "" {
		response.Error(w, http.StatusBadRequest, "context id required")
		return
	}

	contextID, err := models.ParseContextID(contextIDStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid context id")
		return
	}

	// Получаем контекст из usecase
	// TODO: Добавить метод GetContextByID в usecase
	log.Info("get context", "context_id", contextID)
	response.Error(w, http.StatusNotImplemented, "get context by id not yet implemented in usecase")
}

func (h *ContextHandler) UpdateContext(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	log := h.log.WithContext(ctx)

	userIDStr := r.Header.Get("X-User-ID")
	if userIDStr == "" {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	contextIDStr := r.URL.Query().Get("id")
	if contextIDStr == "" {
		response.Error(w, http.StatusBadRequest, "context id required")
		return
	}

	contextID, err := models.ParseContextID(contextIDStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid context id")
		return
	}

	var req CreateContextRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Error("failed to decode request", "error", err)
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// TODO: Добавить метод UpdateContext в usecase
	log.Info("update context", "context_id", contextID)
	response.Error(w, http.StatusNotImplemented, "update context not yet implemented in usecase")
}

func (h *ContextHandler) DeleteContext(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	log := h.log.WithContext(ctx)

	userIDStr := r.Header.Get("X-User-ID")
	if userIDStr == "" {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	contextIDStr := r.URL.Query().Get("id")
	if contextIDStr == "" {
		response.Error(w, http.StatusBadRequest, "context id required")
		return
	}

	contextID, err := models.ParseContextID(contextIDStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid context id")
		return
	}

	// TODO: Добавить метод DeleteContext в usecase
	log.Info("delete context", "context_id", contextID)
	response.Error(w, http.StatusNotImplemented, "delete context not yet implemented in usecase")
}
