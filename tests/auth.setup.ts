import { test as setup, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path  from 'node:path';

setup('authenticate', async ({ page }) => {
  await page.goto('https://www.saucedemo.com');
  await expect(page.getByText('Swag Labs')).toBeVisible();

  const credentialsPath = path.join(import.meta.dirname, '../playwright/.auth/user.json');
  const raw = await readFile(credentialsPath, 'utf-8');
  const { username, password } = JSON.parse(raw);

  await page.locator('[data-test="username"]').fill(username);
  await page.locator('[data-test="password"]').fill(password);
  await page.locator('[data-test="login-button"]').click();

  await expect(page.locator('[data-test="inventory-container"]')).toBeVisible();

  await page.context().storageState({ path: 'playwright/.auth/user-state.json' });
});
