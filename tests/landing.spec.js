import { test, expect } from '@playwright/test';

test.describe('Landing Page (/)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders hero headline', async ({ page }) => {
    await expect(page.locator('text=Find Certified Restaurant Staff')).toBeVisible();
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

  test('"I\'m a Restaurant" hero CTA navigates', async ({ page }) => {
    // The hero CTA uses the exact visible text on the landing page
    const cta = page.getByRole('link', { name: /I'm a Restaurant/i });
    await cta.click();
    await expect(page).toHaveURL(/\/(restaurant|browse)/);
  });

  test('"I\'m Looking for Work" CTA navigates', async ({ page }) => {
    await page.click('text=I\'m Looking for Work');
    await expect(page).toHaveURL(/\/(worker|signup|browse)/);
  });

  test('stats section shows numbers', async ({ page }) => {
    await expect(page.locator('text=500+')).toBeVisible();
    await expect(page.locator('text=Verified Workers')).toBeVisible();
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
