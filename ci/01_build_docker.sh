#!/bin/sh

# This script will build docker images specified either via
# command line arguments or via environment variable DOCKER_IMAGES
#
# DOCKER_IMAGES may be set in ci/config.sh, but can be overridden
# with args
#
# usage:
#   ci/01_build_docker.sh api db_migrate
#   DOCKER_IMAGES="api db_migrate" ci/01_build_docker.sh

set -e

CI_DIR=$(dirname $0)
. "$CI_DIR/config.sh"
. "$CI_DIR/utils.sh"
IS_CI=${CI:-false}

APP_NAME=$(get_app_name "${APP_NAME:-}")

DOCKER_IMAGES_ARGS=$@

if [ ! -z "$DOCKER_IMAGES_ARGS" ]; then
    echo "DOCKER_IMAGES set via args [$DOCKER_IMAGES_ARGS]"
    DOCKER_IMAGES=$DOCKER_IMAGES_ARGS
else
    echo "DOCKER_IMAGES set via environment [$DOCKER_IMAGES]"
fi

if [ -z "$DOCKER_IMAGES" ]; then
    echo "DOCKER_IMAGES is not set and no args provided"
    echo "Nothing to build"
    exit 0
fi

ENVIRONMENT=${ENVIRONMENT:-development}
echo "Using environment: ${ENVIRONMENT}"

# Build with Buildx/Bake so we can use cache across steps/jobs.
COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.yml}
TAG_ARGS=""
for IMAGE in $DOCKER_IMAGES; do
  TAG_ARGS="$TAG_ARGS --set ${IMAGE}.tags=${APP_NAME}_${IMAGE}:latest"
done
if [ "$IS_CI" = "true" ]; then
  CACHE_FROM=${BUILDX_CACHE_FROM:-type=local,src=/tmp/.buildx-cache}
  CACHE_TO=${BUILDX_CACHE_TO:-type=local,dest=/tmp/.buildx-cache-new,mode=max}
  ARGS="--set *.cache-from=${CACHE_FROM} --set *.cache-to=${CACHE_TO} ${TAG_ARGS} --set *.output=type=docker"
else
  ARGS="${TAG_ARGS} --set *.output=type=docker"
  CACHE_FROM="type=inline"
  CACHE_TO="type=inline"
fi

echo "Building Docker images via buildx bake from ${COMPOSE_FILE}..."
if [ ! -z "$ARGS" ]; then
  echo "Cache from: ${CACHE_FROM}"
  echo "Cache to:   ${CACHE_TO}"
fi

docker buildx bake \
  -f "${COMPOSE_FILE}" \
  ${DOCKER_IMAGES} \
  ${ARGS}

echo "Docker build completed"
