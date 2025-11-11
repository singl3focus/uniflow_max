package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/singl3focus/uniflow/internal/adapters/http/response"
	"github.com/singl3focus/uniflow/internal/core/usecase"
	"github.com/singl3focus/uniflow/pkg/logger"
)

type AuthHandler struct {
	uc  *usecase.Usecase
	log logger.Logger
}

func NewAuthHandler(uc *usecase.Usecase, log logger.Logger) *AuthHandler {
	return &AuthHandler{uc: uc, log: log}
}

type AuthWithMAXRequest struct {
	MaxUserID string `json:"max_user_id"`
}

type AuthWithMAXResponse struct {
	UserID    string `json:"user_id"`
	MaxUserID string `json:"max_user_id"`
	Token     string `json:"token"` // JWT token для дальнейшей аутентификации
}

func (h *AuthHandler) AuthWithMAX(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	log := h.log.WithContext(ctx)

	var req AuthWithMAXRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Error("failed to decode request", "error", err)
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.MaxUserID == "" {
		response.Error(w, http.StatusBadRequest, "max_user_id is required")
		return
	}

	user, err := h.uc.GetOrCreateUserByMaxID(ctx, req.MaxUserID)
	if err != nil {
		log.Error("failed to get or create user", "error", err)
		response.Error(w, http.StatusInternalServerError, "internal server error")
		return
	}

	// TODO: Generate JWT token
	token := "fake-jwt-token-" + user.ID.String()

	resp := AuthWithMAXResponse{
		UserID:    user.ID.String(),
		MaxUserID: user.MaxUserID,
		Token:     token,
	}

	response.JSON(w, http.StatusOK, resp)
}
