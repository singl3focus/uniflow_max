package max

import (
	"context"
	"fmt"
	"strings"
	"time"

	maxbot "github.com/max-messenger/max-bot-api-client-go"
	"github.com/max-messenger/max-bot-api-client-go/schemes"

	"github.com/singl3focus/uniflow/internal/core/models"
)

// ============== Команды ==============

func (h *UniFlowUpdateHandler) handleStartCommand(ctx context.Context, userID int64) {
	response := "🎯 Добро пожаловать в UniFlow!\n\n" +
		"Я помогу тебе организовать учебу и задачи.\n\n" +
		"Доступные функции:\n" +
		"✅ Управление задачами по контекстам\n" +
		"📅 Отслеживание дедлайнов\n" +
		"🔔 Напоминания\n" +
		"📊 Прогресс выполнения\n\n" +
		"Используй кнопки ниже для навигации!"

	h.sendMessageWithKeyboard(ctx, userID, response, h.buildMainMenuKeyboard())
}

func (h *UniFlowUpdateHandler) showMainMenu(ctx context.Context, userID int64) {
	response := "📱 Главное меню\n\nВыбери нужный раздел:"
	h.sendMessageWithKeyboard(ctx, userID, response, h.buildMainMenuKeyboard())
}

func (h *UniFlowUpdateHandler) handleTodayCommand(ctx context.Context, userID int64) {
	h.handleScheduleCommand(ctx, userID, 0)
}

func (h *UniFlowUpdateHandler) handleScheduleCommand(ctx context.Context, userID int64, dayOffset int) {
	// Получаем или создаем пользователя по MAX ID
	maxUserID := fmt.Sprintf("%d", userID)
	user, err := h.usecase.GetOrCreateUserByMaxID(ctx, maxUserID)
	if err != nil {
		h.logger.Error("failed to get user", "error", err, "max_user_id", maxUserID)
		h.sendMessage(ctx, userID, "❌ Ошибка при получении данных пользователя.")
		return
	}

	// Вычисляем целевую дату
	targetDate := time.Now().AddDate(0, 0, dayOffset)
	dateStr := targetDate.Format("02.01.2006")

	// Получаем все задачи пользователя
	allTasks, err := h.usecase.GetTasksByUserID(ctx, user.ID.String())
	if err != nil {
		h.logger.Error("failed to get tasks", "error", err, "user_id", user.ID)
		h.sendMessage(ctx, userID, "❌ Ошибка при получении задач.")
		return
	}

	// Фильтруем задачи по дате
	var tasks []models.Task
	for _, task := range allTasks {
		if task.DueAt != nil && task.DueAt.Format("02.01.2006") == dateStr {
			tasks = append(tasks, task)
		}
	}

	if len(tasks) == 0 {
		dayLabel := "Сегодня"
		if dayOffset > 0 {
			dayLabel = targetDate.Format("02.01")
		} else if dayOffset < 0 {
			dayLabel = targetDate.Format("02.01")
		}
		response := fmt.Sprintf("📅 %s задач нет!\n\nОтличный день для отдыха 😊", dayLabel)
		h.sendMessageWithKeyboard(ctx, userID, response, h.buildScheduleKeyboard(dayOffset))
		return
	}

	// Группируем задачи по статусу
	var active, completed []models.Task
	for _, task := range tasks {
		if task.Status == "completed" {
			completed = append(completed, task)
		} else {
			active = append(active, task)
		}
	}

	dayLabel := "Сегодня"
	if dayOffset != 0 {
		dayLabel = targetDate.Format("02.01")
	}

	response := fmt.Sprintf("📅 Задачи на %s:\n\n", dayLabel)

	if len(active) > 0 {
		response += fmt.Sprintf("⭕ Активные (%d):\n", len(active))
		for _, task := range active {
			response += fmt.Sprintf("• %s\n", task.Title)
		}
		response += "\n"
	}

	if len(completed) > 0 {
		response += fmt.Sprintf("✅ Завершенные (%d):\n", len(completed))
		for _, task := range completed {
			response += fmt.Sprintf("• %s\n", task.Title)
		}
	}

	h.sendMessageWithKeyboard(ctx, userID, response, h.buildScheduleKeyboard(dayOffset))
}

