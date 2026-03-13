import { test, expect } from '@playwright/test';

test.describe('Swipe View (/swipe)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/swipe');
    // Wait for loading to finish and cards to appear
    await page.waitForSelector('h2', { timeout: 10000 });
  });

  test('renders swipe card with worker name', async ({ page }) => {
    await expect(page.locator('h2').first()).toBeVisible();
  });

  test('shows counter "1 of N"', async ({ page }) => {
    await expect(page.locator('text=/1 of \\d+/')).toBeVisible();
  });

  test('shows worker photo', async ({ page }) => {
    const img = page.locator('img').first();
    await expect(img).toBeVisible();
  });

  test('Grid View link navigates to /browse', async ({ page }) => {
    await page.click('text=Grid View');
    await expect(page).toHaveURL(/\/browse/);
  });

  test('Pass button (X) advances to next card', async ({ page }) => {
    const passBtn = page.locator('button[title*="Pass"]');
    await expect(passBtn).toBeVisible();
    await passBtn.click();
    await page.waitForTimeout(400);
    await expect(page.locator('text=/2 of \\d+/')).toBeVisible();
  });

  test('Interested button (heart) advances to next card', async ({ page }) => {
    const heartBtn = page.locator('button[title*="Interested"]');
    await expect(heartBtn).toBeVisible();
    await heartBtn.click();
    await page.waitForTimeout(400);
    await expect(page.locator('text=/2 of \\d+/')).toBeVisible();
  });

  test('View Profile button navigates to worker profile', async ({ page }) => {
    const viewBtn = page.locator('a:has-text("View Profile")');
    await expect(viewBtn).toBeVisible();
    await viewBtn.click();
    await expect(page).toHaveURL(/\/worker\//);
  });

  test('Left arrow key advances (pass)', async ({ page }) => {
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(400);
    await expect(page.locator('text=/2 of \\d+/')).toBeVisible();
  });

  test('Right arrow key advances (interested)', async ({ page }) => {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(400);
    await expect(page.locator('text=/2 of \\d+/')).toBeVisible();
  });

  test('keyboard hint text is displayed', async ({ page }) => {
    await expect(page.locator('text=arrow keys to swipe')).toBeVisible();
  });

  test('shows exhausted state after all cards', async ({ page }) => {
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(400);
    }
    await expect(page.locator('text=seen everyone')).toBeVisible({ timeout: 10000 });
  });
});
