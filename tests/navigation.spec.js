import { test, expect } from '@playwright/test';

test.describe('Navigation & Routing', () => {
  const publicRoutes = [
    { path: '/', name: 'Landing' },
    { path: '/login', name: 'Login' },
    { path: '/worker/signup', name: 'Worker Signup' },
    { path: '/restaurant/signup', name: 'Restaurant Signup' },
    { path: '/browse', name: 'Browse' },
    { path: '/swipe', name: 'Swipe' },
    { path: '/worker/1', name: 'Worker Profile' },
    { path: '/restaurant/1', name: 'Restaurant Profile' },
    { path: '/jobs/1', name: 'Shift Detail' },
  ];

  for (const route of publicRoutes) {
    test(`${route.name} (${route.path}) loads without JS error`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (err) => errors.push(err.message));
      await page.goto(route.path);
      await page.waitForTimeout(1000);
      expect(errors).toEqual([]);
    });
  }

  test('protected /dashboard/worker redirects to /login', async ({ page }) => {
    await page.goto('/dashboard/worker');
    await expect(page).toHaveURL(/\/login/);
  });

  test('protected /dashboard/restaurant redirects to /login', async ({ page }) => {
    await page.goto('/dashboard/restaurant');
    await expect(page).toHaveURL(/\/login/);
  });

  test('navbar Browse link works from landing', async ({ page }) => {
    await page.goto('/');
    await page.click('nav >> text=Browse');
    await expect(page).toHaveURL(/\/browse/);
  });

  test('navbar logo links back to home from browse', async ({ page }) => {
    await page.goto('/browse');
    const logo = page.locator('nav a[href="/"]').first();
    await logo.click();
    await expect(page).toHaveURL('/');
  });

  test('Browse → Worker Profile → Back to Browse', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForSelector('[class*="animate-fade-in"]', { timeout: 10000 });
    const link = page.locator('[class*="animate-fade-in"] a').first();
    if (await link.isVisible()) {
      await link.click();
      await expect(page).toHaveURL(/\/worker\//);
      await page.click('text=Back to Browse');
      await expect(page).toHaveURL(/\/browse/);
    }
  });

  test('Browse → Swipe toggle and back', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForSelector('[class*="animate-fade-in"]', { timeout: 10000 });
    await page.click('a:has-text("Card")');
    await expect(page).toHaveURL(/\/swipe/);
    await page.waitForSelector('h2', { timeout: 10000 });
    await page.click('text=Grid View');
    await expect(page).toHaveURL(/\/browse/);
  });

  test('pages render on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    for (const route of ['/', '/browse', '/worker/1']) {
      await page.goto(route);
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
