#!/bin/sh 

set -e

CI_DIR=$(dirname $0)
. $CI_DIR/config.sh
. $CI_DIR/utils.sh

APP_NAME=$(get_app_name "${APP_NAME:-}")
SITE_NAME=$(get_app_site "${APP_SITE:-}")
VERSION=$(get_app_version "${VERSION:-}")

STACK_DEPLOY_FILE=${1:-stack-deploy.yml}

if [ -z $DEPLOY_USER ]; then
  echo "Error: DEPLOY_USER is not set in config.sh"
  exit 1
fi

if [ -z $WEB_HOST ]; then
  echo "Error: WEB_HOST is not set in config.sh"
  exit 1
fi

echo "Deploying stack for '$APP_NAME:$VERSION'..."
ssh $SSH_ARGS $DEPLOY_USER@$WEB_HOST <<EOF
cd $SITE_NAME

VERSION=${VERSION} docker stack deploy -c ${STACK_DEPLOY_FILE} ${APP_NAME}
EOF
