#!/bin/sh
set -eu
mkdir -p "${DATA_DIR:-/data}/cache" "${DATA_DIR:-/data}/logs"
npx prisma migrate deploy
npm run worker &
worker_pid=$!
npm run start &
web_pid=$!
terminate() {
  kill -TERM "$worker_pid" "$web_pid" 2>/dev/null || true
  wait "$worker_pid" "$web_pid" 2>/dev/null || true
}
trap terminate TERM INT
wait "$web_pid"
terminate
