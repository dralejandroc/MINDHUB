import { test, expect } from '@playwright/test';

test.describe('Landing Page UX Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load landing page without errors', async ({ page }) => {
    await expect(page).toHaveTitle(/Glian/);
    
    // Check for console errors
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    expect(logs).toHaveLength(0);
  });

  test('navigation links should work', async ({ page }) => {
    // Test main navigation links
    const navLinks = [
      { text: 'Características', selector: '[href="#features"]' },
      { text: 'Planes', selector: '[href="#plans"]' },
    ];

    for (const link of navLinks) {
      const element = page.locator(link.selector).first();
      await expect(element).toBeVisible();
      await element.click();
      await page.waitForTimeout(500); // Wait for smooth scroll
    }
  });

  test('beta access buttons should be functional', async ({ page }) => {
    // Look for beta access buttons
    const betaButtons = page.locator('text=/.*Beta.*Gratuito.*/i');
    const count = await betaButtons.count();
    
    expect(count).toBeGreaterThan(0);
    
    // Click first beta button and check modal opens
    if (count > 0) {
      await betaButtons.first().click();
      
      // Check if modal or form appears
      await expect(
        page.locator('[role="dialog"], .modal, form')
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('responsive design should work on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if mobile menu toggle exists and works
    const mobileMenuButton = page.locator('[aria-label*="menu"], .mobile-menu, [data-testid="mobile-menu"]');
    if (await mobileMenuButton.count() > 0) {
      await mobileMenuButton.click();
      await expect(page.locator('.mobile-menu, [role="navigation"]')).toBeVisible();
    }
    
    // Check key sections are still visible on mobile
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should not have broken images', async ({ page }) => {
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');
      
      if (src && !src.startsWith('data:')) {
        // Check if image loads without 404 error
        const response = await page.request.get(src).catch(() => null);
        if (response) {
          expect(response.status()).not.toBe(404);
        }
      }
    }
  });

  test('email links should be valid', async ({ page }) => {
    const emailLinks = page.locator('a[href^="mailto:"]');
    const count = await emailLinks.count();
    
    for (let i = 0; i < count; i++) {
      const link = emailLinks.nth(i);
      const href = await link.getAttribute('href');
      expect(href).toMatch(/^mailto:.+@.+\..+/);
    }
  });
});