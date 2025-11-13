package handlers

import (
	"net/http"

	"github.com/singl3focus/uniflow/internal/adapters/http/middleware"
	"github.com/singl3focus/uniflow/internal/adapters/http/response"
	"github.com/singl3focus/uniflow/internal/core/usecase"
	"github.com/singl3focus/uniflow/pkg/logger"
)

type SearchHandler struct {
	uc  *usecase.Usecase
	log logger.Logger
}

func NewSearchHandler(uc *usecase.Usecase, log logger.Logger) *SearchHandler {
	return &SearchHandler{uc: uc, log: log}
}

// Search godoc
// @Summary      Поиск по задачам и контекстам
// @Description  Выполняет поиск по названиям и описаниям задач и контекстов
// @Tags         search
// @Param        q query string true "Поисковый запрос"
// @Success      200 {object} map[string]interface{} "tasks: array of Task, contexts: array of Context"
// @Failure      400 {object} response.ErrorResponse
// @Failure      401 {object} response.ErrorResponse
// @Failure      500 {object} response.ErrorResponse
// @Router       /search [get]
// @Security     BearerAuth
func (h *SearchHandler) Search(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	log := h.log.WithContext(ctx)

	userIDStr, ok := middleware.GetUserIDFromContext(ctx)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	query := r.URL.Query().Get("q")
	if query == "" {
		response.Error(w, http.StatusBadRequest, "query parameter 'q' is required")
		return
	}

	results, err := h.uc.Search(ctx, userIDStr, query)
	if err != nil {
		log.Error("failed to search", "error", err, "query", query)
		handleUsecaseError(w, err)
		return
	}

	response.Success(w, http.StatusOK, results)
}
