#!/bin/sh
set -e

if [ -z "${DB_HOST}" ]; then
  echo "DB_HOST is not set; defaulting to 'db'"
  DB_HOST="db"
fi
if [ -z "${DB_PORT}" ]; then
  echo "DB_PORT is not set; defaulting to '5432'"
  DB_PORT="5432"
fi
if [ -z "${DB_USER}" ]; then
  echo "No DB_USER set; cannot proceed with migrations"
  exit 1
fi
if [ -z "${DB_PASSWORD}" ]; then
  echo "No DB_PASSWORD set; cannot proceed with migrations"
  exit 1
fi
if [ -z "${DB_NAME}" ]; then
  echo "No DB_NAME set; cannot proceed with migrations"
  exit 1
fi

echo "Connecting to postgres://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME} to run migrations"
echo "Waiting for database to be ready..."
ready=0
for i in $(seq 1 10); do
  if pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" >/dev/null 2>&1; then
    echo "Database is ready"
    ready=1
    break
  fi
  sleep 2
done

if [ "$ready" -ne 1 ]; then
  echo "Database did not become ready in time"
  exit 1
fi

echo "Running backup..."
./backup.sh ./backup/pre-migration-backup-$(date +%Y%m%d%H%M%S).sql

echo "Running migrations..."
pnpm run migrate

if [ "${DB_SEED_DATA}" = "1" ]; then
  echo "DB_SEED_DATA=1 -> running seed:dev..."
  pnpm run seed:dev
else
  echo "DB_SEED_DATA not set to 1; skipping seeds."
fi
