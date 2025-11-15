package max

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/singl3focus/uniflow/internal/core/models"
)

// ============== Обработчики callback'ов ==============

func (h *UniFlowUpdateHandler) handleTaskCallback(ctx context.Context, userID int64, callbackID string, parts []string) {
	if len(parts) < 3 {
		return
	}

	action := parts[1] // complete, view, edit, delete, reopen, due
	taskID := parts[2] // ID задачи

	// Получаем пользователя
	maxUserID := fmt.Sprintf("%d", userID)
	user, err := h.usecase.GetOrCreateUserByMaxID(ctx, maxUserID)
	if err != nil {
		h.logger.Error("failed to get user", "error", err)
		h.answerCallback(ctx, callbackID, "❌ Ошибка при получении пользователя")
		return
	}

	switch action {
	case "complete":
		h.handleCompleteTask(ctx, userID, callbackID, taskID, user.ID.String())
	case "view":
		h.handleViewTask(ctx, userID, callbackID, taskID, user.ID.String())
	case "edit":
		h.handleEditTask(ctx, userID, callbackID, taskID)
	case "delete":
		h.handleDeleteTask(ctx, userID, callbackID, taskID, user.ID.String())
	case "reopen":
		h.handleReopenTask(ctx, userID, callbackID, taskID, user.ID.String())
	case "confirm":
		h.handleConfirmAction(ctx, userID, callbackID, "task", taskID)
	case "cancel":
		h.answerCallback(ctx, callbackID, "❌ Действие отменено")
		h.showMainMenu(ctx, userID)
	}
}

func (h *UniFlowUpdateHandler) handleContextCallback(ctx context.Context, userID int64, callbackID string, parts []string) {
	if len(parts) < 3 {
		return
	}

	action := parts[1]    // view, tasks, edit, delete
	contextID := parts[2] // ID контекста

	// Получаем пользователя
	maxUserID := fmt.Sprintf("%d", userID)
	user, err := h.usecase.GetOrCreateUserByMaxID(ctx, maxUserID)
	if err != nil {
		h.logger.Error("failed to get user", "error", err)
		h.answerCallback(ctx, callbackID, "❌ Ошибка при получении пользователя")
		return
	}

	switch action {
	case "view":
		h.handleViewContext(ctx, userID, callbackID, contextID, user.ID.String())
	case "tasks":
		h.handleContextTasks(ctx, userID, callbackID, contextID, user.ID.String())
	case "edit":
		h.handleEditContext(ctx, userID, callbackID, contextID)
	case "delete":
		h.handleDeleteContext(ctx, userID, callbackID, contextID, user.ID.String())
	case "confirm":
		h.handleConfirmAction(ctx, userID, callbackID, "context", contextID)
	case "cancel":
		h.answerCallback(ctx, callbackID, "❌ Действие отменено")
		h.handleContextsCommand(ctx, userID)
	}
}

func (h *UniFlowUpdateHandler) handleMenuCallback(ctx context.Context, userID int64, callbackID string, parts []string) {
	if len(parts) < 2 {
		return
	}

	action := parts[1]

	h.answerCallback(ctx, callbackID, "")

	switch action {
	case "main":
		h.showMainMenu(ctx, userID)
	case "today":
		h.handleTodayCommand(ctx, userID)
	case "tasks":
		h.handleTasksCommand(ctx, userID)
	case "newtask":
		h.handleNewTaskCommand(ctx, userID)
	case "contexts":
		h.handleContextsCommand(ctx, userID)
	case "newcontext":
		h.handleNewContextCommand(ctx, userID)
	case "search":
		h.sendMessage(ctx, userID, "🔍 Введи запрос для поиска:\n\nНапример: математика")
		h.userStates[userID] = &UserState{
			State: "searching",
			Data:  make(map[string]interface{}),
		}
	case "inbox":
		h.handleInboxCommand(ctx, userID)
	case "schedule":
		// Расписание на сегодня (без offset)
		h.handleScheduleCommand(ctx, userID, 0)
	default:
		// Обработка schedule_N (где N - offset)
		if strings.HasPrefix(action, "schedule_") {
			offsetStr := strings.TrimPrefix(action, "schedule_")
			offset := 0
			if offsetStr != "" {
				if parsedOffset, err := strconv.Atoi(offsetStr); err == nil {
					offset = parsedOffset
				}
			}
			h.handleScheduleCommand(ctx, userID, offset)
		}
	}
}

// ============== Действия с задачами ==============

