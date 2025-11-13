package usecase

import (
	"context"
	"errors"
	"time"

	"github.com/singl3focus/uniflow/internal/core/models"
	"github.com/singl3focus/uniflow/internal/core/ports/repository"
	"github.com/singl3focus/uniflow/pkg/errs"
	jwtpkg "github.com/singl3focus/uniflow/pkg/jwt"
)

type Usecase struct {
	repo       repository.Repository
	jwtManager *jwtpkg.JWTManager
}

func NewUsecase(r repository.Repository, j *jwtpkg.JWTManager) *Usecase {
	return &Usecase{repo: r, jwtManager: j}
}

var (
	ErrInvalidData = errs.New("invalid data")
	ErrNotFound    = errs.New("not found")
	ErrInternal    = errs.New("internal error")
	ErrUnexpected  = errs.New("unexpected error")
)

func handleRepositoryError(op string, err error) error {
	switch {
	case errors.Is(err, repository.ErrNotFound):
		return ErrNotFound.SetPlace(op).SetCause(err)
	case errors.Is(err, repository.ErrAlreadyExists):
		return ErrInvalidData.SetPlace(op).SetCause(err)
	case errors.Is(err, repository.ErrBuildQuery), errors.Is(err, repository.ErrQueryFailed):
		return ErrInternal.SetPlace(op).SetCause(err)
	default:
		return ErrInternal.SetPlace(op).SetCause(err)
	}
}

// ===========================
// Auth Usecases
// ===========================

func (u *Usecase) Login(ctx context.Context, maxUserID string) (models.User, string, error) {
	const op = "usecase.Login"

	if maxUserID == "" { // 1v1, changes
		return models.User{}, "", ErrInvalidData.SetPlace(op)
	}

	user, err := u.GetOrCreateUserByMaxID(ctx, maxUserID)
	if err != nil {
		return models.User{}, "", ErrInternal.SetPlace(op).SetCause(err)
	}

	token, err := u.jwtManager.GenerateToken(user.ID)
	if err != nil {
		return models.User{}, "", ErrInvalidData.SetPlace(op).SetCause(err)
	}

	return user, token, nil
}

func (u *Usecase) GetOrCreateUserByMaxID(ctx context.Context, maxUserID string) (models.User, error) {
	const op = "usecase.GetOrCreateUserByMaxID"

	user, err := u.repo.GetUserByMaxUserID(ctx, maxUserID)
	if err == nil {
		return user, nil
	}

	if !errors.Is(err, repository.ErrNotFound) {
		return models.User{}, handleRepositoryError(op, err)
	}

	user, err = models.NewUser(maxUserID)
	if err != nil {
		return models.User{}, ErrInvalidData.SetPlace(op).SetCause(err)
	}

	if err = u.repo.CreateUser(ctx, user); err != nil {
		return models.User{}, handleRepositoryError(op, err)
	}

	return user, nil
}

// ===========================
// Context use cases
// ===========================

func (u *Usecase) CreateContext(ctx context.Context, userIDStr string, contextType models.ContextType, title, description, color string, subjectID, deadlineAt *string) (models.Context, error) {
	const op = "usecase.CreateContext"

	userID, err := models.ParseUserID(userIDStr)
	if err != nil {
		return models.Context{}, ErrInvalidData.SetPlace(op).SetCause(err)
	}

	var deadlineAtTime *time.Time
	if deadlineAt != nil {
		t, err := time.Parse(time.RFC3339, *deadlineAt)
		if err != nil {
			return models.Context{}, ErrInvalidData.SetPlace(op).SetCause(err)
		}

		deadlineAtTime = &t
	}

	context, err := models.NewContext(userID, contextType, title, description, color, subjectID, deadlineAtTime)
	if err != nil {
		return models.Context{}, ErrInvalidData.SetPlace(op).SetCause(err)
	}

	if err = u.repo.CreateContext(ctx, context); err != nil {
		return models.Context{}, handleRepositoryError(op, err)
	}

	return context, nil
}

func (u *Usecase) GetContextsByUserID(ctx context.Context, userIDStr string) ([]models.Context, error) {
	const op = "usecase.GetContextsByUserID"

	userID, err := models.ParseUserID(userIDStr)
	if err != nil {
		return nil, ErrInvalidData.SetPlace(op).SetCause(err)
	}

	contexts, err := u.repo.GetContextsByUserID(ctx, userID)
	if err != nil {
		return nil, handleRepositoryError(op, err)
	}

	return contexts, nil
}

