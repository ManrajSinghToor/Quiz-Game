#!/usr/bin/env bash
set -euo pipefail

DBPATH="${MONGO_DBPATH:-/opt/homebrew/var/mongodb}"
PORT="${MONGO_PORT:-27017}"
BIND_IP="${MONGO_BIND_IP:-127.0.0.1}"

if [[ ! -d "$DBPATH" ]]; then
  echo "Mongo DBPATH not found: $DBPATH" >&2
  echo "Set MONGO_DBPATH to a valid directory and retry." >&2
  exit 1
fi

echo "Starting mongod on ${BIND_IP}:${PORT}"
echo "DBPATH: ${DBPATH}"
exec mongod --dbpath "$DBPATH" --bind_ip "$BIND_IP" --port "$PORT"

