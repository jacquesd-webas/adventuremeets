# App specific configuation
DOCKER_IMAGES="api db_migrate"
APP_NAME="adventuremeets"
APP_SITE="adventuremeets.apps.fringecoding.com"

# Docker
DOCKER_REPO_PREFIX="fringecoding"

# SSH args for CI/CD
SSH_ARGS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

# Deployment server information
DEPLOY_USER='webdeploy'
WEB_HOST='webapps1.fringecoding.com'
WEB_USER="webdeploy"
WEB_STAGE_DIR="staging"

# Node
NPM="pnpm"