#!/usr/bin/env bash
set -euo pipefail

# Orchestrates final live-environment V1 checks and writes an evidence report.
#
# Required env:
# - BASE_URL
# - TEST_EMAIL
# - TEST_PASSWORD
# - API_BASE_URL
#
# Optional env:
# - LOG_FILE (if omitted, log redaction audit is marked as skipped)
# - REPORT_PATH (default: docs/releases/v1-live-verification.md)
# - REQUIRE_SECURE_COOKIE (default: true)

BASE_URL="${BASE_URL:-}"
TEST_EMAIL="${TEST_EMAIL:-}"
TEST_PASSWORD="${TEST_PASSWORD:-}"
API_BASE_URL="${API_BASE_URL:-}"
LOG_FILE="${LOG_FILE:-}"
REPORT_PATH="${REPORT_PATH:-docs/releases/v1-live-verification.md}"
REQUIRE_SECURE_COOKIE="${REQUIRE_SECURE_COOKIE:-true}"

if [[ -z "${BASE_URL}" || -z "${TEST_EMAIL}" || -z "${TEST_PASSWORD}" || -z "${API_BASE_URL}" ]]; then
  cat <<'USAGE'
Missing required env.
Usage:
  BASE_URL=https://app.example.com \
  API_BASE_URL=https://api.example.com/api/v2 \
  TEST_EMAIL=user@example.com \
  TEST_PASSWORD='***' \
  pnpm security:verify-live

Optional:
  LOG_FILE=./app.log
  REPORT_PATH=docs/releases/v1-live-verification.md
  REQUIRE_SECURE_COOKIE=true
USAGE
  exit 1
fi

mkdir -p "$(dirname "${REPORT_PATH}")"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
RESULT_ROWS=""

run_check() {
  local id="$1"
  local description="$2"
  local command="$3"
  local log_file="${TMP_DIR}/${id}.log"

  set +e
  bash -lc "${command}" >"${log_file}" 2>&1
  local code=$?
  set -e

  if [[ ${code} -eq 0 ]]; then
    PASS_COUNT=$((PASS_COUNT + 1))
    RESULT_ROWS="${RESULT_ROWS}
| ${id} | ${description} | PASS | \`0\` |"
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
    RESULT_ROWS="${RESULT_ROWS}
| ${id} | ${description} | FAIL | \`${code}\` |"
  fi
}

run_skip() {
  local id="$1"
  local description="$2"
  SKIP_COUNT=$((SKIP_COUNT + 1))
  RESULT_ROWS="${RESULT_ROWS}
| ${id} | ${description} | SKIPPED | - |"
}

run_check \
  "SEC-1" \
  "Cookie flags (HttpOnly/SameSite/Secure) via deployed login" \
  "BASE_URL='${BASE_URL}' TEST_EMAIL='${TEST_EMAIL}' TEST_PASSWORD='${TEST_PASSWORD}' REQUIRE_SECURE_COOKIE='${REQUIRE_SECURE_COOKIE}' bash ./scripts/validate-prod-security.sh"

run_check \
  "SEC-2" \
  "CORS + credentials policy sanity via deployed API preflight" \
  "BASE_URL='${BASE_URL}' API_BASE_URL='${API_BASE_URL}' TEST_EMAIL='${TEST_EMAIL}' TEST_PASSWORD='${TEST_PASSWORD}' REQUIRE_SECURE_COOKIE='${REQUIRE_SECURE_COOKIE}' bash ./scripts/validate-prod-security.sh"

if [[ -n "${LOG_FILE}" ]]; then
  run_check \
    "SEC-3" \
    "Sensitive data redaction audit on production/staging logs" \
    "LOG_FILE='${LOG_FILE}' bash ./scripts/audit-log-redaction.sh"
else
  run_skip "SEC-3" "Sensitive data redaction audit on production/staging logs (LOG_FILE not provided)"
fi

OVERALL="PASS"
if [[ ${FAIL_COUNT} -gt 0 ]]; then
  OVERALL="FAIL"
fi

{
  echo "# V1 Live Verification Report"
  echo
  echo "- Generated (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "- Base URL: ${BASE_URL}"
  echo "- API Base URL: ${API_BASE_URL}"
  echo "- Require Secure Cookie: ${REQUIRE_SECURE_COOKIE}"
  echo "- Log File: ${LOG_FILE:-not provided}"
  echo "- Overall: **${OVERALL}**"
  echo
  echo "## Results"
  echo
  echo "| Check | Description | Status | Exit |"
  echo "| --- | --- | --- | --- |${RESULT_ROWS}"
  echo
  echo "## Summary"
  echo
  echo "- Passed: ${PASS_COUNT}"
  echo "- Failed: ${FAIL_COUNT}"
  echo "- Skipped: ${SKIP_COUNT}"
  echo
  echo "## Command Outputs"
  echo
  for file in "${TMP_DIR}"/*.log; do
    id="$(basename "${file}" .log)"
    echo "### ${id}"
    echo
    echo '```text'
    cat "${file}"
    echo '```'
    echo
  done
} >"${REPORT_PATH}"

echo "Wrote report: ${REPORT_PATH}"
if [[ "${OVERALL}" == "FAIL" ]]; then
  exit 1
fi
