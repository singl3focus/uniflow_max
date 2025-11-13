package handlers

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/singl3focus/uniflow/internal/core/usecase"
)

func TestHandleUsecaseError(t *testing.T) {
	tests := []struct {
		name           string
		err            error
		expectedStatus int
	}{
		{
			name:           "ErrInvalidData returns 400",
			err:            usecase.ErrInvalidData,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "ErrNotFound returns 404",
			err:            usecase.ErrNotFound,
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "ErrInternal returns 500",
			err:            usecase.ErrInternal,
			expectedStatus: http.StatusInternalServerError,
		},
		{
			name:           "Unknown error returns 500",
			err:            errors.New("unknown error"),
			expectedStatus: http.StatusInternalServerError,
		},
		{
			name:           "Nil error returns false",
			err:            nil,
			expectedStatus: 0, // не вызовется обработчик
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			handled := handleUsecaseError(w, tt.err)

			if tt.err == nil {
				if handled {
					t.Errorf("handleUsecaseError() should return false for nil error")
				}
				return
			}

			if !handled {
				t.Errorf("handleUsecaseError() should return true for error %v", tt.err)
			}

			if w.Code != tt.expectedStatus {
				t.Errorf("handleUsecaseError() status = %v, want %v", w.Code, tt.expectedStatus)
			}
		})
	}
}
