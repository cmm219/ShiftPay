import { test, expect } from '@playwright/test';

test.describe('Worker Signup (/worker/signup)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/worker/signup');
    await page.evaluate(() => localStorage.removeItem('shiftpay-worker-signup'));
    await page.reload();
  });

  test('renders step 1 with "Always Free" banner', async ({ page }) => {
    await expect(page.locator('text=Always Free for Workers')).toBeVisible();
  });

  test('shows step indicator "Step 1 of 6"', async ({ page }) => {
    await expect(page.locator('text=Step 1 of 6')).toBeVisible();
  });

  test('shows step labels: Basics and Roles', async ({ page }) => {
    await expect(page.locator('text=Basics').first()).toBeVisible();
    await expect(page.locator('text=Roles').first()).toBeVisible();
  });

  test('step 1 has Full Name input', async ({ page }) => {
    const name = page.locator('input[placeholder="Jane Doe"]');
    await expect(name).toBeVisible();
    await name.fill('Test Worker');
    await expect(name).toHaveValue('Test Worker');
  });

  test('step 1 has Email input', async ({ page }) => {
    const email = page.locator('input[placeholder="jane@example.com"]');
    await expect(email).toBeVisible();
    await email.fill('test@example.com');
  });

  test('step 1 has Phone input', async ({ page }) => {
    const phone = page.locator('input[placeholder="(555) 123-4567"]');
    await expect(phone).toBeVisible();
  });

  test('Next button advances to step 2', async ({ page }) => {
    await page.locator('input[placeholder="Jane Doe"]').fill('Test Worker');
    await page.locator('input[placeholder="jane@example.com"]').fill('test@example.com');
    await page.locator('input[placeholder="(555) 123-4567"]').fill('(555) 123-4567');
    await page.locator('input[placeholder="Create a password"]').fill('TestPass123!');
    await page.locator('input[placeholder="Confirm your password"]').fill('TestPass123!');
    // Select a city
    const citySelect = page.locator('select');
    if (await citySelect.isVisible()) {
      await citySelect.selectOption({ index: 1 });
    }

    const nextBtn = page.locator('button:has-text("Next")').first();
    await nextBtn.click();
    await expect(page.locator('text=Step 2 of 6')).toBeVisible({ timeout: 5000 });
  });

  test('Back button returns to previous step', async ({ page }) => {
    // Go to step 2
    await page.locator('input[placeholder="Jane Doe"]').fill('Test');
    await page.locator('input[placeholder="jane@example.com"]').fill('t@t.com');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(300);

    // Go back
    const backBtn = page.locator('button:has-text("Back")').first();
    if (await backBtn.isVisible()) {
      await backBtn.click();
      await expect(page.locator('text=Step 1 of 6')).toBeVisible({ timeout: 3000 });
    }
  });

  test('form data persists after page reload', async ({ page }) => {
    const name = page.locator('input[placeholder="Jane Doe"]');
    await name.fill('Persistence Test');
    await page.waitForTimeout(500);
    await page.reload();
    await expect(name).toHaveValue('Persistence Test');
  });
});
