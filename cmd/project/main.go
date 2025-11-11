package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/singl3focus/uniflow/config"
	inhttp "github.com/singl3focus/uniflow/internal/adapters/http"
	"github.com/singl3focus/uniflow/internal/adapters/max"
	"github.com/singl3focus/uniflow/internal/adapters/postgres"
	"github.com/singl3focus/uniflow/internal/core/usecase"
	zerologger "github.com/singl3focus/uniflow/pkg/logger/zerolog-wrap"
)

func main() {
	cfg := config.NewConfig(config.ENV)
	if err := cfg.Load("config.env"); err != nil {
		panic(err)
	}

	log := zerologger.NewZeroLogger(os.Stdout, cfg.LoggerLevel())

	repo := postgres.NewPostgres(cfg.PGDSN())
	defer repo.Close()
	uc := usecase.NewUsecase(repo)

	// Инициализация MAX клиента (опционально)
	var maxWebhook http.Handler
	if cfg.MaxBotToken() != "" {
		maxClient, err := max.NewClient(cfg.MaxBotToken())
		if err != nil {
			log.Warn("failed to initialize MAX client", "error", err)
		} else {
			log.Info("MAX client initialized successfully")

			// Настройка webhook если указан URL
			if cfg.MaxWebhookURL() != "" {
				ctx := context.Background()
				if err := maxClient.SetWebhook(ctx, cfg.MaxWebhookURL()); err != nil {
					log.Error("failed to set MAX webhook", "error", err)
				} else {
					log.Info("MAX webhook set successfully", "url", cfg.MaxWebhookURL())
				}
			}

			// Создание обработчика webhook
			updateHandler := &max.DefaultUpdateHandler{}
			maxWebhook = max.NewWebhookHandler(maxClient, updateHandler)
		}
	} else {
		log.Warn("MAX bot token not configured, MAX integration disabled")
	}

	handler := inhttp.NewHandler(log, uc, maxWebhook)

	addr := fmt.Sprintf(":%d", cfg.HTTPPort())
	srv := &http.Server{
		Addr:         addr,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Запуск сервера в горутине
	errCh := make(chan error, 1)
	go func() {
		log.Info("Starting HTTP server", "addr", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- err
		}
		close(errCh)
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	defer signal.Stop(sigCh)

	select {
	case sig := <-sigCh:
		log.Info("shutdown signal received", "signal", sig.String())
	case err := <-errCh:
		if err != nil {
			log.Error("server exited unexpectedly", "error", err.Error())
		} else {
			log.Info("server goroutine finished without error")
		}
	}

	// Завершение работы сервера
	log.Info("shutting down server")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Error("server shutdown failed", "error", err)
	}

	if err := log.Flush(); err != nil {
		log.Error("Failed to flush logs", "error", err)
	}
	log.Info("server shutdown complete")
}
