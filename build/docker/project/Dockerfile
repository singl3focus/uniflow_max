# Build stage
FROM golang:1.25.1 AS builder

WORKDIR /opt/auth
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN mkdir -p bin && CGO_ENABLED=0 GOOS=linux go build -o bin/app ./cmd/project/main.go

# Final stage
FROM alpine:latest

ARG TZ

WORKDIR /opt/auth

RUN apk add --no-cache ca-certificates tzdata

RUN cp /usr/share/zoneinfo/${TZ} /etc/localtime && \
    echo "${TZ}" > /etc/timezone
    
COPY --from=builder /opt/auth/bin/app .
COPY --from=builder /opt/auth/build/docker/configs/config.env .

RUN chmod +x ./app

RUN ls -laR > /ls_output.txt && cat /ls_output.txt
RUN cat ./config.env

CMD [ "./app", "--config-path=./config.env" ]