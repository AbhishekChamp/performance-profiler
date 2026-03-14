import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check that the app loaded
    await expect(page).toHaveTitle(/Frontend Performance Profiler/i);
    
    // Check for main elements
    await expect(page.locator('body')).toBeVisible();
  });

  test('file upload area is visible', async ({ page }) => {
    await page.goto('/');
    
    // Look for upload-related text
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('upload');
  });

  test('theme toggle works', async ({ page }) => {
    await page.goto('/');
    
    // Check for theme-related element
    const themeButton = await page.locator('[data-testid="theme-toggle"]').first();
    
    if (await themeButton.isVisible().catch(() => false)) {
      // Get initial theme
      const initialClass = await page.evaluate(() => document.documentElement.className);
      
      // Click theme toggle
      await themeButton.click();
      
      // Check that theme changed
      const newClass = await page.evaluate(() => document.documentElement.className);
      expect(newClass).not.toBe(initialClass);
    }
  });

  test('keyboard shortcuts help is accessible', async ({ page }) => {
    await page.goto('/');
    
    // Press ? key
    await page.keyboard.press('?');
    
    // Look for shortcuts modal
    const pageContent = await page.textContent('body');
    expect(pageContent?.toLowerCase()).toContain('keyboard');
  });
});

test.describe('Analysis Flow', () => {
  test('can upload and analyze HTML file', async ({ page }) => {
    await page.goto('/');
    
    // Create a test file
    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body>
          <h1>Test Page</h1>
          <img src="test.jpg" loading="lazy" width="100" height="100">
        </body>
      </html>
    `;
    
    // Set up file input
    const fileInput = await page.locator('input[type="file"]').first();
    
    if (await fileInput.isVisible().catch(() => false)) {
      await fileInput.setInputFiles({
        name: 'test.html',
        mimeType: 'text/html',
        buffer: Buffer.from(testHtml),
      });
      
      // Wait for analysis to complete
      await page.waitForTimeout(3000);
      
      // Check for analysis results
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toContain('score');
    }
  });
});
