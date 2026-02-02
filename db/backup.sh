#!/bin/sh
set -e

DB_BACKUP_PATH=${1:-/backup/db-backup-$(date +%Y%m%d%H%M%S).sql}

if [ -z "${DB_HOST}" ]; then
  echo "DB_HOST is not set; defaulting to 'db'"
  DB_HOST="db"
fi
if [ -z "${DB_PORT}" ]; then
  echo "DB_PORT is not set; defaulting to '5432'"
  DB_PORT="5432"
fi
if [ -z "${DB_USER}" ]; then
  echo "No DB_USER set; cannot proceed with backup"
  exit 1
fi
if [ -z "${DB_NAME}" ]; then
  echo "No DB_NAME set; cannot proceed with backup"
  exit 1
fi
if [ -z "${DB_PASSWORD}" ]; then
  echo "No DB_PASSWORD set; cannot proceed with backup"
  exit 1
fi

BACKUP_DIR=$(dirname "$DB_BACKUP_PATH")
if [ ! -d $BACKUP_DIR ]; then
  echo "$BACKUP_DIR is not mounted, cannot make backups there. Skipping backup."
  exit 0
fi

echo "Creating backup of ${DB_NAME} at ${DB_HOST}:${DB_PORT} -> ${DB_BACKUP_PATH}"

export PGPASSWORD="${DB_PASSWORD}"
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -F p > "$DB_BACKUP_PATH"

echo "Backup complete: $DB_BACKUP_PATH"
