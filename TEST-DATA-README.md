# UniFlow API - Тестовые данные

Коллекция тестовых данных для всех эндпоинтов UniFlow API.

## Доступные файлы

### 1. `test-data.http`
REST Client файл для VS Code с расширением REST Client.
- Содержит все эндпоинты с примерами запросов
- Поддерживает переменные и цепочки запросов
- Идеально для быстрого тестирования

**Использование:**
1. Установите расширение REST Client в VS Code
2. Откройте файл `test-data.http`
3. Нажмите "Send Request" над любым запросом

### 2. `test-api.sh`
Bash скрипт для Linux/macOS с использованием curl.
- Автоматическое тестирование всех эндпоинтов
- Создание полного набора тестовых данных
- Вывод с цветовой индикацией

**Использование:**
```bash
chmod +x test-api.sh
./test-api.sh
```

**Требования:**
- curl
- jq (для форматирования JSON)

### 3. `test-api.ps1`
PowerShell скрипт для Windows.
- Полное тестирование всех эндпоинтов
- Автоматическое создание тестовых данных
- Цветной вывод результатов

**Использование:**
```powershell
.\test-api.ps1
```

### 4. `postman-collection.json`
Postman коллекция для импорта.
- Готовая коллекция со всеми эндпоинтами
- Автоматическое сохранение переменных (token, ids)
- Удобная организация по папкам

**Использование:**
1. Откройте Postman
2. Import → Upload Files → выберите `postman-collection.json`
3. Запускайте запросы из коллекции

## Структура тестовых данных

### Контексты (Contexts)
1. **Математика** (study)
   - Высшая математика, 3 курс
   - Цвет: #FF5733
   - Дедлайн: 31.12.2025

2. **Дипломный проект** (project)
   - Разработка веб-приложения
   - Цвет: #3498DB
   - Дедлайн: 01.06.2026

3. **Спорт** (personal)
   - Тренировки и здоровье
   - Цвет: #2ECC71
   - Без дедлайна

### Задачи (Tasks)
1. **Решить задачи по матанализу**
   - Контекст: Математика
   - Описание: Глава 5, задачи 1-15
   - Срок: 15.11.2025 18:00

2. **Позвонить врачу**
   - Без контекста
   - Описание: Записаться на приём
   - Срок: Сегодня 17:00

3. **Написать документацию API**
   - Контекст: Дипломный проект
   - Описание: OpenAPI спецификация
   - Срок: 20.11.2025

4. **Тренировка в спортзале**
   - Контекст: Спорт
   - Описание: Силовая тренировка, 1.5 часа
   - Срок: 14.11.2025 19:00

## Сценарии тестирования

### Базовый сценарий
1. Аутентификация → получение JWT токена
2. Создание 3 контекстов (учёба, проект, личное)
3. Создание 4 задач с разными параметрами
4. Получение списка задач
5. Обновление статусов задач
6. Поиск по задачам и контекстам

### Тестирование ошибок
- Невалидный JWT токен → 401 Unauthorized
- Отсутствие токена → 401 Unauthorized
- Неверный UUID → 400 Bad Request
- Несуществующий ID → 404 Not Found
- Некорректное тело запроса → 400 Bad Request

## Статусы задач

Доступные статусы для обновления:
- `todo` - К выполнению (по умолчанию)
- `in_progress` - В процессе
- `completed` - Выполнена
- `cancelled` - Отменена

## Типы контекстов

Доступные типы контекстов:
- `study` - Учёба
- `project` - Проект
- `personal` - Личное

## Переменные окружения

### Для REST Client (.http файлы)
```
@baseUrl = http://localhost:50031
@token = YOUR_JWT_TOKEN_HERE
```

### Для скриптов
- `BASE_URL` / `$BaseUrl` - адрес API (по умолчанию: http://localhost:50031)
- `TOKEN` / `$Token` - JWT токен (получается автоматически)

## Примеры запросов

### Аутентификация
```bash
curl -X POST http://localhost:50031/api/auth/max \
  -H "Content-Type: application/json" \
  -d '{"max_user_id": "123456789"}'
```

### Создание контекста
```bash
curl -X POST http://localhost:50031/api/contexts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "study",
    "title": "Математика",
    "description": "Высшая математика",
    "color": "#FF5733",
    "deadline_at": "2025-12-31T23:59:59Z"
  }'
```

### Создание задачи
```bash
curl -X POST http://localhost:50031/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "context_id": "CONTEXT_UUID",
    "title": "Решить задачи",
    "description": "Глава 5",
    "due_at": "2025-11-15T18:00:00Z"
  }'
```

### Обновление статуса
```bash
curl -X PATCH http://localhost:50031/api/tasks/TASK_UUID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

### Поиск
```bash
curl -X GET "http://localhost:50031/api/search?q=математика" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Очистка данных

После тестирования можно очистить данные:

1. **Удалить задачи:**
```bash
curl -X DELETE http://localhost:50031/api/tasks/TASK_UUID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

2. **Удалить контексты:**
```bash
curl -X DELETE http://localhost:50031/api/contexts/CONTEXT_UUID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

3. **Перезапустить БД:**
```bash
docker-compose down -v
docker-compose up -d
```

## Swagger документация

Альтернативно можно использовать Swagger UI:
```
http://localhost:50031/swagger/index.html
```

## Поддержка

При возникновении проблем:
1. Проверьте, что сервер запущен (`docker-compose up`)
2. Убедитесь, что порт 50031 доступен
3. Проверьте логи: `docker-compose logs -f app`
4. Проверьте health check: `curl http://localhost:50031/health`
