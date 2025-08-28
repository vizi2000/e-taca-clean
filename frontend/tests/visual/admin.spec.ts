import { test, expect } from '@playwright/test';
import { VisualTestHelper } from './helpers/visual-helper';

test.describe('Admin Panel Visual Tests', () => {
  let visualHelper: VisualTestHelper;

  test.beforeEach(async ({ page }) => {
    visualHelper = new VisualTestHelper(page);
    await visualHelper.hideAnimatedElements();
  });

  test('should render admin login page correctly', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');
    
    await visualHelper.compareWithBaseline('admin-login');
  });

  test('should display login form with proper styling', async ({ page }) => {
    await page.goto('/admin/login');
    
    const loginForm = page.locator('form');
    await expect(loginForm).toBeVisible();
    
    // Test input focus states
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await emailInput.focus();
    await visualHelper.takeScreenshot('admin-login-email-focus');
    
    await passwordInput.focus();
    await visualHelper.takeScreenshot('admin-login-password-focus');
  });

  test('should show admin dashboard after login', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Check if redirected to login, if not, capture dashboard
    if (page.url().includes('/admin') && !page.url().includes('/login')) {
      await visualHelper.compareWithBaseline('admin-dashboard');
    }
  });

  test('should render admin panel pages', async ({ page }) => {
    const adminPages = [
      { path: '/panel', name: 'panel-dashboard' },
      { path: '/panel/donations', name: 'panel-donations' },
      { path: '/panel/goals', name: 'panel-goals' },
      { path: '/panel/goals/new', name: 'panel-new-goal' },
      { path: '/panel/organization', name: 'panel-organization' },
      { path: '/panel/qr', name: 'panel-qr-codes' },
      { path: '/panel/settings', name: 'panel-settings' },
    ];

    for (const adminPage of adminPages) {
      await page.goto(adminPage.path);
      await page.waitForLoadState('networkidle');
      await visualHelper.compareWithBaseline(adminPage.name);
    }
  });

  test('should display statistics cards correctly', async ({ page }) => {
    await page.goto('/panel');
    
    const statsCards = page.locator('[class*="card"]').filter({ hasText: /Total|Revenue|Donations|Goals/i });
    
    for (let i = 0; i < Math.min(4, await statsCards.count()); i++) {
      const card = statsCards.nth(i);
      if (await card.isVisible()) {
        await visualHelper.takeScreenshot(`stats-card-${i}`, {
          clip: await card.boundingBox()
        });
      }
    }
  });

  test('should show data tables with proper formatting', async ({ page }) => {
    await page.goto('/panel/donations');
    await page.waitForLoadState('networkidle');
    
    const table = page.locator('table');
    if (await table.isVisible()) {
      await visualHelper.takeScreenshot('donations-table');
      
      // Test table hover states
      const rows = table.locator('tbody tr');
      if (await rows.count() > 0) {
        await rows.first().hover();
        await visualHelper.takeScreenshot('table-row-hover');
      }
    }
  });

  test('should display forms with validation states', async ({ page }) => {
    await page.goto('/panel/goals/new');
    
    const form = page.locator('form');
    if (await form.isVisible()) {
      // Test empty form
      await visualHelper.takeScreenshot('new-goal-form-empty');
      
      // Test with some filled fields
      const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
      const amountInput = page.locator('input[type="number"], input[name="targetAmount"]').first();
      
      if (await titleInput.isVisible()) {
        await titleInput.fill('Test Goal');
      }
      if (await amountInput.isVisible()) {
        await amountInput.fill('1000');
      }
      
      await visualHelper.takeScreenshot('new-goal-form-filled');
    }
  });

  test('should handle dark mode in admin panel', async ({ page }) => {
    await page.goto('/panel');
    
    // Check if dark mode toggle exists
    const darkModeToggle = page.locator('button').filter({ hasText: /dark|theme|mode/i });
    
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      await page.waitForTimeout(500);
      await visualHelper.compareWithBaseline('admin-panel-dark-mode');
    }
  });

  test('should be responsive in admin areas', async ({ page }) => {
    await page.goto('/panel');
    
    const viewports = [
      { width: 375, height: 667, name: 'admin-mobile' },
      { width: 768, height: 1024, name: 'admin-tablet' },
      { width: 1440, height: 900, name: 'admin-desktop' },
    ];

    await visualHelper.checkResponsiveness(viewports);
  });
});