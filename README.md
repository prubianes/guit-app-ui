# Guit App UI (SvelteKit)

Production-ready personal finance web UI built with:

- Svelte + SvelteKit + TypeScript
- pnpm
- Tailwind CSS
- Zod validation
- SvelteKit server `load` + `actions`

## Features

- Auth routes: `/login`, `/register`
- Protected routes: `/`, `/accounts`, `/categories`, `/transactions`, `/budgets`, `/profile`
- Custom 404 via `+error.svelte`
- Typed API client layer for `/api/v2`
- HttpOnly cookie session strategy (access + refresh tokens)
- Automatic one-time refresh retry on `401`
- Reusable table, modal, confirm dialog, loading bar, state messages, and toast notifications

## Environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Required variables:

```env
PUBLIC_API_BASE_URL=http://localhost:3000
PUBLIC_API_VERSION=/api/v2
```

Optional private overrides:

```env
PRIVATE_API_BASE_URL=http://localhost:3000
PRIVATE_API_VERSION=/api/v2
```

## Install and Run

```bash
pnpm install
pnpm dev
```

## Checks

```bash
pnpm check
pnpm build
pnpm test
```

## Optional E2E

```bash
pnpm test:e2e
```

This runs Playwright smoke tests for auth guard + 404 behavior.

## Operations and Troubleshooting

### Auth/session behavior

- Session uses HttpOnly cookies: `finance_access_token` and `finance_refresh_token`.
- Protected requests retry once on auth failures (`401`, `UNAUTHORIZED`, `INVALID_TOKEN`) via refresh flow.
- If refresh fails, cookies are cleared and user is redirected to `/login`.

### Structured logging

- API failures are logged as structured JSON events (`api.error`).
- Logs include a `release` field (`PUBLIC_APP_RELEASE`/`APP_RELEASE`/CI SHA fallback).
- Logs include request context (`requestId`, route, endpoint, method, status, code).
- Sensitive fields are redacted by key before logging (password/token/cookie/authorization family keys).
- Product funnel milestones are logged as `product.funnel` for auth and create flows.

### Common backend contract failures

- `VALIDATION_ERROR` with numeric IDs:
  - Transaction/account/category IDs are normalized client-side before request.
- `VALIDATION_ERROR` on datetime:
  - Date inputs are normalized to ISO UTC datetime (`YYYY-MM-DDT00:00:00.000Z`).
- Register payload mismatch:
  - Register sends `name` derived from first + last name.

### Debug workflow

1. Run `pnpm dev`.
2. Reproduce the failing action.
3. Inspect server logs for `api.error` entries and `requestId`.
4. Compare `code` + `details.path` with route action field mapping.

## Architecture

```text
src/
  lib/
    api/        # typed API client + domain models + API errors
    auth/       # cookie/session helpers
    components/ # reusable UI primitives
    utils/      # action error utilities and env helpers
  routes/
    (app)/      # protected area layout + pages
    login/
    register/
    +layout.svelte
    +error.svelte
  hooks.server.ts
```