func (h *UniFlowUpdateHandler) handleInboxCommand(ctx context.Context, userID int64) {
	// Получаем или создаем пользователя по MAX ID
	maxUserID := fmt.Sprintf("%d", userID)
	user, err := h.usecase.GetOrCreateUserByMaxID(ctx, maxUserID)
	if err != nil {
		h.logger.Error("failed to get user", "error", err, "max_user_id", maxUserID)
		h.sendMessage(ctx, userID, "❌ Ошибка при получении данных пользователя.")
		return
	}

	// Получаем все задачи пользователя
	allTasks, err := h.usecase.GetTasksByUserID(ctx, user.ID.String())
	if err != nil {
		h.logger.Error("failed to get tasks", "error", err, "user_id", user.ID)
		h.sendMessage(ctx, userID, "❌ Ошибка при получении задач.")
		return
	}

	// Фильтруем задачи без контекста
	var inboxTasks []models.Task
	for _, task := range allTasks {
		if task.ContextID == nil {
			inboxTasks = append(inboxTasks, task)
		}
	}

	if len(inboxTasks) == 0 {
		response := "📥 Входящие пусты!\n\nВсе задачи распределены по контекстам 👍"
		h.sendMessageWithKeyboard(ctx, userID, response, h.buildMainMenuKeyboard())
		return
	}

	// Группируем задачи по статусу
	var active, completed []models.Task
	for _, task := range inboxTasks {
		if task.Status == "completed" {
			completed = append(completed, task)
		} else {
			active = append(active, task)
		}
	}

	response := fmt.Sprintf("📥 Входящие (%d):\n\n", len(inboxTasks))

	if len(active) > 0 {
		response += fmt.Sprintf("⭕ Активные (%d):\n", len(active))
		for i, task := range active {
			if i >= 10 {
				response += fmt.Sprintf("...и ещё %d\n", len(active)-10)
				break
			}
			dueStr := ""
			if task.DueAt != nil {
				dueStr = fmt.Sprintf(" (до %s)", task.DueAt.Format("02.01"))
			}
			response += fmt.Sprintf("%d. %s%s\n", i+1, task.Title, dueStr)
		}
		response += "\n"
	}

	if len(completed) > 0 {
		response += fmt.Sprintf("✅ Завершенные (%d)\n", len(completed))
	}

	response += "\n💡 Нажми на кнопку, чтобы завершить задачу"

	h.sendMessageWithKeyboard(ctx, userID, response, h.buildInboxKeyboard(active))
}

func (h *UniFlowUpdateHandler) handleTasksCommand(ctx context.Context, userID int64) {
	// Получаем или создаем пользователя по MAX ID
	maxUserID := fmt.Sprintf("%d", userID)
	user, err := h.usecase.GetOrCreateUserByMaxID(ctx, maxUserID)
	if err != nil {
		h.logger.Error("failed to get user", "error", err, "max_user_id", maxUserID)
		h.sendMessage(ctx, userID, "❌ Ошибка при получении данных пользователя.")
		return
	}

	// Получаем все задачи
	tasks, err := h.usecase.GetTasksByUserID(ctx, user.ID.String())
	if err != nil {
		h.logger.Error("failed to get tasks", "error", err, "user_id", user.ID)
		h.sendMessage(ctx, userID, "❌ Ошибка при получении задач.")
		return
	}

	// Формируем ответ
	if len(tasks) == 0 {
		response := "📝 У тебя пока нет задач!\n\nСоздай первую задачу с помощью /newtask"
		h.sendMessageWithKeyboard(ctx, userID, response, h.buildMainMenuKeyboard())
		return
	}

	// Группируем задачи по статусу
	var active, completed []models.Task
	for _, task := range tasks {
		if task.Status == "completed" {
			completed = append(completed, task)
		} else {
			active = append(active, task)
		}
	}

	response := fmt.Sprintf("📝 Всего задач: %d\n\n", len(tasks))

	if len(active) > 0 {
		response += fmt.Sprintf("⭕ Активные (%d):\n", len(active))
		// Показываем максимум 5 активных
		for i, task := range active {
			if i >= 5 {
				response += fmt.Sprintf("...и ещё %d\n", len(active)-5)
				break
			}
			dueStr := ""
			if task.DueAt != nil {
				dueStr = fmt.Sprintf(" (до %s)", task.DueAt.Format("02.01"))
			}
			response += fmt.Sprintf("• %s%s\n", task.Title, dueStr)
		}
		response += "\n"
	}

	if len(completed) > 0 {
		response += fmt.Sprintf("✅ Завершено: %d\n", len(completed))
	}

	// Показываем кнопки для первых 5 активных задач
	displayTasks := active[:min(5, len(active))]
	h.sendMessageWithKeyboard(ctx, userID, response, h.buildTaskListKeyboard(displayTasks))
}

