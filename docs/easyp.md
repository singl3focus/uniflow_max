# Конспект: тулинг для Protobuf/gRPC — генерация, линт, зависимости, breaking-checks

## О чём это занятие

- Генерация кода через `protoc` + плагины, базовый синтаксис и частые флаги.
- Проблема “одной длинной команды” и зачем её выносить в конфиг/скрипт.
- Nice to have тулсет: линтер/форматер, пакетный менеджер для .proto, автоматический breaking-check.
- Линт-правила и стиль: PascalCase/SnakeCase, enum zero-value, версионирование пакетов (`…/v1`).
- Buf vs альтернативы: плюсы/минусы централизованного реестра.
- Своя утилита (EP/«ZIP»): deps из любого git-хостинга, lockfile, vendor, generate, lint, breaking-check; планы по плагинам для IDE.
- Практика и CI: как склеить всё в pipeline, как жить с преднамеренными breaking-изменениями.

## 1) Генерация кода: базовый `protoc`

Скелет команды:
```bash
protoc \
  -I . -I ./api \
  --plugin=protoc-gen-go=/path/to/protoc-gen-go \
  --plugin=protoc-gen-go-grpc=/path/to/protoc-gen-go-grpc \
  --go_out=pkg --go_opt=paths=source_relative \
  --go-grpc_out=pkg --go-grpc_opt=paths=source_relative \
  api/v1/*.proto
````

Ключевые моменты

* `-I` (или `--proto_path`) — где искать импорты.
* `--plugin=…` — указываем бинарь плагина (абсолютный или в `$PATH`).
* `--<lang>_out=DIR` и `--<lang>_opt=…` — куда класть код и как строить пути (часто `paths=source_relative`).
* Минус one-liner’а: каждый новый плагин/файл → править команду; неудобно для рефакторинга и CI.

## 2) Nice to have тулсет

### Линтер и форматер

* Единый стиль контракта облегчает ревью и интеграцию.
* Типичные правила:

  * ServicePascalCase + ServiceSuffix (`FooService`/`FooAPI`).
  * RPCPascalCase (`GetUser`, `ListUsers`).
  * MessagePascalCase.
  * FieldLowerSnakeCase (`user_id`, `created_at`).
  * Enum zero value с суффиксом (например, `*_UNSPECIFIED`) и индекс 0 зарезервирован под «не задано».
  * Пакет с версией: `my.service.user.v1`.

### Пакетный менеджер для .proto (зачем)

* Тянуть внешние импорты (google types, validate и т.п.) без копипасты и использования `git submodule`
* Работать с корпоративными GitLab/GitHub и приватными репами.
* Держать lockfile (фиксированные версии/коммиты), поддерживать транзитивные зависимости.
* Указывать версии как `repo@vX.Y.Z` или `repo@<commit>`.

### Breaking-check (обратная совместимость)

* Сравнивает текущее состояние `.proto` с состоянием в определенной ветке и проверят было ли нарушение орбатной совметимости, например при:
  * смене field number,
  * удаление полей/методов,
  * изменения сигнатур и т.д.
* Часнтый кейс: добавили `oneof`, а старому полю поменяли номер → сериализация ломается; breaking-check ловит это на ранней стадии.

## 3) Buf: сильные стороны и ограничения

* Что даёт: линтер, breaking-checks, пакетный менеджер/реестр, удобные дефолты.
* Что мешает в корп-средах: централизация (зависимость от их сервера/реестра), кейсы «пропажи» коммита, блокировки в РФ/РБ (VPN в периметре не всегда допустим).

## 4) easyp — утилита из практики

Цель — сохранить удобство Buf, но без централизации и с поддержкой любого git-хоста.

Возможности:
* deps: тянет зависимости напрямую из GitHub/GitLab (в т.ч. приватных), пишет lockfile.
* generate: сам подхватывает импорты из deps при запуске `protoc`.
* lint: совместимый набор правил, с buf. 
* break check: сравнение против ветки (`--against main` и т.п.).
* vendor: складывает исходники зависимостей в каталог `vendor` — IDE получает интроспекцию/автодополнение.

Примеры команд (обобщённо):

```bash
# добавить зависимость и зафиксировать версию
easyp mod update # сформирует/обновит lockfile
easyp mod download   

# сгенерировать код с учётом deps
easyp generate

# запуск линтера
easyp lint 

# проверить обратную совместимость с веткой main
easyp break --against main 

