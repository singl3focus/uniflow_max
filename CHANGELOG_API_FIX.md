# Changelog - Исправление парсинга API

## Дата: 2025-11-15

### Проблемы, которые были исправлены

1. **Несоответствие типов ID**: Бекэнд использовал UUID (строки), а фронтенд ожидал числовые ID
2. **Отсутствие JSON-тегов**: Структуры Go не имели JSON-тегов, что приводило к неправильной сериализации
3. **Неправильный формат ошибок**: Фронтенд ожидал поле `detail`, а бекэнд возвращал `error`
4. **Несогласованность интерфейсов**: TypeScript типы не соответствовали реальным ответам бекэнда

### Изменения в бекэнде

#### 1. Модели данных (добавлены JSON-теги)

**backend/internal/core/models/user.go**
```go
type User struct {
    ID        UserID    `json:"id"`
    MaxUserID string    `json:"max_user_id"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}
```

**backend/internal/core/models/task.go**
```go
type Task struct {
    ID          TaskID     `json:"id"`
    UserID      UserID     `json:"user_id"`
    ContextID   *ContextID `json:"context_id,omitempty"`
    Title       string     `json:"title"`
    Description string     `json:"description"`
    Status      TaskStatus `json:"status"`
    DueAt       *time.Time `json:"due_at,omitempty"`
    CompletedAt *time.Time `json:"completed_at,omitempty"`
    CreatedAt   time.Time  `json:"created_at"`
    UpdatedAt   time.Time  `json:"updated_at"`
}
```

**backend/internal/core/models/context.go**
```go
type Context struct {
    ID          ContextID   `json:"id"`
    UserID      UserID      `json:"user_id"`
    Type        ContextType `json:"type"`
    Title       string      `json:"title"`
    Description string      `json:"description"`
    SubjectID   *string     `json:"subject_id,omitempty"`
    Color       string      `json:"color"`
    DeadlineAt  *time.Time  `json:"deadline_at,omitempty"`
    CreatedAt   time.Time   `json:"created_at"`
    UpdatedAt   time.Time   `json:"updated_at"`
}
```

#### 2. Формат ошибок

Бекэнд уже использовал правильный формат:
```go
type ErrorResponse struct {
    Error string `json:"error"`
}
```

### Изменения во фронтенде

#### 1. Обновлены типы (frontend/src/types/api.ts)

**Task interface:**
```typescript
export interface Task {
  id: string; // было: number
  user_id: string; // было: number
  context_id?: string | null; // было: number | null
  title: string;
  description: string;
  status: TaskStatus;
  due_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}
```

**Context interface:**
```typescript
export interface Context {
  id: string; // было: number
  user_id: string; // было: number
  type: ContextType;
  title: string;
  description: string;
  subject_id?: string | null;
  color: string;
  deadline_at?: string | null;
  created_at: string;
  updated_at: string;
}
```

**Добавлены новые интерфейсы:**
```typescript
export interface TaskUpdate {
  title?: string;
  description?: string;
  context_id?: string | null;
  due_at?: string | null;
}

export interface ContextCreate {
  type: ContextType;
  title: string;
  description: string;
  subject_id?: string | null;
  color: string;
  deadline_at?: string | null;
}

export interface ContextUpdate {
  type?: ContextType;
  title?: string;
  description?: string;
  subject_id?: string | null;
  color?: string;
  deadline_at?: string | null;
}

export interface AuthWithMAXResponse {
  user_id: string;
  max_user_id: string;
  access_token: string;
}

export interface ErrorResponse {
  error: string;
}
```

#### 2. Обновлен API-клиент (frontend/src/api/client.ts)

- Добавлены правильные импорты типов
- Обновлена обработка ошибок для парсинга `ErrorResponse`
- Обновлены методы для использования новых интерфейсов
- Добавлена типизация ответов на удаление и обновление статуса

**Обработка ошибок:**
```typescript
this.client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorResponse>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      console.error('[API] Unauthorized - token removed');
    }
    
    if (error.response?.data?.error) {
      console.error('[API Error]', error.response.data.error);
    }
    
    return Promise.reject(error);
  }
);
```

#### 3. Обновлены компоненты

**frontend/src/pages/TaskPage.tsx**
- Изменен тип параметра `taskId` с `number` на `string`
- Обновлена функция `loadTask` для работы со строковыми UUID
- Исправлено сравнение ID задач

**frontend/src/pages/LoginPageSimple.tsx и LoginPage.tsx**
- Обновлена обработка ошибок для поддержки как `error`, так и `detail`
```typescript
setError(err.response?.data?.error || err.response?.data?.detail || 'Ошибка входа. Проверьте MAX ID.');
```

**frontend/src/pages/TaskFormPageSimple.tsx**
- Убрано поле `status` из `taskData` при обновлении задачи (статус обновляется отдельным методом)

### Проверка совместимости

✅ Все эндпоинты бекэнда возвращают данные в формате snake_case
✅ Все ID в системе - это UUID (строки)
✅ Все даты в формате ISO 8601
✅ Ошибки возвращаются в едином формате `{ "error": "..." }`
✅ TypeScript типы соответствуют моделям Go
✅ Нет ошибок компиляции в TypeScript
✅ Нет ошибок компиляции в Go

### Тестирование

Рекомендуется протестировать следующие сценарии:

1. **Аутентификация:**
   - Вход с корректным MAX ID
   - Вход с некорректным MAX ID (должна вернуться понятная ошибка)

2. **Задачи:**
   - Создание задачи
   - Получение списка задач
   - Получение задачи по ID
   - Обновление задачи
   - Обновление статуса задачи
   - Удаление задачи

3. **Контексты:**
   - Создание контекста
   - Получение списка контекстов
   - Получение контекста по ID
   - Обновление контекста
   - Удаление контекста

4. **Поиск:**
   - Поиск задач и контекстов

5. **Обработка ошибок:**
   - Запросы без токена (401)
   - Запросы с невалидными данными (400)
   - Запросы к несуществующим ресурсам (404)

### Примечания

- UUID генерируются на бекэнде при создании новых сущностей
- Фронтенд не должен генерировать UUID самостоятельно
- Все опциональные поля помечены как `omitempty` в JSON-тегах Go
- TypeScript интерфейсы используют `?` для опциональных полей

### Следующие шаги

1. Запустить бекэнд: `cd backend && docker-compose up -d --build`
2. Запустить фронтенд: `cd frontend && npm run dev`
3. Протестировать все эндпоинты через UI
4. Проверить логи на наличие ошибок парсинга JSON
