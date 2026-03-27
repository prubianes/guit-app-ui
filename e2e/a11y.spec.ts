import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function auditCurrentPage(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();

  const blockingViolations = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact ?? "")
  );

  expect(blockingViolations, JSON.stringify(blockingViolations, null, 2)).toEqual([]);
}

async function runThemeAudit(page: Page, path: string) {
  await page.goto(path);
  await auditCurrentPage(page);

  const themeToggle = page.getByRole("button", { name: /Theme:/i }).first();
  if (await themeToggle.isVisible()) {
    await themeToggle.click();
    await auditCurrentPage(page);
  }
}

test("login page has no serious/critical accessibility violations in both themes", async ({ page }) => {
  await runThemeAudit(page, "/login");
});

test("register page has no serious/critical accessibility violations in both themes", async ({ page }) => {
  await runThemeAudit(page, "/register");
});
