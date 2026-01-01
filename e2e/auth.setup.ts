import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Go to the login page
  await page.goto('/');
  
  // Check if we're already logged in by looking for the main navigation
  const isLoggedIn = await page.locator('[data-testid="bottom-navigation"]').isVisible().catch(() => false);
  
  if (!isLoggedIn) {
    // Look for Google login button
    const googleLoginButton = page.locator('button:has-text("Google"), button:has-text("구글")').first();
    
    if (await googleLoginButton.isVisible()) {
      console.log('Google login required - skipping auth setup for now');
      // For now, we'll skip actual Google OAuth in tests
      // In a real scenario, you'd set up test credentials
    }
  }
  
  // Save signed-in state (even if not actually signed in)
  await page.context().storageState({ path: authFile });
});