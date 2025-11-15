# UniFlow - Личный ассистент продуктивности для студентов

UniFlow - это полнофункциональный ассистент продуктивности для мессенджера MAX с чат-ботом и мини-приложением.

## 🌟 Особенности

### 🤖 Чат-бот MAX
- ✅ **Управление задачами** через диалоги
- 📁 **Организация контекстов** (учеба, работа, личное)
- 🔍 **Поиск задач** по названию
- ⌨️ **Интерактивные клавиатуры** для удобной навигации
- 💬 **Диалоговые сценарии** (FSM) для создания задач
- 📊 **Просмотр статистики** и прогресса

### 📱 Мини-приложение
- 🎨 **Современный UI** на React + TypeScript
- 🔄 **Реактивное обновление** данных
- 📱 **Интеграция с MAX WebApp API**
- 🎯 **Haptic feedback** для лучшего UX
- ⚡ **Быстрая навигация** с React Router

### 📋 Управление задачами
- ✏️ Создание, редактирование, удаление задач
- ✅ Отслеживание статуса выполнения
- ⏰ Установка дедлайнов
- 🏷️ Привязка к контекстам

### 🗂️ Контексты
- 📂 Организация задач по категориям
- 🎨 Кастомные иконки
- 📝 Описания контекстов
- 📊 Статистика по контекстам

## 🛠 Технологический стек

### Backend
- **Язык**: Go 1.24
- **База данных**: PostgreSQL 15
- **Архитектура**: Clean Architecture
- **HTTP router**: Chi v5
- **DB**: pgx/v5 + Squirrel
- **Логирование**: zerolog
- **MAX Bot API**: max-bot-api-client-go v1.0.3

### Frontend
- **Framework**: React 18.2.0
- **Язык**: TypeScript
- **Build**: Vite 5.0.8
- **Router**: React Router 6.20.0
- **HTTP**: Axios
- **MAX**: WebApp SDK

## 📦 Установка и запуск

### Предварительные требования

- Go 1.24+
- Node.js 18+
- PostgreSQL 15+
- Docker (опционально)

### Backend

1. Скопируйте конфигурацию:
```bash
cd backend
cp config.env.example config.env
```

2. Получите токен бота в `@max_master_bot`:
```
/newbot
```

3. Укажите токен в `config.env`:
```env
MAX_BOT_TOKEN=your-bot-token-here
MAX_WEBHOOK_URL=  # Пусто для long polling
```

4. Настройте PostgreSQL в `config.env`

5. Запустите:
```bash
go run cmd/project/main.go
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 📖 Документация

### Чат-бот
- 📚 [Полное руководство](backend/docs/MAX_BOT_GUIDE.md)
- 🎯 Команды, клавиатуры, диалоги
- 🔧 Настройка и использование

### Мини-приложение
- 📱 [MAX Integration](backend/docs/MAX_INTEGRATION.md)
- 🎨 Компоненты и хуки
- ⚡ WebApp API

### API
- 📡 [OpenAPI спецификация](backend/api/http/v1/openapi.yaml)
- 🔌 REST endpoints

## 🎮 Использование

### Команды бота

```
🏠 Основные:
/start       - Приветствие и меню
/menu        - Главное меню
/help        - Справка

✅ Задачи:
/today       - Задачи на сегодня
/tasks       - Все задачи
/newtask     - Создать задачу
/search      - Поиск

📁 Контексты:
/contexts    - Все контексты
/newcontext  - Создать контекст
```

### Создание задачи через бота

```
User: /newtask
Bot: Шаг 1/3: Введи название

User: Сделать домашку
Bot: Шаг 2/3: Введи описание (или '-')

User: Математика, задачи 1-15
Bot: Шаг 3/3: Выбери контекст
     1. 📚 Учеба
     2. 💼 Работа

User: 1
Bot: ✅ Задача создана!
```

## 🏗 Архитектура проекта

```
uniflow_max/
├── backend/
│   ├── cmd/
│   │   └── project/
│   │       └── main.go          # Точка входа
│   ├── internal/
│   │   ├── adapters/
│   │   │   ├── http/            # HTTP handlers
│   │   │   ├── max/             # MAX Bot integration
│   │   │   │   ├── bot_handler.go     # Главный обработчик
│   │   │   │   ├── bot_commands.go    # Команды
│   │   │   │   ├── bot_callbacks.go   # Callback'и
│   │   │   │   ├── bot_keyboards.go   # Клавиатуры
│   │   │   │   └── client.go          # MAX API клиент
│   │   │   └── postgres/        # Database
│   │   ├── core/
│   │   │   ├── models/          # Domain models
│   │   │   ├── ports/           # Interfaces
│   │   │   └── usecase/         # Business logic
│   │   └── pkg/                 # Utilities
│   ├── migrations/              # SQL migrations
│   ├── docs/
│   │   └── MAX_BOT_GUIDE.md    # Документация бота
│   └── config.env               # Конфигурация
│
└── frontend/
    ├── src/
    │   ├── components/          # React компоненты
    │   ├── pages/               # Страницы
    │   ├── hooks/               # Custom hooks
    │   │   ├── useMaxBackButton.ts
    │   │   └── useMaxHaptic.ts
    │   ├── contexts/            # React Contexts
    │   ├── lib/
    │   │   └── maxBridge.ts     # MAX WebApp API
    │   └── api/                 # API client
    └── package.json
```

## 🚀 Деплой

### Продакшн

1. **Backend**:
```bash
cd backend
go build -o uniflow cmd/project/main.go
./uniflow
```

2. **Frontend**:
```bash
cd frontend
npm run build
# Разместите dist/ на CDN или статическом хостинге
```

3. **Webhook для бота**:
```env
MAX_WEBHOOK_URL=https://yourdomain.com/max/webhook
```

## 📊 Статус разработки

- ✅ Backend API
- ✅ Чат-бот с полным функционалом
- ✅ Интерактивные клавиатуры
- ✅ Диалоговые сценарии (FSM)
- ✅ Frontend мини-приложения
- ✅ MAX WebApp интеграция
- ✅ Haptic feedback
- ⏳ Система уведомлений (в процессе)
- ⏳ JWT authentication (в процессе)

## 🤝 Вклад в проект

1. Fork проекта
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📝 Лицензия

MIT License - см. файл [LICENSE](LICENSE)

## 👨‍💻 Автор

[@singl3focus](https://github.com/singl3focus)

## 🔗 Полезные ссылки

- [MAX Bot API Documentation](https://dev.max.ru/)
- [max-bot-api-client-go](https://github.com/max-messenger/max-bot-api-client-go)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
