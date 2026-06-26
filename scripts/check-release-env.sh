#!/usr/bin/env bash
set -euo pipefail

APP_ENV="${1:-${THAI_TONES_ENV:-development}}"
API_BASE_URL="${EXPO_PUBLIC_API_BASE_URL:-}"
CORS_ORIGINS="${THAI_TONES_CORS_ORIGINS:-}"
CORS_REGEX="${THAI_TONES_CORS_ORIGIN_REGEX:-}"

fail() {
  echo "Release env check failed: $1" >&2
  exit 1
}

warn() {
  echo "Release env warning: $1" >&2
}

case "$APP_ENV" in
  development|preview|production) ;;
  *) fail "unknown environment '${APP_ENV}'. Use development, preview, or production." ;;
esac

if [[ "$APP_ENV" != "development" ]]; then
  [[ -n "$API_BASE_URL" ]] || fail "EXPO_PUBLIC_API_BASE_URL is required for ${APP_ENV}."
  [[ "$API_BASE_URL" == https://* ]] || fail "EXPO_PUBLIC_API_BASE_URL must use HTTPS for ${APP_ENV}."
  [[ "$API_BASE_URL" != *localhost* ]] || fail "EXPO_PUBLIC_API_BASE_URL cannot point to localhost for ${APP_ENV}."
  [[ "$API_BASE_URL" != *127.0.0.1* ]] || fail "EXPO_PUBLIC_API_BASE_URL cannot point to 127.0.0.1 for ${APP_ENV}."
  [[ -n "$CORS_ORIGINS" ]] || fail "THAI_TONES_CORS_ORIGINS is required for ${APP_ENV}."
  [[ "$CORS_ORIGINS" != "*" ]] || fail "THAI_TONES_CORS_ORIGINS cannot be '*' for ${APP_ENV}."

  if [[ -n "$CORS_REGEX" ]]; then
    warn "THAI_TONES_CORS_ORIGIN_REGEX is set. Keep it narrow in ${APP_ENV}."
  fi
else
  if [[ -z "$API_BASE_URL" ]]; then
    warn "EXPO_PUBLIC_API_BASE_URL is not set. Mobile will use platform local defaults."
  fi
fi

echo "Release env check passed for ${APP_ENV}."
