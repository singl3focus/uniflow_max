package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/singl3focus/uniflow/internal/adapters/http/response"
	"github.com/singl3focus/uniflow/internal/core/models"
	"github.com/singl3focus/uniflow/internal/core/usecase"
	"github.com/singl3focus/uniflow/pkg/logger"
)

type TaskHandler struct {
	uc  *usecase.Usecase
	log logger.Logger
}

func NewTaskHandler(uc *usecase.Usecase, log logger.Logger) *TaskHandler {
	return &TaskHandler{uc: uc, log: log}
}

type CreateTaskRequest struct {
	ContextID   *string `json:"context_id"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	DueAt       *string `json:"due_at"` // ISO 8601 format
}

type UpdateTaskStatusRequest struct {
	Status string `json:"status"`
}

// GetTasks godoc
// @Summary      Получить все задачи пользователя
// @Description  Возвращает список всех задач текущего пользователя
// @Tags         tasks
// @Accept       json
// @Produce      json
// @Param        X-User-ID header string true "User ID"
// @Success      200 {object} map[string]interface{} "tasks: array of Task objects"
// @Failure      401 {object} response.ErrorResponse
// @Failure      500 {object} response.ErrorResponse
// @Router       /tasks [get]
// @Security     BearerAuth
func (h *TaskHandler) GetTasks(w http.ResponseWriter, r *http.Request) {
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

	tasks, err := h.uc.GetTasksByUserID(ctx, userID)
	if err != nil {
		log.Error("failed to get tasks", "error", err)
		response.Error(w, http.StatusInternalServerError, "internal server error")
		return
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"tasks": tasks,
	})
}

// GetTasksToday godoc
// @Summary      Получить задачи на сегодня
// @Description  Возвращает список задач с дедлайном на сегодня
// @Tags         tasks
// @Accept       json
// @Produce      json
// @Param        X-User-ID header string true "User ID"
// @Success      200 {object} map[string]interface{} "tasks: array of Task objects"
// @Failure      401 {object} response.ErrorResponse
// @Failure      500 {object} response.ErrorResponse
// @Router       /tasks/today [get]
// @Security     BearerAuth
func (h *TaskHandler) GetTasksToday(w http.ResponseWriter, r *http.Request) {
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

	tasks, err := h.uc.GetTasksDueToday(ctx, userID)
	if err != nil {
		log.Error("failed to get tasks due today", "error", err)
		response.Error(w, http.StatusInternalServerError, "internal server error")
		return
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"tasks": tasks,
	})
}

// CreateTask godoc
// @Summary      Создать новую задачу
// @Description  Создает новую задачу с привязкой к контексту (опционально)
// @Tags         tasks
// @Accept       json
// @Produce      json
// @Param        X-User-ID header string true "User ID"
// @Param        request body CreateTaskRequest true "Данные задачи"
// @Success      201 {object} models.Task
// @Failure      400 {object} response.ErrorResponse
// @Failure      401 {object} response.ErrorResponse
// @Failure      500 {object} response.ErrorResponse
// @Router       /tasks [post]
// @Security     BearerAuth
func (h *TaskHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
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

	var req CreateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Error("failed to decode request", "error", err)
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	var contextID *models.ContextID
	if req.ContextID != nil {
		cid, err := models.ParseContextID(*req.ContextID)
		if err == nil {
			contextID = &cid
		}
	}

	var dueAt *time.Time
	if req.DueAt != nil {
		t, err := time.Parse(time.RFC3339, *req.DueAt)
		if err == nil {
			dueAt = &t
		}
	}

	task, err := h.uc.CreateTask(ctx, userID, contextID, req.Title, req.Description, dueAt)
	if err != nil {
		log.Error("failed to create task", "error", err)
		response.Error(w, http.StatusInternalServerError, "internal server error")
		return
	}

	response.JSON(w, http.StatusCreated, task)
}

func (h *TaskHandler) GetTask(w http.ResponseWriter, r *http.Request) {
	response.Error(w, http.StatusNotImplemented, "not implemented")
}

func (h *TaskHandler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	response.Error(w, http.StatusNotImplemented, "not implemented")
}

func (h *TaskHandler) UpdateTaskStatus(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	log := h.log.WithContext(ctx)

	taskIDStr := chi.URLParam(r, "id")
	taskID, err := models.ParseTaskID(taskIDStr)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid task id")
		return
	}

	var req UpdateTaskStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Error("failed to decode request", "error", err)
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.uc.UpdateTaskStatus(ctx, taskID, models.TaskStatus(req.Status)); err != nil {
		log.Error("failed to update task status", "error", err)
		response.Error(w, http.StatusInternalServerError, "internal server error")
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{"status": "updated"})
}

func (h *TaskHandler) DeleteTask(w http.ResponseWriter, r *http.Request) {
	response.Error(w, http.StatusNotImplemented, "not implemented")
}
