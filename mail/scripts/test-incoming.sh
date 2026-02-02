#!/usr/bin/env bash
set -euo pipefail

SMTP_HOST="${SMTP_HOST:-localhost}"
SMTP_PORT="${SMTP_PORT:-25}"
MAIL_DOMAIN="${MAIL_DOMAIN:-adventuremeets.apps.fringecoding.com}"
MEET_ID="${MEET_ID:-test-meet}"
RECIPIENT="${RECIPIENT:-${MEET_ID}@${MAIL_DOMAIN}}"
SENDER="${SENDER:-tester@${MAIL_DOMAIN}}"

echo "==> Following logs (mail + api)..."
docker compose logs -f --tail=50 mail &
LOG_PID=$!
trap 'kill ${LOG_PID} >/dev/null 2>&1 || true' EXIT

echo "==> Sending test inbound message to ${SMTP_HOST}:${SMTP_PORT}"
cat <<EOF | nc -w 5 "${SMTP_HOST}" "${SMTP_PORT}"
EHLO localhost
MAIL FROM:<${SENDER}>
RCPT TO:<${RECIPIENT}>
DATA
Subject: Incoming test $(date -u +"%Y-%m-%dT%H:%M:%SZ")
From: ${SENDER}
To: ${RECIPIENT}

Hello from test-incoming.sh
.
QUIT
EOF

echo "==> Done. If everything is wired, you should see mailhook + API logs above."
