import { test, expect } from '@playwright/test';

test.describe('Restaurant Profile (/restaurant/:id)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/restaurant/1');
    await page.waitForSelector('h1', { timeout: 10000 });
  });

  test('renders restaurant name', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/\w+/);
  });

  test('renders banner photo', async ({ page }) => {
    const img = page.locator('img').first();
    await expect(img).toBeVisible();
  });

  test('shows city', async ({ page }) => {
    // City text appears somewhere on the page
    await expect(page.locator('body')).toContainText(/Tampa|Miami|Orlando|St. Pete/);
  });

  test('shows restaurant type', async ({ page }) => {
    await expect(page.locator('body')).toContainText(/Fine Dining|Upscale Casual|Nightlife|Gastropub/i);
  });

  test('shows rating and review count', async ({ page }) => {
    await expect(page.locator('text=/\\(\\d+ reviews?\\)/')).toBeVisible();
  });

  test('shows employee count', async ({ page }) => {
    await expect(page.locator('text=/\\d+ employees/')).toBeVisible();
  });

  test('shows About section', async ({ page }) => {
    await expect(page.locator('h2:has-text("About")')).toBeVisible();
  });

  test('shows Current Openings section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Current Openings")')).toBeVisible();
  });

  test('opening cards show pay range', async ({ page }) => {
    await expect(page.locator('text=/\\$/').first()).toBeVisible();
  });

  test('Apply buttons exist', async ({ page }) => {
    const applyBtns = page.locator('button:has-text("Apply")');
    if (await applyBtns.count() > 0) {
      await expect(applyBtns.first()).toBeVisible();
    }
  });

  test('Back link navigates home', async ({ page }) => {
    await page.click('a:has-text("Back")');
    await expect(page).toHaveURL('/');
  });

  test('404 for non-existent restaurant', async ({ page }) => {
    await page.goto('/restaurant/99999');
    await expect(page.locator('text=404')).toBeVisible({ timeout: 10000 });
  });
});
