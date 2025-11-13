package max

import (
	"context"
	"fmt"
	"strings"

	"github.com/max-messenger/max-bot-api-client-go/schemes"

	"github.com/singl3focus/uniflow/internal/core/usecase"
	"github.com/singl3focus/uniflow/pkg/logger"
)

// UniFlowUpdateHandler обработчик команд бота UniFlow
type UniFlowUpdateHandler struct {
	client  *Client
	usecase *usecase.Usecase
	logger  logger.Logger
}

// NewUniFlowUpdateHandler создает обработчик команд UniFlow
func NewUniFlowUpdateHandler(client *Client, uc *usecase.Usecase, log logger.Logger) *UniFlowUpdateHandler {
	return &UniFlowUpdateHandler{
		client:  client,
		usecase: uc,
		logger:  log,
	}
}

// HandleUpdate обрабатывает обновления от MAX бота
func (h *UniFlowUpdateHandler) HandleUpdate(update schemes.UpdateInterface) {
	ctx := context.Background()

	switch upd := update.(type) {
	case *schemes.MessageCreatedUpdate:
		h.handleMessage(ctx, upd)
	case *schemes.BotStartedUpdate:
		h.handleBotStarted(ctx, upd)
	case *schemes.MessageCallbackUpdate:
		h.handleCallback(ctx, upd)
	default:
		h.logger.Debug("received unknown update type", "type", fmt.Sprintf("%T", update))
	}
}

// handleMessage обрабатывает входящие текстовые сообщения
func (h *UniFlowUpdateHandler) handleMessage(ctx context.Context, upd *schemes.MessageCreatedUpdate) {
	userID := upd.Message.Sender.UserId
	text := strings.TrimSpace(upd.Message.Body.Text)

	h.logger.Info("received message from user", "user_id", userID, "text", text)

	// Обработка команд
	if strings.HasPrefix(text, "/") {
		h.handleCommand(ctx, userID, text)
		return
	}

	// Обычное сообщение - предлагаем использовать Mini-App
	response := "👋 Привет! Я UniFlow — твой ассистент продуктивности.\n\n" +
		"Для работы с задачами и контекстами используй мини-приложение.\n" +
		"Доступные команды:\n" +
		"/today — задачи на сегодня\n" +
		"/tasks — все задачи\n" +
		"/help — помощь"

	if err := h.client.SendMessage(ctx, userID, response); err != nil {
		h.logger.Error("failed to send message", "error", err, "user_id", userID)
	}
}

// handleCommand обрабатывает команды бота
func (h *UniFlowUpdateHandler) handleCommand(ctx context.Context, userID int64, command string) {
	parts := strings.Fields(command)
	if len(parts) == 0 {
		return
	}

	cmd := strings.ToLower(parts[0])

	switch cmd {
	case "/start":
		h.handleStartCommand(ctx, userID)
	case "/today":
		h.handleTodayCommand(ctx, userID)
	case "/tasks":
		h.handleTasksCommand(ctx, userID)
	case "/help":
		h.handleHelpCommand(ctx, userID)
	default:
		h.sendMessage(ctx, userID, "❓ Неизвестная команда. Используй /help для списка команд.")
	}
}

// handleBotStarted обрабатывает событие запуска бота
func (h *UniFlowUpdateHandler) handleBotStarted(ctx context.Context, upd *schemes.BotStartedUpdate) {
	userID := upd.User.UserId
	h.logger.Info("bot started by user", "user_id", userID)

	// Приветственное сообщение
	response := "🎯 Добро пожаловать в UniFlow!\n\n" +
		"Я помогу тебе организовать учебу и задачи.\n\n" +
		"🔹 Открой мини-приложение для полного функционала\n" +
		"🔹 Используй команды для быстрого доступа:\n\n" +
		"/today — задачи на сегодня\n" +
		"/tasks — все твои задачи\n" +
		"/help — справка по командам"

	if err := h.client.SendMessage(ctx, userID, response); err != nil {
		h.logger.Error("failed to send welcome message", "error", err, "user_id", userID)
	}
}

