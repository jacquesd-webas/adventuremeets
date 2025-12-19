#!/bin/sh 

NEED_SSH=1

PROJECT_ROOT=$(git rev-parse --show-toplevel)
. $PROJECT_ROOT/ci/common.inc

echo "Deploying API for '$STACK_NAME:$VERSION' from $PROJECT_ROOT"
ssh $SSH_ARGS -l $DEPLOY_USER $WEB_HOST "cd $STACK_NAME && source .env && export VERSION=$VERSION && docker compose -f stack-deploy.yml up -d api"