func (h *UniFlowUpdateHandler) handleNewTaskCommand(ctx context.Context, userID int64) {
	// Устанавливаем состояние создания задачи
	h.userStates[userID] = &UserState{
		State:      "creating_task",
		Data:       make(map[string]interface{}),
		LastUpdate: time.Now(),
	}

	response := "📝 Создание новой задачи\n\n" +
		"Шаг 1/3: Введи название задачи\n\n" +
		"Или /cancel для отмены"

	h.sendMessage(ctx, userID, response)
}

func (h *UniFlowUpdateHandler) handleContextsCommand(ctx context.Context, userID int64) {
	// Получаем или создаем пользователя по MAX ID
	maxUserID := fmt.Sprintf("%d", userID)
	user, err := h.usecase.GetOrCreateUserByMaxID(ctx, maxUserID)
	if err != nil {
		h.logger.Error("failed to get user", "error", err, "max_user_id", maxUserID)
		h.sendMessage(ctx, userID, "❌ Ошибка при получении данных пользователя.")
		return
	}

	// Получаем все контексты
	contexts, err := h.usecase.GetContextsByUserID(ctx, user.ID.String())
	if err != nil {
		h.logger.Error("failed to get contexts", "error", err, "user_id", user.ID)
		h.sendMessage(ctx, userID, "❌ Ошибка при получении контекстов.")
		return
	}

	if len(contexts) == 0 {
		response := "📁 У тебя пока нет контекстов!\n\nСоздай первый контекст с помощью /newcontext"
		h.sendMessageWithKeyboard(ctx, userID, response, h.buildMainMenuKeyboard())
		return
	}

	response := fmt.Sprintf("📁 Твои контексты (%d):\n\n", len(contexts))

	for i, context := range contexts {
		response += fmt.Sprintf("%d. 📂 %s\n", i+1, context.Title)
		if context.Description != "" {
			response += fmt.Sprintf("   %s\n", context.Description)
		}
	}

	h.sendMessageWithKeyboard(ctx, userID, response, h.buildContextListKeyboard(contexts[:min(5, len(contexts))]))
}

func (h *UniFlowUpdateHandler) handleNewContextCommand(ctx context.Context, userID int64) {
	// Устанавливаем состояние создания контекста
	h.userStates[userID] = &UserState{
		State:      "creating_context",
		Data:       make(map[string]interface{}),
		LastUpdate: time.Now(),
	}

	response := "📁 Создание нового контекста\n\n" +
		"Шаг 1/2: Введи название контекста\n\n" +
		"Например: Учеба, Работа, Проекты\n\n" +
		"Или /cancel для отмены"

	h.sendMessage(ctx, userID, response)
}

