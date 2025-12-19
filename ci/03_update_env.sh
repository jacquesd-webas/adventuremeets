#!/bin/sh

set -eu

DEPLOYMENT_TYPE=$1
VERSION=$2

echo "Starting environment file update process for DEPLOYMENT_TYPE=${DEPLOYMENT_TYPE}."

PROJECT_ROOT=$(git rev-parse --show-toplevel)
. $PROJECT_ROOT/ci/common.inc

ENV_TARGET_FILE=".env"
ENV_TARGET_PATH="${DEPLOY_USER}@${WEB_HOST}:${DEPLOY_DIR}/${ENV_TARGET_FILE}"
GENERATED_ENV_DIR="${PROJECT_ROOT}/ci/output"
GENERATED_ENV_FILE="${GENERATED_ENV_DIR}/.env.${DEPLOYMENT_TYPE}"

mkdir -p "$GENERATED_ENV_DIR"

echo "Generating environment file for ${DEPLOYMENT_TYPE}"
"$PROJECT_ROOT/env/make-env.sh" "$DEPLOYMENT_TYPE" "$GENERATED_ENV_FILE"

echo "scp command: scp $SSH_ARGS $GENERATED_ENV_FILE $ENV_TARGET_PATH"
echo "Updating environment file on ${WEB_HOST}"
scp $SSH_ARGS "$GENERATED_ENV_FILE" "$ENV_TARGET_PATH"

echo "Successfully updated environment file ${ENV_TARGET_FILE} on $WEB_HOST."
