# AdventureMeets

AdventureMeets is an open-source platform for organising and joining outdoor activities such as hiking, climbing, diving, and other adventure sports.

A free hosted version is provided by the project, while the codebase remains fully open for self-hosting and contribution.

---

## What’s in this repository

This repo contains the **core AdventureMeets application**, structured as a Dockerised monorepo:

### Components

- **Database (`db/`)**
  - Knex configuration
  - Schema migrations and seeds
  - Works with local or containerised Postgres

- **API (`api/`)**
  - NestJS backend
  - Knex-based Postgres access
  - Modular, testable structure
- **Web (`web/`)**
  - React SPA built with Vite
  - Vitest + Testing Library configured

- **Worker (`worker/`)**
  - Node scheduler for background tasks
  - Uses DB for fast read-only and API for writing

- **Mail (`mail/`)**
  - Postfix mail relay
  - Mail hook for incoming mail

- **Env (`env/`)**
  - Environment files
  - Scripts to generate .env locally or on production environment

- **CI (`ci/`)**
  - Scripts used for CI/CD pipeline

- **Infrastructure**
  - Docker Compose for local development
  - S3-compatible object storage
  - MailHog for local email testing

---

## Hosted vs Self-Hosted

### Hosted (recommended for most users)

The AdventureMeets project provides a **free hosted service** intended for communities, clubs, and individuals who just want to organise events without running infrastructure.

### Self-Hosted

You are free to run your own instance:

- For personal use
- For clubs or organisations
- For internal use whether commerical or non-commercial enterprise

If you run a **modified version** as a network-accessible service, the AGPL license requires that you make your modifications available to users.

---

## Quick start (local development)

### Prerequisites

- Docker + Docker Compose
- Node.js + pnpm (matching versions used by the subprojects)
- GNU Make

### Steps

1. Install dependencies per app:

   ```bash
   cd api && pnpm install
   cd ../web && pnpm install
   cd ../worker && pnpm install
   cd ../db && pnpm install
   ```

2. Create and populate environment files:

   ```bash
   touch api/.env web/.env worker/.env db/.env
   make env
   ```

3. Start services:

   Use `make up` to start Postgres and the local S3-compatible storage service.

4. Apply datbase migrations:

   `make migrate` will build a docker container to apply migrations.

5. You can run the API and Web either in docker (built like prod) or in your local node env

   ```bash
   cp env/development.env.example.docker env/development.env
   make env
   docker compose build
   docker compose up -d
   ```

   For development it's usually better to watch the files for changes:

   ```bash
   cp env/development.env.example.local env/development.env
   make env
   make up
   cd api && pnpm start:dev
   cd web && pnpm start:dev
   ```

   Generally the worker doesn't need to be sarted for meaningful work (and often it's in the way):

   ```bash
   cd worker && pnpm start:dev
   ```

6. Generally a good idea to run mailhog so that the mail system doesn't give you errors when failing to send emails.

   Run `docker compose up -d mailhog` to start it.
   - Set `MAIL_SMTP_HOST=host.docker.internal` in development.env
   - Mailhog will be avalable on http://localhost:8025/

### Garage object storage

The API uses the S3 API, so Garage needs no provider-specific application code. Create the bucket and attach the application access key to it with read, write, and owner permissions before deploying.

Set these production environment values:

```dotenv
S3_ENDPOINT=https://s3.garage.example.com
S3_REGION=garage
S3_FORCE_PATH_STYLE=true
S3_BUCKET=meet-images
S3_ACCESS_KEY_ID=your-garage-access-key-id
S3_SECRET_ACCESS_KEY=your-garage-secret-access-key
# Public URL prefix for the bucket, including the bucket name when applicable.
S3_PUBLIC_URL=https://meet-images.web.example.com
```

`S3_PUBLIC_URL` is stored with uploaded images and must remain publicly reachable. It can use Garage's web endpoint or your reverse proxy; it does not have to match the authenticated S3 API endpoint.
`S3_ENDPOINT` must be the root of the authenticated S3 API, with no bucket or path appended.
For Garage's web endpoint, enable public website access for the bucket with `garage bucket website --allow meet-images` and set `S3_PUBLIC_URL` to the resulting bucket hostname.

### Testing

- **API (`api/`)**
  - Jest with @nestjs/testing
  - See api/jest.config.ts and api/test/

- **Web (`web/`)**
  - Vitest + Testing Library
  - Configured in web/vite.config.ts

- **Worker (`worker/`)**
  - Very basic scheduler tests

- **Database (`db/`)**
  - Database
  - Knex migrations
  - Integration testing against a test database is recommended

To quickly run all all tests you can use a make command to run:

- pnpm lint on `api/`, `web/` and `worker/`
- pnpm test on `api/`, `web/` and `worker/`
- pnpm build on `api/`,`web/` and `worker/`

  Use `make test` to run all tests

### Running database migrations

Clear exisitng data and setup a new database from scratch:

    ```make clean && make migrate```

Testing migrations:

    ```cd db/
    pnpm knex migrate:latest --knexfile knexfile.ts
    pnpm knex migrate:rollback --knexfile knexfile.ts```

## Contributing

## AI-assisted code navigation

This repository can be indexed with [graphify](https://github.com/graphify/graphify) to give coding agents a structural view of the API, web app, worker, and database migrations.

Install `uv`, then build the local graph from the repository root:

```bash
make graphify
```

The default target uses graphify's deterministic code-only extractor, so it does not require an API key. The generated report and JSON graph are written to `graphify-out/` and are intentionally ignored by git. After changing the code, refresh only changed files with:

```bash
make graphify-update
```

Useful local queries include:

```bash
uv tool run --from graphifyy graphify query "How does a meet signup move from the web app through the API to the database?"
uv tool run --from graphifyy graphify path "Meet" "Notification"
uv tool run --from graphifyy graphify explain "AuthModule"
```

To include documentation and images, run graphify with a configured supported LLM backend; this is optional and may send scanned content to that provider.

If you use a graphify release that exposes its MCP server, configure that server in your AI client with the repository root as its working directory. Check the installed release with `uv tool run --from graphifyy graphify --help`; the current CLI supports direct graph queries, while MCP availability may vary by release. Keep graphify local unless you have reviewed the generated graph and source-data handling; do not scan `.env` files, secrets, database dumps, uploads, or production data.

Contributions are welcome — whether that’s:

- Features
- Bug fixes
- Documentation
- Design improvements

Please keep changes:

- Small and focused
- Well-tested where applicable
- Aligned with the project’s community-first goals

A more detailed CONTRIBUTING.md will be added as the project grows.

## Sustainability & Sponsors

AdventureMeets is free and open source.

To help cover hosting and operational costs, the hosted platform may display limited, non-intrusive sponsor placements from relevant outdoor and community partners.

There is:

- No behavioural tracking
- No data selling
- No invasive advertising

Self-hosted instances are unaffected.

## License

AdventureMeets is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).

Commercial use is permitted, but any distributed or network-accessible
modifications must be released under the same license.
