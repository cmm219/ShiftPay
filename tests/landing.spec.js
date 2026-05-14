import { test, expect } from '@playwright/test';

test.describe('Landing Page (/)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders hero headline', async ({ page }) => {
    await expect(
      page.getByRole('heading', {
        name: /The restaurant hiring flow for operators/i,
      }),
    ).toBeVisible();
  });

  test('navbar shows ShiftPay logo', async ({ page }) => {
    await expect(page.locator('nav >> text=ShiftPay')).toBeVisible();
  });

  test('navbar Browse link navigates to /browse', async ({ page }) => {
    await page.click('nav >> text=Browse');
    await expect(page).toHaveURL(/\/browse/);
  });

  test('navbar Login link navigates to /login', async ({ page }) => {
    await page.click('nav >> text=Login');
    await expect(page).toHaveURL(/\/login/);
  });

  test('navbar Sign Up link is visible', async ({ page }) => {
    await expect(page.locator('nav >> text=Sign Up')).toBeVisible();
  });

  test('"Open browse demo" hero CTA navigates', async ({ page }) => {
    const cta = page.getByRole('link', { name: /Open browse demo/i });
    await cta.click();
    await expect(page).toHaveURL(/\/browse/);
  });

  test('"Try swipe view" CTA navigates', async ({ page }) => {
    await page.getByRole('link', { name: /Try swipe view/i }).click();
    await expect(page).toHaveURL(/\/swipe/);
  });

  test('demo banner and seed counts are truthful', async ({ page }) => {
    await expect(page.locator('text=Demo mode')).toBeVisible();
    await expect(page.locator('text=/10 mock workers.*9 active jobs seeded/')).toBeVisible();
  });

  test('mobile hamburger menu opens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    const hamburger = page.locator('nav button').first();
    await expect(hamburger).toBeVisible();
    await hamburger.click();
    // After clicking hamburger, mobile menu should expand — look for any link becoming visible
    await page.waitForTimeout(300);
    const menuLink = page.getByRole('link', { name: 'Browse' }).first();
    await expect(menuLink).toBeVisible({ timeout: 3000 });
  });
});
