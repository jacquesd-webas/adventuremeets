#!/bin/sh

# Script to tag and push Docker images
# Assumes images are already built and loaded locally and docker login has been performed.

VERSION="${1:-}"

if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>"
  exit 1
fi

echo "Publishing Docker images for version $VERSION..."

REPO_PREFIX="fringecoding/adventuremeets"
IMAGES="api backup_runner"

for IMAGE in $IMAGES; do
  docker tag $IMAGE "${REPO_PREFIX}_${IMAGE}:$VERSION"
  docker tag $IMAGE "${REPO_PREFIX}_${IMAGE}:latest"
done

for IMAGE in $IMAGES; do
  docker push "${REPO_PREFIX}_${IMAGE}:$VERSION"
  docker push "${REPO_PREFIX}_${IMAGE}:latest"
done

echo "Finished pushing Docker images."
