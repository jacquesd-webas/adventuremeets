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
source $CI_DIR/config.sh
source $CI_DIR/utils.sh

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

VERSION=$(get_app_version "${VERSION:-}")
APP_NAME=$(get_app_name "${APP_NAME:-}")


echo "Building web archives..."
for DIR in $WEB_PROJECTS; do
    echo "Building $DIR..."
    cd $DIR
    NPM=$(get_package_manaher)
    $NPM run build
    cd $OLDPWD
    WAR_FILE="${APP_NAME}-${DIR}-${VERSION}.tgz"
    echo "Creating war file $WAR_FILE"
    mkdir -p $CI_DIR/../dist
    tar -czf $CI_DIR/../dist/$WAR_FILE -C ${DIR}/dist .
done

echo "Web archives build completed"