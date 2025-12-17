#!/bin/sh

set -eu

# Args: environment name (e.g., development, production) and optional output path

ENVIRONMENT="${1:-}"
OUTPUT_OVERRIDE="${2:-}"
if [ -z "$ENVIRONMENT" ]; then
  ENVIRONMENT="development"
fi

# Vars: paths

ENV_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_FILE="${ENV_DIR}/base.env"
ENV_FILE="${ENV_DIR}/${ENVIRONMENT}.env"
VARS_FILE="${ENV_DIR}/vars.list"
SECRETS_FILE="${ENV_DIR}/secrets.list"
if [ -n "$OUTPUT_OVERRIDE" ]; then
  OUTPUT_FILES="$OUTPUT_OVERRIDE"
else
  OUTPUT_FILES="$ENV_DIR/../api/.env $ENV_DIR/../web/.env $ENV_DIR/../db/.env"
fi
PWD="$(pwd)"
# Functions

warn_mismatch() {
  file="$1"
  warning=0
  relativepath="${file#"$PWD"/}"
  while IFS= read -r raw || [ -n "$raw" ]; do
    line="${raw%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [ -z "$line" ] && continue
    key="${line%%=*}"
    [ -z "$key" ] && continue
    if ! grep -qx "$key" "$BASE_KEYS_TMP"; then
      echo "Warning: key '${key}' in $relativepath not present in base.env" >&2
      warning=1
    fi
  done < "$file"
  return $warning
}

append_list() {
  file="$1"
  while IFS= read -r raw || [ -n "$raw" ]; do
    line="${raw%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [ -z "$line" ] && continue

    target="$line"
    source="$line"

    case "$line" in
      *=*)
        target="${line%%=*}"
        source="${line#*=}"
        ;;
    esac

    value="$(eval "printf '%s' \"\${$source-}\"")"
    for OUTPUT_FILE in $OUTPUT_FILES; do
      if [ -z "$value" ]; then
        printf '#%s=%s\n' "$target" "$value" >> "$OUTPUT_FILE"
      else
        printf '%s=%s\n' "$target" "$value" >> "$OUTPUT_FILE"
      fi
    done

  done < "$file"
}

# 1. Locate all required files

for file in "$BASE_FILE" "$VARS_FILE" "$SECRETS_FILE"; do
  if [ ! -f "$file" ]; then
    echo "Missing required file: $file" >&2
    exit 1
  fi
done

BASE_KEYS_TMP="$(mktemp)"
trap 'rm -f "$BASE_KEYS_TMP"' EXIT

# 2. Extract base keys

while IFS= read -r raw || [ -n "$raw" ]; do
  line="${raw%%#*}"
  line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [ -z "$line" ] && continue
  key="${line%%=*}"
  [ -z "$key" ] && continue
  echo "$key" >> "$BASE_KEYS_TMP"
done < "$BASE_FILE"


for FILE in "$ENV_FILE" "$VARS_FILE" "$SECRETS_FILE"; do
  warnings=0
  # strip the $PWD from the path for clearer output
  RELATIVEPATH="${FILE#"$PWD"/}"
  if [ ! -f "$FILE" ]; then
    echo "Warning: $RELATIVEPATH not found, skipping mismatch check." >&2
    continue
  fi
  warn_mismatch "$FILE" || warnings=1
  if [ "$warnings" -eq 1 ]; then
    echo "Environment mismatch warnings encountered in $RELATIVEPATH." >&2
  fi
done

# 3. Generate output file

for OUTPUT_FILE in $OUTPUT_FILES; do
  RELATIVEPATH="${OUTPUT_FILE#"$PWD"/}"
  RELATIVEPATH=$(echo ${RELATIVEPATH} | sed 's#[^/]*/\.\./##g')

  mkdir -p "$(dirname "$OUTPUT_FILE")"
  BASE_SHORT="${BASE_FILE##*/}"
  printf '# Base environment from %s\n' "$BASE_SHORT" > "$OUTPUT_FILE"
  cat "$BASE_FILE" >> "$OUTPUT_FILE"

  if [ -f "$ENV_FILE" ]; then
    ENV_SHORT="${ENV_FILE##*/}"
    printf '\n# Overrides from %s\n' "$ENV_SHORT" >> "$OUTPUT_FILE"
    cat "$ENV_FILE" >> "$OUTPUT_FILE"
  fi

  printf '\n# Vars expected to be populated from CI/CD\n' >> "$OUTPUT_FILE"
  append_list "$VARS_FILE"
  printf '\n# Secrets expected to be populated from CI/CD\n' >> "$OUTPUT_FILE"
  append_list "$SECRETS_FILE"

  echo "Generated ${RELATIVEPATH} for ${ENVIRONMENT}"
done



