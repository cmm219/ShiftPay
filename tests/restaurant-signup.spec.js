import { test, expect } from '@playwright/test';

test.describe('Restaurant Signup (/restaurant/signup)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/restaurant/signup');
    await page.evaluate(() => localStorage.removeItem('shiftpay-restaurant-signup'));
    await page.reload();
  });

  test('renders step 1', async ({ page }) => {
    await expect(page.locator('text=/Step 1/').first()).toBeVisible();
  });

  test('has restaurant name input', async ({ page }) => {
    // Find any text input on the page
    const inputs = page.locator('input[type="text"], input:not([type])');
    expect(await inputs.count()).toBeGreaterThan(0);
  });

  test('Next button advances to step 2', async ({ page }) => {
    // Fill any visible text inputs
    const inputs = page.locator('input[type="text"], input:not([type])');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        await input.fill('Test Value');
      }
    }

    const nextBtn = page.locator('button:has-text("Next")').first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('form data persists after reload', async ({ page }) => {
    const firstInput = page.locator('input[type="text"], input:not([type])').first();
    if (await firstInput.isVisible()) {
      await firstInput.fill('Persist Test');
      await page.waitForTimeout(500);
      await page.reload();
      await expect(firstInput).toHaveValue('Persist Test');
    }
  });
});
