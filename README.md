# AdventureMeets Skeleton

Scaffolded monorepo with APIs, database migrations, and a Vite SPA. Everything is dockerized for local development.

## Structure
- `api/`: NestJS HTTP API with Knex-backed Postgres connection.
- `db/`: Knex configuration and migrations.
- `web/`: React + Vite SPA shell.
- `env/`: Environment files (`.env.example` committed; create `.env` for secrets).
- `docker-compose.yml`: Runs Postgres, API, and web together.

## Quick start
1. Copy env: `cp env/.env.example env/.env` and adjust secrets/ports.
2. Install per app: `npm install` inside `api/`, `web/`, `db/`, and `packages/shared` (shared builds on prepare).
3. Build and run stacks: `docker-compose up --build`.
   - API runs on `http://localhost:3000`
   - Web runs on `http://localhost:5173`
4. Apply migrations/seeds inside the API container: `docker-compose exec api npm run migrate`.
5. MinIO console at `http://localhost:9001` (root/minioadmin creds by default).

## Testing
- API: Jest setup with `@nestjs/testing` (see `api/jest.config.ts` and `api/test` folder).
- Web: Vitest + Testing Library (`web/vite.config.ts` already includes `test` config).
- DB: Knex migrations; consider integration tests hitting a test database.

## Next steps
- Add real modules/routes to the API and share Knex via `KnexModule`.
- Write first migration (example included) and seed data.
- Add CI to run `npm install`, `npm run lint`/`test` in `api` and `web`.
