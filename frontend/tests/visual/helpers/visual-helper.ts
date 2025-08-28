import { Page, expect } from '@playwright/test';

export class VisualTestHelper {
  constructor(private page: Page) {}

  async waitForAnimations() {
    await this.page.waitForTimeout(500);
    await this.page.evaluate(() => {
      return new Promise<void>((resolve) => {
        if (document.getAnimations) {
          Promise.all(
            document.getAnimations().map(animation => animation.finished)
          ).then(() => resolve());
        } else {
          resolve();
        }
      });
    });
  }

  async hideAnimatedElements() {
    await this.page.addStyleTag({
      content: `
        * {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
  }

  async takeScreenshot(name: string, options?: any) {
    await this.waitForAnimations();
    return await this.page.screenshot({
      fullPage: true,
      animations: 'disabled',
      ...options,
      path: `tests/visual/screenshots/${name}.png`
    });
  }

  async compareWithBaseline(name: string) {
    const screenshot = await this.takeScreenshot(name);
    await expect(this.page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
      maxDiffPixels: 100,
      threshold: 0.2,
      animations: 'disabled'
    });
    return screenshot;
  }

  async checkAccessibility() {
    const violations = await this.page.evaluate(() => {
      const issues: string[] = [];
      
      // Check for alt text on images
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (!img.alt) {
          issues.push(`Image missing alt text: ${img.src}`);
        }
      });
      
      // Check for form labels
      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        const id = input.id;
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (!label) {
            issues.push(`Input missing label: ${id}`);
          }
        }
      });
      
      // Check color contrast (basic check)
      const elements = document.querySelectorAll('*');
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const bgColor = styles.backgroundColor;
        const color = styles.color;
        
        if (bgColor !== 'rgba(0, 0, 0, 0)' && color !== 'rgba(0, 0, 0, 0)') {
          // Basic contrast check would go here
        }
      });
      
      return issues;
    });
    
    return violations;
  }

  async checkResponsiveness(viewports: { width: number; height: number; name: string }[]) {
    const screenshots = [];
    
    for (const viewport of viewports) {
      await this.page.setViewportSize(viewport);
      await this.waitForAnimations();
      const screenshot = await this.takeScreenshot(`${viewport.name}-${viewport.width}x${viewport.height}`);
      screenshots.push({
        viewport,
        screenshot
      });
    }
    
    return screenshots;
  }
}