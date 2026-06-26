#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${EXPO_PUBLIC_API_BASE_URL:-http://127.0.0.1:8000}"

cd "$(dirname "${BASH_SOURCE[0]}")/../mobile"

EXPO_PUBLIC_API_BASE_URL="${API_BASE_URL}" npm run web
