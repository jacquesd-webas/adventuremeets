# AdventureMeets Skeleton

Scaffolded monorepo with APIs, database migrations, and a Vite SPA. Everything is dockerized for local development.

## Structure

- `api/`: NestJS HTTP API with Knex-backed Postgres connection.
- `db/`: Knex configuration and migrations.
- `web/`: React + Vite SPA shell.
- `env/`: Environment files (`.env.example` committed; create `.env` for secrets).
- `docker-compose.yml`: Runs Postgres, API, and web together.

## Quick start

1. Create env files where you will need them: `touch api/.env web/.env db/.env`
2. Install per app: `npm install` inside `api/`, `web/`, `db/`.
3. Update the environments: `make env`
4. Start the db and minio `make up`
5. Apply migrations/seeds `make migrate`
6. MinIO console at `http://localhost:9001` (root/minioadmin creds by default).
7. Start mailhog if you want: `docker compose up -d mailhog`
8. Mailhog is available at `http://localhost:8025`

## Testing

- API: Jest setup with `@nestjs/testing` (see `api/jest.config.ts` and `api/test` folder).
- Web: Vitest + Testing Library (`web/vite.config.ts` already includes `test` config).
- DB: Knex migrations; consider integration tests hitting a test database.

## Next steps

- Add real modules/routes to the API and share Knex via `KnexModule`.
- Write first migration (example included) and seed data.
- Add CI to run `npm install`, `npm run lint`/`test` in `api` and `web`.
