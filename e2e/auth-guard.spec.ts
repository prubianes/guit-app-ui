import { expect, test } from "@playwright/test";

test("redirects unauthenticated access from / to /login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("shows custom not-found page on unknown route", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");
  await expect(page.getByText("Page does not exist")).toBeVisible();
});
