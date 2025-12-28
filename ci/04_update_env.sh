#!/bin/sh

set -eu

CI_DIR=$(dirname $0)
. $CI_DIR/config.sh
. $CI_DIR/utils.sh

# Args
DEPLOYMENT_TYPE=${1:-production}

DEPLOY_DIR=$(get_app_site "${APP_SITE:-}")
ENV_DIR=$CI_DIR/../env

if [ -z "$DEPLOY_DIR" ]; then
    echo "Error: DEPLOY_DIR is not set. Please check APP_SITE configuration."
    exit 1
fi

if [ ! -f "$ENV_DIR/make-env.sh" ]; then
    echo "Error: Environment generation script not found at $ENV_DIR/make-env.sh"
    exit 1
fi

echo "Starting environment file update process for DEPLOYMENT_TYPE=${DEPLOYMENT_TYPE}."

ENV_TMP_FILE=$(mktemp)
trap 'rm -f "$ENV_TMP_FILE"' EXIT

ENV_TARGET_PATH="${DEPLOY_USER}@${WEB_HOST}:${DEPLOY_DIR}/.env"

echo "Generating environment file for ${DEPLOYMENT_TYPE}"
"$ENV_DIR/make-env.sh" "$DEPLOYMENT_TYPE" "$ENV_TMP_FILE"

echo "scp command: scp $SSH_ARGS $ENV_TMP_FILE $ENV_TARGET_PATH"
echo "Updating environment file on ${WEB_HOST}"
scp $SSH_ARGS "$ENV_TMP_FILE" "$ENV_TARGET_PATH"

echo "Successfully updated environment file ${ENV_TARGET_PATH}"