#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR/mobile"
npm run typecheck
npm run build:web
npm run doctor

cd "$ROOT_DIR"
.venv/bin/python -m pytest backend/tests -q -rs

if curl -fsS "http://127.0.0.1:8000/health" >/dev/null 2>&1; then
  "$ROOT_DIR/scripts/api-smoke.sh" "http://127.0.0.1:8000"
else
  echo "Skipping local API smoke: http://127.0.0.1:8000 is not running."
fi
