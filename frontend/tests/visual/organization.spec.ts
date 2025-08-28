import { test, expect } from '@playwright/test';
import { VisualTestHelper } from './helpers/visual-helper';

test.describe('Organization Page Visual Tests', () => {
  let visualHelper: VisualTestHelper;

  test.beforeEach(async ({ page }) => {
    visualHelper = new VisualTestHelper(page);
    await visualHelper.hideAnimatedElements();
  });

  test('should render organization page with donation goals', async ({ page }) => {
    // Navigate to a sample organization page
    await page.goto('/parafia-test');
    await page.waitForLoadState('networkidle');
    
    await visualHelper.compareWithBaseline('organization-page');
  });

  test('should display organization header correctly', async ({ page }) => {
    await page.goto('/parafia-test');
    
    const header = page.locator('h1').first();
    await expect(header).toBeVisible();
    
    const headerSection = page.locator('div').filter({ has: header });
    await visualHelper.takeScreenshot('organization-header', {
      clip: await headerSection.boundingBox()
    });
  });

  test('should show donation goals grid', async ({ page }) => {
    await page.goto('/parafia-test');
    
    const goalsGrid = page.locator('[class*="grid"]').filter({ has: page.locator('a[href*="/parafia-test/"]') });
    
    if (await goalsGrid.isVisible()) {
      await visualHelper.takeScreenshot('organization-goals-grid');
      
      // Test hover effects on goal cards
      const goalCards = goalsGrid.locator('a');
      for (let i = 0; i < Math.min(3, await goalCards.count()); i++) {
        await goalCards.nth(i).hover();
        await visualHelper.takeScreenshot(`goal-card-hover-${i}`);
      }
    }
  });

  test('should display glass card effect correctly', async ({ page }) => {
    await page.goto('/parafia-test');
    
    const glassCards = page.locator('[class*="backdrop-blur"]');
    
    for (let i = 0; i < Math.min(3, await glassCards.count()); i++) {
      const card = glassCards.nth(i);
      if (await card.isVisible()) {
        await visualHelper.takeScreenshot(`glass-card-${i}`, {
          clip: await card.boundingBox()
        });
      }
    }
  });

  test('should handle empty state gracefully', async ({ page }) => {
    await page.goto('/non-existent-org');
    await page.waitForLoadState('networkidle');
    
    await visualHelper.compareWithBaseline('organization-not-found');
  });

  test('should be responsive on organization pages', async ({ page }) => {
    await page.goto('/parafia-test');
    
    const viewports = [
      { width: 375, height: 667, name: 'org-mobile' },
      { width: 768, height: 1024, name: 'org-tablet' },
      { width: 1440, height: 900, name: 'org-desktop' },
    ];

    await visualHelper.checkResponsiveness(viewports);
  });
});