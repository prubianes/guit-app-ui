# Release Runbook

This runbook defines the minimal release and rollback procedure for V1.

## 1) Pre-release gate

1. Ensure environment variables are set for target environment.
2. Run local gate:

```bash
pnpm release:check
```

3. Verify CI `quality` job is green on the release commit.
4. (Optional but recommended) Trigger manual CRUD E2E from GitHub Actions with `run_crud_e2e=true`.

## 2) Release steps

1. Create release tag (example):

```bash
git tag v1.0.0
git push origin v1.0.0
```

2. Deploy using your target platform pipeline.
   - Runtime profile: Node 22, `pnpm build`, then `pnpm start`.
3. Validate production smoke checklist:
   - `/login` renders and accepts credentials
   - `/` redirects correctly when unauthenticated
   - `/accounts` loads with authenticated session
   - Theme toggle works and persists
4. Run security validation commands on deployed target:

```bash
BASE_URL=https://app.example.com TEST_EMAIL=user@example.com TEST_PASSWORD='***' REQUIRE_SECURE_COOKIE=true pnpm security:validate
BASE_URL=https://app.example.com TEST_EMAIL=user@example.com TEST_PASSWORD='***' API_BASE_URL=https://api.example.com/api/v2 pnpm security:validate
```
5. Review post-release logs and enforce redaction:

```bash
LOG_FILE=./app-production.log pnpm security:audit-logs
```

6. Prefer one-shot verification + artifact report:

```bash
BASE_URL=https://app.example.com API_BASE_URL=https://api.example.com/api/v2 TEST_EMAIL=user@example.com TEST_PASSWORD='***' LOG_FILE=./app-production.log pnpm security:verify-live
```

Expected output artifact:
- `docs/releases/v1-live-verification.md`

## 3) Rollback procedure

Use rollback when login, protected routing, or CRUD paths are broken in production.

1. Identify last known good commit/tag.
2. Redeploy that version immediately.
3. Confirm recovery with the same smoke checklist.
4. Communicate rollback status and impact window.
5. Open follow-up issue with:
   - broken version
   - rollback target version
   - root-cause hypothesis
   - corrective actions

## 4) Incident notes template

- Start time (UTC):
- End time (UTC):
- Customer impact:
- Trigger:
- Detection source:
- Mitigation:
- Permanent fix:
