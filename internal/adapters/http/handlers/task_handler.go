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

type UpdateTaskRequest struct {
	ContextID   *string `json:"context_id"`
	Title       *string `json:"title"`
	Description *string `json:"description"`
	DueAt       *string `json:"due_at"` // ISO 8601 format
}

type UpdateTaskStatusRequest struct {
	Status string `json:"status"`
}

// GetTasks godoc
// @Summary      Получить все задачи пользователя
// @Description  Возвращает список всех задач текущего пользователя
// @Tags         tasks
// @Success      200 {object} map[string]interface{} "tasks: array of Task objects"
// @Failure      401 {object} response.ErrorResponse
// @Failure      500 {object} response.ErrorResponse
// @Router       /tasks [get]
// @Security     BearerAuth
func (h *TaskHandler) GetTasks(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	log := h.log.WithContext(ctx)

	userIDStr, ok := middleware.GetUserIDFromContext(ctx)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	tasks, err := h.uc.GetTasksByUserID(ctx, userIDStr)
	if err != nil {
		log.Error("failed to get tasks", "error", err)
		handleUsecaseError(w, err)
		return
	}

	response.Success(w, http.StatusOK, map[string]interface{}{
		"tasks": tasks,
	})
}

// GetTasksToday godoc
// @Summary      Получить задачи на сегодня
// @Description  Возвращает список задач с дедлайном на сегодня
// @Tags         tasks
// @Success      200 {object} map[string]interface{} "tasks: array of Task objects"
// @Failure      401 {object} response.ErrorResponse
// @Failure      500 {object} response.ErrorResponse
// @Router       /tasks/today [get]
// @Security     BearerAuth
func (h *TaskHandler) GetTasksToday(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	_ = h.log.WithContext(ctx)

	userIDStr, ok := middleware.GetUserIDFromContext(ctx)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	tasks, err := h.uc.GetTasksDueToday(ctx, userIDStr)
	if err != nil {
		handleUsecaseError(w, err)
		return
	}

	response.Success(w, http.StatusOK, map[string]interface{}{
		"tasks": tasks,
	})
}

// CreateTask godoc
// @Summary      Создать новую задачу
// @Description  Создает новую задачу с привязкой к контексту (опционально)
// @Tags         tasks
// @Param        request body CreateTaskRequest true "Данные задачи"
// @Success      201 {object} models.Task
// @Failure      400 {object} response.ErrorResponse
// @Failure      401 {object} response.ErrorResponse
// @Failure      500 {object} response.ErrorResponse
// @Router       /tasks [post]
// @Security     BearerAuth
func (h *TaskHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	_ = h.log.WithContext(ctx)

	userIDStr, ok := middleware.GetUserIDFromContext(ctx)
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req CreateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	task, err := h.uc.CreateTask(ctx, userIDStr, req.ContextID, req.Title, req.Description, req.DueAt)
	if err != nil {
		handleUsecaseError(w, err)
		return
	}

	response.Success(w, http.StatusCreated, task)
}

// GetTask godoc
// @Summary      Получить задачу по ID
// @Description  Возвращает подробную информацию о задаче
// @Tags         tasks
// @Accept       json
// @Produce      json
// @Param        id path string true "Task ID"
// @Success      200 {object} models.Task
// @Failure      400 {object} response.ErrorResponse
// @Failure      404 {object} response.ErrorResponse
// @Failure      500 {object} response.ErrorResponse
// @Router       /tasks/{id} [get]
// @Security     BearerAuth
func (h *TaskHandler) GetTask(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	log := h.log.WithContext(ctx)

	taskIDStr := chi.URLParam(r, "id")

	task, err := h.uc.GetTaskByID(ctx, taskIDStr)
	if err != nil {
		log.Error("failed to get task", "error", err)
		handleUsecaseError(w, err)
		return
	}

	response.Success(w, http.StatusOK, task)
}

// UpdateTask godoc
// @Summary      Обновить задачу
// @Description  Обновляет информацию о задаче. Все поля опциональны, обновляются только переданные
// @Tags         tasks
// @Accept       json
// @Produce      json
// @Param        id path string true "Task ID"
// @Param        request body UpdateTaskRequest true "Данные для обновления"
// @Success      200 {object} models.Task
// @Failure      400 {object} response.ErrorResponse
// @Failure      404 {object} response.ErrorResponse
// @Failure      500 {object} response.ErrorResponse
// @Router       /tasks/{id} [patch]
// @Security     BearerAuth
func (h *TaskHandler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	_ = h.log.WithContext(ctx)

	taskIDStr := chi.URLParam(r, "id")

	var req UpdateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	task, err := h.uc.UpdateTask(ctx, taskIDStr, req.ContextID, req.Title, req.Description, req.DueAt, nil)
	if err != nil {
		handleUsecaseError(w, err)
		return
	}

	response.Success(w, http.StatusOK, task)
}

// UpdateTaskStatus godoc
// @Summary      Обновить статус задачи
// @Description  Изменяет статус задачи (todo, in_progress, completed, cancelled)
// @Tags         tasks
// @Accept       json
// @Produce      json
// @Param        id path string true "Task ID"
// @Param        request body UpdateTaskStatusRequest true "Новый статус"
// @Success      200 {object} map[string]string
// @Failure      400 {object} response.ErrorResponse
// @Failure      404 {object} response.ErrorResponse
// @Failure      500 {object} response.ErrorResponse
// @Router       /tasks/{id}/status [patch]
// @Security     BearerAuth
func (h *TaskHandler) UpdateTaskStatus(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	_ = h.log.WithContext(ctx)

	taskIDStr := chi.URLParam(r, "id")

	var req UpdateTaskStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.uc.UpdateTaskStatus(ctx, taskIDStr, models.TaskStatus(req.Status)); err != nil {
		handleUsecaseError(w, err)
		return
	}

	response.Success(w, http.StatusOK, map[string]string{"status": "updated"})
}

// DeleteTask godoc
// @Summary      Удалить задачу
// @Description  Удаляет задачу по ID
// @Tags         tasks
// @Accept       json
// @Produce      json
// @Param        id path string true "Task ID"
// @Success      200 {object} map[string]string
// @Failure      400 {object} response.ErrorResponse
// @Failure      404 {object} response.ErrorResponse
// @Failure      500 {object} response.ErrorResponse
// @Router       /tasks/{id} [delete]
// @Security     BearerAuth
func (h *TaskHandler) DeleteTask(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	_ = h.log.WithContext(ctx)

	taskIDStr := chi.URLParam(r, "id")

	if err := h.uc.DeleteTask(ctx, taskIDStr); err != nil {
		handleUsecaseError(w, err)
		return
	}

	response.Success(w, http.StatusOK, map[string]string{"status": "deleted"})
}
