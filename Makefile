COMPOSE ?= docker-compose
DB_USER ?= meetplanner
DB_PASSWORD ?= meetplanner
DB_NAME ?= meetplanner
DB_HOST ?= localhost
DB_PORT ?= 5432
DATABASE_URL ?= postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)

.PHONY: db-up db-wait migrate stack-up stack-down clean

db-up:
	$(COMPOSE) up -d db

db-wait: db-up
	@echo "Connecting to postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)"
	@echo "Waiting for database to be ready..."
	@for i in $$(seq 1 10); do \
		if $(COMPOSE) exec -T db pg_isready -U $(DB_USER) >/dev/null 2>&1; then \
			echo "Database is ready"; exit 0; \
		fi; \
		sleep 2; \
	done; \
	echo "Database did not become ready in time" && exit 1

migrate: db-wait
	cd db && DB_HOST=localhost DB_PORT=$(DB_PORT) DB_USER=$(DB_USER) DB_PASSWORD=$(DB_PASSWORD) DB_NAME=$(DB_NAME) npm run migrate

seed-dev: db-wait
	cd db && NODE_ENV=development DB_HOST=localhost DB_PORT=$(DB_PORT) DB_USER=$(DB_USER) DB_PASSWORD=$(DB_PASSWORD) DB_NAME=$(DB_NAME) npm run seed:dev

stack-up:
	$(COMPOSE) up --build -d

stack-down:
	$(COMPOSE) down

clean:
	$(COMPOSE) down -v