func (h *UniFlowUpdateHandler) handleCompleteTask(ctx context.Context, userID int64, callbackID, taskID, userIDStr string) {
	// Получаем задачу
	task, err := h.usecase.GetTaskByID(ctx, taskID)
	if err != nil {
		h.logger.Error("failed to get task", "error", err)
		h.answerCallback(ctx, callbackID, "❌ Задача не найдена")
		return
	}

	// Проверяем права доступа
	if task.UserID.String() != userIDStr {
		h.answerCallback(ctx, callbackID, "❌ Нет доступа к этой задаче")
		return
	}

	// Обновляем статус
	completedStatus := models.TaskStatusCompleted
	if err := h.usecase.UpdateTaskStatus(ctx, taskID, completedStatus); err != nil {
		h.logger.Error("failed to update task", "error", err)
		h.answerCallback(ctx, callbackID, "❌ Ошибка при обновлении задачи")
		return
	}

	h.answerCallback(ctx, callbackID, "✅ Задача завершена!")

	response := fmt.Sprintf("✅ Задача завершена!\n\n📝 %s", task.Title)
	h.sendMessageWithKeyboard(ctx, userID, response, h.buildMainMenuKeyboard())
}

func (h *UniFlowUpdateHandler) handleViewTask(ctx context.Context, userID int64, callbackID, taskID, userIDStr string) {
	// Получаем задачу
	task, err := h.usecase.GetTaskByID(ctx, taskID)
	if err != nil {
		h.logger.Error("failed to get task", "error", err)
		h.answerCallback(ctx, callbackID, "❌ Задача не найдена")
		return
	}

	// Проверяем права доступа
	if task.UserID.String() != userIDStr {
		h.answerCallback(ctx, callbackID, "❌ Нет доступа к этой задаче")
		return
	}

	h.answerCallback(ctx, callbackID, "")

	// Формируем детали задачи
	status := "⭕ В работе"
	if task.Status == "completed" {
		status = "✅ Завершена"
	}

	response := fmt.Sprintf("📝 *%s*\n\n", task.Title)
	response += fmt.Sprintf("Статус: %s\n", status)

	if task.Description != "" {
		response += fmt.Sprintf("\n📄 Описание:\n%s\n", task.Description)
	}

	if task.DueAt != nil {
		response += fmt.Sprintf("\n⏰ Срок: %s\n", task.DueAt.Format("02.01.2006 15:04"))
	}

	if task.ContextID != nil {
		contextIDStr := task.ContextID.String()
		context, err := h.usecase.GetContextByID(ctx, contextIDStr)
		if err == nil {
			response += fmt.Sprintf("\n📂 Контекст: %s\n", context.Title)
		}
	}

	h.sendMessageWithKeyboard(ctx, userID, response, h.buildTaskDetailKeyboard(&task))
}

func (h *UniFlowUpdateHandler) handleEditTask(ctx context.Context, userID int64, callbackID, taskID string) {
	h.answerCallback(ctx, callbackID, "✏️ Редактирование задачи")

	// Устанавливаем состояние редактирования
	h.userStates[userID] = &UserState{
		State: "editing_task",
		Data: map[string]interface{}{
			"task_id": taskID,
			"step":    1,
		},
	}

	h.sendMessage(ctx, userID, "✏️ Редактирование задачи\n\nШаг 1/3: Введи новое название\n\nИли /cancel для отмены")
}

func (h *UniFlowUpdateHandler) handleDeleteTask(ctx context.Context, userID int64, callbackID, taskID, userIDStr string) {
	// Получаем задачу для проверки прав
	task, err := h.usecase.GetTaskByID(ctx, taskID)
	if err != nil {
		h.logger.Error("failed to get task", "error", err)
		h.answerCallback(ctx, callbackID, "❌ Задача не найдена")
		return
	}

	if task.UserID.String() != userIDStr {
		h.answerCallback(ctx, callbackID, "❌ Нет доступа к этой задаче")
		return
	}

	h.answerCallback(ctx, callbackID, "")

	// Запрашиваем подтверждение
	response := fmt.Sprintf("⚠️ Удалить задачу?\n\n📝 %s\n\nЭто действие нельзя отменить!", task.Title)
	h.sendMessageWithKeyboard(ctx, userID, response, h.buildConfirmKeyboard("task", taskID))
}