func (u *Usecase) GetContextByID(ctx context.Context, contextIDStr string) (models.Context, error) {
	const op = "usecase.GetContextByID"

	contextID, err := models.ParseContextID(contextIDStr)
	if err != nil {
		return models.Context{}, ErrInvalidData.SetPlace(op).SetCause(err)
	}

	context, err := u.repo.GetContextByID(ctx, contextID)
	if err != nil {
		return models.Context{}, handleRepositoryError(op, err)
	}

	return context, nil
}

func (u *Usecase) UpdateContext(ctx context.Context, contextIDStr string, contextType string, title, description, color *string, subjectID *string, deadlineAt *string) (models.Context, error) {
	const op = "usecase.UpdateContext"

	var contextTypeCleaned *models.ContextType
	if contextType != "" {
		ct := models.ContextType(contextType)
		contextTypeCleaned = &ct
	}

	contextID, err := models.ParseContextID(contextIDStr)
	if err != nil {
		return models.Context{}, ErrInvalidData.SetPlace(op).SetCause(err)
	}

	context, err := u.repo.GetContextByID(ctx, contextID)
	if err != nil {
		return models.Context{}, handleRepositoryError(op, err)
	}

	// Обновляем только переданные поля
	if contextTypeCleaned != nil {
		context.Type = *contextTypeCleaned
	}
	if title != nil {
		context.Title = *title
	}
	if description != nil {
		context.Description = *description
	}
	if color != nil {
		context.Color = *color
	}
	if subjectID != nil {
		context.SubjectID = subjectID
	}
	if deadlineAt != nil {
		t, err := time.Parse(time.RFC3339, *deadlineAt)
		if err != nil {
			return models.Context{}, ErrInvalidData.SetPlace(op).SetCause(err)
		}
		context.DeadlineAt = &t
	}

	context.UpdatedAt = time.Now()

	if err = u.repo.UpdateContext(ctx, context); err != nil {
		return models.Context{}, handleRepositoryError(op, err)
	}

	return context, nil
}

func (u *Usecase) DeleteContext(ctx context.Context, contextIDStr string) error {
	const op = "usecase.DeleteContext"

	contextID, err := models.ParseContextID(contextIDStr)
	if err != nil {
		return ErrInvalidData.SetPlace(op).SetCause(err)
	}

	if err := u.repo.DeleteContext(ctx, contextID); err != nil {
		return handleRepositoryError(op, err)
	}

	return nil
}

// ===========================
// Task use cases
// ===========================

func (u *Usecase) CreateTask(ctx context.Context, userIDStr string, contextID *string, title, description string, dueAt *string) (models.Task, error) {
	const op = "usecase.CreateTask"

	userID, err := models.ParseUserID(userIDStr)
	if err != nil {
		return models.Task{}, ErrInvalidData.SetPlace(op).SetCause(err)
	}

	var contextIDCleaned *models.ContextID
	if contextID != nil {
		cid, err := models.ParseContextID(*contextID)
		if err == nil {
			contextIDCleaned = &cid
		}
	}

	var dueAtCleaned *time.Time
	if dueAt != nil {
		t, err := time.Parse(time.RFC3339, *dueAt)
		if err == nil {
			dueAtCleaned = &t
		}
	}

	task, err := models.NewTask(userID, contextIDCleaned, title, description, dueAtCleaned)
	if err != nil {
		return models.Task{}, ErrInvalidData.SetPlace(op).SetCause(err)
	}

	if err = u.repo.CreateTask(ctx, task); err != nil {
		return models.Task{}, handleRepositoryError(op, err)
	}

	return task, nil
}

func (u *Usecase) GetTasksByUserID(ctx context.Context, userIDStr string) ([]models.Task, error) {
	const op = "usecase.GetTasksByUserID"

	userID, err := models.ParseUserID(userIDStr)
	if err != nil {
		return nil, ErrInvalidData.SetPlace(op).SetCause(err)
	}

	tasks, err := u.repo.GetTasksByUserID(ctx, userID)
	if err != nil {
		return nil, handleRepositoryError(op, err)
	}

	return tasks, nil
}

