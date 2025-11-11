package max

import (
	"context"
	"fmt"
	"log"

	maxbot "github.com/max-messenger/max-bot-api-client-go"
	"github.com/max-messenger/max-bot-api-client-go/schemes"
)

// Client обертка над MAX Bot API
type Client struct {
	api   *maxbot.Api
	token string
}

// NewClient создает новый MAX клиент
func NewClient(token string) (*Client, error) {
	if token == "" {
		return nil, fmt.Errorf("MAX bot token is required")
	}

	api, err := maxbot.New(token)
	if err != nil {
		return nil, fmt.Errorf("failed to create MAX bot API client: %w", err)
	}

	return &Client{
		api:   api,
		token: token,
	}, nil
}

// SendMessage отправляет сообщение пользователю
func (c *Client) SendMessage(ctx context.Context, userID int64, text string) error {
	msg := maxbot.NewMessage().SetUser(userID).SetText(text)
	if _, err := c.api.Messages.Send(ctx, msg); err != nil {
		return fmt.Errorf("failed to send message: %w", err)
	}
	return nil
}

// SendMessageToChat отправляет сообщение в чат
func (c *Client) SendMessageToChat(ctx context.Context, chatID int64, text string) error {
	msg := maxbot.NewMessage().SetChat(chatID).SetText(text)
	if _, err := c.api.Messages.Send(ctx, msg); err != nil {
		return fmt.Errorf("failed to send message: %w", err)
	}
	return nil
}

// GetUpdates получает обновления от MAX Bot API (long polling)
func (c *Client) GetUpdates(ctx context.Context) <-chan schemes.UpdateInterface {
	return c.api.GetUpdates(ctx)
}

// SetWebhook устанавливает webhook для получения обновлений
func (c *Client) SetWebhook(ctx context.Context, webhookURL string) error {
	// Получаем список существующих подписок
	subs, err := c.api.Subscriptions.GetSubscriptions(ctx)
	if err != nil {
		log.Printf("Failed to get subscriptions: %v", err)
	} else {
		// Удаляем старые подписки
		for _, sub := range subs.Subscriptions {
			if _, err := c.api.Subscriptions.Unsubscribe(ctx, sub.Url); err != nil {
				log.Printf("Failed to unsubscribe from %s: %v", sub.Url, err)
			}
		}
	}

	// Создаем новую подписку
	updateTypes := []string{} // Пустой массив означает подписку на все типы обновлений
	if _, err := c.api.Subscriptions.Subscribe(ctx, webhookURL, updateTypes); err != nil {
		return fmt.Errorf("failed to subscribe to webhook: %w", err)
	}

	log.Printf("Webhook set to: %s", webhookURL)
	return nil
}

// GetMe возвращает информацию о боте
func (c *Client) GetMe(ctx context.Context) (*schemes.BotInfo, error) {
	return c.api.Bots.GetBot(ctx)
}

// GetAPI возвращает базовый API клиент для расширенных операций
func (c *Client) GetAPI() *maxbot.Api {
	return c.api
}