func (h *UniFlowUpdateHandler) handleReopenTask(ctx context.Context, userID int64, callbackID, taskID, userIDStr string) {
	// Получаем задачу
	task, err := h.usecase.GetTaskByID(ctx, taskID)
	if err != nil {
		h.logger.Error("failed to get task", "error", err)
		h.answerCallback(ctx, callbackID, "❌ Задача не найдена")
		return
	}

	if task.UserID.String() != userIDStr {
		h.answerCallback(ctx, callbackID, "❌ Нет доступа к этой задаче")
		return
	}

	// Обновляем статус
	todoStatus := models.TaskStatusTodo
	if err := h.usecase.UpdateTaskStatus(ctx, taskID, todoStatus); err != nil {
		h.logger.Error("failed to update task", "error", err)
		h.answerCallback(ctx, callbackID, "❌ Ошибка при обновлении задачи")
		return
	}

	h.answerCallback(ctx, callbackID, "↩️ Задача возобновлена!")

	response := fmt.Sprintf("↩️ Задача возобновлена!\n\n📝 %s", task.Title)
	h.sendMessageWithKeyboard(ctx, userID, response, h.buildMainMenuKeyboard())
}

// ============== Действия с контекстами ==============

func (h *UniFlowUpdateHandler) handleViewContext(ctx context.Context, userID int64, callbackID, contextID, userIDStr string) {
	// Получаем контекст
	context, err := h.usecase.GetContextByID(ctx, contextID)
	if err != nil {
		h.logger.Error("failed to get context", "error", err)
		h.answerCallback(ctx, callbackID, "❌ Контекст не найден")
		return
	}

	if context.UserID.String() != userIDStr {
		h.answerCallback(ctx, callbackID, "❌ Нет доступа к этому контексту")
		return
	}

	h.answerCallback(ctx, callbackID, "")

	response := fmt.Sprintf("📂 *%s*\n\n", context.Title)

	if context.Description != "" {
		response += fmt.Sprintf("📄 %s\n\n", context.Description)
	}

	// Получаем все задачи пользователя и фильтруем по контексту
	allTasks, err := h.usecase.GetTasksByUserID(ctx, userIDStr)
	if err == nil {
		var tasks []models.Task
		for _, task := range allTasks {
			if task.ContextID != nil && task.ContextID.String() == contextID {
				tasks = append(tasks, task)
			}
		}
		active := 0
		completed := 0
		for _, task := range tasks {
			if task.Status == models.TaskStatusCompleted {
				completed++
			} else {
				active++
			}
		}
		response += fmt.Sprintf("📊 Задач: %d (активных: %d, завершено: %d)", len(tasks), active, completed)
	}

	h.sendMessageWithKeyboard(ctx, userID, response, h.buildContextDetailKeyboard(&context))
}

func (h *UniFlowUpdateHandler) handleContextTasks(ctx context.Context, userID int64, callbackID, contextID, userIDStr string) {
	// Получаем контекст
	context, err := h.usecase.GetContextByID(ctx, contextID)
	if err != nil {
		h.logger.Error("failed to get context", "error", err)
		h.answerCallback(ctx, callbackID, "❌ Контекст не найден")
		return
	}

	if context.UserID.String() != userIDStr {
		h.answerCallback(ctx, callbackID, "❌ Нет доступа к этому контексту")
		return
	}

	h.answerCallback(ctx, callbackID, "")

	// Получаем все задачи пользователя и фильтруем по контексту
	allTasks, err := h.usecase.GetTasksByUserID(ctx, userIDStr)
	if err != nil {
		h.logger.Error("failed to get tasks", "error", err)
		h.sendMessage(ctx, userID, "❌ Ошибка при получении задач")
		return
	}

	// Фильтруем задачи по контексту
	var tasks []models.Task
	for _, task := range allTasks {
		if task.ContextID != nil && task.ContextID.String() == contextID {
			tasks = append(tasks, task)
		}
	}

	if len(tasks) == 0 {
		response := fmt.Sprintf("📂 Контекст: %s\n\n📝 В этом контексте пока нет задач", context.Title)
		h.sendMessageWithKeyboard(ctx, userID, response, h.buildMainMenuKeyboard())
		return
	}

	response := fmt.Sprintf("📂 Контекст: %s\n\n📋 Задачи (%d):\n\n", context.Title, len(tasks))

	for i, task := range tasks[:min(10, len(tasks))] {
		status := "⭕"
		if task.Status == models.TaskStatusCompleted {
			status = "✅"
		}
		response += fmt.Sprintf("%d. %s %s\n", i+1, status, task.Title)
	}

	if len(tasks) > 10 {
		response += fmt.Sprintf("\n...и ещё %d", len(tasks)-10)
	}

	h.sendMessageWithKeyboard(ctx, userID, response, h.buildTaskListKeyboard(tasks[:min(5, len(tasks))]))
}

