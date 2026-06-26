#!/usr/bin/env bash
set -euo pipefail

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"

if lsof -nP -iTCP:"${PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port ${PORT} is already in use."
  lsof -nP -iTCP:"${PORT}" -sTCP:LISTEN
  echo "Use PORT=8001 ./scripts/dev-backend.sh or stop the existing process."
  exit 1
fi

uvicorn app.main:app \
  --reload \
  --host "${HOST}" \
  --port "${PORT}" \
  --app-dir backend
