import { test, expect } from '@playwright/test';
import { VisualTestHelper } from './helpers/visual-helper';

test.describe('Accessibility Visual Tests', () => {
  let visualHelper: VisualTestHelper;

  test.beforeEach(async ({ page }) => {
    visualHelper = new VisualTestHelper(page);
  });

  test('should meet color contrast requirements', async ({ page }) => {
    await page.goto('/');
    
    // Inject axe-core for accessibility testing
    await page.addScriptTag({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.0/axe.min.js'
    });
    
    const results = await page.evaluate(async () => {
      // @ts-ignore
      return await axe.run();
    });
    
    const colorContrastViolations = results.violations.filter(
      (v: any) => v.id === 'color-contrast'
    );
    
    if (colorContrastViolations.length > 0) {
      console.log('Color contrast violations:', colorContrastViolations);
    }
    
    expect(colorContrastViolations).toHaveLength(0);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Tab through elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el?.tagName,
          text: el?.textContent,
          className: el?.className
        };
      });
      
      console.log(`Tab ${i + 1}: Focused on`, focusedElement);
      await visualHelper.takeScreenshot(`keyboard-nav-tab-${i + 1}`);
    }
  });

  test('should display focus indicators clearly', async ({ page }) => {
    await page.goto('/admin/login');
    
    const focusableElements = page.locator('input, button, a, select, textarea');
    
    for (let i = 0; i < Math.min(5, await focusableElements.count()); i++) {
      const element = focusableElements.nth(i);
      if (await element.isVisible()) {
        await element.focus();
        await visualHelper.takeScreenshot(`focus-indicator-${i}`);
      }
    }
  });

  test('should support high contrast mode', async ({ page }) => {
    await page.goto('/');
    
    // Simulate high contrast mode
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * {
            outline: 2px solid currentColor !important;
          }
        }
      `
    });
    
    await page.emulateMedia({ colorScheme: 'dark' });
    await visualHelper.compareWithBaseline('high-contrast-mode');
  });

  test('should support reduced motion', async ({ page }) => {
    await page.goto('/');
    
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.addStyleTag({
      content: `
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `
    });
    
    await visualHelper.compareWithBaseline('reduced-motion');
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    const elementsWithoutAria = await page.evaluate(() => {
      const issues: string[] = [];
      
      // Check buttons without accessible text
      document.querySelectorAll('button').forEach(button => {
        if (!button.textContent?.trim() && !button.getAttribute('aria-label')) {
          issues.push(`Button without accessible text`);
        }
      });
      
      // Check images without alt text
      document.querySelectorAll('img').forEach(img => {
        if (!img.alt && !img.getAttribute('aria-label')) {
          issues.push(`Image without alt text: ${img.src}`);
        }
      });
      
      // Check form inputs without labels
      document.querySelectorAll('input, select, textarea').forEach(input => {
        const id = input.id;
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (!label && !input.getAttribute('aria-label')) {
            issues.push(`Input without label: ${id}`);
          }
        }
      });
      
      return issues;
    });
    
    if (elementsWithoutAria.length > 0) {
      console.log('ARIA issues found:', elementsWithoutAria);
    }
    
    expect(elementsWithoutAria).toHaveLength(0);
  });

  test('should support screen reader landmarks', async ({ page }) => {
    await page.goto('/');
    
    const landmarks = await page.evaluate(() => {
      const found: Record<string, number> = {};
      
      ['main', 'nav', 'header', 'footer', 'aside'].forEach(landmark => {
        const elements = document.querySelectorAll(landmark);
        const roleElements = document.querySelectorAll(`[role="${landmark}"]`);
        found[landmark] = elements.length + roleElements.length;
      });
      
      return found;
    });
    
    console.log('Landmarks found:', landmarks);
    
    // Verify essential landmarks exist
    expect(landmarks.main).toBeGreaterThan(0);
    expect(landmarks.nav).toBeGreaterThan(0);
  });

  test('should display skip links', async ({ page }) => {
    await page.goto('/');
    
    // Focus to reveal skip links
    await page.keyboard.press('Tab');
    
    const skipLink = page.locator('a').filter({ hasText: /skip/i });
    if (await skipLink.isVisible()) {
      await visualHelper.takeScreenshot('skip-link-visible');
    }
  });

  test('should handle text zoom correctly', async ({ page }) => {
    await page.goto('/');
    
    // Test different zoom levels
    const zoomLevels = [100, 150, 200];
    
    for (const zoom of zoomLevels) {
      await page.evaluate((z) => {
        document.documentElement.style.fontSize = `${z}%`;
      }, zoom);
      
      await page.waitForTimeout(500);
      await visualHelper.takeScreenshot(`text-zoom-${zoom}`);
    }
  });

  test('should maintain readability with custom colors', async ({ page }) => {
    await page.goto('/');
    
    // Simulate custom user colors
    await page.addStyleTag({
      content: `
        * {
          background-color: #000 !important;
          color: #ff0 !important;
        }
      `
    });
    
    await visualHelper.compareWithBaseline('custom-colors');
  });

  test('should provide error feedback accessibly', async ({ page }) => {
    await page.goto('/admin/login');
    
    // Submit empty form to trigger errors
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(500);
      
      // Check for ARIA live regions
      const liveRegions = await page.evaluate(() => {
        const regions = document.querySelectorAll('[aria-live], [role="alert"], [role="status"]');
        return Array.from(regions).map(r => ({
          role: r.getAttribute('role'),
          ariaLive: r.getAttribute('aria-live'),
          text: r.textContent
        }));
      });
      
      console.log('Live regions for errors:', liveRegions);
      
      await visualHelper.takeScreenshot('accessible-error-feedback');
    }
  });
});