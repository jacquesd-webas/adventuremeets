#!/bin/sh

# This script will build a webpack project and tgz the file for extraction on a
# web server.
#
# The web projects may be specified as args, or via the WEB_PROJECTS
# environment variable, which may be set in ci/config.sh
#
# usage:
#   ci/01_build_war.sh web web-admin
#   WEB_PROJECTS="web web-admin" ci/01_build_war.sh

CI_DIR=$(dirname $0)
. $CI_DIR/config.sh
. $CI_DIR/utils.sh

WEB_PROJECTS_ARGS=$@
if [ ! -z "$WEB_PROJECTS_ARGS" ]; then
    echo "WEB_PROJECTS set via args [$WEB_PROJECTS_ARGS]"
    WEB_PROJECTS=$WEB_PROJECTS_ARGS
elif [ ! -z "$WEB_PROJECTS" ]; then
    echo "WEB_PROJECTS set via environment [$WEB_PROJECTS]"
else
    echo "Nothing to build"
    exit 0
fi

ENVIRONMENT=${ENVIRONMENT:-development}
echo "Using environment: ${ENVIRONMENT}"

VERSION=$(get_app_version "${VERSION:-}")
APP_NAME=$(get_app_name "${APP_NAME:-}")

ENV_DIR="$CI_DIR/../env"

echo "Building web archives..."
for DIR in $WEB_PROJECTS; do
    echo "Creating ${ENVIRONMENT} environment..."
    sh $ENV_DIR/make-env.sh $ENVIRONMENT $DIR/.env
    echo "Building $DIR..."
    cd $DIR
    NPM=$(get_package_manager)
    $NPM run build
    cd $OLDPWD
    if [ $ENVIRONMENT = "production" ]; then
      WAR_FILE="${APP_NAME}-${DIR}-${VERSION}.tgz"
    else
      echo "Non-production environment, using latest tag for web archive."
      WAR_FILE="${APP_NAME}-${DIR}-latest.tgz"
    fi
    echo "Creating war file $WAR_FILE"
    mkdir -p $CI_DIR/../dist
    tar -czf $CI_DIR/../dist/$WAR_FILE -C ${DIR}/dist .
done

echo "Web archives build completed"
