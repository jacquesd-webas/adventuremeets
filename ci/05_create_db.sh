#!/bin/sh 

set -e

CI_DIR=$(dirname $0)
. $CI_DIR/config.sh
. $CI_DIR/utils.sh

APP_NAME=$(get_app_name "${APP_NAME:-}")
SITE_NAME=$(get_app_site "${APP_SITE:-}")
VERSION=$(get_app_version "${VERSION:-}")

if [ -z $DEPLOY_USER ]; then
  echo "Error: DEPLOY_USER is not set in config.sh"
  exit 1
fi

if [ -z $WEB_HOST ]; then
  echo "Error: WEB_HOST is not set in config.sh"
  exit 1
fi

ENVIRONMENT=${ENVIRONMENT:-development}
echo "Using environment: ${ENVIRONMENT}"

echo "Creating database for '$APP_NAME'..."
ssh $SSH_ARGS $DEPLOY_USER@$WEB_HOST <<EOF
cd $SITE_NAME

# Load environment
. .env

DB_ROOT_USER=postgres

if [ -z "\$DB_HOST" ] || [ -z "\$DB_USER" ] || [ -z "\$DB_NAME" ] || [ -z "\$DB_PASSWORD" ]; then
  echo "Error: DB_HOST, DB_USER, DB_NAME, DB_PASSWORD must be set in environment"
  exit 1
fi

# Check if DB already exists
DB_EXIST=\$(psql -U \${DB_ROOT_USER} -lqt | cut -d \| -f 1 | grep -w \${DB_NAME} | wc -l)
if [ "\$DB_EXIST" -eq "1" ]; then
  echo "Database '\${DB_NAME}' already exists. Skipping creation."
  exit 0
fi

# Create the DB
echo "Creating database '\${DB_NAME}' and user '\${DB_USER}'..."
psql -U \${DB_ROOT_USER} <<SQL
CREATE DATABASE \${DB_NAME};
CREATE USER \${DB_USER} WITH ENCRYPTED PASSWORD '\${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON DATABASE \${DB_NAME} TO \${DB_USER};
SQL

# Creat configured extensions
if [ ! -z "\$DB_EXTENSIONS" ]; then
  echo "Creating extensions in database '\${DB_NAME}': \$DB_EXTENSIONS"
  for EXT in \$DB_EXTENSIONS; do
    echo "Creating extension: \$EXT"
    psql -U \${DB_ROOT_USER} -d \${DB_NAME} <<SQL
CREATE EXTENSION IF NOT EXISTS "\$EXT";
GRANT ALL PRIVILEGES ON EXTENSION "\$EXT" TO \${DB_USER};
SQL
  done
fi
EOF
