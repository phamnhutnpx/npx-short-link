#!/usr/bin/env bash
set -euo pipefail

HOST=${1:-db}
PORT=${2:-5432}
TIMEOUT=${TIMEOUT:-60}

until nc -z "$HOST" "$PORT"; do
  echo "Waiting for PostgreSQL at $HOST:$PORT..."
  TIMEOUT=$((TIMEOUT - 1))
  if [ "$TIMEOUT" -le 0 ]; then
    echo "Timed out waiting for PostgreSQL" >&2
    exit 1
  fi
  sleep 1
done

echo "PostgreSQL is available at $HOST:$PORT"
