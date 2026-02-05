# Load env files (simple KEY=VALUE lines). Make will ignore them if they don't exist.
-include env/base.env env/development.env

COMPOSE ?= docker-compose
DATABASE_URL ?= postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)

.PHONY: db-up db-wait migrate stack-up stack-down clean env

up:
	$(COMPOSE) up -d db minio

migrate:
	$(COMPOSE) run --build --rm db_migrate

env:
	./env/make-env.sh development

build:
	$(COMPOSE) build

test:
	@echo Running linters...
	cd api @@ pnpm lint
	cd web && pnpm lint
	@echo Testing build...
	cd api && pnpm build
	cd web && pnpm build
	@echo Running tests...
	cd api && pnpm test
	cd web && pnpm test

down:
	$(COMPOSE) down

clean:
	$(COMPOSE) down -v
