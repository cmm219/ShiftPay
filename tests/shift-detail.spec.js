import { test, expect } from '@playwright/test';

test.describe('Shift Detail (/jobs/:id)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jobs/1');
    await page.waitForSelector('h1', { timeout: 10000 });
  });

  test('renders restaurant name', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
  });

  test('shows ON THE FLY urgent banner', async ({ page }) => {
    await expect(page.locator('text=ON THE FLY')).toBeVisible();
  });

  test('shows city', async ({ page }) => {
    await expect(page.locator('body')).toContainText(/Tampa|Miami|Orlando|St. Pete/);
  });

  test('shows pay rate', async ({ page }) => {
    await expect(page.locator('text=Pay Rate')).toBeVisible();
    await expect(page.locator('text=/\\$\\d+/')).toBeVisible();
  });

  test('shows date', async ({ page }) => {
    await expect(page.locator('text=Date')).toBeVisible();
  });

  test('shows start and end time', async ({ page }) => {
    await expect(page.locator('text=Start')).toBeVisible();
    await expect(page.locator('text=End')).toBeVisible();
  });

  test('shows Description section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Description")')).toBeVisible();
  });

  test('shows Requirements section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Requirements")')).toBeVisible();
  });

  test('shows Time Remaining countdown', async ({ page }) => {
    await expect(page.locator('text=Time Remaining')).toBeVisible();
  });

  test('countdown has progress bar', async ({ page }) => {
    const bar = page.locator('[class*="bg-gradient-to-r"][class*="rounded-full"]');
    await expect(bar).toBeVisible();
  });

  test('Claim Now button is visible', async ({ page }) => {
    await expect(page.locator('button:has-text("Claim Now")')).toBeVisible();
  });

  test('shows first-to-claim helper text', async ({ page }) => {
    await expect(page.locator('text=First to claim gets the shift')).toBeVisible();
  });

  test('Back link navigates home', async ({ page }) => {
    await page.click('a:has-text("Back")');
    await expect(page).toHaveURL('/');
  });

  test('404 for non-existent shift', async ({ page }) => {
    await page.goto('/jobs/99999');
    await expect(page.locator('text=404')).toBeVisible({ timeout: 10000 });
  });
});
