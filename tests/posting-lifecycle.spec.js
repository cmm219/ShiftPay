import { test, expect } from '@playwright/test';

test.describe('Posting lifecycle demo flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('shiftpay-demo-session');
      localStorage.removeItem('shiftpay-posting-lifecycle-overrides');
      localStorage.removeItem('shiftpay-post-job');
    });
  });

  test('demo hiring team can review and renew lifecycle attention items', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Demo hiring team' }).click();

    await expect(page).toHaveURL(/\/dashboard\/hiring/);
    await expect(page.getByRole('heading', { name: "Bern's Steak House" })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Needs attention' })).toBeVisible();
    await expect(page.getByText('Expiring soon').first()).toBeVisible();
    await expect(page.getByText('Shift has passed').first()).toBeVisible();

    await page.getByRole('button', { name: 'Renew for 30 days' }).first().click();
    await expect(page.getByText(/Job renewed until/)).toBeVisible();
  });

  test('expired event shift repost preloads a new future-date draft', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('shiftpay-post-job', JSON.stringify({
        step: 1,
        shiftType: 'long-term',
        role: 'Dishwasher',
        city: 'Miami',
        payRate: '18',
        description: 'Old draft that should not override repost params.',
      }));
    });
    await page.getByRole('button', { name: 'Demo hiring team' }).click();

    await page.getByRole('link', { name: 'Repost event shift' }).first().click();
    await expect(page).toHaveURL(/\/post-job\?.*repost=shift/);
    await expect(page.getByText('Repost draft')).toBeVisible();
    await expect(page.getByLabel('Role')).toHaveValue('Line Cook');
    await expect(page.getByLabel('City')).toHaveValue('Tampa');
    await expect(page.getByLabel('Date')).not.toHaveValue('');
  });
});
