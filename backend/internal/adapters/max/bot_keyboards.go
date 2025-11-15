package max

import (
	"fmt"

	maxbot "github.com/max-messenger/max-bot-api-client-go"
	"github.com/max-messenger/max-bot-api-client-go/schemes"

	"github.com/singl3focus/uniflow/internal/core/models"
)

// buildMainMenuKeyboard создает главную клавиатуру
func (h *UniFlowUpdateHandler) buildMainMenuKeyboard() *maxbot.Keyboard {
	kb := &maxbot.Keyboard{}

	// Первая строка - сегодня и расписание
	kb.AddRow().
		AddCallback("📋 Сегодня", schemes.DEFAULT, "menu_today").
		AddCallback("📅 Расписание", schemes.DEFAULT, "menu_schedule_0")

	// Вторая строка - контексты и входящие
	kb.AddRow().
		AddCallback("📁 Контексты", schemes.DEFAULT, "menu_contexts").
		AddCallback("📥 Входящие", schemes.DEFAULT, "menu_inbox")

	// Третья строка - создание
	kb.AddRow().
		AddCallback("➕ Новая задача", schemes.POSITIVE, "menu_newtask").
		AddCallback("📂 Новый контекст", schemes.POSITIVE, "menu_newcontext")

	// Четвертая строка - поиск (большая кнопка)
	kb.AddRow().
		AddCallback("🔍 Поиск", schemes.DEFAULT, "menu_search")

	return kb
}

// buildTaskListKeyboard создает клавиатуру для списка задач
func (h *UniFlowUpdateHandler) buildTaskListKeyboard(tasks []models.Task) *maxbot.Keyboard {
	kb := &maxbot.Keyboard{}

	// Добавляем кнопки для каждой задачи (максимум 5)
	count := 0
	for _, task := range tasks {
		if count >= 5 {
			break
		}

		if task.Status == "completed" {
			// Для завершенных задач - только просмотр
			kb.AddRow().
				AddCallback("✅ "+truncate(task.Title, 30), schemes.DEFAULT, "task_view_"+task.ID.String())
		} else {
			// Для активных - завершить или посмотреть
			kb.AddRow().
				AddCallback("✓ Завершить", schemes.POSITIVE, "task_complete_"+task.ID.String()).
				AddCallback("👁 Просмотр", schemes.DEFAULT, "task_view_"+task.ID.String())
		}
		count++
	}

	// Кнопка возврата в меню
	kb.AddRow().
		AddCallback("🏠 Главное меню", schemes.DEFAULT, "menu_main")

	return kb
}

// buildTaskDetailKeyboard создает клавиатуру для деталей задачи
func (h *UniFlowUpdateHandler) buildTaskDetailKeyboard(task *models.Task) *maxbot.Keyboard {
	kb := &maxbot.Keyboard{}

	if task.Status != "completed" {
		// Управление задачей
		kb.AddRow().
			AddCallback("✓ Завершить", schemes.POSITIVE, "task_complete_"+task.ID.String()).
			AddCallback("✏️ Редактировать", schemes.DEFAULT, "task_edit_"+task.ID.String())

		kb.AddRow().
			AddCallback("⏰ Изменить срок", schemes.DEFAULT, "task_due_"+task.ID.String()).
			AddCallback("🗑 Удалить", schemes.NEGATIVE, "task_delete_"+task.ID.String())
	} else {
		// Для завершенных задач - возобновить или удалить
		kb.AddRow().
			AddCallback("↩️ Возобновить", schemes.DEFAULT, "task_reopen_"+task.ID.String()).
			AddCallback("🗑 Удалить", schemes.NEGATIVE, "task_delete_"+task.ID.String())
	}

	// Возврат
	kb.AddRow().
		AddCallback("◀️ Назад к задачам", schemes.DEFAULT, "menu_tasks")

	return kb
}

// buildContextListKeyboard создает клавиатуру для списка контекстов
func (h *UniFlowUpdateHandler) buildContextListKeyboard(contexts []models.Context) *maxbot.Keyboard {
	kb := &maxbot.Keyboard{}

	// Добавляем кнопки для каждого контекста (максимум 5)
	count := 0
	for _, ctx := range contexts {
		if count >= 5 {
			break
		}

		kb.AddRow().
			AddCallback("📂 "+truncate(ctx.Title, 25), schemes.DEFAULT, "context_view_"+ctx.ID.String()).
			AddCallback("📋 Задачи", schemes.DEFAULT, "context_tasks_"+ctx.ID.String())

		count++
	}

	// Создать новый контекст
	kb.AddRow().
		AddCallback("➕ Новый контекст", schemes.POSITIVE, "menu_newcontext")

	// Кнопка возврата в меню
	kb.AddRow().
		AddCallback("🏠 Главное меню", schemes.DEFAULT, "menu_main")

	return kb
}

