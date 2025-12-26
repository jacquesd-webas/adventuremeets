#!/bin/sh

# Script to update the stack definition file on the remote webapp server

CI_DIR=$(dirname $0)
source $CI_DIR/config.sh
source $CI_DIR/utils.sh

SITE_NAME=$(get_app_site "${APP_SITE:-}")
VERSION=$(get_app_version "${VERSION:-}")
APP_NAME=$(get_app_name "${APP_NAME:-}")

# Parameters
STACK_DEPLOY_FILE=${1:-stack-deploy.yml}

# Stack deploy directory and filename
STACK_DEPLOY_SRC_FILE="$CI_DIR/$STACK_DEPLOY_FILE"
STACK_DEPLOY_DEST_FILE="${TARGET_DIR}/stack-deploy.yml"

# Copy the stack deploy file to the remote host
echo "Updating $STACK_DEPLOY_FILE for '$APP_NAME:$VERSION' from $STACK_DEPLOY_SRC_FILE to $WEB_HOST:$STACK_DEPLOY_DEST_FILE"
scp $SSH_ARGS $STACK_DEPLOY_SRC_FILE $DEPLOY_USER@$WEB_HOST:./$STACK_DEPLOY_DEST_FILE

if [ $? -eq 0 ]; then
    echo "Successfully updated stack deploy $APP_NAME version $VERSION at $WEB_HOST."
else
    echo "Failed to update stack deployment file. Please check the logs for errors."
    exit 1
fi