#!/bin/sh

# Script to tag and push Docker images
# Assumes images are already built and loaded locally and docker login has been performed.

 set -e

CI_DIR=$(dirname $0)
. "$CI_DIR/config.sh"
. "$CI_DIR/utils.sh"

VERSION=$(get_app_version "${VERSION:-}")
APP_NAME=$(get_app_name "${APP_NAME:-}")
IMAGE_PREFIX="${DOCKER_REPO_PREFIX:-fringecoding}/${APP_NAME}"

ENVIRONMENT=${ENVIRONMENT:-development}
echo "Using environment: $ENVIRONMENT"

DOCKER_IMAGES_ARGS=$@
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
  SRC="${APP_NAME}_${IMAGE}:latest"
  if ! docker image inspect "$SRC" >/dev/null 2>&1; then
    SRC="$IMAGE:latest"
  fi
  pushed=0
  if [ "$ENVIRONMENT" = "production" ]; then
    echo "Tagging and pushing image $SRC --> ${IMAGE_PREFIX}_${IMAGE}:$VERSION"
    docker tag "$SRC" "${IMAGE_PREFIX}_${IMAGE}:$VERSION"
    docker push "${IMAGE_PREFIX}_${IMAGE}:$VERSION"
    pushed=1
  elif [ "$ENVIRONMENT" = "testing" ]; then
    if echo "$VERSION" | grep -Eq '(^[0-9]+\.[0-9]+\.[0-9]+$|beta)'; then
      echo "Tagging and pushing image $SRC --> ${IMAGE_PREFIX}_${IMAGE}:$VERSION"
      docker tag "$SRC" "${IMAGE_PREFIX}_${IMAGE}:$VERSION"
      docker push "${IMAGE_PREFIX}_${IMAGE}:$VERSION"
      pushed=1
    else
      echo "Version $VERSION is not a beta release. Skipped version tag push for testing environment."
    fi
  elif [ "$ENVIRONMENT" = "development" ]; then
    if echo "$VERSION" | grep -Eq '(^[0-9]+\.[0-9]+\.[0-9]+$|alpha)'; then
      echo "Tagging and pushing image $SRC --> ${IMAGE_PREFIX}_${IMAGE}:$VERSION"
      docker tag "$SRC" "${IMAGE_PREFIX}_${IMAGE}:$VERSION"
      docker push "${IMAGE_PREFIX}_${IMAGE}:$VERSION"
      pushed=1
    else
      echo "Version $VERSION is not an alpha release. Skipped version tag push for development environment."
    fi
  fi
  if [ $pushed -eq 0 ]; then
    echo "Tagging and pushing image $SRC for non-production environment..."
    docker tag "$SRC" "${IMAGE_PREFIX}_${IMAGE}:latest"
    docker push "${IMAGE_PREFIX}_${IMAGE}:latest"
  fi
done

echo "Finished pushing Docker images."
