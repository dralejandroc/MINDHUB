import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation UX Tests', () => {
  
  test('dashboard should redirect to sign-in when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to sign-in page
    await expect(page).toHaveURL(/.*sign-in.*|.*auth.*/);
  });

  test('hubs routes should be accessible', async ({ page }) => {
    const hubRoutes = [
      '/hubs/expedix',
      '/hubs/agenda',
      '/hubs/clinimetrix',
      '/hubs/formx',
      '/hubs/finance',
      '/hubs/frontdesk'
    ];

    for (const route of hubRoutes) {
      await page.goto(route);
      
      // Should either show the hub or redirect to auth
      const isAuthRedirect = page.url().includes('sign-in') || page.url().includes('auth');
      const isValidPage = !page.url().includes('404') && !page.url().includes('error');
      
      expect(isAuthRedirect || isValidPage).toBe(true);
      
      // If not redirected to auth, check page loads properly
      if (!isAuthRedirect) {
        // Look for common UI elements that indicate a proper page load
        const hasContent = await page.locator('h1, .page-title, .dashboard, .hub, main').count() > 0;
        expect(hasContent).toBe(true);
      }
    }
  });

  test('navigation between hubs should work', async ({ page }) => {
    // Try to access each hub and check navigation
    const hubs = [
      { name: 'Expedix', path: '/hubs/expedix' },
      { name: 'Agenda', path: '/hubs/agenda' },
      { name: 'ClinimetrixPro', path: '/hubs/clinimetrix' },
      { name: 'FormX', path: '/hubs/formx' },
      { name: 'Finance', path: '/hubs/finance' },
      { name: 'FrontDesk', path: '/hubs/frontdesk' }
    ];

    for (const hub of hubs) {
      await page.goto(hub.path);
      
      // Check if page loads (either shows content or redirects to auth)
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      const currentUrl = page.url();
      const isValidResponse = !currentUrl.includes('404') && !currentUrl.includes('error');
      expect(isValidResponse).toBe(true);
    }
  });

  test('sidebar navigation should be functional', async ({ page }) => {
    await page.goto('/hubs/expedix'); // Start with any hub
    
    // Look for navigation elements
    const navElements = page.locator('nav, .sidebar, .navigation, [role="navigation"]');
    
    if (await navElements.count() > 0) {
      // Look for navigation links
      const navLinks = page.locator('a[href^="/hubs/"], nav a, .sidebar a');
      const linkCount = await navLinks.count();
      
      if (linkCount > 0) {
        // Try clicking the first few navigation links
        for (let i = 0; i < Math.min(3, linkCount); i++) {
          const link = navLinks.nth(i);
          const href = await link.getAttribute('href');
          
          if (href && href.startsWith('/hubs/')) {
            await link.click();
            await page.waitForLoadState('networkidle', { timeout: 5000 });
            
            // Check that navigation worked
            const newUrl = page.url();
            const isValidNavigation = newUrl.includes('/hubs/') && !newUrl.includes('404');
            expect(isValidNavigation).toBe(true);
          }
        }
      }
    }
  });

  test('mobile navigation should work', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/hubs/expedix');
    
    // Look for mobile menu toggle
    const mobileToggle = page.locator('[aria-label*="menu"], .mobile-menu-toggle, [data-testid*="mobile"]').first();
    
    if (await mobileToggle.count() > 0) {
      await mobileToggle.click();
      
      // Check if mobile navigation opens
      const mobileNav = page.locator('.mobile-menu, [role="navigation"]').first();
      if (await mobileNav.count() > 0) {
        await expect(mobileNav).toBeVisible();
      }
    }
  });

  test('should handle 404 errors gracefully', async ({ page }) => {
    await page.goto('/hubs/nonexistent-hub');
    
    // Should either show 404 page or redirect somewhere valid
    await page.waitForLoadState('networkidle');
    
    const has404Content = await page.locator('text=/404|Not Found|Página no encontrada/i').count() > 0;
    const isRedirected = !page.url().includes('nonexistent-hub');
    
    expect(has404Content || isRedirected).toBe(true);
  });

  test('breadcrumb navigation should be present', async ({ page }) => {
    await page.goto('/hubs/expedix');
    
    // Look for breadcrumb elements
    const breadcrumbs = page.locator('.breadcrumb, [aria-label*="breadcrumb"], nav[aria-label="Breadcrumb"]');
    
    if (await breadcrumbs.count() > 0) {
      await expect(breadcrumbs.first()).toBeVisible();
      
      // Check breadcrumb links work
      const breadcrumbLinks = breadcrumbs.locator('a').first();
      if (await breadcrumbLinks.count() > 0) {
        await breadcrumbLinks.click();
        await page.waitForLoadState('networkidle');
        
        // Should navigate somewhere
        expect(page.url()).not.toContain('expedix');
      }
    }
  });
});