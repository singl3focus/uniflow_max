# PowerShell скрипт для тестирования API
# Для Windows PowerShell 5.1+

$BaseUrl = "http://localhost:50031"
$Token = ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "UniFlow API - Тестирование с PowerShell" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Функция для выполнения HTTP запросов
function Invoke-APIRequest {
    param (
        [string]$Method,
        [string]$Uri,
        [hashtable]$Headers = @{},
        [object]$Body = $null
    )
    
    try {
        $params = @{
            Method = $Method
            Uri = $Uri
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        return $response
    }
    catch {
        Write-Host "Ошибка: $_" -ForegroundColor Red
        return $null
    }
}

# 1. Health Check
Write-Host "`n1. Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Method Get -Uri "$BaseUrl/health"
    Write-Host "✓ Сервер доступен: $health" -ForegroundColor Green
}
catch {
    Write-Host "✗ Сервер недоступен" -ForegroundColor Red
    exit 1
}

# 2. Аутентификация
Write-Host "`n2. Аутентификация через MAX" -ForegroundColor Yellow
$authBody = @{
    max_user_id = "123456789"
}

$authResponse = Invoke-APIRequest -Method Post -Uri "$BaseUrl/api/auth/max" -Body $authBody
if ($authResponse) {
    $Token = $authResponse.token
    $UserId = $authResponse.user_id
    Write-Host "✓ Токен получен" -ForegroundColor Green
    Write-Host "  User ID: $UserId"
    $authResponse | ConvertTo-Json | Write-Host
}
else {
    Write-Host "✗ Ошибка получения токена" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $Token"
}

# 3. Создать контекст - Учёба
Write-Host "`n3. Создать контекст - Математика" -ForegroundColor Yellow
$context1Body = @{
    type = "study"
    title = "Математика"
    description = "Высшая математика, 3 курс"
    color = "#FF5733"
    subject_id = $null
    deadline_at = "2025-12-31T23:59:59Z"
}

$context1 = Invoke-APIRequest -Method Post -Uri "$BaseUrl/api/contexts" -Headers $headers -Body $context1Body
if ($context1) {
    $Context1Id = $context1.id
    Write-Host "✓ Контекст создан: $Context1Id" -ForegroundColor Green
    $context1 | ConvertTo-Json | Write-Host
}

# 4. Создать контекст - Проект
Write-Host "`n4. Создать контекст - Дипломный проект" -ForegroundColor Yellow
$context2Body = @{
    type = "project"
    title = "Дипломный проект"
    description = "Разработка веб-приложения"
    color = "#3498DB"
    subject_id = $null
    deadline_at = "2026-06-01T00:00:00Z"
}

$context2 = Invoke-APIRequest -Method Post -Uri "$BaseUrl/api/contexts" -Headers $headers -Body $context2Body
if ($context2) {
    $Context2Id = $context2.id
    Write-Host "✓ Контекст создан: $Context2Id" -ForegroundColor Green
    $context2 | ConvertTo-Json | Write-Host
}

# 5. Создать контекст - Личное
Write-Host "`n5. Создать контекст - Спорт" -ForegroundColor Yellow
$context3Body = @{
    type = "personal"
    title = "Спорт"
    description = "Тренировки и здоровье"
    color = "#2ECC71"
    subject_id = $null
    deadline_at = $null
}

$context3 = Invoke-APIRequest -Method Post -Uri "$BaseUrl/api/contexts" -Headers $headers -Body $context3Body
if ($context3) {
    $Context3Id = $context3.id
    Write-Host "✓ Контекст создан: $Context3Id" -ForegroundColor Green
}

# 6. Получить все контексты
Write-Host "`n6. Получить все контексты" -ForegroundColor Yellow
$contexts = Invoke-APIRequest -Method Get -Uri "$BaseUrl/api/contexts" -Headers $headers
if ($contexts) {
    Write-Host "✓ Получено контекстов: $($contexts.contexts.Count)" -ForegroundColor Green
    $contexts | ConvertTo-Json -Depth 5 | Write-Host
}

