#!/usr/bin/env bash
set -euo pipefail

RECIPIENT=""
SENDER=""
CLIENT=""

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --recipient=*) RECIPIENT="${1#*=}"; shift ;;
    --sender=*) SENDER="${1#*=}"; shift ;;
    --client_address=*) CLIENT="${1#*=}"; shift ;;
    *) shift ;;
  esac
done

# Temp file
TMP="$(mktemp)"

cleanup() {
  [[ -n "${TMP:-}" && -f "$TMP" ]] && rm -f "$TMP"
}

# Always clean up on any exit path
trap cleanup EXIT INT TERM HUP

# Read full raw email from stdin
cat > "$TMP"
# Call adventuremeets API (public endpoint)
MAILHOOK_URL="${MAILHOOK_URL:-http://host.docker.internal:8000/api/v1/incoming}"
curl -sS -X POST "${MAILHOOK_URL}" \
  -H "Content-Type: message/rfc822" \
  -H "X-Rcpt-To: ${RECIPIENT}" \
  -H "X-Mail-From: ${SENDER}" \
  -H "X-Client-IP: ${CLIENT}" \
  --data-binary @"$TMP"
