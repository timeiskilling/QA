import { test, expect } from "@playwright/test";
// import { ClickUpMeta } from "../playwright/utils";
// import { Priority } from "../playwright/clickUp/priority";
// import { Tags } from "../playwright/clickUp/tags";
// import { Severity } from "../playwright/clickUp/severity";
// import { Status } from "../playwright/clickUp/status";
import path from "path";
import { readFile } from "fs/promises";

test.beforeEach(async ({ page }) => {
  await page.goto("https://www.saucedemo.com/inventory.html");
  await expect(page.getByText("Swag Labs")).toBeVisible();
});

test("add_to_cart", async ({ page }) => {
  await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
  await page.locator('[data-test="shopping-cart-link"]').click();
  const backpackItem = page
    .locator('[data-test="inventory-item-name"]')
    .filter({ hasText: "Sauce Labs Backpack" });
  await expect(backpackItem).toBeVisible();

  await expect(page.locator('[data-test="shopping-cart-badge"]')).toContainText(
    "1",
  );
});

test("remove_from_cart_from_item_page", async ({ page }) => {
  // ClickUpMeta.setDetails({
  //   description: "Remove from cart from item page.",
  //   priority: Priority.High,
  //   severity: Severity.Major,
  //   status: Status.inQa,
  //   tags: [Tags.Feature, Tags.QA],
  // });

  await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
  await page.locator('[data-test="shopping-cart-link"]').click();
  await page.locator('[data-test="item-4-title-link"]').click();
  await page.getByText("Sauce Labs Backpackcarry.").click();
  await page.locator('[data-test="remove"]').click();

  await expect(
    page.locator('[data-test="shopping-cart-link"]'),
  ).toHaveAttribute("aria-label", "Cart, empty");

  await expect(page.locator('[data-test="shopping-cart-badge"]')).toBeHidden();
});

test.describe('Unauthenticated tests', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('invalid_login', async ({ page }) => {

    await page.locator('[data-test="username"]').click();
    await page.locator('[data-test="username"]').fill('qwe');
    await page.locator('[data-test="password"]').click();
    await page.locator('[data-test="password"]').fill('qwe');
    await page.locator('[data-test="login-button"]').click();
    await expect(page.locator('[data-test="error"]')).toContainText('Epic sadface: Username and password do not match any user in this service');
  });

});

test.describe('Blocked user tests', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('invalid_login', async ({ page }) => {

    const credentialsPath = path.join(import.meta.dirname, '../playwright/.auth/user.json');
    const raw = await readFile(credentialsPath, 'utf-8');
    const { blockedUsername, blockedPassword } = JSON.parse(raw);

    await page.locator('[data-test="username"]').click();
    await page.locator('[data-test="username"]').fill(blockedUsername);
    await page.locator('[data-test="password"]').click();
    await page.locator('[data-test="password"]').fill(blockedPassword);
    await page.locator('[data-test="login-button"]').click();
    await expect(page.locator('[data-test="error"]')).toContainText('Epic sadface: Sorry, this user has been locked out.');  });

});
