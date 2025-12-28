#!/bin/sh

# Script to upload the built web tarball to the staging directory on the deployment host.
# Requires web-build.tar.gz artifact present at build time.

CI_DIR=$(dirname $0)
. $CI_DIR/config.sh
. $CI_DIR/utils.sh

VERSION=$(get_app_version "${VERSION:-}")
APP_NAME=$(get_app_name "${APP_NAME:-}")
SITE_NAME=$(get_app_site "${APP_SITE:-}")

if [ -z $WEB_STAGE_DIR ]; then
  echo "Error: WEB_STAGE_DIR is not set in config.sh"
  exit 1
fi

if [ -z $WEB_USER ]; then
  echo "Error: WEB_USER is not set in config.sh"
  exit 1
fi

if [ -z $WEB_HOST ]; then
  echo "Error: WEB_HOST is not set in config.sh"
  exit 1
fi

ARCHIVE_NAME="${APP_NAME}-web-${VERSION}.tgz"

if [ ! -f "$CI_DIR/../dist/${APP_NAME}-web-${VERSION}.tgz" ]; then
  echo "web-build.tgz not found in current directory."
  exit 1
fi

echo "Uploading web bundle to ${WEB_HOST}:${WEB_STAGE_DIR}/${ARCHIVE_NAME}"
scp $SSH_ARGS $CI_DIR/../dist/${ARCHIVE_NAME} ${WEB_USER}@${WEB_HOST}:./${WEB_STAGE_DIR}/${ARCHIVE_NAME}

echo "Web bundle uploaded."