func (h *UniFlowUpdateHandler) handleSearchCommand(ctx context.Context, userID int64, parts []string) {
	if len(parts) < 2 {
		h.sendMessage(ctx, userID, "🔍 Использование: /search <запрос>\n\nНапример: /search математика")
		return
	}

	query := strings.Join(parts[1:], " ")

	// Получаем или создаем пользователя по MAX ID
	maxUserID := fmt.Sprintf("%d", userID)
	user, err := h.usecase.GetOrCreateUserByMaxID(ctx, maxUserID)
	if err != nil {
		h.logger.Error("failed to get user", "error", err, "max_user_id", maxUserID)
		h.sendMessage(ctx, userID, "❌ Ошибка при получении данных пользователя.")
		return
	}

	// Поиск
	results, err := h.usecase.Search(ctx, user.ID.String(), query)
	if err != nil {
		h.logger.Error("failed to search", "error", err, "user_id", user.ID)
		h.sendMessage(ctx, userID, "❌ Ошибка при поиске.")
		return
	}

	// Извлекаем задачи и контексты из результатов
	var tasks []models.Task
	var contexts []models.Context

	if tasksData, ok := results["tasks"].([]models.Task); ok {
		tasks = tasksData
	}

	if contextsData, ok := results["contexts"].([]models.Context); ok {
		contexts = contextsData
	}

	if len(tasks) == 0 && len(contexts) == 0 {
		h.sendMessage(ctx, userID, fmt.Sprintf("🔍 По запросу '%s' ничего не найдено", query))
		return
	}

	response := fmt.Sprintf("🔍 Результаты поиска: '%s'\n\n", query)

	// Показываем контексты
	if len(contexts) > 0 {
		response += fmt.Sprintf("📁 Контексты (%d):\n", len(contexts))
		for i, context := range contexts[:min(5, len(contexts))] {
			response += fmt.Sprintf("%d. 📂 %s\n", i+1, context.Title)
		}
		if len(contexts) > 5 {
			response += fmt.Sprintf("...и ещё %d\n", len(contexts)-5)
		}
		response += "\n"
	}

	// Показываем задачи
	if len(tasks) > 0 {
		response += fmt.Sprintf("📝 Задачи (%d):\n", len(tasks))
		for i, task := range tasks[:min(10, len(tasks))] {
			status := "⭕"
			if task.Status == "completed" {
				status = "✅"
			}
			response += fmt.Sprintf("%d. %s %s\n", i+1, status, task.Title)
		}
		if len(tasks) > 10 {
			response += fmt.Sprintf("...и ещё %d\n", len(tasks)-10)
		}
	}

	h.sendMessageWithKeyboard(ctx, userID, response, h.buildMainMenuKeyboard())
}

func (h *UniFlowUpdateHandler) handleHelpCommand(ctx context.Context, userID int64) {
	response := "📖 Справка по командам:\n\n" +
		"🏠 Основное:\n" +
		"/start — приветствие и меню\n" +
		"/menu — главное меню\n" +
		"/help — эта справка\n\n" +
		"✅ Задачи:\n" +
		"/today — задачи на сегодня\n" +
		"/tasks — все задачи\n" +
		"/newtask — создать задачу\n" +
		"/search <запрос> — поиск задач\n\n" +
		"📁 Контексты:\n" +
		"/contexts — все контексты\n" +
		"/newcontext — создать контекст\n\n" +
		"⚙️ Другое:\n" +
		"/cancel — отменить текущее действие"

	h.sendMessageWithKeyboard(ctx, userID, response, h.buildMainMenuKeyboard())
}

// ============== Обработка состояний ==============

func (h *UniFlowUpdateHandler) handleStateMessage(ctx context.Context, userID int64, text string, state *UserState) {
	switch state.State {
	case "creating_task":
		h.handleCreatingTaskState(ctx, userID, text, state)
	case "creating_context":
		h.handleCreatingContextState(ctx, userID, text, state)
	case "editing_task":
		h.handleEditingTaskState(ctx, userID, text, state)
	case "searching":
		// Выполняем поиск по введенному запросу
		delete(h.userStates, userID)
		h.handleSearchCommand(ctx, userID, []string{"search", text})
	default:
		delete(h.userStates, userID)
		h.showMainMenu(ctx, userID)
	}
}

