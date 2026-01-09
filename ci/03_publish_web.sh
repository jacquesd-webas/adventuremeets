#!/bin/sh

# Script to upload the built web tarball to the staging directory on the deployment host.
# Requires web-build.tar.gz artifact present at build time.

set -e

CI_DIR=$(cd "$(dirname "$0")" && pwd)
ROOT_DIR=$(cd "$CI_DIR/.." && pwd)
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

ENVIRONMENT=${ENVIRONMENT:-development}
echo "Using environment: ${ENVIRONMENT}"

echo "Publishing web archives..."
for DIR in $WEB_PROJECTS; do
    SRC_FILE="${APP_NAME}-${ENVIRONMENT}-${DIR}-latest.tgz"
    echo "Publishing $DIR..."
    if [ $ENVIRONMENT = "production" ]; then
      WAR_FILE="${APP_NAME}-${DIR}-${VERSION}.tgz"
    elif [ $ENVIRONMENT = "testing" ]; then
      if echo "$VERSION" | grep -Eq '(^[0-9]+\.[0-9]+\.[0-9]+$|beta)'; then
        WAR_FILE="${APP_NAME}-${DIR}-${VERSION}.tgz"
      else
        echo "Version $VERSION is not a beta release. Skipped web publish for testing environment."
      fi
    elif [ $ENVIRONMENT = "development" ]; then
      if echo "$VERSION" | grep -Eq '(^[0-9]+\.[0-9]+\.[0-9]+$|alpha)'; then
        WAR_FILE="${APP_NAME}-${DIR}-${VERSION}.tgz"
      else
        echo "Version $VERSION is not an alpha release. Skipped web publish for development environment."
      fi
    fi
    if [ -z "$WAR_FILE" ]; then
      echo "Non-production environment, using latest tag for web archive."
      WAR_FILE="${APP_NAME}-${ENVIRONMENT}-${DIR}-latest.tgz"
    fi
    if [ ! -f "$ROOT_DIR/dist/${SRC_FILE}" ]; then
      echo "Web archive $SRC_FILE not found in dist directory."
      exit 1
    fi
    echo "Uploading $SRC_FILE --> ${WEB_HOST}:${WEB_STAGE_DIR}/${WAR_FILE}"
    scp $SSH_ARGS "$ROOT_DIR/dist/${SRC_FILE}" ${WEB_USER}@${WEB_HOST}:./${WEB_STAGE_DIR}/${WAR_FILE}
    echo "Web bundle uploaded."
done
