# Load env files (simple KEY=VALUE lines). Make will ignore them if they don't exist.
-include env/base.env env/development.env

COMPOSE ?= docker-compose
DATABASE_URL ?= postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)

.PHONY: db-up db-wait migrate stack-up stack-down clean env graphify graphify-update garage-init

up:
	$(COMPOSE) up -d --wait db garage mailhog
	$(MAKE) garage-init

garage-init:
	@if ! $(COMPOSE) exec -T garage /garage bucket info attendee-items >/dev/null 2>&1; then \
		$(COMPOSE) exec -T garage /garage bucket create attendee-items; \
	fi
	@$(COMPOSE) exec -T garage /garage bucket allow --read --write --owner attendee-items --key $(GARAGE_DEFAULT_ACCESS_KEY)

migrate:
	$(COMPOSE) run --build --rm db_migrate

env:
	./env/make-env.sh development

build:
	$(COMPOSE) build

test:
	@echo Running linters...
	cd api && pnpm lint
	cd web && pnpm lint
	cd worker && pnpm lint
	@echo Testing build...
	cd api && pnpm build
	cd web && pnpm build
	cd worker && pnpm build
	@echo Running tests...
	cd api && pnpm test
	cd web && pnpm test
	cd worker && pnpm test
	

down:
	$(COMPOSE) down

clean:
	$(COMPOSE) down -v

graphify:
	uv tool run --from graphifyy graphify . --code-only --no-viz

graphify-update:
	uv tool run --from graphifyy graphify . --update --code-only --no-viz
