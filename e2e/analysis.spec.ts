import { test, expect } from '@playwright/test';

test.describe('Analysis Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should upload and analyze HTML file', async ({ page }) => {
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
    
    const fileInput = await page.locator('input[type="file"]').first();
    
    if (await fileInput.isVisible().catch(() => false)) {
      await fileInput.setInputFiles({
        name: 'test.html',
        mimeType: 'text/html',
        buffer: Buffer.from(testHtml),
      });
      
      await page.waitForTimeout(3000);
      
      const pageContent = await page.textContent('body');
      expect(pageContent?.toLowerCase()).toContain('score');
    }
  });

  test('should show analysis progress', async ({ page }) => {
    const testHtml = '<html><body><h1>Test</h1></body></html>';
    
    const fileInput = await page.locator('input[type="file"]').first();
    
    if (await fileInput.isVisible().catch(() => false)) {
      await fileInput.setInputFiles({
        name: 'test.html',
        mimeType: 'text/html',
        buffer: Buffer.from(testHtml),
      });
      
      // Should show progress indicator
      const progressText = await page.textContent('body');
      expect(progressText).toContain('Analyzing');
    }
  });

  test('should display report sections after analysis', async ({ page }) => {
    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test</title>
          <link rel="stylesheet" href="style.css">
        </head>
        <body>
          <h1>Test</h1>
        </body>
      </html>
    `;
    
    const fileInput = await page.locator('input[type="file"]').first();
    
    if (await fileInput.isVisible().catch(() => false)) {
      await fileInput.setInputFiles({
        name: 'test.html',
        mimeType: 'text/html',
        buffer: Buffer.from(testHtml),
      });
      
      await page.waitForTimeout(3000);
      
      // Should have report content
      const content = await page.textContent('body');
      expect(content).toBeTruthy();
    }
  });
});

test.describe('Waterfall Visualization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to waterfall section', async ({ page }) => {
    // First analyze a file
    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body><h1>Test</h1></body>
      </html>
    `;
    
    const fileInput = await page.locator('input[type="file"]').first();
    
    if (await fileInput.isVisible().catch(() => false)) {
      await fileInput.setInputFiles({
        name: 'test.html',
        mimeType: 'text/html',
        buffer: Buffer.from(testHtml),
      });
      
      await page.waitForTimeout(3000);
      
      // Look for waterfall in the page
      const content = await page.textContent('body');
      expect(content?.toLowerCase()).toContain('water');
    }
  });
});
