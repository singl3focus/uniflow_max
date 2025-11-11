package usecase

import (
	"context"
	"errors"
	"time"

	"github.com/singl3focus/uniflow/internal/core/models"
	"github.com/singl3focus/uniflow/internal/core/ports/repository"
	"github.com/singl3focus/uniflow/pkg/errs"
)

type Usecase struct {
	repo repository.Repository
}

func NewUsecase(r repository.Repository) *Usecase {
	return &Usecase{repo: r}
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

// User use cases
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

// Context use cases
func (u *Usecase) CreateContext(ctx context.Context, userID models.UserID, contextType models.ContextType, title, description, color string, subjectID *string, deadlineAt *time.Time) (models.Context, error) {
	const op = "usecase.CreateContext"

	context, err := models.NewContext(userID, contextType, title, description, color, subjectID, deadlineAt)
	if err != nil {
		return models.Context{}, ErrInvalidData.SetPlace(op).SetCause(err)
	}

	if err = u.repo.CreateContext(ctx, context); err != nil {
		return models.Context{}, handleRepositoryError(op, err)
	}

	return context, nil
}

func (u *Usecase) GetContextsByUserID(ctx context.Context, userID models.UserID) ([]models.Context, error) {
	const op = "usecase.GetContextsByUserID"

	contexts, err := u.repo.GetContextsByUserID(ctx, userID)
	if err != nil {
		return nil, handleRepositoryError(op, err)
	}

	return contexts, nil
}

// Task use cases
func (u *Usecase) CreateTask(ctx context.Context, userID models.UserID, contextID *models.ContextID, title, description string, dueAt *time.Time) (models.Task, error) {
	const op = "usecase.CreateTask"

	task, err := models.NewTask(userID, contextID, title, description, dueAt)
	if err != nil {
		return models.Task{}, ErrInvalidData.SetPlace(op).SetCause(err)
	}

	if err = u.repo.CreateTask(ctx, task); err != nil {
		return models.Task{}, handleRepositoryError(op, err)
	}

	return task, nil
}

func (u *Usecase) GetTasksByUserID(ctx context.Context, userID models.UserID) ([]models.Task, error) {
	const op = "usecase.GetTasksByUserID"

	tasks, err := u.repo.GetTasksByUserID(ctx, userID)
	if err != nil {
		return nil, handleRepositoryError(op, err)
	}

	return tasks, nil
}

func (u *Usecase) GetTasksDueToday(ctx context.Context, userID models.UserID) ([]models.Task, error) {
	const op = "usecase.GetTasksDueToday"

	tasks, err := u.repo.GetTasksDueToday(ctx, userID)
	if err != nil {
		return nil, handleRepositoryError(op, err)
	}

	return tasks, nil
}

func (u *Usecase) UpdateTaskStatus(ctx context.Context, taskID models.TaskID, status models.TaskStatus) error {
	const op = "usecase.UpdateTaskStatus"

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
