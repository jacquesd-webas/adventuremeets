#!/bin/sh

# Save built docker images to dist/docker-images.tar

CI_DIR=$(dirname $0)
. "$CI_DIR/config.sh"
source $CI_DIR/utils.sh

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

echo "Saving images to ${DIST_DIR}/docker-images-latest.tar.gz: $IMAGES"
docker save $IMAGES | gzip > ${DIST_DIR}/docker-images-latest.tar.gz
echo "Saved docker images."
