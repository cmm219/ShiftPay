import { test, expect } from '@playwright/test';

test.describe('Hiring Dashboard (/dashboard/hiring)', () => {
  // Dashboard is behind ProtectedRoute — redirects to /login without auth
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/hiring');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page renders after redirect', async ({ page }) => {
    await page.goto('/dashboard/hiring');
    await expect(page.locator('text=Sign In').first()).toBeVisible();
  });
});
