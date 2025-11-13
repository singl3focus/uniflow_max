package handlers

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/singl3focus/uniflow/internal/adapters/http/response"
	"github.com/singl3focus/uniflow/internal/core/usecase"
)

// handleUsecaseError преобразует ошибки usecase в соответствующие HTTP-ответы
func handleUsecaseError(w http.ResponseWriter, err error) bool {
	if err == nil {
		return false
	}

	switch {
	case errors.Is(err, usecase.ErrInvalidData):
		response.Error(w, http.StatusBadRequest, fmt.Sprintf("invalid data: %v", err))
		return true
	case errors.Is(err, usecase.ErrNotFound):
		response.Error(w, http.StatusNotFound, fmt.Sprintf("not found: %v", err))
		return true
	case errors.Is(err, usecase.ErrInternal):
		response.Error(w, http.StatusInternalServerError, fmt.Sprintf("internal server error: %v", err))
		return true
	default:
		response.Error(w, http.StatusInternalServerError, fmt.Sprintf("internal server error: %v", err))
		return true
	}
}
