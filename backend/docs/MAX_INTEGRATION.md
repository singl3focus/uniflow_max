# Интеграция с MAX Messenger

## Обзор

UniFlow интегрирован с мессенджером MAX для отправки уведомлений пользователям. Интеграция реализована с помощью официального SDK: `github.com/max-messenger/max-bot-api-client-go`

## Конфигурация

### Переменные окружения

Добавьте следующие переменные в файл `build/docker/configs/config.env`:

```env
# MAX Bot Configuration
MAX_BOT_TOKEN=your_bot_token_here
MAX_WEBHOOK_URL=https://yourdomain.com/webhook/max
```

### Получение токена бота

1. Откройте диалог с [MasterBot](https://max.ru/primebot) в MAX Messenger
2. Создайте нового бота, следуя инструкциям
3. После создания PrimeBot отправит вам токен бота
4. Скопируйте токен в переменную `MAX_BOT_TOKEN`

## Архитектура

### Компоненты

#### 1. Client (`internal/adapters/max/client.go`)

Основной клиент для работы с MAX Bot API:

```go
type Client struct {
    api   *maxbot.Api
    token string
}
```

**Методы:**
- `SendMessage(ctx, userID, text)` - отправка сообщения пользователю
- `SendMessageToChat(ctx, chatID, text)` - отправка сообщения в чат
- `GetUpdates(ctx)` - получение обновлений (long polling)
- `SetWebhook(ctx, webhookURL)` - настройка webhook
- `GetMe(ctx)` - получение информации о боте

#### 2. WebhookHandler (`internal/adapters/max/webhook.go`)

Обработчик входящих webhook запросов от MAX:

```go
type WebhookHandler struct {
    client        *Client
    updateChannel chan schemes.UpdateInterface
    updateHandler UpdateHandler
}
```

**Поддерживаемые типы обновлений:**
- `MessageCreatedUpdate` - новое сообщение
- `BotStartedUpdate` - пользователь начал диалог с ботом
- `MessageCallbackUpdate` - нажатие на кнопку

#### 3. NotificationService (`internal/adapters/max/notification.go`)

Сервис для отправки различных типов уведомлений:

```go
type NotificationService struct {
    client *Client
}
```

**Методы:**
- `SendTaskReminder(ctx, userID, task)` - напоминание о задаче
- `SendDailySummary(ctx, userID, tasks)` - ежедневная сводка задач
- `SendFocusSessionStart(ctx, userID, session)` - начало фокус-сессии
- `SendFocusSessionEnd(ctx, userID, session)` - завершение фокус-сессии
- `SendCustomNotification(ctx, userID, title, message, scheduledFor)` - произвольное уведомление

## Использование

### Инициализация клиента

```go
import "github.com/singl3focus/uniflow/internal/adapters/max"

// Создание клиента
maxClient, err := max.NewClient("your_bot_token")
if err != nil {
    log.Fatal(err)
}

// Получение информации о боте
ctx := context.Background()
botInfo, err := maxClient.GetMe(ctx)
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Bot: %s (@%s)\n", botInfo.Name, botInfo.Username)
```

### Отправка сообщений

```go
ctx := context.Background()

// Отправка сообщения пользователю
err := maxClient.SendMessage(ctx, 12345, "Привет! Это тестовое сообщение.")
if err != nil {
    log.Printf("Failed to send message: %v", err)
}

// Отправка сообщения в чат
err = maxClient.SendMessageToChat(ctx, 67890, "Сообщение для всех участников чата!")
if err != nil {
    log.Printf("Failed to send message to chat: %v", err)
}
```

### Настройка webhook

```go
ctx := context.Background()
webhookURL := "https://yourdomain.com/webhook/max"

err := maxClient.SetWebhook(ctx, webhookURL)
if err != nil {
    log.Fatal(err)
}
log.Println("Webhook configured successfully")
```

### Обработка обновлений

```go
// Создание обработчика
updateHandler := &max.DefaultUpdateHandler{}
webhookHandler := max.NewWebhookHandler(maxClient, updateHandler)

// Регистрация в HTTP сервере
http.Handle("/webhook/max", webhookHandler)
```

### Отправка уведомлений

```go
// Создание сервиса уведомлений
notificationService := max.NewNotificationService(maxClient)

// Напоминание о задаче
err := notificationService.SendTaskReminder(ctx, userID, task)

// Ежедневная сводка
tasks := []*models.Task{...}
err = notificationService.SendDailySummary(ctx, userID, tasks)

// Уведомление о фокус-сессии
err = notificationService.SendFocusSessionStart(ctx, userID, session)
```

## Примеры сообщений

### Напоминание о задаче

```
⏰ Напоминание о задаче:

📝 Подготовить отчет
📅 Срок: 15.12.2024 18:00
📊 Статус: in_progress
```

### Ежедневная сводка

```
📊 Ваши задачи на сегодня:

1. ✅ Утренняя зарядка
2. ⬜ Подготовить презентацию
3. ⬜ Встреча с командой
```

### Фокус-сессия

```
🎯 Начинается фокус-сессия!

⏱ Длительность: 25 минут
📂 Контекст: Работа

Сконцентрируйтесь на выполнении задачи. Удачи!
```

## Режимы работы

### Long Polling

Для получения обновлений через long polling:

```go
ctx := context.Background()
updates := maxClient.GetUpdates(ctx)

for update := range updates {
    switch upd := update.(type) {
    case *schemes.MessageCreatedUpdate:
        fmt.Printf("New message: %s\n", upd.Message.Body.Text)
    case *schemes.BotStartedUpdate:
        fmt.Printf("User %d started bot\n", upd.User.UserId)
    }
}
```

### Webhook

Для работы через webhook (рекомендуется для production):

1. Настройте публичный HTTPS endpoint
2. Установите webhook через `SetWebhook()`
3. Обрабатывайте входящие запросы через `WebhookHandler`

## Безопасность

1. **Храните токен в безопасности**: Никогда не коммитьте `MAX_BOT_TOKEN` в git
2. **Используйте HTTPS**: Webhook URL должен использовать HTTPS
3. **Валидация запросов**: В production добавьте проверку подписи webhook запросов

## Troubleshooting

### Проблема: "failed to create MAX bot API client"

**Решение**: Проверьте правильность токена бота в `config.env`

### Проблема: "failed to subscribe to webhook"

**Решения**:
- Убедитесь, что webhook URL доступен из интернета
- Проверьте, что используется HTTPS
- Убедитесь, что сервер запущен и обрабатывает POST запросы

### Проблема: Сообщения не отправляются

**Проверьте**:
- Правильность `userID` (должен быть числовой ID пользователя MAX)
- Убедитесь, что пользователь начал диалог с ботом
- Проверьте логи на наличие ошибок

## Дополнительные возможности

### Клавиатуры

```go
api := maxClient.GetAPI()
keyboard := api.Messages.NewKeyboardBuilder()

keyboard.AddRow().
    AddCallback("Кнопка 1", schemes.POSITIVE, "payload1").
    AddCallback("Кнопка 2", schemes.NEGATIVE, "payload2")

msg := maxbot.NewMessage().
    SetUser(userID).
    SetText("Выберите действие:").
    AddKeyboard(keyboard)

api.Messages.Send(ctx, msg)
```

### Форматирование текста

```go
msg := maxbot.NewMessage().
    SetUser(userID).
    SetText("**Жирный** _курсив_ `код`").
    SetFormat("markdown")

api.Messages.Send(ctx, msg)
```

## Ссылки

- [Официальная документация MAX Bot API](https://dev.max.ru/)
- [GitHub репозиторий SDK](https://github.com/max-messenger/max-bot-api-client-go)
- [Примеры использования](https://github.com/max-messenger/max-bot-api-client-go/tree/main/examples)
