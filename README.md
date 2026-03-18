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
```

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
