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
	Token     string `json:"token"` // JWT token
}

// AuthWithMAX godoc
// @Summary      Аутентификация через MAX
// @Description  Создает или получает пользователя по MAX User ID и возвращает JWT токен
// @Tags         auth
// @Param        request body AuthWithMAXRequest true "MAX User ID"
// @Success      200 {object} AuthWithMAXResponse
// @Failure      400 {object} response.ErrorResponse "Некорректный запрос"
// @Failure      500 {object} response.ErrorResponse "Внутренняя ошибка сервера"
// @Router       /auth/max [post]
func (h *AuthHandler) AuthWithMAX(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	log := h.log.WithContext(ctx)

	var req AuthWithMAXRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Error("failed to decode request", "error", err)
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	user, token, err := h.uc.Login(ctx, req.MaxUserID)
	if err != nil {
		log.Error("failed to login", "error", err)
		handleUsecaseError(w, err)
		return
	}

	resp := AuthWithMAXResponse{
		UserID:    user.ID.String(),
		MaxUserID: user.MaxUserID,
		Token:     token,
	}

	response.Success(w, http.StatusOK, resp)
}