# 7. Создать задачу 1
Write-Host "`n7. Создать задачу - Домашнее задание" -ForegroundColor Yellow
$task1Body = @{
    context_id = $Context1Id
    title = "Решить задачи по матанализу"
    description = "Глава 5, задачи 1-15"
    due_at = "2025-11-15T18:00:00Z"
}

$task1 = Invoke-APIRequest -Method Post -Uri "$BaseUrl/api/tasks" -Headers $headers -Body $task1Body
if ($task1) {
    $Task1Id = $task1.id
    Write-Host "✓ Задача создана: $Task1Id" -ForegroundColor Green
    $task1 | ConvertTo-Json | Write-Host
}

# 8. Создать задачу 2 - на сегодня
Write-Host "`n8. Создать задачу - Срочная на сегодня" -ForegroundColor Yellow
$todayDate = (Get-Date).ToString("yyyy-MM-ddT17:00:00Z")
$task2Body = @{
    context_id = $null
    title = "Позвонить врачу"
    description = "Записаться на приём"
    due_at = $todayDate
}

$task2 = Invoke-APIRequest -Method Post -Uri "$BaseUrl/api/tasks" -Headers $headers -Body $task2Body
if ($task2) {
    $Task2Id = $task2.id
    Write-Host "✓ Задача создана: $Task2Id" -ForegroundColor Green
}

# 9. Создать задачу 3 - Проект
Write-Host "`n9. Создать задачу - Документация" -ForegroundColor Yellow
$task3Body = @{
    context_id = $Context2Id
    title = "Написать документацию API"
    description = "OpenAPI спецификация"
    due_at = "2025-11-20T23:59:59Z"
}

$task3 = Invoke-APIRequest -Method Post -Uri "$BaseUrl/api/tasks" -Headers $headers -Body $task3Body
if ($task3) {
    $Task3Id = $task3.id
    Write-Host "✓ Задача создана: $Task3Id" -ForegroundColor Green
}

# 10. Создать задачу 4 - Спорт
Write-Host "`n10. Создать задачу - Тренировка" -ForegroundColor Yellow
$task4Body = @{
    context_id = $Context3Id
    title = "Тренировка в спортзале"
    description = "Силовая тренировка, 1.5 часа"
    due_at = "2025-11-14T19:00:00Z"
}

$task4 = Invoke-APIRequest -Method Post -Uri "$BaseUrl/api/tasks" -Headers $headers -Body $task4Body
if ($task4) {
    $Task4Id = $task4.id
    Write-Host "✓ Задача создана: $Task4Id" -ForegroundColor Green
}

# 11. Получить все задачи
Write-Host "`n11. Получить все задачи" -ForegroundColor Yellow
$tasks = Invoke-APIRequest -Method Get -Uri "$BaseUrl/api/tasks" -Headers $headers
if ($tasks) {
    Write-Host "✓ Получено задач: $($tasks.tasks.Count)" -ForegroundColor Green
    $tasks | ConvertTo-Json -Depth 5 | Write-Host
}

# 12. Получить задачи на сегодня
Write-Host "`n12. Получить задачи на сегодня" -ForegroundColor Yellow
$todayTasks = Invoke-APIRequest -Method Get -Uri "$BaseUrl/api/tasks/today" -Headers $headers
if ($todayTasks) {
    Write-Host "✓ Задач на сегодня: $($todayTasks.tasks.Count)" -ForegroundColor Green
    $todayTasks | ConvertTo-Json -Depth 5 | Write-Host
}

# 13. Обновить статус задачи - в процессе
Write-Host "`n13. Обновить статус задачи - в процессе" -ForegroundColor Yellow
$statusBody = @{
    status = "in_progress"
}

$statusUpdate = Invoke-APIRequest -Method Patch -Uri "$BaseUrl/api/tasks/$Task1Id/status" -Headers $headers -Body $statusBody
if ($statusUpdate) {
    Write-Host "✓ Статус обновлён" -ForegroundColor Green
    $statusUpdate | ConvertTo-Json | Write-Host
}

