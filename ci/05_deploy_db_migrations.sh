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

echo "Deploying migrations for '$APP_NAME:$VERSION'..."
ssh $SSH_ARGS $DEPLOY_USER@$WEB_HOST <<EOF
cd $SITE_NAME

# Ensure a local backups directory exists and mount it into the container
mkdir -p backups
VERSION=${VERSION} docker compose -f stack-deploy.yml run --rm -v "\$PWD/backups:/app/db/backup" db_migrate
EOF
