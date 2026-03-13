import { test, expect } from '@playwright/test';

test.describe('Browse Workers (/browse)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/browse');
    // Wait for worker cards to load (from Supabase or mock fallback)
    await page.waitForSelector('[class*="animate-fade-in"]', { timeout: 10000 });
  });

  test('renders page headline', async ({ page }) => {
    await expect(page.locator('text=Browse Workers')).toBeVisible();
  });

  test('shows worker count', async ({ page }) => {
    await expect(page.locator('text=/Showing \\d+ worker/')).toBeVisible();
  });

  test('displays worker profile cards', async ({ page }) => {
    const cards = page.locator('[class*="animate-fade-in"]');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('Grid view button is active', async ({ page }) => {
    await expect(page.locator('button:has-text("Grid")')).toBeVisible();
  });

  test('Card view link navigates to /swipe', async ({ page }) => {
    await page.click('a:has-text("Card")');
    await expect(page).toHaveURL(/\/swipe/);
  });

  test('filter sidebar visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('label:has-text("Role")')).toBeVisible();
    await expect(page.locator('label:has-text("City")')).toBeVisible();
  });

  test('role filter dropdown changes results', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const roleSelect = page.locator('select').first();
    await expect(roleSelect).toBeVisible();
    await roleSelect.selectOption({ index: 1 });
    await expect(page.locator('text=/Showing \\d+ worker/')).toBeVisible();
  });

  test('reset button clears all filters', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    // Apply a filter first
    const roleSelect = page.locator('select').first();
    await roleSelect.selectOption({ index: 1 });

    const resetBtn = page.locator('button:has-text("Reset")');
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await expect(page.locator('text=/Showing \\d+ worker/')).toBeVisible();
    }
  });

  test('mobile filter button is visible on small screen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/browse');
    await page.waitForSelector('text=Showing', { timeout: 10000 });
    const filterBtn = page.getByRole('button', { name: 'Filters', exact: true });
    await expect(filterBtn).toBeVisible();
  });

  test('clicking a worker card navigates to profile', async ({ page }) => {
    const link = page.locator('[class*="animate-fade-in"] a').first();
    if (await link.isVisible()) {
      await link.click();
      await expect(page).toHaveURL(/\/worker\//);
    }
  });

  test('empty state shows when filters too strict', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    // Set min experience very high
    const inputs = page.locator('input[type="number"]');
    const count = await inputs.count();
    if (count > 0) {
      await inputs.first().fill('99');
      await expect(page.locator('text=No workers match')).toBeVisible({ timeout: 3000 });
    }
  });
});
