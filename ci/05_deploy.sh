#!/bin/bash

# Deployment script for deploying Docker containers with Docker Compose

# Parameters
TARGET_DIR=$1
VERSION=$2
CI_REGISTRY_USER=$3
CI_REGISTRY_PASSWORD=$4
STACK_NAME=$5

echo "Deploying in $TARGET_DIR for version $VERSION..."

# Source common variables
PROJECT_ROOT=$(git rev-parse --show-toplevel)
. $PROJECT_ROOT/ci/common.inc
WEB_STAGE_DIR=${WEB_STAGE_DIR:-staging}
WEB_ARCHIVE_NAME="adventuremeets-web-${VERSION}.tar.gz"

# Commands to deploy the services using Docker Compose
echo "Deploying application at $WEB_HOST..."
ssh $SSH_ARGS $DEPLOY_USER@$WEB_HOST <<EOF
cd $TARGET_DIR

# Login to Docker registry
echo "Logging into Docker registry as $CI_REGISTRY_USER..."
echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin
if [ $? -ne 0 ]; then
    echo "Docker login failed, aborting deployment."
    exit 1
fi

# Check if images are available locally and pull if not
declare -A IMAGES
IMAGES[api]="fringecoding/adventuremeets_api"
IMAGES[web]="fringecoding/adventuremeets_web"
IMAGES[backup_runner]="fringecoding/adventuremeets_backup-runner"

for IMAGE_KEY in "\${!IMAGES[@]}"; do
    IMAGE_REPO="\${IMAGES[\$IMAGE_KEY]}"
    echo "Pulling image \${IMAGE_REPO}:$VERSION..."
    docker pull \${IMAGE_REPO}:$VERSION
    if [ \$? -ne 0 ]; then
        echo "Failed to pull image \${IMAGE_REPO}:$VERSION, aborting deployment."
        exit 1
    fi
done

if [ ! -f "./$WEB_STAGE_DIR/$WEB_ARCHIVE_NAME" ]; then
    echo "Web archive ./$WEB_STAGE_DIR/$WEB_ARCHIVE_NAME not found. Please upload before deploying."
    exit 1
fi

echo "Updating web assets from staging archive..."
cp "./$WEB_STAGE_DIR/$WEB_ARCHIVE_NAME" web-build.tar.gz
rm -rf web/build
mkdir -p web
tar -xzf web-build.tar.gz -C web
rm web-build.tar.gz

# Run database migrations
echo "Running database migrations..."
VERSION=$VERSION docker compose -f stack-deploy.yml run --rm --entrypoint '' api npx knex --knexfile ./knexfile.js --env production migrate:latest
if [ $? -ne 0 ]; then
    echo "Database migrations failed."
    exit 1
fi

# Generate the Docker Compose configuration and deploy using Docker stack
echo "Executing: VERSION=$VERSION docker-compose -f stack-deploy.yml $STACK_NAME"
echo "NOT DONE ===> PLEASE RUN COMMAND MANUALLY FOR NOW <==="
#VERSION=$VERSION docker-compose -f stack-deploy.yml $STACK_NAME
if [ $? -ne 0 ]; then
    echo "Docker Compose deployment failed."
    exit 1
fi
EOF

echo "Deployment command executed. Check server logs for detailed output."
