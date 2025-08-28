import { test, expect, devices } from '@playwright/test';
import { VisualTestHelper } from './helpers/visual-helper';

test.use(devices['iPhone 12']);

test.describe('Mobile Visual Tests', () => {
  let visualHelper: VisualTestHelper;

  test.beforeEach(async ({ page }) => {
    visualHelper = new VisualTestHelper(page);
    await visualHelper.hideAnimatedElements();
  });

  test('should render mobile navigation correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for mobile menu button
    const menuButton = page.locator('button').filter({ hasText: /menu/i });
    const hamburger = page.locator('[class*="hamburger"], [aria-label*="menu"]');
    
    if (await menuButton.isVisible() || await hamburger.isVisible()) {
      await visualHelper.takeScreenshot('mobile-navigation-closed');
      
      // Open menu
      if (await menuButton.isVisible()) {
        await menuButton.click();
      } else if (await hamburger.isVisible()) {
        await hamburger.click();
      }
      
      await page.waitForTimeout(500);
      await visualHelper.takeScreenshot('mobile-navigation-open');
    }
  });

  test('should display mobile-optimized cards', async ({ page }) => {
    await page.goto('/');
    
    const cards = page.locator('[class*="card"]');
    
    for (let i = 0; i < Math.min(3, await cards.count()); i++) {
      const card = cards.nth(i);
      if (await card.isVisible()) {
        await visualHelper.takeScreenshot(`mobile-card-${i}`, {
          clip: await card.boundingBox()
        });
      }
    }
  });

  test('should handle touch interactions', async ({ page }) => {
    await page.goto('/parafia-test');
    
    const touchElements = page.locator('a, button');
    
    for (let i = 0; i < Math.min(3, await touchElements.count()); i++) {
      const element = touchElements.nth(i);
      if (await element.isVisible()) {
        // Simulate touch
        await element.tap();
        await page.waitForTimeout(100);
        await visualHelper.takeScreenshot(`mobile-touch-${i}`);
      }
    }
  });

  test('should display mobile donation form correctly', async ({ page }) => {
    await page.goto('/parafia-test/renowacja-oltarza');
    
    await visualHelper.compareWithBaseline('mobile-donation-form');
    
    // Test keyboard appearance
    const input = page.locator('input').first();
    if (await input.isVisible()) {
      await input.focus();
      await page.waitForTimeout(500);
      await visualHelper.takeScreenshot('mobile-keyboard-open');
    }
  });

  test('should handle landscape orientation', async ({ page }) => {
    await page.setViewportSize({ width: 812, height: 375 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await visualHelper.compareWithBaseline('mobile-landscape-home');
    
    // Test other pages in landscape
    await page.goto('/parafia-test');
    await visualHelper.compareWithBaseline('mobile-landscape-organization');
  });

  test('should display mobile-optimized tables', async ({ page }) => {
    await page.goto('/panel/donations');
    
    const table = page.locator('table');
    if (await table.isVisible()) {
      await visualHelper.takeScreenshot('mobile-table');
      
      // Check if table is scrollable
      const scrollContainer = table.locator('..').first();
      await scrollContainer.evaluate(el => el.scrollLeft = 100);
      await visualHelper.takeScreenshot('mobile-table-scrolled');
    }
  });

  test('should handle mobile modals correctly', async ({ page }) => {
    await page.goto('/admin/login');
    
    const modal = page.locator('[role="dialog"], [class*="modal"]');
    if (await modal.isVisible()) {
      await visualHelper.takeScreenshot('mobile-modal');
    }
  });

  test('should display mobile-specific UI elements', async ({ page }) => {
    await page.goto('/');
    
    // Bottom navigation
    const bottomNav = page.locator('nav[class*="bottom"], [class*="tab-bar"]');
    if (await bottomNav.isVisible()) {
      await visualHelper.takeScreenshot('mobile-bottom-nav');
    }
    
    // Floating action button
    const fab = page.locator('button[class*="fab"], button[class*="floating"]');
    if (await fab.isVisible()) {
      await visualHelper.takeScreenshot('mobile-fab');
    }
  });

  test('should handle text readability on mobile', async ({ page }) => {
    await page.goto('/parafia-test/renowacja-oltarza');
    
    // Check font sizes
    const textElements = page.locator('p, h1, h2, h3');
    
    for (let i = 0; i < Math.min(3, await textElements.count()); i++) {
      const element = textElements.nth(i);
      if (await element.isVisible()) {
        const fontSize = await element.evaluate(el => 
          window.getComputedStyle(el).fontSize
        );
        console.log(`Mobile text element ${i} font size: ${fontSize}`);
      }
    }
    
    await visualHelper.compareWithBaseline('mobile-text-readability');
  });

  test('should display mobile payment flow', async ({ page }) => {
    await page.goto('/parafia-test/renowacja-oltarza');
    
    // Select amount
    const amountButton = page.locator('button').filter({ hasText: /50/i }).first();
    if (await amountButton.isVisible()) {
      await amountButton.click();
      await visualHelper.takeScreenshot('mobile-payment-amount-selected');
    }
    
    // Fill form
    const nameInput = page.locator('input').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Jan Kowalski');
      await visualHelper.takeScreenshot('mobile-payment-form-filled');
    }
  });
});