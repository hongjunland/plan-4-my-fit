import { test, expect } from '@playwright/test';

test.describe('Plan4MyFit User Flow', () => {
  test('should display login page for new users', async ({ page }) => {
    await page.goto('/');
    
    // Check if login page is displayed
    await expect(page).toHaveTitle(/Plan4MyFit/);
    
    // Look for login elements - wait for any visible login button
    await page.waitForSelector('button:visible', { timeout: 10000 });
    const loginButtons = page.locator('button:visible').filter({ hasText: 'Google로 계속하기' });
    await expect(loginButtons.first()).toBeVisible();
  });

  test('should display app name correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle('Plan4MyFit');
    
    // Check for app branding - wait for any visible h1
    await page.waitForSelector('h1:visible', { timeout: 10000 });
    const appNames = page.locator('h1:visible').filter({ hasText: 'Plan4MyFit' });
    await expect(appNames.first()).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if mobile layout is applied - look for mobile-specific elements
    const mobileLayout = page.locator('.lg\\:hidden').first();
    await expect(mobileLayout).toBeVisible();
    
    // Check that the login button is visible in mobile layout
    // Look for any visible button with the text
    await page.waitForSelector('button:visible', { timeout: 10000 });
    const loginButtons = page.locator('button:visible').filter({ hasText: 'Google로 계속하기' });
    await expect(loginButtons.first()).toBeVisible();
    
    // Verify mobile-optimized content
    await page.waitForSelector('h1:visible', { timeout: 10000 });
    const mobileTitles = page.locator('h1:visible').filter({ hasText: 'Plan4MyFit' });
    await expect(mobileTitles.first()).toBeVisible();
  });

  test('should handle navigation without authentication', async ({ page }) => {
    // Start from root page
    await page.goto('/');
    
    // Wait for initial load
    await page.waitForLoadState('networkidle');
    
    // Verify we're on login page (unauthenticated users should see login)
    await page.waitForSelector('button:visible', { timeout: 10000 });
    const loginButtons = page.locator('button:visible').filter({ hasText: 'Google로 계속하기' });
    await expect(loginButtons.first()).toBeVisible();
    
    // Try to access protected routes directly
    await page.goto('/app/calendar');
    
    // Wait for any redirects to complete
    await page.waitForLoadState('networkidle');
    
    // Should be redirected back to login or show login prompt
    // Check if we see login elements (indicating redirect worked)
    await page.waitForSelector('button:visible', { timeout: 10000 });
    const redirectedLoginButtons = page.locator('button:visible').filter({ hasText: 'Google로 계속하기' });
    await expect(redirectedLoginButtons.first()).toBeVisible();
  });
});

test.describe('App Performance', () => {
  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Wait for main content to load
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have good accessibility', async ({ page }) => {
    await page.goto('/');
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Check for basic accessibility features
    const mainContent = page.locator('main, [role="main"], #root, body').first();
    await expect(mainContent).toBeVisible();
    
    // Check for proper heading structure - be more flexible
    const headings = page.locator('h1, h2, h3');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
  });
});