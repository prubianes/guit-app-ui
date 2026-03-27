# V1 Readiness Checklist

Use this file as the single go/no-go gate before shipping.

Legend:
- `[ ]` pending
- `[x]` complete
- `Owner` = person accountable for closure

## 1) Product QA

- [x] Auth flow pass baseline automated (login/logout/login + invalid-token redirect in Playwright) (`Owner: Engineering`)
- [x] CRUD pass baseline automated (accounts/categories/transactions/budgets cycle in Playwright with `E2E_ENABLE_CRUD=true`) (`Owner: Engineering`)
- [x] Backend error UX pass: validation, unauthorized, rate limit (`Owner: Engineering`)
- [x] Cross-browser/device pass: Chrome, Firefox, Safari + mobile (`Owner: Engineering`)
- [x] Dark/light visual pass and responsive breakpoints (`Owner: Engineering`)

## 2) Reliability and Operations

- [x] CI quality gates active (`pnpm check`, `pnpm build`, `pnpm test`, `pnpm test:e2e`) (`Owner: Engineering`)
- [x] Env template includes API + release variables (`Owner: Engineering`)
- [x] Deploy target adapter confirmed (Node 22 + `@sveltejs/adapter-node`) (`Owner: Engineering`)
- [x] Monitoring scaffold enabled for server/client failures (`hooks.server.ts` + `hooks.client.ts`) (`Owner: Engineering`)
- [x] Release rollback procedure documented (`Owner: Engineering`)

## 3) Test Gate

- [x] Unit/integration tests run in CI (`Owner: Engineering`)
- [x] Playwright smoke suite runs in CI (`Owner: Engineering`)
- [x] Add critical-path auth E2E coverage: login/logout/login (`Owner: Engineering`)
- [x] Add forced redirect E2E scenario for invalid token cookies (`Owner: Engineering`)
- [x] Add manual CI path for full CRUD E2E with secrets (`Owner: Engineering`)
- [x] Execute and pass full CRUD E2E in configured environment (`E2E_ENABLE_CRUD=true`) (`Owner: Engineering`)

## 4) Security and Data Handling

- [x] Production security validation script added (`pnpm security:validate`) (`Owner: Engineering`)
- [ ] Verify prod cookie flags (`httpOnly`, `secure`, `sameSite=lax`) in deployed env (`Owner: TBD`)
- [ ] Verify CORS + credentialed requests against deployed backend (`Owner: TBD`)
- [x] Structured API error logging with redaction enabled (`Owner: Engineering`)
- [ ] Review logs for sensitive field leakage in real traffic (`Owner: TBD`)

## 5) Accessibility and Performance

- [x] Keyboard-only navigation pass baseline implemented (Escape-close dialogs, focusable dialog root, nav `aria-current`) (`Owner: Engineering`)
- [x] Focus visibility and semantic labels baseline implemented (global focus-visible, field/error associations, table aria labels/sort) (`Owner: Engineering`)
- [x] Contrast audit baseline automated for light/dark auth routes (`e2e/a11y.spec.ts`) (`Owner: Engineering`)
- [x] Lighthouse run workflow + baseline targets defined (`lighthouserc.json` + CI workflow) (`Owner: Engineering`)

## 6) Documentation and Handoff

- [x] Setup and env documentation present (`Owner: Engineering`)
- [x] Troubleshooting section present (`Owner: Engineering`)
- [x] Release notes template added (`Owner: Engineering`)
- [x] V1 release notes draft created (scope + known limitations) (`Owner: Engineering`)

## Local Release Gate Command

```bash
pnpm release:check
```

## Live Verification Command

Run this in staging/production with real env values to close remaining security checks:

```bash
BASE_URL=https://app.example.com API_BASE_URL=https://api.example.com/api/v2 TEST_EMAIL=user@example.com TEST_PASSWORD='***' LOG_FILE=./app-production.log pnpm security:verify-live
```

Evidence report path:

```text
docs/releases/v1-live-verification.md
```
