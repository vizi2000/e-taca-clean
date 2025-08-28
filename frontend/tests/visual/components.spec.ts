import { test, expect } from '@playwright/test';
import { VisualTestHelper } from './helpers/visual-helper';

test.describe('Component Visual Tests', () => {
  let visualHelper: VisualTestHelper;

  test.beforeEach(async ({ page }) => {
    visualHelper = new VisualTestHelper(page);
    await visualHelper.hideAnimatedElements();
  });

  test('should render glass card components correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const glassCards = page.locator('[class*="glass"], [class*="backdrop-blur"]');
    
    for (let i = 0; i < Math.min(3, await glassCards.count()); i++) {
      const card = glassCards.nth(i);
      if (await card.isVisible()) {
        await visualHelper.takeScreenshot(`component-glass-card-${i}`, {
          clip: await card.boundingBox()
        });
        
        // Test hover state
        await card.hover();
        await visualHelper.takeScreenshot(`component-glass-card-hover-${i}`, {
          clip: await card.boundingBox()
        });
      }
    }
  });

  test('should display button flash effect', async ({ page }) => {
    await page.goto('/');
    
    const buttons = page.locator('button, a[class*="button"], a[class*="btn"]');
    
    for (let i = 0; i < Math.min(3, await buttons.count()); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        // Initial state
        await visualHelper.takeScreenshot(`button-initial-${i}`, {
          clip: await button.boundingBox()
        });
        
        // Hover state
        await button.hover();
        await page.waitForTimeout(100);
        await visualHelper.takeScreenshot(`button-hover-${i}`, {
          clip: await button.boundingBox()
        });
        
        // Click state (if clickable)
        if (await button.isEnabled()) {
          await button.click({ force: true });
          await page.waitForTimeout(100);
          await visualHelper.takeScreenshot(`button-clicked-${i}`, {
            clip: await button.boundingBox()
          });
        }
      }
    }
  });

  test('should render divine background effect', async ({ page }) => {
    await page.goto('/');
    
    // Look for gradient backgrounds
    const backgrounds = await page.locator('[class*="gradient"], [class*="bg-gradient"]');
    
    if (await backgrounds.count() > 0) {
      await visualHelper.takeScreenshot('divine-background-full');
      
      // Test at different scroll positions
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(500);
      await visualHelper.takeScreenshot('divine-background-scrolled');
    }
  });

  test('should display loading states correctly', async ({ page }) => {
    await page.goto('/panel/donations');
    
    // Look for loading indicators
    const loadingIndicators = page.locator('[class*="loading"], [class*="spinner"], [class*="skeleton"]');
    
    for (let i = 0; i < Math.min(3, await loadingIndicators.count()); i++) {
      const loader = loadingIndicators.nth(i);
      if (await loader.isVisible()) {
        await visualHelper.takeScreenshot(`loading-state-${i}`, {
          clip: await loader.boundingBox()
        });
      }
    }
  });

  test('should render input fields with focus states', async ({ page }) => {
    await page.goto('/admin/login');
    
    const inputs = page.locator('input, textarea, select');
    
    for (let i = 0; i < Math.min(5, await inputs.count()); i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        // Initial state
        await visualHelper.takeScreenshot(`input-initial-${i}`, {
          clip: await input.boundingBox()
        });
        
        // Focus state
        await input.focus();
        await visualHelper.takeScreenshot(`input-focus-${i}`, {
          clip: await input.boundingBox()
        });
        
        // With value
        const inputType = await input.getAttribute('type');
        if (inputType === 'email') {
          await input.fill('test@example.com');
        } else if (inputType === 'password') {
          await input.fill('password123');
        } else if (inputType === 'number') {
          await input.fill('100');
        } else {
          await input.fill('Test value');
        }
        await visualHelper.takeScreenshot(`input-filled-${i}`, {
          clip: await input.boundingBox()
        });
      }
    }
  });

  test('should display modals and overlays correctly', async ({ page }) => {
    await page.goto('/panel');
    
    // Look for modal triggers
    const modalTriggers = page.locator('button').filter({ hasText: /add|new|create|edit/i });
    
    for (let i = 0; i < Math.min(2, await modalTriggers.count()); i++) {
      const trigger = modalTriggers.nth(i);
      if (await trigger.isVisible()) {
        await trigger.click();
        await page.waitForTimeout(500);
        
        const modal = page.locator('[role="dialog"], [class*="modal"], [class*="overlay"]');
        if (await modal.isVisible()) {
          await visualHelper.takeScreenshot(`modal-${i}`);
          
          // Close modal if possible
          const closeButton = modal.locator('button').filter({ hasText: /close|cancel|x/i }).first();
          if (await closeButton.isVisible()) {
            await closeButton.click();
            await page.waitForTimeout(300);
          }
        }
      }
    }
  });

  test('should render error states correctly', async ({ page }) => {
    await page.goto('/admin/login');
    
    // Submit empty form to trigger validation errors
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(500);
      
      const errorMessages = page.locator('[class*="error"], [class*="invalid"]');
      
      for (let i = 0; i < Math.min(3, await errorMessages.count()); i++) {
        const error = errorMessages.nth(i);
        if (await error.isVisible()) {
          await visualHelper.takeScreenshot(`error-state-${i}`, {
            clip: await error.boundingBox()
          });
        }
      }
    }
  });

  test('should display tooltips correctly', async ({ page }) => {
    await page.goto('/panel');
    
    const elementsWithTooltip = page.locator('[title], [data-tooltip], [aria-describedby]');
    
    for (let i = 0; i < Math.min(3, await elementsWithTooltip.count()); i++) {
      const element = elementsWithTooltip.nth(i);
      if (await element.isVisible()) {
        await element.hover();
        await page.waitForTimeout(500);
        
        const tooltip = page.locator('[role="tooltip"], [class*="tooltip"]');
        if (await tooltip.isVisible()) {
          await visualHelper.takeScreenshot(`tooltip-${i}`);
        }
      }
    }
  });

  test('should render tables with proper styling', async ({ page }) => {
    await page.goto('/panel/donations');
    
    const tables = page.locator('table');
    
    for (let i = 0; i < Math.min(2, await tables.count()); i++) {
      const table = tables.nth(i);
      if (await table.isVisible()) {
        await visualHelper.takeScreenshot(`table-${i}`);
        
        // Test row hover
        const rows = table.locator('tbody tr');
        if (await rows.count() > 0) {
          await rows.first().hover();
          await visualHelper.takeScreenshot(`table-row-hover-${i}`);
        }
        
        // Test sortable headers
        const sortableHeaders = table.locator('th[class*="sort"], th button');
        if (await sortableHeaders.count() > 0) {
          await sortableHeaders.first().click();
          await page.waitForTimeout(500);
          await visualHelper.takeScreenshot(`table-sorted-${i}`);
        }
      }
    }
  });

  test('should display badges and tags correctly', async ({ page }) => {
    await page.goto('/panel/donations');
    
    const badges = page.locator('[class*="badge"], [class*="tag"], [class*="chip"]');
    
    for (let i = 0; i < Math.min(5, await badges.count()); i++) {
      const badge = badges.nth(i);
      if (await badge.isVisible()) {
        await visualHelper.takeScreenshot(`badge-${i}`, {
          clip: await badge.boundingBox()
        });
      }
    }
  });
});