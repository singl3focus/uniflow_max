package env

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

const (
	httpPort      = "HTTP_PORT"
	postgresDSN   = "PG_DSN"
	loggerLevel   = "LOGGER_LEVEL"
	jwtSecret     = "JWT_SECRET"
	maxBotToken   = "MAX_BOT_TOKEN"
	maxWebhookURL = "MAX_WEBHOOK_URL"
)

type Config struct{}

func NewConfig() Config {
	return Config{}
}

func (c Config) Load(path string) error {
	return godotenv.Load(path)
}

func (c Config) HTTPPort() int {
	portString := os.Getenv(httpPort)
	if portString == "" {
		panic("var is empty: " + httpPort)
	}

	portInt, err := strconv.Atoi(portString)
	if err != nil {
		panic(err.Error() + " httpPort: " + portString)
	}

	return portInt
}

func (c Config) MaxBotToken() string {
	token := os.Getenv(maxBotToken)
	// MAX_BOT_TOKEN может быть пустым - интеграция с MAX опциональна
	return token
}

func (c Config) MaxWebhookURL() string {
	url := os.Getenv(maxWebhookURL)
	// webhook URL может быть пустым для локальной разработки
	return url
}

func (c Config) PGDSN() string {
	dsn := os.Getenv(postgresDSN)
	if dsn == "" {
		panic("var is empty: " + postgresDSN)
	}

	return dsn
}

func (c Config) LoggerLevel() string {
	dsn := os.Getenv(loggerLevel)
	if dsn == "" {
		panic("var is empty: " + loggerLevel)
	}

	return dsn
}

func (c Config) JWTSecret() string {
	secret := os.Getenv(jwtSecret)
	if secret == "" {
		panic("var is empty: " + jwtSecret)
	}

	return secret
}
