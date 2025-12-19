#!/bin/sh

# Script to upload the built web tarball to the staging directory on the deployment host.
# Requires web-build.tar.gz artifact present at build time.

VERSION="${1:-}"
if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>"
  exit 1
fi

STAGE_DIR="${WEB_STAGE_DIR:-staging}"
REMOTE_USER="${WEB_USER:-webdeploy}"
REMOTE_HOST="${WEB_HOST:-webapps1.fringecoding.com}"
ARCHIVE_NAME="adventuremeets-web-${VERSION}.tar.gz"

if [ ! -f "web-build.tar.gz" ]; then
  echo "web-build.tar.gz not found in current directory."
  exit 1
fi

SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"
echo "Uploading web bundle to ${REMOTE_HOST}:${STAGE_DIR}/${ARCHIVE_NAME}"
scp $SSH_OPTS web-build.tar.gz $REMOTE_USER@$REMOTE_HOST:./${STAGE_DIR}/${ARCHIVE_NAME}

echo "Web bundle uploaded."
