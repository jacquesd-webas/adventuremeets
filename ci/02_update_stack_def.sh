#!/bin/sh

# Script to update the stack definition file on the remote host

# Parameters
STACK_DEPLOY_FILENAME=$1
TARGET_DIR=$2
VERSION=$2

# Determine the project root directory
PROJECT_ROOT=$(git rev-parse --show-toplevel)

# Source common variables
. $PROJECT_ROOT/ci/common.inc

# Stack deploy directory and filename
STACK_DEPLOY_SRC_FILE="${PROJECT_ROOT}/ci/$STACK_DEPLOY_FILENAME"
STACK_DEPLOY_DEST_FILE="${TARGET_DIR}/stack-deploy.yml"

# Copy the stack deploy file to the remote host
echo "Updating $STACK_DEPLOY_FILE for '$STACK_NAME:$VERSION' from $STACK_DEPLOY_SRC_DIR"
scp $SSH_ARGS $STACK_DEPLOY_SRC_FILE $DEPLOY_USER@$WEB_HOST:./$STACK_DEPLOY_DEST_FILE

if [ $? -eq 0 ]; then
    echo "Successfully updated stack deploy $STACK_NAME version $VERSION at $WEB_HOST."
else
    echo "Failed to update stack deployment file. Please check the logs for errors."
    exit 1
fi