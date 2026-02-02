#!/bin/sh

# Verify all variables listed in env/vars.list and env/secrets.list are set in the current environment.
# Intended to be run early in CI to fail fast on missing configuration.

set -eu

CI_DIR=$(dirname $0)
. "$CI_DIR/config.sh"
. "$CI_DIR/utils.sh"

ENV_DIR="$CI_DIR/../env"
FILES="$ENV_DIR/vars.list $ENV_DIR/secrets.list"

for f in $FILES; do
  if [ ! -f "$f" ]; then
    echo "Missing required file: $f" >&2
    exit 1
  fi
done

missing=0
for file in $FILES; do
  while IFS= read -r raw || [ -n "$raw" ]; do
    line="${raw%%#*}"
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"
    [ -z "$line" ] && continue
    var="$line"
    val="$(eval "printf '%s' \"\${$var-}\"")"
    if [ -z "$val" ]; then
      echo "Environment variable '$var' is not set (listed in ${file##*/})" >&2
      missing=1
    fi
  done < "$file"
done

if [ "$missing" -ne 0 ]; then
  echo "One or more required environment variables are missing." >&2
  exit 1
fi

echo "All required environment variables from vars.list and secrets.list are set."
