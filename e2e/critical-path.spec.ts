import { expect, test, type Page } from "@playwright/test";

const API_BASE_URL = process.env.E2E_API_BASE_URL ?? "http://localhost:3000/api/v2";
const E2E_TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const E2E_TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;
const E2E_ENABLE_CRUD = process.env.E2E_ENABLE_CRUD === "true";

const unique = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

async function isBackendReachable() {
  try {
    const response = await fetch(`${API_BASE_URL}/me`, { method: "GET" });
    return response.status >= 200 && response.status < 500;
  } catch {
    return false;
  }
}

async function provisionCredentials() {
  if (E2E_TEST_EMAIL && E2E_TEST_PASSWORD) {
    return { email: E2E_TEST_EMAIL, password: E2E_TEST_PASSWORD };
  }

  const email = `${unique("e2e-user")}@example.com`;
  const password = "E2E-pass-1234";
  const name = "E2E Operator";

  const payloads = [
    { email, password, name, firstName: "E2E", lastName: "Operator" },
    { email, password, name },
    { email, password, firstName: "E2E", lastName: "Operator" }
  ];

  for (const payload of payloads) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        return { email, password };
      }
    } catch {
      // continue trying alternate payloads
    }
  }

  return null;
}

async function loginAndLandOnDashboard(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/$/);
}

async function createApiSession(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    throw new Error(`Could not create API session: ${response.status}`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const data = (payload.data ?? payload) as Record<string, unknown>;
  const tokens = (data.tokens ?? {}) as Record<string, unknown>;

  let accessToken =
    (data.accessToken as string | undefined) ??
    (data.access_token as string | undefined) ??
    (data.token as string | undefined) ??
    (data.jwt as string | undefined) ??
    (tokens.accessToken as string | undefined) ??
    (tokens.access_token as string | undefined);

  if (!accessToken) {
    const setCookieValues =
      typeof (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie === "function"
        ? (response.headers as Headers & { getSetCookie: () => string[] }).getSetCookie()
        : [response.headers.get("set-cookie")].filter(Boolean) as string[];

    for (const cookieHeader of setCookieValues) {
      const match = cookieHeader.match(/finance_access_token=([^;]+)/i);
      if (match?.[1]) {
        accessToken = decodeURIComponent(match[1]);
        break;
      }
    }
  }

  if (!accessToken) {
    throw new Error("Missing accessToken from login response.");
  }

  return accessToken;
}

async function apiRequest<T = unknown>(accessToken: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API request failed (${response.status}) ${path}: ${body}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json()) as { data: T };
  return payload.data;
}

test.describe("critical path", () => {
  let backendAvailable = false;
  let credentials: { email: string; password: string } | null = null;

  test.beforeAll(async () => {
    backendAvailable = await isBackendReachable();
    if (backendAvailable) {
      credentials = await provisionCredentials();
    }
  });

  test("login -> logout -> login flow", async ({ page }) => {
    test.skip(!backendAvailable, "Backend API is not reachable; skipping API-dependent critical path.");
    test.skip(!credentials, "No E2E credentials available. Set E2E_TEST_EMAIL/E2E_TEST_PASSWORD or enable register API.");
    const creds = credentials!;

    await loginAndLandOnDashboard(page, creds.email, creds.password);
    await page.getByRole("button", { name: "Logout" }).first().click();
    await expect(page).toHaveURL(/\/login$/);
    await loginAndLandOnDashboard(page, creds.email, creds.password);
    await expect(page.getByText("All money flows in one board.")).toBeVisible();
  });

  test("login/logout/login and CRUD cycles", async ({ page }) => {
    test.skip(!E2E_ENABLE_CRUD, "Set E2E_ENABLE_CRUD=true to run full CRUD critical-path E2E.");
    test.skip(!backendAvailable, "Backend API is not reachable; skipping API-dependent critical path.");
    test.skip(!credentials, "No E2E credentials available. Set E2E_TEST_EMAIL/E2E_TEST_PASSWORD or enable register API.");
    const creds = credentials!;

    await loginAndLandOnDashboard(page, creds.email, creds.password);
    await page.getByRole("button", { name: "Logout" }).first().click();
    await expect(page).toHaveURL(/\/login$/);

    await loginAndLandOnDashboard(page, creds.email, creds.password);
    await expect(page.getByText("All money flows in one board.")).toBeVisible();

    const accountName = unique("E2E Account");
    const categoryName = unique("E2E Category");
    const budgetAmount = 321.45;
    const txDescription = unique("E2E Transaction");
    const accessToken = await createApiSession(creds.email, creds.password);

    const account = await apiRequest<{ id: number }>(accessToken, "/me/accounts", {
      method: "POST",
      body: JSON.stringify({
        name: accountName,
        type: "checking",
        currency: "USD",
        balance: 1234.56,
        institution: "E2E Bank"
      })
    });

    const category = await apiRequest<{ id: number }>(accessToken, "/me/categories", {
      method: "POST",
      body: JSON.stringify({
        name: categoryName,
        kind: "expense",
        type: "expense"
      })
    });

    const budget = await apiRequest<{ id: number }>(accessToken, "/me/budgets", {
      method: "POST",
      body: JSON.stringify({
        categoryId: category.id,
        amount: budgetAmount,
        period: "monthly",
        startDate: todayIsoDate()
      })
    });

    const transaction = await apiRequest<{ id: number }>(accessToken, "/me/transactions", {
      method: "POST",
      body: JSON.stringify({
        accountId: account.id,
        categoryId: category.id,
        amount: 42.25,
        type: "expense",
        description: txDescription,
        date: `${todayIsoDate()}T00:00:00.000Z`
      })
    });

    await page.goto("/accounts");
    await expect(page.getByRole("cell", { name: accountName }).first()).toBeVisible();

    await page.goto("/categories");
    await expect(page.getByRole("cell", { name: categoryName }).first()).toBeVisible();

    await page.goto("/budgets");
    await expect(page.getByRole("cell", { name: categoryName }).first()).toBeVisible();

    await page.goto("/transactions");
    await expect(page.getByRole("cell", { name: txDescription }).first()).toBeVisible();

    await apiRequest(accessToken, `/me/transactions/${transaction.id}`, { method: "DELETE" });
    await apiRequest(accessToken, `/me/budgets/${budget.id}`, { method: "DELETE" });
    await apiRequest(accessToken, `/me/categories/${category.id}`, { method: "DELETE" });
    await apiRequest(accessToken, `/me/accounts/${account.id}`, { method: "DELETE" });
  });

  test("invalid token cookies force redirect to /login on protected route", async ({ page, context }) => {
    test.skip(!backendAvailable, "Backend API is not reachable; skipping API-dependent critical path.");

    await context.addCookies([
      {
        name: "finance_access_token",
        value: "invalid-access-token",
        domain: "127.0.0.1",
        path: "/"
      },
      {
        name: "finance_refresh_token",
        value: "invalid-refresh-token",
        domain: "127.0.0.1",
        path: "/"
      }
    ]);

    await page.goto("/accounts");
    await expect(page).toHaveURL(/\/login$/);
  });
});
