# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /build

# Копируем go.mod и go.sum для кеширования зависимостей
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# Копируем исходный код
COPY . .

# Собираем статический бинарник
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s" \
    -o app \
    ./cmd/project/main.go

# Final stage
FROM alpine:3.19

ARG TZ=Europe/Moscow

WORKDIR /app

# Устанавливаем сертификаты и настраиваем timezone
RUN apk add --no-cache ca-certificates tzdata && \
    cp /usr/share/zoneinfo/${TZ} /etc/localtime && \
    echo "${TZ}" > /etc/timezone && \
    apk del tzdata

# Копируем бинарник из builder stage
COPY --from=builder /build/app .

# Копируем конфигурационный файл
COPY build/docker/configs/config.env ./config.env

# Создаем непривилегированного пользователя
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 50031

CMD ["./app", "--config-path=./config.env"]