func (h *UniFlowUpdateHandler) handleCreatingTaskState(ctx context.Context, userID int64, text string, state *UserState) {
	// Получаем пользователя
	maxUserID := fmt.Sprintf("%d", userID)
	user, err := h.usecase.GetOrCreateUserByMaxID(ctx, maxUserID)
	if err != nil {
		h.logger.Error("failed to get user", "error", err, "max_user_id", maxUserID)
		h.sendMessage(ctx, userID, "❌ Ошибка при получении данных пользователя.")
		delete(h.userStates, userID)
		return
	}

	step := state.Data["step"]
	if step == nil {
		step = 1
	}

	switch step.(int) {
	case 1:
		// Сохраняем название
		state.Data["title"] = text
		state.Data["step"] = 2
		state.LastUpdate = time.Now()

		response := "📝 Создание новой задачи\n\n" +
			fmt.Sprintf("Название: %s ✓\n\n", text) +
			"Шаг 2/3: Введи описание задачи\n\n" +
			"Или напиши '-' чтобы пропустить"

		h.sendMessage(ctx, userID, response)

	case 2:
		// Сохраняем описание
		if text != "-" {
			state.Data["description"] = text
		}
		state.Data["step"] = 3
		state.LastUpdate = time.Now()

		// Получаем контексты для выбора
		contexts, err := h.usecase.GetContextsByUserID(ctx, user.ID.String())
		if err != nil {
			h.logger.Error("failed to get contexts", "error", err)
		}

		response := "📝 Создание новой задачи\n\n" +
			fmt.Sprintf("Название: %s ✓\n", state.Data["title"]) +
			"Описание: ✓\n\n" +
			"Шаг 3/4: Выбери контекст или введи '-' чтобы пропустить\n\n"

		if len(contexts) > 0 {
			response += "Доступные контексты:\n"
			for i, ctx := range contexts {
				response += fmt.Sprintf("%d. 📂 %s\n", i+1, ctx.Title)
			}
			response += "\nВведи номер контекста или '-'"
		}

		state.Data["contexts"] = contexts
		h.sendMessage(ctx, userID, response)

	case 3:
		// Обрабатываем выбор контекста
		var contextID *string
		if text != "-" {
			// Пытаемся распарсить номер контекста
			var contextIdx int
			if _, err := fmt.Sscanf(text, "%d", &contextIdx); err == nil {
				contexts := state.Data["contexts"].([]models.Context)
				if contextIdx > 0 && contextIdx <= len(contexts) {
					ctxID := contexts[contextIdx-1].ID.String()
					contextID = &ctxID
				}
			}
		}

		state.Data["context_id"] = contextID
		state.Data["step"] = 4
		state.LastUpdate = time.Now()

		response := "📝 Создание новой задачи\n\n" +
			fmt.Sprintf("Название: %s ✓\n", state.Data["title"]) +
			"Описание: ✓\n" +
			"Контекст: ✓\n\n" +
			"Шаг 4/4: Выбери дедлайн"

		h.sendMessageWithKeyboard(ctx, userID, response, h.buildDateSelectionKeyboard())

	case 4:
		// Создаем задачу с выбранной датой
		title := state.Data["title"].(string)
		description := ""
		if desc, ok := state.Data["description"]; ok {
			description = desc.(string)
		}

		var contextID *string
		if ctxID, ok := state.Data["context_id"].(*string); ok {
			contextID = ctxID
		}

		var dueAt *string
		if dueDateStr, ok := state.Data["due_at"]; ok && dueDateStr != nil {
			dateStr := dueDateStr.(string)
			dueAt = &dateStr
		}

		// Создаем задачу
		createdTask, err := h.usecase.CreateTask(ctx, user.ID.String(), contextID, title, description, dueAt)
		if err != nil {
			h.logger.Error("failed to create task", "error", err)
			h.sendMessage(ctx, userID, "❌ Ошибка при создании задачи: "+err.Error())
			delete(h.userStates, userID)
			return
		}

		response := "✅ Задача создана!\n\n" +
			fmt.Sprintf("📝 %s\n", createdTask.Title)
		if createdTask.Description != "" {
			response += fmt.Sprintf("📄 %s\n", createdTask.Description)
		}
		if createdTask.DueAt != nil {
			response += fmt.Sprintf("⏰ До %s\n", createdTask.DueAt.Format("02.01.2006"))
		}

		delete(h.userStates, userID)
		h.sendMessageWithKeyboard(ctx, userID, response, h.buildMainMenuKeyboard())
	}
}

