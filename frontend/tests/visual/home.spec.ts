import { test, expect } from '@playwright/test';
import { VisualTestHelper } from './helpers/visual-helper';

test.describe('Home Page Visual Tests', () => {
  let visualHelper: VisualTestHelper;

  test.beforeEach(async ({ page }) => {
    visualHelper = new VisualTestHelper(page);
    await page.goto('/');
    await visualHelper.hideAnimatedElements();
  });

  test('should render home page correctly', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await visualHelper.compareWithBaseline('home-page');
  });

  test('should display hero section with proper styling', async ({ page }) => {
    const heroSection = page.locator('section').first();
    await expect(heroSection).toBeVisible();
    
    await visualHelper.takeScreenshot('home-hero-section', {
      clip: await heroSection.boundingBox()
    });
  });

  test('should show interactive particles background', async ({ page }) => {
    const particlesCanvas = page.locator('canvas');
    await expect(particlesCanvas).toBeVisible();
    
    // Take screenshot with particles
    await visualHelper.takeScreenshot('home-particles-background');
  });

  test('should display organization buttons correctly', async ({ page }) => {
    const orgButtons = page.locator('a[href^="/"]').filter({ hasText: /Parafia|Parish|Church/i });
    
    for (let i = 0; i < await orgButtons.count(); i++) {
      const button = orgButtons.nth(i);
      await expect(button).toBeVisible();
      
      // Hover state
      await button.hover();
      await visualHelper.takeScreenshot(`org-button-hover-${i}`);
    }
  });

  test('should be responsive across different viewports', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'mobile-small' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1024, height: 768, name: 'desktop-small' },
      { width: 1440, height: 900, name: 'desktop-medium' },
      { width: 1920, height: 1080, name: 'desktop-large' },
    ];

    await visualHelper.checkResponsiveness(viewports);
  });

  test('should meet basic accessibility requirements', async ({ page }) => {
    const violations = await visualHelper.checkAccessibility();
    
    if (violations.length > 0) {
      console.log('Accessibility issues found:', violations);
    }
    
    expect(violations).toHaveLength(0);
  });

  test('should display footer correctly', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    const footer = page.locator('footer');
    if (await footer.isVisible()) {
      await visualHelper.takeScreenshot('home-footer');
    }
  });
});