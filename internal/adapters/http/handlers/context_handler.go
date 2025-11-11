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

func (h *ContextHandler) GetContext(w http.ResponseWriter, r *http.Request) {
	// TODO: implement
	response.Error(w, http.StatusNotImplemented, "not implemented")
}

func (h *ContextHandler) UpdateContext(w http.ResponseWriter, r *http.Request) {
	// TODO: implement
	response.Error(w, http.StatusNotImplemented, "not implemented")
}

func (h *ContextHandler) DeleteContext(w http.ResponseWriter, r *http.Request) {
	// TODO: implement
	response.Error(w, http.StatusNotImplemented, "not implemented")
}
