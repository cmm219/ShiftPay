import { test, expect } from '@playwright/test';

test.describe('Login Page (/login)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders Sign In heading', async ({ page }) => {
    await expect(page.locator('text=Sign In').first()).toBeVisible();
  });

  test('email input accepts text', async ({ page }) => {
    const email = page.locator('input[placeholder="you@example.com"]');
    await expect(email).toBeVisible();
    await email.fill('test@example.com');
    await expect(email).toHaveValue('test@example.com');
  });

  test('password input is present', async ({ page }) => {
    const pw = page.locator('input[type="password"]').first();
    await expect(pw).toBeVisible();
  });

  test('Sign In submit button is present', async ({ page }) => {
    const submit = page.locator('button:has-text("Sign In")').first();
    await expect(submit).toBeVisible();
  });

  test('Worker/Restaurant toggle tabs work', async ({ page }) => {
    // Tabs are buttons inside the form
    const workerTab = page.locator('button:has-text("Worker")');
    const restaurantTab = page.locator('button:has-text("Restaurant")');
    await expect(workerTab).toBeVisible();
    await expect(restaurantTab).toBeVisible();
    await restaurantTab.click();
    await workerTab.click();
  });

  test('Forgot password link is visible', async ({ page }) => {
    await expect(page.locator('text=Forgot password')).toBeVisible();
  });

  test('Sign up link is visible', async ({ page }) => {
    await expect(page.locator('text=Sign up as a Worker')).toBeVisible();
  });
});
