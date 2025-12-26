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

source $(dirname $0)/config.sh
source $(dirname $0)/utils.sh

DOCKER_IMAGES_ARGS=$@

if [ ! -z "$DOCKER_IMAGES_ARGS" ]; then
    echo "DOCKER_IMAGES set via args [$DOCKER_IMAGES_ARGS]"
    DOCKER_IMAGES=$DOCKER_IMAGES_ARGS
elif [ ! -z "$DOCKER_IMAGES" ]; then
    echo "DOCKER_IMAGES set via environment [$DOCKER_IMAGES]"
    exit 0
else
    echo "DOCKER_IMAGES is not set and no args provided"
    echo "Nothing to build"
    exit 0
fi

echo "Building Docker images..."
for IMAGE in $DOCKER_IMAGES; do
    echo "Building $IMAGE..."
    docker-compose build --no-cache $IMAGE
done

echo "Docker build completed"
