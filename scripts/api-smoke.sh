#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${1:-${EXPO_PUBLIC_API_BASE_URL:-http://127.0.0.1:8000}}"
API_BASE_URL="${API_BASE_URL%/}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_command curl
require_command python3

echo "Checking Thai Tones API at ${API_BASE_URL}"

health_json="$(curl -fsS "${API_BASE_URL}/health")"
python3 - "$health_json" <<'PY'
import json
import sys

payload = json.loads(sys.argv[1])
assert payload["status"] == "ok", payload
assert payload["service"] == "thai-tones-api", payload
PY

words_json="$(curl -fsS "${API_BASE_URL}/api/practice-words")"
python3 - "$words_json" <<'PY'
import json
import sys

payload = json.loads(sys.argv[1])
items = payload["items"]
assert len(items) >= 25, f"Expected at least 25 practice words, got {len(items)}"
assert items[0]["id"], "First practice word is missing id"
print(f"Practice catalog: {len(items)} words")
PY

analysis_json="$(
  curl -fsS \
    -H "Content-Type: application/json" \
    -d '{"word_id":"sawasdee","recording_duration_ms":1700}' \
    "${API_BASE_URL}/api/analyze"
)"
python3 - "$analysis_json" <<'PY'
import json
import sys

payload = json.loads(sys.argv[1])
assert payload["word_id"] == "sawasdee", payload
assert payload["overall_accuracy"] > 0, payload
assert payload["analysis_mode"] in {"pitch", "fallback"}, payload
assert 0 <= payload["confidence"] <= 1, payload
print(
    "Analyze endpoint:",
    payload["analysis_mode"],
    f"confidence={payload['confidence']}",
)
PY

echo "API smoke passed."
