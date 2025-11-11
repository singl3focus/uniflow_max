package errs

import (
	"fmt"
)

// Error — базовый тип ошибки внутри проекта.
// Реализует интерфейс error, хранит текст и необязательное вложенное cause.
// Все поля экспортируемы только в пределах пакета через методы.
type Error struct {
	place string // формат: {модуль}.{функция}
	msg   string
	cause error
	meta  map[string]string // простые метаданные, можно расширить
}

var _ error = Error{}

func New(msg string) Error {
	return Error{
		msg:  msg,
		meta: nil,
	}
}

// Wrap оборачивает существующую ошибку в *Error.
// Если err уже *Error — возвращает новую обёртку, сохраняя исходный as-совместимый стек.
func Wrap(err error, msg string) Error {
	if err == nil {
		return Error{}
	}
	e := New(msg)
	e.cause = err
	return e
}

// Error реализует интерфейс error.
func (e Error) Error() string {
	const msgFmt = "%s"
	const placeFmt = " (%s)"
	const causeFmt = ": %v"

	totalFmt := ""
	args := []interface{}{}

	if e.msg != "" {
		totalFmt += msgFmt
		args = append(args, e.msg)
	}
	if e.place != "" {
		totalFmt += placeFmt
		args = append(args, e.place)
	}
	if e.cause != nil {
		totalFmt += causeFmt
		args = append(args, e.cause)
	}

	if totalFmt == "" {
		return ""
	}
	return fmt.Sprintf(totalFmt, args...)
}

func (e Error) Is(target error) bool {
	t, ok := target.(Error)
	if !ok {
		tp, ok := target.(*Error)
		if ok && tp != nil {
			t = *tp
		} else {
			return false
		}
	}

	return e.msg == t.msg
}

// Unwrap поддерживает errors.Unwrap / errors.Is / errors.As
func (e Error) Unwrap() error {
	if e.cause == nil {
		return nil
	}
	return e.cause
}

func (e Error) SetCause(c error) Error {
	e.cause = c
	return e
}

func (e Error) SetPlace(p string) Error {
	e.place = p
	return e
}

func (e Error) SetMeta(m map[string]string) Error {
	if e.meta == nil {
		e.meta = make(map[string]string, len(m))
	}
	for k, v := range m {
		e.meta[k] = v
	}

	return e
}
