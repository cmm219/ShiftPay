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

  test('shows contact gating copy before completion', async ({ page }) => {
    await expect(page.locator('text=Contact info available after shift completion')).toBeVisible();
  });

  test('shows available status badge', async ({ page }) => {
    await expect(page.getByText('Available', { exact: true })).toBeVisible();
  });

  test('Sign in to Claim button is visible for guests', async ({ page }) => {
    await expect(page.locator('text=Sign in to Claim')).toBeVisible();
  });

  test('shows account-required helper text for guests', async ({ page }) => {
    await expect(page.locator('text=You need an account to claim shifts.')).toBeVisible();
  });

  test('Back link navigates to browse', async ({ page }) => {
    await page.click('a:has-text("Back")');
    await expect(page).toHaveURL('/browse');
  });

  test('not found state for non-existent shift', async ({ page }) => {
    await page.goto('/jobs/99999');
    await expect(page.locator('text=Shift not found')).toBeVisible({ timeout: 10000 });
  });
});
