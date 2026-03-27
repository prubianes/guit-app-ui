#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   LOG_FILE=./server.log pnpm security:audit-logs
#   pnpm security:audit-logs -- ./server.log

LOG_FILE="${LOG_FILE:-${1:-}}"

if [[ -z "${LOG_FILE}" ]]; then
  echo "Missing log file path."
  echo "Usage: LOG_FILE=./server.log pnpm security:audit-logs"
  echo "   or: pnpm security:audit-logs -- ./server.log"
  exit 1
fi

if [[ ! -f "${LOG_FILE}" ]]; then
  echo "Log file not found: ${LOG_FILE}"
  exit 1
fi

echo "==> Auditing logs for obvious secret leakage: ${LOG_FILE}"

# This looks for sensitive keys where the value is not redacted.
PATTERN='("password"|"token"|"access_token"|"accessToken"|"refresh_token"|"refreshToken"|"authorization"|"cookie"|"set-cookie")[[:space:]]*:[[:space:]]*"[^"]+"'
REDACATED_PATTERN='"(\*\*\*redacted\*\*\*)"'

MATCHES="$(grep -Eni "${PATTERN}" "${LOG_FILE}" || true)"
if [[ -z "${MATCHES}" ]]; then
  echo "PASS: no sensitive key/value candidates found."
  exit 0
fi

UNREDACTED="$(echo "${MATCHES}" | grep -Evi "${REDACATED_PATTERN}" || true)"
if [[ -z "${UNREDACTED}" ]]; then
  echo "PASS: sensitive keys are present but redacted."
  exit 0
fi

echo "FAIL: potential unredacted sensitive values found:"
echo "${UNREDACTED}"
exit 1