# 14. Обновить задачу
Write-Host "`n14. Обновить задачу" -ForegroundColor Yellow
$updateTaskBody = @{
    context_id = $Context1Id
    title = "Решить задачи по матанализу (обновлено)"
    description = "Глава 5, задачи 1-20 + дополнительные"
    due_at = "2025-11-16T18:00:00Z"
}

$taskUpdate = Invoke-APIRequest -Method Patch -Uri "$BaseUrl/api/tasks/$Task1Id" -Headers $headers -Body $updateTaskBody
if ($taskUpdate) {
    Write-Host "✓ Задача обновлена" -ForegroundColor Green
    $taskUpdate | ConvertTo-Json | Write-Host
}

# 15. Получить задачу по ID
Write-Host "`n15. Получить задачу по ID" -ForegroundColor Yellow
$task = Invoke-APIRequest -Method Get -Uri "$BaseUrl/api/tasks/$Task1Id" -Headers $headers
if ($task) {
    Write-Host "✓ Задача получена" -ForegroundColor Green
    $task | ConvertTo-Json -Depth 5 | Write-Host
}

# 16. Поиск
Write-Host "`n16. Поиск по запросу 'математика'" -ForegroundColor Yellow
$searchResults = Invoke-APIRequest -Method Get -Uri "$BaseUrl/api/search?q=математика" -Headers $headers
if ($searchResults) {
    Write-Host "✓ Результаты поиска получены" -ForegroundColor Green
    $searchResults | ConvertTo-Json -Depth 5 | Write-Host
}

# 17. Поиск - документация
Write-Host "`n17. Поиск по запросу 'документация'" -ForegroundColor Yellow
$searchResults2 = Invoke-APIRequest -Method Get -Uri "$BaseUrl/api/search?q=документация" -Headers $headers
if ($searchResults2) {
    Write-Host "✓ Результаты поиска получены" -ForegroundColor Green
    $searchResults2 | ConvertTo-Json -Depth 5 | Write-Host
}

# 18. Обновить контекст
Write-Host "`n18. Обновить контекст" -ForegroundColor Yellow
$updateContextBody = @{
    type = "study"
    title = "Математика (обновлено)"
    description = "Высшая математика, 3 курс - подготовка к экзамену"
    color = "#E74C3C"
    subject_id = $null
    deadline_at = "2025-12-20T23:59:59Z"
}

$contextUpdate = Invoke-APIRequest -Method Patch -Uri "$BaseUrl/api/contexts/$Context1Id" -Headers $headers -Body $updateContextBody
if ($contextUpdate) {
    Write-Host "✓ Контекст обновлён" -ForegroundColor Green
    $contextUpdate | ConvertTo-Json | Write-Host
}

# 19. Отметить задачу выполненной
Write-Host "`n19. Отметить задачу выполненной" -ForegroundColor Yellow
$completeBody = @{
    status = "completed"
}

$completeUpdate = Invoke-APIRequest -Method Patch -Uri "$BaseUrl/api/tasks/$Task2Id/status" -Headers $headers -Body $completeBody
if ($completeUpdate) {
    Write-Host "✓ Задача отмечена выполненной" -ForegroundColor Green
}

# 20. Получить контекст по ID
Write-Host "`n20. Получить контекст по ID" -ForegroundColor Yellow
$contextById = Invoke-APIRequest -Method Get -Uri "$BaseUrl/api/contexts/$Context1Id" -Headers $headers
if ($contextById) {
    Write-Host "✓ Контекст получен" -ForegroundColor Green
    $contextById | ConvertTo-Json -Depth 5 | Write-Host
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "Тестирование завершено!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "`nСоздано:"
Write-Host "  - Пользователь: $UserId"
Write-Host "  - Контексты: $Context1Id, $Context2Id, $Context3Id"
Write-Host "  - Задачи: $Task1Id, $Task2Id, $Task3Id, $Task4Id"
Write-Host "`nДля очистки используйте команды DELETE или перезапустите БД"
