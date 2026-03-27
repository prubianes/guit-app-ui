import { expect, test, type Page } from "@playwright/test";

const API_BASE_URL = process.env.E2E_API_BASE_URL ?? "http://localhost:3000/api/v2";
const E2E_TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const E2E_TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;

const unique = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

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

  const email = `${unique("e2e-ui-user")}@example.com`;
  const password = "E2E-pass-1234";
  const payload = { email, password, name: "UI Smoke User" };

  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) return null;
  return { email, password };
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/$/);
}

test("theme preference key persists across protected routes", async ({ page }) => {
  const backendAvailable = await isBackendReachable();
  test.skip(!backendAvailable, "Backend API unavailable for protected-route theme smoke.");

  const creds = await provisionCredentials();
  test.skip(!creds, "No credentials available for protected-route theme smoke.");

  await page.goto("/login");
  await page.evaluate(() => localStorage.setItem("finance-theme", "dark"));
  await login(page, creds.email, creds.password);
  const routes = ["/", "/accounts", "/categories", "/transactions", "/budgets", "/profile"];

  for (const route of routes) {
    await page.goto(route);
    await expect(page.getByRole("main")).toBeVisible();
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem("finance-theme") ?? "light"))
      .toBe("dark");
  }
});

test("auth pages are responsive in light/dark themes on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of ["/login", "/register"]) {
    for (const theme of ["light", "dark"] as const) {
      await page.goto(route);
      await page.evaluate((selectedTheme) => {
        localStorage.setItem("finance-theme", selectedTheme);
        document.body.dataset.theme = selectedTheme;
      }, theme);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      );
      expect(overflow).toBe(false);
    }
  }
});
