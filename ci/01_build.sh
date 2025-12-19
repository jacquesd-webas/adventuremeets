#!/bin/bash

echo "Building Docker images..."

IMAGES="api backup_runner"

# Build Docker images
for IMAGE in $IMAGES; do
    echo "Building $IMAGE..."
    docker-compose build --no-cache $IMAGE
done

echo "Docker build completed"
