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

CI_DIR=$(dirname $0)
source $CI_DIR/config.sh
source $CI_DIR/utils.sh

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

# Build with Buildx/Bake so we can use cache across steps/jobs.
COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.yml}
CACHE_FROM=${BUILDX_CACHE_FROM:-type=local,src=/tmp/.buildx-cache}
CACHE_TO=${BUILDX_CACHE_TO:-type=local,dest=/tmp/.buildx-cache-new,mode=max}

echo "Building Docker images via buildx bake from ${COMPOSE_FILE}..."
echo "Cache from: ${CACHE_FROM}"
echo "Cache to:   ${CACHE_TO}"
docker buildx bake \
  -f "${COMPOSE_FILE}" \
  ${DOCKER_IMAGES} \
  --set *.cache-from="${CACHE_FROM}" \
  --set *.cache-to="${CACHE_TO}" \
  --load

echo "Docker build completed"
