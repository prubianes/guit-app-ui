# V1 Live Verification Report

- Generated (UTC): 2026-03-27T02:58:54Z
- Base URL: http://localhost:5174
- API Base URL: http://localhost:3000/api/v2
- Require Secure Cookie: false
- Log File: not provided
- Overall: **PASS**

## Results

| Check | Description | Status | Exit |
| --- | --- | --- | --- |
| SEC-1 | Cookie flags (HttpOnly/SameSite/Secure) via deployed login | PASS | `0` |
| SEC-2 | CORS + credentials policy sanity via deployed API preflight | PASS | `0` |
| SEC-3 | Sensitive data redaction audit on production/staging logs (LOG_FILE not provided) | SKIPPED | - |

## Summary

- Passed: 2
- Failed: 0
- Skipped: 1

## Command Outputs

### SEC-1

```text
==> Checking auth cookie flags via POST /login
Found auth cookies.
PASS: auth cookie flags validated.
==> Checking API CORS headers
PASS: CORS policy sanity check completed.
Security validation completed.
```

### SEC-2

```text
==> Checking auth cookie flags via POST /login
Found auth cookies.
PASS: auth cookie flags validated.
==> Checking API CORS headers
PASS: CORS policy sanity check completed.
Security validation completed.
```

