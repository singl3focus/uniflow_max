#!/bin/bash
# Скрипт для тестирования API с помощью curl

BASE_URL="http://localhost:50031"
TOKEN=""

echo "=========================================="
echo "UniFlow API - Тестирование с curl"
echo "=========================================="

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Health Check
echo -e "\n${YELLOW}1. Health Check${NC}"
curl -X GET "$BASE_URL/health"
echo -e "\n"

# 2. Аутентификация
echo -e "\n${YELLOW}2. Аутентификация через MAX${NC}"
AUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/max" \
  -H "Content-Type: application/json" \
  -d '{
    "max_user_id": "123456789"
  }')

echo "$AUTH_RESPONSE" | jq '.'
TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.token')
USER_ID=$(echo "$AUTH_RESPONSE" | jq -r '.user_id')

if [ "$TOKEN" != "null" ]; then
  echo -e "${GREEN}✓ Токен получен: $TOKEN${NC}"
else
  echo -e "${RED}✗ Ошибка получения токена${NC}"
  exit 1
fi

# 3. Создать контекст - Учёба
echo -e "\n${YELLOW}3. Создать контекст - Математика${NC}"
CONTEXT1_RESPONSE=$(curl -s -X POST "$BASE_URL/api/contexts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "study",
    "title": "Математика",
    "description": "Высшая математика, 3 курс",
    "color": "#FF5733",
    "subject_id": null,
    "deadline_at": "2025-12-31T23:59:59Z"
  }')

echo "$CONTEXT1_RESPONSE" | jq '.'
CONTEXT1_ID=$(echo "$CONTEXT1_RESPONSE" | jq -r '.id')
echo -e "${GREEN}✓ Контекст создан: $CONTEXT1_ID${NC}"

# 4. Создать контекст - Проект
echo -e "\n${YELLOW}4. Создать контекст - Дипломный проект${NC}"
CONTEXT2_RESPONSE=$(curl -s -X POST "$BASE_URL/api/contexts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "project",
    "title": "Дипломный проект",
    "description": "Разработка веб-приложения",
    "color": "#3498DB",
    "subject_id": null,
    "deadline_at": "2026-06-01T00:00:00Z"
  }')

echo "$CONTEXT2_RESPONSE" | jq '.'
CONTEXT2_ID=$(echo "$CONTEXT2_RESPONSE" | jq -r '.id')
echo -e "${GREEN}✓ Контекст создан: $CONTEXT2_ID${NC}"

# 5. Получить все контексты
echo -e "\n${YELLOW}5. Получить все контексты${NC}"
curl -s -X GET "$BASE_URL/api/contexts" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 6. Создать задачу 1
echo -e "\n${YELLOW}6. Создать задачу - Домашнее задание${NC}"
TASK1_RESPONSE=$(curl -s -X POST "$BASE_URL/api/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"context_id\": \"$CONTEXT1_ID\",
    \"title\": \"Решить задачи по матанализу\",
    \"description\": \"Глава 5, задачи 1-15\",
    \"due_at\": \"2025-11-15T18:00:00Z\"
  }")

echo "$TASK1_RESPONSE" | jq '.'
TASK1_ID=$(echo "$TASK1_RESPONSE" | jq -r '.id')
echo -e "${GREEN}✓ Задача создана: $TASK1_ID${NC}"

# 7. Создать задачу 2 - на сегодня
echo -e "\n${YELLOW}7. Создать задачу - Срочная на сегодня${NC}"
TODAY=$(date -u +"%Y-%m-%dT17:00:00Z")
TASK2_RESPONSE=$(curl -s -X POST "$BASE_URL/api/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"context_id\": null,
    \"title\": \"Позвонить врачу\",
    \"description\": \"Записаться на приём\",
    \"due_at\": \"$TODAY\"
  }")

echo "$TASK2_RESPONSE" | jq '.'
TASK2_ID=$(echo "$TASK2_RESPONSE" | jq -r '.id')
echo -e "${GREEN}✓ Задача создана: $TASK2_ID${NC}"

# 8. Создать задачу 3 - Проект
echo -e "\n${YELLOW}8. Создать задачу - Документация${NC}"
TASK3_RESPONSE=$(curl -s -X POST "$BASE_URL/api/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"context_id\": \"$CONTEXT2_ID\",
    \"title\": \"Написать документацию API\",
    \"description\": \"OpenAPI спецификация\",
    \"due_at\": \"2025-11-20T23:59:59Z\"
  }")

echo "$TASK3_RESPONSE" | jq '.'
TASK3_ID=$(echo "$TASK3_RESPONSE" | jq -r '.id')
echo -e "${GREEN}✓ Задача создана: $TASK3_ID${NC}"

# 9. Получить все задачи
echo -e "\n${YELLOW}9. Получить все задачи${NC}"
curl -s -X GET "$BASE_URL/api/tasks" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 10. Получить задачи на сегодня
echo -e "\n${YELLOW}10. Получить задачи на сегодня${NC}"
curl -s -X GET "$BASE_URL/api/tasks/today" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 11. Обновить статус задачи - в процессе
echo -e "\n${YELLOW}11. Обновить статус задачи - в процессе${NC}"
curl -s -X PATCH "$BASE_URL/api/tasks/$TASK1_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress"
  }' | jq '.'

# 12. Обновить задачу
echo -e "\n${YELLOW}12. Обновить задачу${NC}"
curl -s -X PATCH "$BASE_URL/api/tasks/$TASK1_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"context_id\": \"$CONTEXT1_ID\",
    \"title\": \"Решить задачи по матанализу (обновлено)\",
    \"description\": \"Глава 5, задачи 1-20 + дополнительные\",
    \"due_at\": \"2025-11-16T18:00:00Z\"
  }" | jq '.'

# 13. Получить конкретную задачу
echo -e "\n${YELLOW}13. Получить задачу по ID${NC}"
curl -s -X GET "$BASE_URL/api/tasks/$TASK1_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 14. Поиск
echo -e "\n${YELLOW}14. Поиск по запросу 'математика'${NC}"
curl -s -X GET "$BASE_URL/api/search?q=математика" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 15. Поиск - проект
echo -e "\n${YELLOW}15. Поиск по запросу 'документация'${NC}"
curl -s -X GET "$BASE_URL/api/search?q=документация" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 16. Обновить контекст
echo -e "\n${YELLOW}16. Обновить контекст${NC}"
curl -s -X PATCH "$BASE_URL/api/contexts/$CONTEXT1_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "study",
    "title": "Математика (обновлено)",
    "description": "Высшая математика, 3 курс - подготовка к экзамену",
    "color": "#E74C3C",
    "subject_id": null,
    "deadline_at": "2025-12-20T23:59:59Z"
  }' | jq '.'

# 17. Получить контекст по ID
echo -e "\n${YELLOW}17. Получить контекст по ID${NC}"
curl -s -X GET "$BASE_URL/api/contexts/$CONTEXT1_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 18. Отметить задачу выполненной
echo -e "\n${YELLOW}18. Отметить задачу выполненной${NC}"
curl -s -X PATCH "$BASE_URL/api/tasks/$TASK2_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }' | jq '.'

echo -e "\n${GREEN}=========================================="
echo "Тестирование завершено!"
echo -e "==========================================${NC}"
echo -e "\nСоздано:"
echo "  - Пользователь: $USER_ID"
echo "  - Контексты: $CONTEXT1_ID, $CONTEXT2_ID"
echo "  - Задачи: $TASK1_ID, $TASK2_ID, $TASK3_ID"
echo ""
echo "Для очистки используйте команды DELETE или перезапустите БД"
