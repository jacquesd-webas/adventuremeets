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
if [[ -z "${MAILHOOK_URL:-}" ]]; then
  echo "MAILHOOK_URL must be set" >&2
  exit 1
fi

curl --fail -sS -X POST "${MAILHOOK_URL}" \
  -H "Content-Type: message/rfc822" \
  -H "X-Rcpt-To: ${RECIPIENT}" \
  -H "X-Mail-From: ${SENDER}" \
  -H "X-Client-IP: ${CLIENT}" \
  --data-binary @"$TMP"