func (h *UniFlowUpdateHandler) handleCreatingContextState(ctx context.Context, userID int64, text string, state *UserState) {
	// Получаем пользователя
	maxUserID := fmt.Sprintf("%d", userID)
	user, err := h.usecase.GetOrCreateUserByMaxID(ctx, maxUserID)
	if err != nil {
		h.logger.Error("failed to get user", "error", err, "max_user_id", maxUserID)
		h.sendMessage(ctx, userID, "❌ Ошибка при получении данных пользователя.")
		delete(h.userStates, userID)
		return
	}

	step := state.Data["step"]
	if step == nil {
		step = 1
	}

	switch step.(int) {
	case 1:
		// Сохраняем название
		state.Data["name"] = text
		state.Data["step"] = 2
		state.LastUpdate = time.Now()

		response := "📁 Создание нового контекста\n\n" +
			fmt.Sprintf("Название: %s ✓\n\n", text) +
			"Шаг 2/2: Введи описание контекста\n\n" +
			"Или напиши '-' чтобы пропустить"

		h.sendMessage(ctx, userID, response)

	case 2:
		// Создаем контекст
		title := state.Data["name"].(string)
		description := ""
		if text != "-" {
			description = text
		}

		createdContext, err := h.usecase.CreateContext(ctx, user.ID.String(), models.ContextTypeOther, title, description, "#3B82F6", nil, nil)
		if err != nil {
			h.logger.Error("failed to create context", "error", err)
			h.sendMessage(ctx, userID, "❌ Ошибка при создании контекста: "+err.Error())
			delete(h.userStates, userID)
			return
		}

		response := "✅ Контекст создан!\n\n" +
			fmt.Sprintf("📁 %s\n", createdContext.Title)
		if createdContext.Description != "" {
			response += fmt.Sprintf("📄 %s\n", createdContext.Description)
		}

		delete(h.userStates, userID)
		h.sendMessageWithKeyboard(ctx, userID, response, h.buildMainMenuKeyboard())
	}
}

func (h *UniFlowUpdateHandler) handleEditingTaskState(ctx context.Context, userID int64, text string, state *UserState) {
	// TODO: Реализовать редактирование задачи
	delete(h.userStates, userID)
	h.showMainMenu(ctx, userID)
}

// ============== Вспомогательные функции ==============

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func (h *UniFlowUpdateHandler) sendMessage(ctx context.Context, userID int64, text string) {
	if err := h.client.SendMessage(ctx, userID, text); err != nil {
		h.logger.Error("failed to send message", "error", err, "user_id", userID)
	}
}

func (h *UniFlowUpdateHandler) sendMessageWithKeyboard(ctx context.Context, userID int64, text string, keyboard *maxbot.Keyboard) {
	api := h.client.GetAPI()
	msg := maxbot.NewMessage().
		SetUser(userID).
		SetText(text).
		AddKeyboard(keyboard)

	if _, err := api.Messages.Send(ctx, msg); err != nil {
		h.logger.Error("failed to send message with keyboard", "error", err, "user_id", userID)
	}
}

func (h *UniFlowUpdateHandler) answerCallback(ctx context.Context, callbackID string, notification string) {
	api := h.client.GetAPI()
	answer := &schemes.CallbackAnswer{
		Notification: notification,
	}
	if _, err := api.Messages.AnswerOnCallback(ctx, callbackID, answer); err != nil {
		h.logger.Error("failed to answer callback", "error", err)
	}
}
