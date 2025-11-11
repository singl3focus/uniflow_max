package app

// import (
// 	"context"
// 	"errors"
// 	"net/http"

// 	"gitlab.e-m-l.ru/devkit/logger"
// 	"go.uber.org/fx"

// 	inhttp "gitlab.e-m-l.ru/go-semd/universal_semd/internal/adapters/http"
// 	"gitlab.e-m-l.ru/go-semd/universal_semd/internal/adapters/http/handlers"
// 	"gitlab.e-m-l.ru/go-semd/universal_semd/internal/adapters/storage/sqlite3"
// 	"gitlab.e-m-l.ru/go-semd/universal_semd/internal/config"
// 	"gitlab.e-m-l.ru/go-semd/universal_semd/internal/usecases"
// )

// func App() *fx.App {
// 	return fx.New(
// 		fx.NopLogger,

// 		fx.Provide(
// 			config.MustLoad,
// 		),

// 		LoggingModule,

// 		RepositoryModule,
// 		ServiceModule,
// 		HttpServerModule,
// 	)
// }

// func ProvideLoggers(cfg *config.AppConfig) (*logger.BaseLogger, *logger.Logger) {
// 	loggerCfg := logger.NewLoggingConfig(
// 		cfg.Logging.Enable,
// 		cfg.Logging.Level,
// 		cfg.Logging.Format,
// 		cfg.Logging.Dir,
// 		uint(cfg.Logging.SavingDays),
// 	)

// 	bl := logger.NewBaseLogger("VERSION", cfg.AppVersion, loggerCfg, logger.WithDailyLogDelete())
// 	ml := logger.NewModuleLogger("SEMD", "API", bl)

// 	return bl, ml
// }

// var LoggingModule = fx.Module("logging_module",
// 	fx.Provide(ProvideLoggers),
// 	fx.Invoke(logger.InvokeBaseLogger),
// )

// func InvokeHttpServer(lc fx.Lifecycle, server *http.Server) {
// 	lc.Append(
// 		fx.Hook{
// 			OnStart: func(ctx context.Context) error {
// 				go func() {
// 					server.ListenAndServe()
// 				}()

// 				return nil
// 			},

// 			OnStop: func(ctx context.Context) error {
// 				if err := server.Close(); err != nil {
// 					if errors.Is(err, http.ErrServerClosed) {
// 						return nil
// 					}
// 					return err
// 				}

// 				return nil
// 			},
// 		},
// 	)
// }

// var HttpServerModule = fx.Module("http_server_module",
// 	fx.Provide(
// 		handlers.NewHandler,
// 		handlers.ProvideRouter,
// 		inhttp.HttpServer,
// 	),
// 	fx.Invoke(InvokeHttpServer),
// )

// var RepositoryModule = fx.Module("postgres_module",
// 	fx.Provide(sqlite3.NewRepository),
// )

// var ServiceModule = fx.Module("service_module",
// 	fx.Provide(usecases.NewUsecases),
// )
