# Guit Finance UI

Personal finance web app frontend built with SvelteKit, focused on production patterns: typed API contracts, cookie-based auth, protected routing, resilient CRUD UX, and CI quality gates.

## Product scope

Routes implemented:

- Public: `/login`, `/register`
- Protected: `/`, `/accounts`, `/categories`, `/transactions`, `/budgets`, `/profile`
- Error: custom `404` UX via `+error.svelte`

Core capabilities:

- Access + refresh auth with HttpOnly cookies
- Automatic one-time refresh/retry on auth failure
- Full CRUD for accounts, categories, budgets, and transactions
- Domain-aware forms (typed IDs, ISO datetime normalization, backend error mapping)
- Global toast feedback, modal forms, confirm dialogs, loading/empty/error states
- Light/dark theme persistence and responsive layout

## UI and design direction

- Orbit-inspired design system (editorial, high-contrast, operational tone)
- Shared visual tokens and motif utilities
- Consistent component sizing and state behavior
- Mobile + desktop navigation patterns for protected app shell

## Tech stack

- Svelte 5 + SvelteKit 2 + TypeScript
- Tailwind CSS v4
- Zod (validation and contract safety)
- Playwright + Vitest
- pnpm

## Architecture

```text
src/
  lib/
    api/          # typed client, schemas, adapters, endpoint wrappers
    auth/         # cookie/session helpers
    components/   # reusable UI building blocks
    utils/        # logger, action helpers, env helpers
  routes/
    (app)/        # protected layout + finance pages
    login/
    register/
    +layout.svelte
    +error.svelte
  hooks.server.ts # auth guard, session hydration, server error handling
  hooks.client.ts # client-side global error capture
```

## Backend contract

Backend project:

- [guit-app-api](https://github.com/prubianes/guit-app-api)

- Base URL: `http://localhost:3000`
- API version: `/api/v2`
- Success envelope: `{ data: ... }`
- Error envelope: `{ error: { code, message, details? } }`

Handled backend error codes include:

- `INVALID_CREDENTIALS`
- `UNAUTHORIZED`
- `VALIDATION_ERROR`
- `CATEGORY_NOT_FOUND`
- `ACCOUNT_NOT_FOUND`
- `RATE_LIMITED`

## Local setup

### 1) Install

```bash
pnpm install
```

### 2) Configure env

```bash
cp .env.example .env
```

### 3) Run

```bash
pnpm dev
```

App runs on the default SvelteKit dev server.

## Environment variables

Required:

| Variable | Description | Example |
| --- | --- | --- |
| `PUBLIC_API_BASE_URL` | Public backend host | `http://localhost:3000` |
| `PUBLIC_API_VERSION` | Public API prefix | `/api/v2` |

Optional:

| Variable | Description | Example |
| --- | --- | --- |
| `PRIVATE_API_BASE_URL` | Server-side API host override | `http://localhost:3000` |
| `PRIVATE_API_VERSION` | Server-side API version override | `/api/v2` |
| `PUBLIC_APP_RELEASE` | Release id shown in logs | `local-dev` |
| `APP_RELEASE` | Server release fallback | `local-dev` |
| `MONITORING_PROVIDER` | Monitoring backend (`console` or `none`) | `console` |
| `E2E_API_BASE_URL` | Playwright API base | `http://localhost:3000/api/v2` |
| `E2E_TEST_EMAIL` | Existing E2E user email | `qa@example.com` |
| `E2E_TEST_PASSWORD` | Existing E2E user password | `secret` |
| `E2E_ENABLE_CRUD` | Enables full CRUD E2E cycle | `true` |

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start local dev server |
| `pnpm check` | Type + Svelte diagnostics |
| `pnpm test` | Unit/integration tests (Vitest) |
| `pnpm test:e2e` | Chromium E2E suite |
| `pnpm test:e2e:matrix` | Chromium/Firefox/WebKit E2E |
| `pnpm build` | Production build |
| `pnpm start` | Run built Node server |
| `pnpm release:check` | Local release gate (`check + build + test`) |
| `pnpm security:validate` | Deployed cookie/CORS validation |
| `pnpm security:audit-logs` | Redaction audit over log files |
| `pnpm security:verify-live` | One-shot live verification + report |
| `pnpm lighthouse:ci` | Lighthouse baseline run |

## Testing and quality gates

- Vitest coverage for adapters/contracts/action and logger redaction logic
- Playwright coverage for auth guard, invalid-token redirects, responsive smoke, accessibility baseline
- Optional full CRUD E2E cycle with real backend (`E2E_ENABLE_CRUD=true`)
- CI workflows for quality, browser matrix, and Lighthouse checks

## Security and auth notes

- Cookie strategy: `finance_access_token` + `finance_refresh_token` (HttpOnly)
- Protected requests attach bearer token server-side
- On `401`/auth failure, client attempts refresh once and retries request
- On refresh failure, session is cleared and user is redirected to `/login`
- Structured JSON logging includes release + request context and redacts sensitive keys

## Production verification workflow

Run final live checks and generate a release artifact:

```bash
BASE_URL=https://app.example.com \
API_BASE_URL=https://api.example.com/api/v2 \
TEST_EMAIL=user@example.com \
TEST_PASSWORD='***' \
LOG_FILE=./app-production.log \
pnpm security:verify-live
```

Generated report:

```text
docs/releases/v1-live-verification.md
```

## Release docs

- `docs/V1_READINESS.md`
- `docs/RELEASE_RUNBOOK.md`
- `docs/RELEASE_NOTES_TEMPLATE.md`
- `docs/releases/v1.0.0-draft.md`

## Engineering highlights

- Building a feature-complete SPA/SSR hybrid with SvelteKit patterns
- Translating unstable backend contracts into stable typed UI models
- Implementing robust auth/session lifecycle and guarded routes
- Designing and scaling a custom design system without a UI kit
- Shipping with production guardrails (tests, CI, security scripts, runbooks)
