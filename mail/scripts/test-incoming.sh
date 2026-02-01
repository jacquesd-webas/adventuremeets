#!/usr/bin/env bash
set -euo pipefail

SMTP_HOST="${SMTP_HOST:-localhost}"
SMTP_PORT="${SMTP_PORT:-25}"
MAIL_DOMAIN="${MAIL_DOMAIN:-adventuremeets.apps.fringecoding.com}"
MEET_ID="${MEET_ID:-test-meet}"
RECIPIENT="${RECIPIENT:-${MEET_ID}@${MAIL_DOMAIN}}"
SENDER="${SENDER:-tester@${MAIL_DOMAIN}}"

echo "==> Sending test inbound message to ${SMTP_HOST}:${SMTP_PORT}"
exec 3<>"/dev/tcp/${SMTP_HOST}/${SMTP_PORT}"
read -r -t 5 -u 3 _banner || true
send_line() {
  printf "%s\r\n" "$1" >&3
  read -r -t 5 -u 3 _resp || true
}
send_line "HELO localhost"
send_line "MAIL FROM:<${SENDER}>"
send_line "RCPT TO:<${RECIPIENT}>"
send_line "DATA"
send_line "Subject: Incoming test $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
send_line "From: ${SENDER}"
send_line "To: ${RECIPIENT}"
send_line ""
send_line "Hello from test-incoming.sh"
send_line "."
send_line "QUIT"
exec 3>&-

echo "==> Done. If everything is wired, you should see mailhook + API logs above."
