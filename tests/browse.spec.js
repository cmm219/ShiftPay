import { test, expect } from '@playwright/test';

test.describe('Browse Workers (/browse)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/browse');
    // Wait for worker cards to load (from Supabase or mock fallback)
    await page.waitForSelector('[class*="animate-fade-in"]', { timeout: 10000 });
  });

  test('renders page headline', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Workers near you' })).toBeVisible();
  });

  test('shows worker count', async ({ page }) => {
    await expect(page.locator('text=/Browsing 10 seeded workers and 9 active jobs/')).toBeVisible();
    await expect(page.getByRole('button', { name: /Workers\s+10/ })).toBeVisible();
  });

  test('displays worker profile cards', async ({ page }) => {
    const cards = page.locator('[class*="animate-fade-in"]');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('Workers tab is active', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Workers\s+10/ })).toBeVisible();
  });

  test('Swipe view link navigates to /swipe', async ({ page }) => {
    await page.getByRole('link', { name: /Swipe view/ }).click();
    await expect(page).toHaveURL(/\/swipe/);
  });

  test('filter sidebar visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByText('Role', { exact: true })).toBeVisible();
    await expect(page.getByText('City', { exact: true })).toBeVisible();
    await expect(page.getByText('Certifications', { exact: true })).toBeVisible();
  });

  test('role filter chips change results', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.getByRole('button', { name: 'Cook' }).click();
    await expect(page.locator('text=/Filtered by Cook/')).toBeVisible();
    await expect(page.getByText('James Chen')).toBeVisible();
  });

  test('reset button clears all filters', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.getByRole('button', { name: 'Cook' }).click();

    const resetBtn = page.locator('button:has-text("Reset")');
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await expect(page.locator('text=/Filtered by All roles/')).toBeVisible();
    }
  });

  test('mobile filter button is visible on small screen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/browse');
    await page.waitForSelector('text=Workers near you', { timeout: 10000 });
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
    await page.getByPlaceholder('Quick search this view…').fill('zzzz-no-match');
    await expect(page.locator('text=No workers match')).toBeVisible({ timeout: 3000 });
  });
});
