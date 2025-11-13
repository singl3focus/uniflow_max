# Исправление бага с частичным обновлением (Partial Update Fix)

## Проблема

При обновлении только одного поля (например, `color` в контексте) все остальные поля перезаписывались пустыми значениями. Это происходило из-за того, что:

1. **Request структуры** (`CreateContextRequest`, `CreateTaskRequest`) использовали обязательные поля (`string`)
2. При декодировании JSON отсутствующие поля получали **zero values** (пустые строки `""`)
3. Handler передавал указатели на эти пустые строки (`&req.Title`, `&req.Description`)
4. Usecase считал, что это осознанное обновление на пустую строку, т.к. указатель не `nil`

## Решение

Созданы отдельные структуры для операций **UPDATE** с опциональными полями:

### Contexts

```go
// Для создания (все поля обязательные)
type CreateContextRequest struct {
    Type        string  `json:"type"`
    Title       string  `json:"title"`
    Description string  `json:"description"`
    Color       string  `json:"color"`
    SubjectID   *string `json:"subject_id"`
    DeadlineAt  *string `json:"deadline_at"`
}

// Для обновления (все поля опциональные)
type UpdateContextRequest struct {
    Type        *string `json:"type"`
    Title       *string `json:"title"`
    Description *string `json:"description"`
    Color       *string `json:"color"`
    SubjectID   *string `json:"subject_id"`
    DeadlineAt  *string `json:"deadline_at"`
}
```

### Tasks

```go
// Для создания
type CreateTaskRequest struct {
    ContextID   *string `json:"context_id"`
    Title       string  `json:"title"`
    Description string  `json:"description"`
    DueAt       *string `json:"due_at"`
}

// Для обновления
type UpdateTaskRequest struct {
    ContextID   *string `json:"context_id"`
    Title       *string `json:"title"`
    Description *string `json:"description"`
    DueAt       *string `json:"due_at"`
}
```

## Как это работает

1. **Если поле не передано в JSON** → указатель будет `nil` → usecase не обновит поле
2. **Если поле передано** → указатель не `nil` → usecase обновит поле новым значением
3. **Если передана пустая строка `""`** → указатель на `""` → usecase обновит поле на пустую строку (намеренное действие)

## Примеры использования

### Обновить только цвет контекста

```http
PATCH /api/contexts/{id}
Content-Type: application/json

{
  "color": "#9B59B6"
}
```

### Обновить только заголовок задачи

```http
PATCH /api/tasks/{id}
Content-Type: application/json

{
  "title": "Новый заголовок"
}
```

### Обновить несколько полей

```http
PATCH /api/contexts/{id}
Content-Type: application/json

{
  "title": "Физика",
  "description": "Механика и термодинамика",
  "color": "#E74C3C"
}
```

## Изменённые файлы

- ✅ `internal/adapters/http/handlers/context_handler.go`
  - Добавлена структура `UpdateContextRequest`
  - Метод `UpdateContext` использует новую структуру
  - Обновлены Swagger комментарии

- ✅ `internal/adapters/http/handlers/task_handler.go`
  - Добавлена структура `UpdateTaskRequest`
  - Метод `UpdateTask` использует новую структуру
  - Обновлены Swagger комментарии

- ✅ `test-data.http`
  - Добавлены примеры частичного обновления:
    - `8a` - обновить только цвет контекста
    - `8b` - обновить заголовок и описание контекста
    - `17a` - обновить только заголовок задачи
    - `17b` - обновить только дедлайн задачи

- ✅ `docs/swagger.yaml`, `docs/swagger.json`, `docs/docs.go`
  - Swagger документация автоматически обновлена через `swag init`
  - Схемы `UpdateContextRequest` и `UpdateTaskRequest` корректно показывают все поля как опциональные

## Тестирование

1. **Создать контекст:**
   ```bash
   POST /api/contexts
   {
     "type": "personal",
     "title": "Спорт",
     "description": "Тренировки",
     "color": "#2ECC71"
   }
   ```

2. **Обновить только цвет:**
   ```bash
   PATCH /api/contexts/{id}
   {
     "color": "#9B59B6"
   }
   ```

3. **Проверить результат:**
   ```bash
   GET /api/contexts/{id}
   # Должны увидеть:
   # - title: "Спорт" (не удалён!)
   # - description: "Тренировки" (не удалён!)
   # - color: "#9B59B6" (обновлён)
   ```

## API Semantics

- `POST /api/contexts` - **CREATE** → использует `CreateContextRequest` (обязательные поля)
- `PATCH /api/contexts/{id}` - **PARTIAL UPDATE** → использует `UpdateContextRequest` (опциональные поля)
- `POST /api/tasks` - **CREATE** → использует `CreateTaskRequest` (обязательные поля)
- `PATCH /api/tasks/{id}` - **PARTIAL UPDATE** → использует `UpdateTaskRequest` (опциональные поля)

---

**Статус:** ✅ Исправлено и протестировано
**Дата:** 13.11.2025
