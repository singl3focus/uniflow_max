package max

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/max-messenger/max-bot-api-client-go/schemes"

	"github.com/singl3focus/uniflow/internal/core/usecase"
	"github.com/singl3focus/uniflow/pkg/logger"
)

// UserState представляет состояние диалога пользователя
type UserState struct {
	State      string // "creating_task", "editing_task", "creating_context", etc.
	Data       map[string]interface{}
	LastUpdate time.Time
}

// UniFlowUpdateHandler обработчик команд бота UniFlow
type UniFlowUpdateHandler struct {
	client     *Client
	usecase    *usecase.Usecase
	logger     logger.Logger
	userStates map[int64]*UserState // Хранение состояний пользователей
}

// NewUniFlowUpdateHandler создает обработчик команд UniFlow
func NewUniFlowUpdateHandler(client *Client, uc *usecase.Usecase, log logger.Logger) *UniFlowUpdateHandler {
	return &UniFlowUpdateHandler{
		client:     client,
		usecase:    uc,
		logger:     log,
		userStates: make(map[int64]*UserState),
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

	// Проверяем состояние пользователя
	if state, exists := h.userStates[userID]; exists {
		h.handleStateMessage(ctx, userID, text, state)
		return
	}

	// Обычное сообщение - показываем главное меню
	h.showMainMenu(ctx, userID)
}

// handleCommand обрабатывает команды бота
func (h *UniFlowUpdateHandler) handleCommand(ctx context.Context, userID int64, command string) {
	parts := strings.Fields(command)
	if len(parts) == 0 {
		return
	}

	cmd := strings.ToLower(parts[0])

	// Сбрасываем состояние при любой команде
	delete(h.userStates, userID)

	switch cmd {
	case "/start":
		h.handleStartCommand(ctx, userID)
	case "/menu":
		h.showMainMenu(ctx, userID)
	case "/today":
		h.handleTodayCommand(ctx, userID)
	case "/tasks":
		h.handleTasksCommand(ctx, userID)
	case "/newtask":
		h.handleNewTaskCommand(ctx, userID)
	case "/contexts":
		h.handleContextsCommand(ctx, userID)
	case "/newcontext":
		h.handleNewContextCommand(ctx, userID)
	case "/search":
		h.handleSearchCommand(ctx, userID, parts)
	case "/cancel":
		delete(h.userStates, userID)
		h.sendMessage(ctx, userID, "❌ Действие отменено")
		h.showMainMenu(ctx, userID)
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

	// Не отправляем приветственное сообщение здесь, так как при перезапуске бэкенда
	// это событие приходит для всех пользователей, что вызывает спам.
	// Вместо этого пользователь может использовать команду /start
}

// handleCallback обрабатывает callback от интерактивных кнопок
func (h *UniFlowUpdateHandler) handleCallback(ctx context.Context, upd *schemes.MessageCallbackUpdate) {
	userID := upd.Callback.User.UserId
	payload := upd.Callback.Payload
	callbackID := upd.Callback.CallbackID

	h.logger.Info("received callback", "user_id", userID, "payload", payload)

	parts := strings.Split(payload, "_")
	if len(parts) < 2 {
		return
	}

	action := parts[0]

	switch action {
	case "task":
		h.handleTaskCallback(ctx, userID, callbackID, parts)
	case "context":
		h.handleContextCallback(ctx, userID, callbackID, parts)
	case "menu":
		h.handleMenuCallback(ctx, userID, callbackID, parts)
	case "date":
		h.handleDateCallback(ctx, userID, callbackID, parts)
	}
}