func (u *Usecase) GetTasksDueToday(ctx context.Context, userIDStr string) ([]models.Task, error) {
	const op = "usecase.GetTasksDueToday"

	userID, err := models.ParseUserID(userIDStr)
	if err != nil {
		return nil, ErrInvalidData.SetPlace(op).SetCause(err)
	}

	tasks, err := u.repo.GetTasksDueToday(ctx, userID)
	if err != nil {
		return nil, handleRepositoryError(op, err)
	}

	return tasks, nil
}

func (u *Usecase) GetTaskByID(ctx context.Context, taskIDStr string) (models.Task, error) {
	const op = "usecase.GetTaskByID"

	taskID, err := models.ParseTaskID(taskIDStr)
	if err != nil {
		return models.Task{}, ErrInvalidData.SetPlace(op).SetCause(err)
	}

	task, err := u.repo.GetTaskByID(ctx, taskID)
	if err != nil {
		return models.Task{}, handleRepositoryError(op, err)
	}

	return task, nil
}

func (u *Usecase) UpdateTask(ctx context.Context, taskIDStr string, contextID *string, title, description *string, dueAt *string, status *models.TaskStatus) (models.Task, error) {
	const op = "usecase.UpdateTask"

	taskID, err := models.ParseTaskID(taskIDStr)
	if err != nil {
		return models.Task{}, ErrInvalidData.SetPlace(op).SetCause(err)
	}

	task, err := u.repo.GetTaskByID(ctx, taskID)
	if err != nil {
		return models.Task{}, handleRepositoryError(op, err)
	}

	// Обновляем только переданные поля
	if contextID != nil {
		cid, err := models.ParseContextID(*contextID)
		if err != nil {
			return models.Task{}, ErrInvalidData.SetPlace(op).SetCause(err)
		}
		task.ContextID = &cid
	}
	if title != nil {
		task.Title = *title
	}
	if description != nil {
		task.Description = *description
	}
	if dueAt != nil {
		t, err := time.Parse(time.RFC3339, *dueAt)
		if err != nil {
			return models.Task{}, ErrInvalidData.SetPlace(op).SetCause(err)
		}
		task.DueAt = &t
	}
	if status != nil {
		if err = task.ChangeStatus(*status); err != nil {
			return models.Task{}, ErrInvalidData.SetPlace(op).SetCause(err)
		}
	}

	task.UpdatedAt = time.Now()

	if err = u.repo.UpdateTask(ctx, task); err != nil {
		return models.Task{}, handleRepositoryError(op, err)
	}

	return task, nil
}

func (u *Usecase) UpdateTaskStatus(ctx context.Context, taskIDStr string, status models.TaskStatus) error {
	const op = "usecase.UpdateTaskStatus"

	taskID, err := models.ParseTaskID(taskIDStr)
	if err != nil {
		return ErrInvalidData.SetPlace(op).SetCause(err)
	}

	task, err := u.repo.GetTaskByID(ctx, taskID)
	if err != nil {
		return handleRepositoryError(op, err)
	}

	if err = task.ChangeStatus(status); err != nil {
		return ErrInvalidData.SetPlace(op).SetCause(err)
	}

	if err = u.repo.UpdateTask(ctx, task); err != nil {
		return handleRepositoryError(op, err)
	}

	return nil
}

func (u *Usecase) DeleteTask(ctx context.Context, taskIDStr string) error {
	const op = "usecase.DeleteTask"

	taskID, err := models.ParseTaskID(taskIDStr)
	if err != nil {
		return ErrInvalidData.SetPlace(op).SetCause(err)
	}

	if err := u.repo.DeleteTask(ctx, taskID); err != nil {
		return handleRepositoryError(op, err)
	}

	return nil
}

// ===========================
// Search use cases
// ===========================

func (u *Usecase) Search(ctx context.Context, userIDStr string, query string) (map[string]interface{}, error) {
	const op = "usecase.Search"

	userID, err := models.ParseUserID(userIDStr)
	if err != nil {
		return nil, ErrInvalidData.SetPlace(op).SetCause(err)
	}

	if query == "" {
		return map[string]interface{}{
			"tasks":    []models.Task{},
			"contexts": []models.Context{},
		}, nil
	}

	// Поиск задач
	tasks, err := u.repo.SearchTasks(ctx, userID, query)
	if err != nil {
		return nil, handleRepositoryError(op, err)
	}

	// Поиск контекстов
	contexts, err := u.repo.SearchContexts(ctx, userID, query)
	if err != nil {
		return nil, handleRepositoryError(op, err)
	}

	return map[string]interface{}{
		"tasks":    tasks,
		"contexts": contexts,
	}, nil
}
