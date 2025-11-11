package max

import (
	"log"
	"net/http"

	"github.com/max-messenger/max-bot-api-client-go/schemes"
)

// WebhookHandler обработчик webhook от MAX
type WebhookHandler struct {
	client        *Client
	updateChannel chan schemes.UpdateInterface
	updateHandler UpdateHandler
}

// UpdateHandler интерфейс для обработки обновлений
type UpdateHandler interface {
	HandleUpdate(update schemes.UpdateInterface)
}

// NewWebhookHandler создает новый обработчик webhook
func NewWebhookHandler(client *Client, handler UpdateHandler) *WebhookHandler {
	if handler == nil {
		handler = &DefaultUpdateHandler{}
	}

	return &WebhookHandler{
		client:        client,
		updateChannel: make(chan schemes.UpdateInterface, 100),
		updateHandler: handler,
	}
}

// ServeHTTP обрабатывает входящие webhook запросы
func (h *WebhookHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Используем встроенный парсер MAX API
	updates := make(chan schemes.UpdateInterface)
	http.HandleFunc(r.URL.Path, h.client.api.GetHandler(updates))

	// Читаем обновление из канала
	select {
	case update := <-updates:
		// Обрабатываем обновление
		h.updateHandler.HandleUpdate(update)
		w.WriteHeader(http.StatusOK)
	default:
		w.WriteHeader(http.StatusOK)
	}
}

// GetUpdates возвращает канал с обновлениями
func (h *WebhookHandler) GetUpdates() <-chan schemes.UpdateInterface {
	return h.updateChannel
}

// DefaultUpdateHandler стандартный обработчик обновлений
type DefaultUpdateHandler struct{}

// HandleUpdate обрабатывает обновление (базовая реализация)
func (h *DefaultUpdateHandler) HandleUpdate(update schemes.UpdateInterface) {
	// Определяем тип обновления
	switch upd := update.(type) {
	case *schemes.MessageCreatedUpdate:
		log.Printf("New message from user %d: %s", upd.Message.Sender.UserId, upd.Message.Body.Text)
	case *schemes.BotStartedUpdate:
		log.Printf("Bot started by user %d", upd.User.UserId)
	case *schemes.MessageCallbackUpdate:
		log.Printf("Callback from user %d with payload: %s", upd.Callback.User.UserId, upd.Callback.Payload)
	default:
		log.Printf("Received update: %+v", update)
	}
}
