#!/bin/sh 

NEED_SSH=1

PROJECT_ROOT=$(git rev-parse --show-toplevel)
. $PROJECT_ROOT/ci/common.inc

echo "Deploying database migrations for '$STACK_NAME:$VERSION' from $PROJECT_ROOT"

echo "Running backup..."
ssh $SSH_ARGS -l $DEPLOY_USER $WEB_HOST "cd $STACK_NAME && export VERSION=$VERSION && docker compose -f stack-deploy.yml run --rm backup_runner"

echo "Pulling latest image..."
ssh $SSH_ARGS -l $DEPLOY_USER $WEB_HOST "cd $STACK_NAME && export VERSION=$VERSION && docker compose -f stack-deploy.yml pull api"

echo "Running database migrations..."
ssh $SSH_ARGS -l $DEPLOY_USER $WEB_HOST "cd $STACK_NAME && export VERSION=$VERSION && source .env && docker compose -f stack-deploy.yml run --rm --entrypoint '' api npx knex --knexfile ./knexfile.js --env development migrate:latest"