// handleCallback обрабатывает callback от интерактивных кнопок
func (h *UniFlowUpdateHandler) handleCallback(ctx context.Context, upd *schemes.MessageCallbackUpdate) {
	userID := upd.Callback.User.UserId
	payload := upd.Callback.Payload

	h.logger.Info("received callback", "user_id", userID, "payload", payload)

	// Здесь можно добавить обработку интерактивных кнопок
	// Например: "task_complete_<id>", "task_postpone_<id>" и т.д.
}

// Команды

func (h *UniFlowUpdateHandler) handleStartCommand(ctx context.Context, userID int64) {
	response := "🎯 UniFlow — твой личный ассистент продуктивности!\n\n" +
		"Я помогу тебе:\n" +
		"✅ Организовать задачи по контекстам (учеба, проекты, личное)\n" +
		"📅 Следить за дедлайнами\n" +
		"🔔 Получать напоминания\n" +
		"📊 Отслеживать прогресс\n\n" +
		"Открой мини-приложение для начала работы!"

	h.sendMessage(ctx, userID, response)
}

func (h *UniFlowUpdateHandler) handleTodayCommand(ctx context.Context, userID int64) {
	// Получаем или создаем пользователя по MAX ID
	maxUserID := fmt.Sprintf("%d", userID)
	user, err := h.usecase.GetOrCreateUserByMaxID(ctx, maxUserID)
	if err != nil {
		h.logger.Error("failed to get user", "error", err, "max_user_id", maxUserID)
		h.sendMessage(ctx, userID, "❌ Ошибка при получении данных пользователя.")
		return
	}

	// Получаем задачи на сегодня
	tasks, err := h.usecase.GetTasksDueToday(ctx, user.ID.String())
	if err != nil {
		h.logger.Error("failed to get today tasks", "error", err, "user_id", user.ID)
		h.sendMessage(ctx, userID, "❌ Ошибка при получении задач.")
		return
	}

	// Формируем ответ
	if len(tasks) == 0 {
		response := "✅ На сегодня задач нет!\n\n" +
			"Отличная возможность запланировать что-то новое в мини-приложении."
		h.sendMessage(ctx, userID, response)
		return
	}

	response := fmt.Sprintf("📋 Задачи на сегодня (%d):\n\n", len(tasks))

	for i, task := range tasks {
		status := "⭕"
		if task.Status == "completed" {
			status = "✅"
		}

		timeStr := ""
		if task.DueAt != nil {
			timeStr = fmt.Sprintf(" ⏰ %s", task.DueAt.Format("15:04"))
		}

		response += fmt.Sprintf("%d. %s %s%s\n", i+1, status, task.Title, timeStr)
	}

	response += "\nОткрой мини-приложение для управления задачами!"
	h.sendMessage(ctx, userID, response)
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
		response := "📝 У тебя пока нет задач!\n\n" +
			"Создай первую задачу в мини-приложении."
		h.sendMessage(ctx, userID, response)
		return
	}

	// Группируем задачи по статусу
	var active, completed []string
	for _, task := range tasks {
		taskStr := fmt.Sprintf("• %s", task.Title)
		if task.DueAt != nil {
			taskStr += fmt.Sprintf(" (до %s)", task.DueAt.Format("02.01"))
		}

		if task.Status == "completed" {
			completed = append(completed, taskStr)
		} else {
			active = append(active, taskStr)
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
			response += task + "\n"
		}
		response += "\n"
	}

	if len(completed) > 0 {
		response += fmt.Sprintf("✅ Завершено: %d\n", len(completed))
	}

	response += "\nОткрой мини-приложение для полного списка!"
	h.sendMessage(ctx, userID, response)
}

func (h *UniFlowUpdateHandler) handleHelpCommand(ctx context.Context, userID int64) {
	response := "📖 Справка по командам:\n\n" +
		"/start — о боте\n" +
		"/today — задачи на сегодня\n" +
		"/tasks — все задачи\n" +
		"/help — эта справка\n\n" +
		"💡 Для полного функционала используй мини-приложение!"

	h.sendMessage(ctx, userID, response)
}

// Вспомогательные методы

func (h *UniFlowUpdateHandler) sendMessage(ctx context.Context, userID int64, text string) {
	if err := h.client.SendMessage(ctx, userID, text); err != nil {
		h.logger.Error("failed to send message", "error", err, "user_id", userID)
	}
}