# вендоринг зависимостей в дирректорию easyp_vendor
easyp vendor
```

Конфигурация из практического занятия:
```yaml
version: v1alpha
# https://easyp.tech/guide/cli/linter/linter
lint:
  use:
    # Minimal
    - DIRECTORY_SAME_PACKAGE
    - PACKAGE_DEFINED
    - PACKAGE_DIRECTORY_MATCH
    - PACKAGE_SAME_DIRECTORY

    # Basic
    - ENUM_FIRST_VALUE_ZERO
    - ENUM_NO_ALLOW_ALIAS
    - ENUM_PASCAL_CASE
    - ENUM_VALUE_UPPER_SNAKE_CASE
    - FIELD_LOWER_SNAKE_CASE
    - IMPORT_NO_PUBLIC
    - IMPORT_NO_WEAK
    - IMPORT_USED
    - MESSAGE_PASCAL_CASE
    - ONEOF_LOWER_SNAKE_CASE
    - PACKAGE_LOWER_SNAKE_CASE
    - PACKAGE_SAME_CSHARP_NAMESPACE
    - PACKAGE_SAME_GO_PACKAGE
    - PACKAGE_SAME_JAVA_MULTIPLE_FILES
    - PACKAGE_SAME_JAVA_PACKAGE
    - PACKAGE_SAME_PHP_NAMESPACE
    - PACKAGE_SAME_RUBY_PACKAGE
    - PACKAGE_SAME_SWIFT_PREFIX
    - RPC_PASCAL_CASE
    - SERVICE_PASCAL_CASE

    # Default
    - ENUM_VALUE_PREFIX
    - ENUM_ZERO_VALUE_SUFFIX
    - FILE_LOWER_SNAKE_CASE
    - PACKAGE_VERSION_SUFFIX
    - SERVICE_SUFFIX
  enum_zero_value_suffix: NONE
  service_suffix: API
deps:
  - github.com/googleapis/googleapis
  - github.com/bufbuild/protovalidate@v0.3.1

generate:
  inputs:
    - directory: "api"
    - git_repo:
        url: github.com/sipki-tech/currency@main
  plugins:
    - name: go
      out: ./pkg
      opts:
        paths: source_relative
    - name: go-grpc
      out: ./pkg
      opts:
        paths: source_relative
        require_unimplemented_servers: false
```

## 5) CI/CD: как это собрать

Рекомендуем отдельные jobs/steps:
1. Lint (быстрая обратная связь, можно публиковать отчёты в UI — напр., GitLab Code Quality).
2. Tests (если есть генерация/валидаторы).
3. Breaking-check (обычно блокирующий; если change преднамеренный — см. версионирование).

UX для ревьюеров
* Логи линтера с путями/строками.
* Отчёты в JSON для подсветки прямо в MR/PR (инлайн-комментарии/панель качества).

## 6) Версионирование и совместимость
* Всегда включайте версию в имя пакета: `…/user/v1`.
* При breaking-изменениях — новая мажорная версия (`v2`) и параллельное сосуществование веток на миграционный период.
* Если исторически версии не было, стратегии:
  * ввести `v1` и объявить старое имя устаревшим;
  * сразу начать с `v2`, если переименование пакета уже произошло и важно избежать путаницы — но лучше заранее зафиксировать единый подход командой.

## 7) Q&A из обсуждения

* JSON Schema для конфига? Помогает со структурой (подсказки ключей/типы), но не ловит логические ошибки (дубликаты правил, конфликт опций) — нужен отдельный self-check валидатор (фича в бэклоге).
* Transitive deps и конфликты версий? Поддерживаются; стратегия — брать максимальный minor в рамках одинакового major.
* VS Code/JetBrains поддержка? JetBrains/OpenIDE — в разработке совместный плагин; VS Code — планируется.
* Breaking-check — блокирующий или нет? В прод-процессах обычно блокирующий. Если breaking осознан: делаем новую `vN`, адаптируем потребителей и после — мерж.

## 8) Практические рецепты (чек-лист)
* Заводите lockfile для .proto-deps; тяните зависимости из ваших git-хостов.
* Включите lint и breaking-check в CI как отдельные шаги.
* Примите и задокументируйте политику линтера (Service/RPC/Message/Fields) и версионирования (`…/vN`).
* Никогда не меняйте field number существующих полей; новые — только с новым номером.
* Для преднамеренных breaking-изменений — новый `vN` пакет, а не «тихая» правка старого.
