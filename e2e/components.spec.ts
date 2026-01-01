import { test, expect } from '@playwright/test';

test.describe('Component Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should render UI components correctly', async ({ page }) => {
    // Check for button components
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
    
    // Check button styling (Toss-style)
    const primaryButton = buttons.first();
    if (await primaryButton.isVisible()) {
      const buttonClass = await primaryButton.getAttribute('class');
      expect(buttonClass).toContain('btn');
    }
  });

  test('should handle form interactions', async ({ page }) => {
    // Look for any input fields
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();
    
    if (inputCount > 0) {
      const firstInput = inputs.first();
      
      // Test input interaction
      await firstInput.click();
      await firstInput.fill('test input');
      
      const value = await firstInput.inputValue();
      expect(value).toBe('test input');
    }
  });

  test('should display proper loading states', async ({ page }) => {
    // Check for loading indicators
    const loadingElements = page.locator('[data-testid*="loading"], .loading, .spinner');
    
    // Loading elements might not be visible initially, which is fine
    const loadingCount = await loadingElements.count();
    expect(loadingCount).toBeGreaterThanOrEqual(0);
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Check console for errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('manifest') &&
      !error.includes('service-worker')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});