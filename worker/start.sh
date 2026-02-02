#!/bin/sh
set -e

echo "Starting meet scheduler loop"
node /app/worker/dist/main.js
