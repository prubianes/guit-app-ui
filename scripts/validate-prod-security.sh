#!/usr/bin/env bash
set -euo pipefail

# Validate key production security controls for deployed UI/API.
#
# Required env:
# - BASE_URL (e.g. https://app.example.com)
# - TEST_EMAIL
# - TEST_PASSWORD
#
# Optional env:
# - API_BASE_URL (e.g. https://api.example.com/api/v2)
# - REQUIRE_SECURE_COOKIE (default: true)
#
# Notes:
# - This script expects login form auth at POST /login.
# - TEST_PASSWORD should avoid shell-sensitive characters unless properly escaped.

BASE_URL="${BASE_URL:-}"
TEST_EMAIL="${TEST_EMAIL:-}"
TEST_PASSWORD="${TEST_PASSWORD:-}"
API_BASE_URL="${API_BASE_URL:-}"
REQUIRE_SECURE_COOKIE="${REQUIRE_SECURE_COOKIE:-true}"

if [[ -z "$BASE_URL" || -z "$TEST_EMAIL" || -z "$TEST_PASSWORD" ]]; then
  echo "Missing required env. Usage:"
  echo "  BASE_URL=https://app.example.com TEST_EMAIL=user@example.com TEST_PASSWORD='***' pnpm security:validate"
  exit 1
fi

TMP_HEADERS="$(mktemp)"
TMP_BODY="$(mktemp)"
cleanup() {
  rm -f "$TMP_HEADERS" "$TMP_BODY"
}
trap cleanup EXIT

echo "==> Checking auth cookie flags via POST /login"
curl -sS -D "$TMP_HEADERS" -o "$TMP_BODY" \
  -X POST "$BASE_URL/login" \
  -H "Origin: $BASE_URL" \
  -H "Referer: $BASE_URL/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "email=$TEST_EMAIL&password=$TEST_PASSWORD" || {
    echo "Login request failed."
    exit 1
  }

ACCESS_SET_COOKIE="$(grep -i '^set-cookie: finance_access_token=' "$TMP_HEADERS" || true)"
REFRESH_SET_COOKIE="$(grep -i '^set-cookie: finance_refresh_token=' "$TMP_HEADERS" || true)"

if [[ -z "$ACCESS_SET_COOKIE" ]]; then
  echo "FAIL: finance_access_token Set-Cookie header missing."
  exit 1
fi

if [[ -z "$REFRESH_SET_COOKIE" ]]; then
  echo "FAIL: finance_refresh_token Set-Cookie header missing."
  exit 1
fi

echo "Found auth cookies."

if ! grep -qi '^set-cookie: finance_access_token=.*HttpOnly' "$TMP_HEADERS"; then
  echo "FAIL: finance_access_token missing HttpOnly."
  exit 1
fi

if ! grep -qi '^set-cookie: finance_access_token=.*SameSite=Lax' "$TMP_HEADERS"; then
  echo "FAIL: finance_access_token missing SameSite=Lax."
  exit 1
fi

if [[ "$REQUIRE_SECURE_COOKIE" == "true" ]]; then
  if ! grep -qi '^set-cookie: finance_access_token=.*Secure' "$TMP_HEADERS"; then
    echo "FAIL: finance_access_token missing Secure in production mode."
    exit 1
  fi
fi

echo "PASS: auth cookie flags validated."

if [[ -n "$API_BASE_URL" ]]; then
  echo "==> Checking API CORS headers"
  CORS_HEADERS="$(mktemp)"
  trap 'cleanup; rm -f "$CORS_HEADERS"' EXIT

  curl -sS -D "$CORS_HEADERS" -o /dev/null \
    -X OPTIONS "$API_BASE_URL/me" \
    -H "Origin: https://evil.example.com" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: authorization,content-type" || {
      echo "WARN: API CORS preflight request failed."
      exit 1
    }

  ACAO="$(grep -i '^access-control-allow-origin:' "$CORS_HEADERS" | head -n1 | cut -d':' -f2- | xargs || true)"
  ACAC="$(grep -i '^access-control-allow-credentials:' "$CORS_HEADERS" | head -n1 | cut -d':' -f2- | xargs || true)"

  if [[ "$ACAO" == "*" && "$ACAC" == "true" ]]; then
    echo "FAIL: invalid CORS policy (wildcard origin with credentials=true)."
    exit 1
  fi

  echo "PASS: CORS policy sanity check completed."
fi

echo "Security validation completed."
