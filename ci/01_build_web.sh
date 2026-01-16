#!/bin/sh

# This script will build a webpack project and tgz the file for extraction on a
# web server.
#
# The web projects may be specified as args, or via the WEB_PROJECTS
# environment variable, which may be set in ci/config.sh
#
# usage:
#   ci/01_build_web.sh web web-admin
#   WEB_PROJECTS="web web-admin" ci/01_build_web.sh

set -e

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
echo "Creating environment: ${ENVIRONMENT}"
cd $CI_DIR/..
sh ./env/make-env.sh $ENVIRONMENT $WEB_PROJECTS
cd $OLDPWD

VERSION=$(get_app_version "${VERSION:-}")
APP_NAME=$(get_app_name "${APP_NAME:-}")

ENV_DIR="$CI_DIR/../env"

echo "Building web archives..."
for DIR in $WEB_PROJECTS; do
    echo "Building in $DIR/"
    cd $DIR
    NPM=$(get_package_manager)
    $NPM install
    $NPM run build
    cd $OLDPWD
    WAR_FILE="${APP_NAME}-${ENVIRONMENT}-${DIR}-latest.tgz"
    echo "Creating war file $CI_DIR/../dist/$WAR_FILE"
    mkdir -p $CI_DIR/../dist
    tar -czf $CI_DIR/../dist/$WAR_FILE -C ${DIR}/dist .
done

echo "Web archives build completed"
