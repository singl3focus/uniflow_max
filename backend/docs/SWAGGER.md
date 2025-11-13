# Swagger API Documentation

## 📚 Доступ к документации

После запуска сервера Swagger UI доступен по адресу:

```
http://localhost:50031/swagger/index.html
```

## 🚀 Использование

### Локально

1. Запустите сервер:
```bash
go run cmd/project/main.go
```

2. Откройте в браузере:
```
http://localhost:50031/swagger/index.html
```

### В Docker

1. Запустите через docker-compose:
```bash
docker-compose up
```

2. Откройте в браузере:
```
http://localhost:50031/swagger/index.html
```

## 📝 Аутентификация

API использует JWT токены для аутентификации.

### Получение токена

```bash
curl -X POST http://localhost:50031/api/auth/max \
  -H "Content-Type: application/json" \
  -d '{"max_user_id": "123456789"}'
```

Ответ:
```json
{
  "user_id": "uuid-here",
  "max_user_id": "123456789",
  "token": "jwt-token-here"
}
```

### Использование токена

Добавьте заголовок к запросам:
```bash
curl -X GET http://localhost:50031/api/tasks \
  -H "X-User-ID: your-user-id-uuid"
```

## 🔄 Регенерация документации

После изменения API аннотаций:

```bash
swag init -g cmd/project/main.go -o docs --parseDependency --parseInternal
```

## 📋 Доступные endpoints

### Auth
- `POST /api/auth/max` - Аутентификация через MAX

### Contexts (Контексты)
- `GET /api/contexts` - Получить все контексты
- `POST /api/contexts` - Создать контекст
- `GET /api/contexts/{id}` - Получить контекст по ID
- `PATCH /api/contexts/{id}` - Обновить контекст
- `DELETE /api/contexts/{id}` - Удалить контекст

### Tasks (Задачи)
- `GET /api/tasks` - Получить все задачи
- `GET /api/tasks/today` - Задачи на сегодня
- `POST /api/tasks` - Создать задачу
- `GET /api/tasks/{id}` - Получить задачу
- `PATCH /api/tasks/{id}` - Обновить задачу
- `PATCH /api/tasks/{id}/status` - Изменить статус
- `DELETE /api/tasks/{id}` - Удалить задачу

### Search
- `GET /api/search` - Поиск по задачам

## 🛠️ Swagger аннотации

### Пример аннотации для handler:

```go
// CreateTask godoc
// @Summary      Создать новую задачу
// @Description  Создает новую задачу с привязкой к контексту
// @Tags         tasks
// @Accept       json
// @Produce      json
// @Param        X-User-ID header string true "User ID"
// @Param        request body CreateTaskRequest true "Данные задачи"
// @Success      201 {object} models.Task
// @Failure      400 {object} response.ErrorResponse
// @Failure      500 {object} response.ErrorResponse
// @Router       /tasks [post]
// @Security     BearerAuth
func (h *TaskHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
    // implementation
}
```

## 📖 Дополнительная информация

- Swagger спецификация: `docs/swagger.json`
- YAML версия: `docs/swagger.yaml`
- Go код: `docs/docs.go`
