#!/bin/sh

# This script will save built docker images specified either via
# command line arguments or via environment variable DOCKER_IMAGES
#
# usage:
#   ci/01_save_docker.sh web web-admin
#   DOCKER_IMAGES="web web-admin" ci/01_save_docker.sh

set -eu

CI_DIR=$(dirname $0)
. "$CI_DIR/config.sh"
. "$CI_DIR/utils.sh"

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
    echo "Nothing to save"
    exit 0
fi

DIST_DIR="${CI_DIR}/../dist"
mkdir -p "$DIST_DIR"

echo "Tagging images with 'latest'..."
IMAGES=""
for IMAGE in $DOCKER_IMAGES; do
    IMAGES="$IMAGES ${APP_NAME}_$IMAGE:latest"
done

echo "Saving images to ${DIST_DIR}/docker-images.tar: $IMAGES"
docker save $IMAGES -o ${DIST_DIR}/docker-images.tar
echo "Saved docker images."