func (h *UniFlowUpdateHandler) handleEditContext(ctx context.Context, userID int64, callbackID, contextID string) {
	h.answerCallback(ctx, callbackID, "✏️ Редактирование контекста")
	h.sendMessage(ctx, userID, "✏️ Функция редактирования контекста будет добавлена позже")
	h.handleContextsCommand(ctx, userID)
}

func (h *UniFlowUpdateHandler) handleDeleteContext(ctx context.Context, userID int64, callbackID, contextID, userIDStr string) {
	// Получаем контекст для проверки прав
	context, err := h.usecase.GetContextByID(ctx, contextID)
	if err != nil {
		h.logger.Error("failed to get context", "error", err)
		h.answerCallback(ctx, callbackID, "❌ Контекст не найден")
		return
	}

	if context.UserID.String() != userIDStr {
		h.answerCallback(ctx, callbackID, "❌ Нет доступа к этому контексту")
		return
	}

	h.answerCallback(ctx, callbackID, "")

	// Запрашиваем подтверждение
	response := fmt.Sprintf("⚠️ Удалить контекст?\n\n📂 %s\n\n⚠️ Все задачи контекста останутся, но потеряют связь с ним!", context.Title)
	h.sendMessageWithKeyboard(ctx, userID, response, h.buildConfirmKeyboard("context", contextID))
}

// ============== Подтверждение действий ==============

func (h *UniFlowUpdateHandler) handleDateCallback(ctx context.Context, userID int64, callbackID string, parts []string) {
	if len(parts) < 2 {
		return
	}

	h.answerCallback(ctx, callbackID, "")

	// Проверяем, что пользователь в состоянии создания задачи
	state, exists := h.userStates[userID]
	if !exists || state.State != "creating_task" {
		h.sendMessage(ctx, userID, "❌ Ошибка: не найден процесс создания задачи")
		return
	}

	days := parts[1]

	if days == "skip" {
		// Пропускаем установку даты
		state.Data["due_at"] = nil
	} else {
		// Парсим количество дней
		daysInt, err := strconv.Atoi(days)
		if err != nil {
			h.sendMessage(ctx, userID, "❌ Неверный формат даты")
			return
		}

		// Вычисляем дату
		dueDate := time.Now().AddDate(0, 0, daysInt)
		dueDateStr := dueDate.Format("2006-01-02T15:04:05Z07:00")
		state.Data["due_at"] = dueDateStr
	}

	// Переводим в шаг 4 для создания задачи
	state.Data["step"] = 4

	// Вызываем обработчик с пустым текстом для создания задачи
	h.handleCreatingTaskState(ctx, userID, "", state)
}

func (h *UniFlowUpdateHandler) handleConfirmAction(ctx context.Context, userID int64, callbackID, itemType, itemID string) {
	// Получаем пользователя
	maxUserID := fmt.Sprintf("%d", userID)
	user, err := h.usecase.GetOrCreateUserByMaxID(ctx, maxUserID)
	if err != nil {
		h.logger.Error("failed to get user", "error", err)
		h.answerCallback(ctx, callbackID, "❌ Ошибка")
		return
	}

	switch itemType {
	case "task":
		// Удаляем задачу
		task, err := h.usecase.GetTaskByID(ctx, itemID)
		if err != nil || task.UserID.String() != user.ID.String() {
			h.answerCallback(ctx, callbackID, "❌ Задача не найдена")
			return
		}

		if err := h.usecase.DeleteTask(ctx, itemID); err != nil {
			h.logger.Error("failed to delete task", "error", err)
			h.answerCallback(ctx, callbackID, "❌ Ошибка при удалении")
			return
		}

		h.answerCallback(ctx, callbackID, "✅ Задача удалена")
		h.sendMessage(ctx, userID, "🗑 Задача удалена")
		h.handleTasksCommand(ctx, userID)

	case "context":
		// Удаляем контекст
		context, err := h.usecase.GetContextByID(ctx, itemID)
		if err != nil || context.UserID.String() != user.ID.String() {
			h.answerCallback(ctx, callbackID, "❌ Контекст не найден")
			return
		}

		if err := h.usecase.DeleteContext(ctx, itemID); err != nil {
			h.logger.Error("failed to delete context", "error", err)
			h.answerCallback(ctx, callbackID, "❌ Ошибка при удалении")
			return
		}

		h.answerCallback(ctx, callbackID, "✅ Контекст удален")
		h.sendMessage(ctx, userID, "🗑 Контекст удален")
		h.handleContextsCommand(ctx, userID)
	}
}
