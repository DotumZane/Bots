#!/bin/sh
set -eu

PUID="${PUID:-99}"
PGID="${PGID:-100}"

case "$PUID" in
  *[!0-9]*|'') echo "PUID must be a numeric user ID." >&2; exit 1 ;;
esac
case "$PGID" in
  *[!0-9]*|'') echo "PGID must be a numeric group ID." >&2; exit 1 ;;
esac

group_name="$(getent group "$PGID" | cut -d: -f1 || true)"
if [ -z "$group_name" ]; then
  group_name="bots"
  groupadd --gid "$PGID" "$group_name"
fi

usermod --non-unique --uid "$PUID" --gid "$PGID" node
mkdir -p "${DATA_DIR:-/data}/cache" "${DATA_DIR:-/data}/logs"
chown -R "$PUID:$PGID" "${DATA_DIR:-/data}"

runuser -u node -- npx prisma migrate deploy
runuser -u node -- npm run worker &
worker_pid=$!
runuser -u node -- npm run start &
web_pid=$!
terminate() {
  kill -TERM "$worker_pid" "$web_pid" 2>/dev/null || true
  wait "$worker_pid" "$web_pid" 2>/dev/null || true
}
trap terminate TERM INT
wait "$web_pid"
terminate
