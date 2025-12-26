#!/bin/sh

# Script to tag and push Docker images
# Assumes images are already built and loaded locally and docker login has been performed.

CI_DIR=$(dirname $0)
source $CI_DIR/config.sh
source $CI_DIR/utils.sh

DOCKER_IMAGES_ARGS=$@

VERSION=$(get_app_version "${VERSION:-}")
APP_NAME=$(get_app_name "${APP_NAME:-}")
IMAGE_PREFIX="${DOCKER_REPO_PREFIX:-fringecoding}/${APP_NAME}"

if [ ! -z "$DOCKER_IMAGES_ARGS" ]; then
    echo "DOCKER_IMAGES set via args [$DOCKER_IMAGES_ARGS]"
    DOCKER_IMAGES=$DOCKER_IMAGES_ARGS
elif [ ! -z "$DOCKER_IMAGES" ]; then
    echo "DOCKER_IMAGES set via environment [$DOCKER_IMAGES]"
    exit 0
else
    echo "DOCKER_IMAGES is not set and no args provided"
    echo "Nothing to publish"
    exit 0
fi

if [ -z "$CI_REGISTRY_USER" ] || [ -z "$CI_REGISTRY_PAT" ]; then
  echo "Warning: Missing CI_REGISTRY_USER and CI_REGISTRY_PAT may be needed to publish images. Continuing anyway."
else
  echo "Logging into Docker registry..."
  echo "$CI_REGISTRY_PAT" | docker login --username "$CI_REGISTRY_USER" --password-stdin
  if [ $? -ne 0 ]; then
    echo "Docker login failed. Continuing anyway."
  fi
fi

echo "Publishing Docker images for version $VERSION..."

for IMAGE in $DOCKER_IMAGES; do
  docker tag $IMAGE "${IMAGE_PREFIX}_${IMAGE}:$VERSION"
  docker tag $IMAGE "${IMAGE_PREFIX}_${IMAGE}:latest"
done

for IMAGE in $DOCKER_IMAGES; do
  docker push "${IMAGE_PREFIX}_${IMAGE}:$VERSION"
  docker push "${IMAGE_PREFIX}_${IMAGE}:latest"
done

echo "Finished pushing Docker images."
