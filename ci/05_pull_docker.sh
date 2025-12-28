#!/bin/sh 

CI_DIR=$(dirname $0)
. $CI_DIR/config.sh
. $CI_DIR/utils.sh

APP_NAME=$(get_app_name "${APP_NAME:-}")
SITE_NAME=$(get_app_site "${APP_SITE:-}")
VERSION=$(get_app_version "${VERSION:-}")

DOCKER_IMAGES_ARGS=$@

if [ ! -z "$DOCKER_IMAGES_ARGS" ]; then
    echo "DOCKER_IMAGES set via args [$DOCKER_IMAGES_ARGS]"
    DOCKER_IMAGES=$DOCKER_IMAGES_ARGS
elif [ ! -z "$DOCKER_IMAGES" ]; then
    echo "DOCKER_IMAGES set via environment [$DOCKER_IMAGES]"
else
    echo "DOCKER_IMAGES is not set and no args provided"
    echo "Nothing to deploy"
    exit 0
fi

if [ -z $DEPLOY_USER ]; then
  echo "Error: DEPLOY_USER is not set in config.sh"
  exit 1
fi

if [ -z $WEB_HOST ]; then
  echo "Error: WEB_HOST is not set in config.sh"
  exit 1
fi

echo "Pulling docker containers for '$APP_NAME:$VERSION'..."
ssh $SSH_ARGS $DEPLOY_USER@$WEB_HOST <<EOF
cd $SITE_NAME

echo "Logging into Docker registry as $CI_REGISTRY_USER..."
echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin
if [ $? -ne 0 ]; then
    echo "Docker login failed, continuing anyway."
fi

for IMAGE in $DOCKER_IMAGES; do
    IMAGE_PATH="${DOCKER_REPO_PREFIX:-fringecoding}/${APP_NAME}_$IMAGE:$VERSION"
    echo "Pulling image ${IMAGE_PATH}..."
    docker pull ${IMAGE_PATH}
    if [ $? -ne 0 ]; then
        echo "Failed to pull image ${IMAGE_PATH}, aborting deployment."
        exit 1
    fi
done
EOF