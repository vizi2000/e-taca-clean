import { test, expect } from '@playwright/test';
import { VisualTestHelper } from './helpers/visual-helper';

test.describe('Donation Flow Visual Tests', () => {
  let visualHelper: VisualTestHelper;

  test.beforeEach(async ({ page }) => {
    visualHelper = new VisualTestHelper(page);
    await visualHelper.hideAnimatedElements();
  });

  test('should render donation goal page correctly', async ({ page }) => {
    await page.goto('/parafia-test/renowacja-oltarza');
    await page.waitForLoadState('networkidle');
    
    await visualHelper.compareWithBaseline('donation-goal-page');
  });

  test('should display progress bar with animation', async ({ page }) => {
    await page.goto('/parafia-test/renowacja-oltarza');
    
    const progressBar = page.locator('[role="progressbar"], [class*="progress"]');
    if (await progressBar.isVisible()) {
      // Capture initial state
      await visualHelper.takeScreenshot('progress-bar-initial');
      
      // Wait for animation to complete
      await page.waitForTimeout(1000);
      await visualHelper.takeScreenshot('progress-bar-animated');
    }
  });

  test('should show donation amount buttons', async ({ page }) => {
    await page.goto('/parafia-test/renowacja-oltarza');
    
    const amountButtons = page.locator('button').filter({ hasText: /\d+\s*(zł|PLN)/i });
    
    for (let i = 0; i < Math.min(5, await amountButtons.count()); i++) {
      const button = amountButtons.nth(i);
      await expect(button).toBeVisible();
      
      // Test hover and click states
      await button.hover();
      await visualHelper.takeScreenshot(`amount-button-hover-${i}`);
      
      await button.click();
      await visualHelper.takeScreenshot(`amount-button-selected-${i}`);
    }
  });

  test('should display custom amount input field', async ({ page }) => {
    await page.goto('/parafia-test/renowacja-oltarza');
    
    const customAmountInput = page.locator('input[type="number"], input[placeholder*="amount" i], input[placeholder*="kwota" i]');
    
    if (await customAmountInput.isVisible()) {
      await customAmountInput.focus();
      await visualHelper.takeScreenshot('custom-amount-focus');
      
      await customAmountInput.fill('100');
      await visualHelper.takeScreenshot('custom-amount-filled');
    }
  });

  test('should show donor information form', async ({ page }) => {
    await page.goto('/parafia-test/renowacja-oltarza');
    
    // Select an amount first
    const amountButton = page.locator('button').filter({ hasText: /50/i }).first();
    if (await amountButton.isVisible()) {
      await amountButton.click();
    }
    
    // Fill donor information
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i], input[placeholder*="imię" i]');
    const emailInput = page.locator('input[type="email"]');
    const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone" i], input[placeholder*="telefon" i]');
    
    if (await nameInput.isVisible()) {
      await nameInput.fill('Jan Kowalski');
    }
    if (await emailInput.isVisible()) {
      await emailInput.fill('jan@example.com');
    }
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('+48123456789');
    }
    
    await visualHelper.takeScreenshot('donor-form-filled');
  });

  test('should display payment button with proper styling', async ({ page }) => {
    await page.goto('/parafia-test/renowacja-oltarza');
    
    const payButton = page.locator('button').filter({ hasText: /pay|zapłać|donate|wspomóż/i });
    
    if (await payButton.isVisible()) {
      await visualHelper.takeScreenshot('pay-button-initial');
      
      await payButton.hover();
      await visualHelper.takeScreenshot('pay-button-hover');
      
      // Check disabled state
      const isDisabled = await payButton.isDisabled();
      if (isDisabled) {
        await visualHelper.takeScreenshot('pay-button-disabled');
      }
    }
  });

  test('should render donation success page', async ({ page }) => {
    await page.goto('/donation/success');
    await page.waitForLoadState('networkidle');
    
    await visualHelper.compareWithBaseline('donation-success');
    
    // Check for success animation
    const successIcon = page.locator('[class*="success"], svg[class*="check"]');
    if (await successIcon.isVisible()) {
      await visualHelper.takeScreenshot('success-icon');
    }
  });

  test('should render donation failure page', async ({ page }) => {
    await page.goto('/donation/fail');
    await page.waitForLoadState('networkidle');
    
    await visualHelper.compareWithBaseline('donation-failure');
    
    // Check for error message
    const errorMessage = page.locator('[class*="error"], [class*="fail"]');
    if (await errorMessage.isVisible()) {
      await visualHelper.takeScreenshot('error-message');
    }
  });

  test('should display spiritual quotes correctly', async ({ page }) => {
    await page.goto('/parafia-test/renowacja-oltarza');
    
    const quotes = page.locator('[class*="quote"], blockquote');
    
    for (let i = 0; i < Math.min(3, await quotes.count()); i++) {
      const quote = quotes.nth(i);
      if (await quote.isVisible()) {
        await visualHelper.takeScreenshot(`spiritual-quote-${i}`, {
          clip: await quote.boundingBox()
        });
      }
    }
  });

  test('should handle responsive donation forms', async ({ page }) => {
    await page.goto('/parafia-test/renowacja-oltarza');
    
    const viewports = [
      { width: 375, height: 812, name: 'donation-mobile' },
      { width: 768, height: 1024, name: 'donation-tablet' },
      { width: 1440, height: 900, name: 'donation-desktop' },
    ];

    await visualHelper.checkResponsiveness(viewports);
  });

  test('should maintain visual consistency across donation flow', async ({ page }) => {
    const flowPages = [
      '/parafia-test/renowacja-oltarza',
      '/donation/success',
      '/donation/fail'
    ];

    for (const flowPage of flowPages) {
      await page.goto(flowPage);
      await page.waitForLoadState('networkidle');
      
      const pageName = flowPage.split('/').pop() || 'page';
      await visualHelper.compareWithBaseline(`donation-flow-${pageName}`);
    }
  });
});