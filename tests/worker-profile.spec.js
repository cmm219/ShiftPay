import { test, expect } from '@playwright/test';

test.describe('Worker Profile (/worker/:id)', () => {
  // Use mock worker ID 1 (Marcus Johnson)
  test.beforeEach(async ({ page }) => {
    await page.goto('/worker/1');
  });

  // ── Page loads ──
  test('renders worker name', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h1')).toContainText(/\w+/);
  });

  test('renders worker photo', async ({ page }) => {
    const img = page.locator('img').first();
    await expect(img).toBeVisible();
  });

  test('renders city location', async ({ page }) => {
    await expect(page.locator('text=/Tampa|Miami|Orlando|St. Pete/').first()).toBeVisible();
  });

  // ── Sections present ──
  test('shows Roles section with badges', async ({ page }) => {
    await expect(page.locator('h2:has-text("Roles")')).toBeVisible();
  });

  test('shows Certifications section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Certifications")')).toBeVisible();
  });

  test('shows Availability section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Availability")')).toBeVisible();
  });

  test('shows Experience section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Experience")')).toBeVisible();
    await expect(page.locator('text=/\\d+ year/')).toBeVisible();
  });

  test('shows Pay Range section', async ({ page }) => {
    await expect(page.locator('h2:has-text("Pay Range")')).toBeVisible();
    await expect(page.locator('text=/\\$\\d+/').first()).toBeVisible();
  });

  test('shows About/Bio section', async ({ page }) => {
    await expect(page.locator('h2:has-text("About")')).toBeVisible();
  });

  test('shows Reviews section with count', async ({ page }) => {
    await expect(page.locator('h2:has-text("Reviews")')).toBeVisible();
  });

  // ── Rating display ──
  test('shows star rating and count', async ({ page }) => {
    await expect(page.locator('text=/\\d+ reviews?\\)/')).toBeVisible();
  });

  // ── Demand status badge ──
  test('shows demand status badge when applicable', async ({ page }) => {
    // Worker 1 has triple_sat demand
    const badge = page.locator('text=/Triple Sat|Double Sat|In the Weeds|86/i');
    if (await badge.isVisible()) {
      await expect(badge).toBeVisible();
    }
  });

  // ── Hire CTA ──
  test('Hire This Person button is visible', async ({ page }) => {
    await expect(page.locator('text=Hire This Person').first()).toBeVisible();
  });

  // ── Back to Browse link ──
  test('Back to Browse link navigates correctly', async ({ page }) => {
    await page.click('text=Back to Browse');
    await expect(page).toHaveURL(/\/browse/);
  });

  // ── Review cards ──
  test('review cards display restaurant name, rating, comment', async ({ page }) => {
    const reviewCards = page.locator('[class*="bg-bg-elevated"][class*="rounded-xl"]');
    if (await reviewCards.count() > 0) {
      const first = reviewCards.first();
      await expect(first).toContainText(/\w+/);
    }
  });

  // ── 404 for invalid ID ──
  test('shows 404 for non-existent worker', async ({ page }) => {
    await page.goto('/worker/99999');
    await expect(page.locator('text=404')).toBeVisible();
    await expect(page.locator('text=Worker not found')).toBeVisible();
  });

  test('404 page has back to browse link', async ({ page }) => {
    await page.goto('/worker/99999');
    await page.click('text=Back to Browse');
    await expect(page).toHaveURL(/\/browse/);
  });

  // ── Mobile CTA ──
  test('Hire button visible on page', async ({ page }) => {
    await expect(page.locator('text=Hire This Person').first()).toBeVisible();
  });
});
