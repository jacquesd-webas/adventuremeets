#!/usr/bin/env bash
set -euo pipefail

TEMPFAIL_EXIT_CODE=75
RECIPIENT=""
SENDER=""
CLIENT=""
MAILHOOK_URL=""

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --url=*) MAILHOOK_URL="${1#*=}"; shift ;;
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

handle_error() {
  exit "${TEMPFAIL_EXIT_CODE}"
}

# Always clean up on any exit path
trap cleanup EXIT INT TERM HUP
trap handle_error ERR

# Read full raw email from stdin
cat > "$TMP"

# Call adventuremeets API (public endpoint)
if [[ -z "${MAILHOOK_URL:-}" ]]; then
  echo "MAILHOOK_URL must be provided to mailhook" >&2
  exit "${TEMPFAIL_EXIT_CODE}"
fi

curl --fail -sS -X POST "${MAILHOOK_URL}" \
  -H "Content-Type: message/rfc822" \
  -H "X-Rcpt-To: ${RECIPIENT}" \
  -H "X-Mail-From: ${SENDER}" \
  -H "X-Client-IP: ${CLIENT}" \
  --data-binary @"$TMP"
