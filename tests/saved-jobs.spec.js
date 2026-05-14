import { test, expect } from '@playwright/test';

test.describe('Worker saved jobs demo flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('shiftpay-demo-session');
      localStorage.removeItem('shiftpay-saved-jobs');
      localStorage.removeItem('shiftpay-posting-lifecycle-overrides');
    });
  });

  test('guest save routes through demo worker sign-in and resumes the save', async ({ page }) => {
    await page.goto('/browse');
    await page.getByRole('button', { name: /Jobs\s+\d+/ }).click();

    const expiringJob = page.locator('article').filter({ hasText: 'Expiring soon' }).first();
    await expiringJob.getByRole('button', { name: /Save .* job/ }).click();

    await expect(page).toHaveURL(/\/login\?.*saveJob=/);
    await page.getByRole('button', { name: 'Demo worker' }).click();
    await expect(page).toHaveURL(/\/browse/);

    await page.goto('/dashboard/worker');
    await expect(page.getByRole('heading', { name: 'Saved Jobs' })).toBeVisible();
    await expect(page.getByText('Saved job expires soon')).toBeVisible();
    await expect(page.getByText('In-app saved-job reminder only')).toBeVisible();
  });

  test('worker can save, dismiss reminder, and remove a long-term job', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Demo worker' }).click();

    await page.goto('/browse');
    await page.getByRole('button', { name: /Jobs\s+\d+/ }).click();

    const expiringJob = page.locator('article').filter({ hasText: 'Expiring soon' }).first();
    await expiringJob.getByRole('button', { name: /Save .* job/ }).click();
    await expect(expiringJob.getByRole('button', { name: /Unsave .* job/ })).toBeVisible();

    await page.goto('/dashboard/worker');
    await expect(page.getByText('Saved job expires soon')).toBeVisible();

    await page.getByRole('button', { name: 'Dismiss' }).first().click();
    await expect(page.getByText('Saved job expires soon')).toHaveCount(0);

    await page.getByRole('button', { name: 'Remove' }).first().click();
    await expect(page.getByText('No saved jobs yet')).toBeVisible();
  });

  test('hiring team does not see worker save controls', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Demo hiring team' }).click();

    await page.goto('/browse');
    await page.getByRole('button', { name: /Jobs\s+\d+/ }).click();

    await expect(page.getByRole('button', { name: /Save job/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Saved/ })).toHaveCount(0);

    await page.goto('/company/1');
    await expect(page.getByRole('button', { name: /Save job|Saved/ })).toHaveCount(0);
  });

  test('malformed return target falls back to worker dashboard', async ({ page }) => {
    await page.goto('/login?saveJob=1-0&returnTo=//example.com');
    await page.getByRole('button', { name: 'Demo worker' }).click();

    await expect(page).toHaveURL(/\/dashboard\/worker/);
    await expect(page.url()).not.toContain('example.com');
  });
});
