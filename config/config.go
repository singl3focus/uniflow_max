package config

import "github.com/singl3focus/uniflow/config/env"

type Config interface {
	Load(path string) error

	HTTPConfig
	PGConfig
	LoggerConfig
	JWTConfig
	MaxConfig
}

type LoggerConfig interface {
	LoggerLevel() string
}

type JWTConfig interface {
	JWTSecret() string
}

type HTTPConfig interface {
	HTTPPort() int
}

type PGConfig interface {
	PGDSN() string
}

type MaxConfig interface {
	MaxBotToken() string
	MaxWebhookURL() string
}

type ConfigType int

const (
	ENV ConfigType = iota
	YAML
	JSON
)

func NewConfig(option ConfigType) Config {
	switch option {
	case ENV:
		return env.NewConfig()
	case YAML:
		fallthrough
	case JSON:
		panic("not implemented")
	}
	return nil
}