// buildContextDetailKeyboard создает клавиатуру для деталей контекста
func (h *UniFlowUpdateHandler) buildContextDetailKeyboard(context *models.Context) *maxbot.Keyboard {
	kb := &maxbot.Keyboard{}

	// Управление контекстом
	kb.AddRow().
		AddCallback("📋 Задачи контекста", schemes.DEFAULT, "context_tasks_"+context.ID.String()).
		AddCallback("✏️ Редактировать", schemes.DEFAULT, "context_edit_"+context.ID.String())

	kb.AddRow().
		AddCallback("🗑 Удалить", schemes.NEGATIVE, "context_delete_"+context.ID.String())

	// Возврат
	kb.AddRow().
		AddCallback("◀️ Назад к контекстам", schemes.DEFAULT, "menu_contexts")

	return kb
}

// buildConfirmKeyboard создает клавиатуру подтверждения
func (h *UniFlowUpdateHandler) buildConfirmKeyboard(actionType, itemID string) *maxbot.Keyboard {
	kb := &maxbot.Keyboard{}

	kb.AddRow().
		AddCallback("✓ Подтвердить", schemes.POSITIVE, actionType+"_confirm_"+itemID).
		AddCallback("✗ Отмена", schemes.NEGATIVE, actionType+"_cancel_"+itemID)

	return kb
}

// buildScheduleKeyboard создает клавиатуру для навигации по расписанию
func (h *UniFlowUpdateHandler) buildScheduleKeyboard(dayOffset int) *maxbot.Keyboard {
	kb := &maxbot.Keyboard{}

	// Навигация по дням
	prevOffset := dayOffset - 1
	nextOffset := dayOffset + 1

	kb.AddRow().
		AddCallback("⬅️ Предыдущий", schemes.DEFAULT, fmt.Sprintf("menu_schedule_%d", prevOffset)).
		AddCallback("Сегодня", schemes.POSITIVE, "menu_schedule_0").
		AddCallback("Следующий ➡️", schemes.DEFAULT, fmt.Sprintf("menu_schedule_%d", nextOffset))

	// Возврат в меню
	kb.AddRow().
		AddCallback("🏠 Главное меню", schemes.DEFAULT, "menu_main")

	return kb
}

// buildDateSelectionKeyboard создает клавиатуру для выбора даты
func (h *UniFlowUpdateHandler) buildDateSelectionKeyboard() *maxbot.Keyboard {
	kb := &maxbot.Keyboard{}

	// Сегодня, завтра, послезавтра
	kb.AddRow().
		AddCallback("Сегодня", schemes.DEFAULT, "date_0").
		AddCallback("Завтра", schemes.DEFAULT, "date_1")

	kb.AddRow().
		AddCallback("Послезавтра", schemes.DEFAULT, "date_2").
		AddCallback("Через 3 дня", schemes.DEFAULT, "date_3")

	kb.AddRow().
		AddCallback("Через неделю", schemes.DEFAULT, "date_7").
		AddCallback("Пропустить", schemes.NEGATIVE, "date_skip")

	return kb
}

// buildInboxKeyboard создает клавиатуру для входящих задач
func (h *UniFlowUpdateHandler) buildInboxKeyboard(tasks []models.Task) *maxbot.Keyboard {
	kb := &maxbot.Keyboard{}

	// Добавляем кнопки для активных задач (максимум 5)
	count := 0
	for _, task := range tasks {
		if task.Status == "completed" {
			continue
		}
		if count >= 5 {
			break
		}

		// Для каждой активной задачи - кнопка завершения
		taskTitle := truncate(task.Title, 25)
		kb.AddRow().
			AddCallback("✓ "+taskTitle, schemes.POSITIVE, "task_complete_"+task.ID.String()).
			AddCallback("👁", schemes.DEFAULT, "task_view_"+task.ID.String())

		count++
	}

	// Кнопка возврата в меню
	kb.AddRow().
		AddCallback("🏠 Главное меню", schemes.DEFAULT, "menu_main")

	return kb
}

// truncate обрезает строку до указанной длины
func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}
