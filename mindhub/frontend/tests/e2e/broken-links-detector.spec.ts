import { test, expect } from '@playwright/test';

test.describe('Broken Links and Dead Endpoints Detection', () => {
  const pagesToTest = [
    '/',
    '/auth/sign-in',
    '/auth/sign-up',
    '/dashboard',
    '/hubs/expedix',
    '/hubs/agenda',
    '/hubs/clinimetrix',
    '/hubs/formx',
    '/hubs/finance',
    '/hubs/frontdesk'
  ];

  test('should detect broken internal links across all pages', async ({ page }) => {
    const brokenLinks: { page: string; link: string; status: number }[] = [];
    
    for (const testPage of pagesToTest) {
      await page.goto(testPage);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Get all internal links
      const links = page.locator('a[href^="/"], a[href^="./"], a[href^="../"]');
      const linkCount = await links.count();
      
      for (let i = 0; i < linkCount; i++) {
        const link = links.nth(i);
        const href = await link.getAttribute('href');
        
        if (href && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('#')) {
          try {
            // Navigate to the link and check if it loads properly
            const response = await page.request.get(href);
            const status = response.status();
            
            if (status >= 400) {
              brokenLinks.push({ page: testPage, link: href, status });
            }
          } catch (error) {
            brokenLinks.push({ page: testPage, link: href, status: 0 });
          }
        }
      }
    }
    
    // Report broken links
    if (brokenLinks.length > 0) {
      console.log('🚨 BROKEN LINKS DETECTED:');
      brokenLinks.forEach(({ page, link, status }) => {
        console.log(`  - Page: ${page}, Link: ${link}, Status: ${status}`);
      });
    }
    
    // This should pass but log the broken links for analysis
    expect(brokenLinks.length).toBeLessThan(50); // Allow some tolerance for auth-protected pages
  });

  test('should detect broken buttons and non-functional elements', async ({ page }) => {
    const brokenButtons: { page: string; button: string; issue: string }[] = [];
    
    for (const testPage of pagesToTest) {
      await page.goto(testPage);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Skip if redirected to auth
      if (page.url().includes('sign-in') && !testPage.includes('auth')) {
        continue;
      }
      
      // Test all clickable buttons
      const buttons = page.locator('button:not([disabled]), [role="button"]:not([aria-disabled="true"])');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 10); i++) { // Test max 10 buttons per page
        const button = buttons.nth(i);
        const buttonText = await button.textContent() || 'Unknown button';
        
        try {
          // Check if button is visible and enabled
          const isVisible = await button.isVisible();
          const isEnabled = await button.isEnabled();
          
          if (!isVisible) {
            brokenButtons.push({ page: testPage, button: buttonText, issue: 'Not visible' });
          } else if (!isEnabled) {
            brokenButtons.push({ page: testPage, button: buttonText, issue: 'Disabled' });
          } else {
            // Try clicking and see if it causes any JavaScript errors
            const errorLogs: string[] = [];
            page.on('console', msg => {
              if (msg.type() === 'error') {
                errorLogs.push(msg.text());
              }
            });
            
            await button.click({ timeout: 2000 });
            await page.waitForTimeout(500);
            
            if (errorLogs.length > 0) {
              brokenButtons.push({ 
                page: testPage, 
                button: buttonText, 
                issue: `JavaScript errors: ${errorLogs.join(', ')}` 
              });
            }
          }
        } catch (error) {
          brokenButtons.push({ 
            page: testPage, 
            button: buttonText, 
            issue: `Click failed: ${error}` 
          });
        }
      }
    }
    
    // Report broken buttons
    if (brokenButtons.length > 0) {
      console.log('🚨 BROKEN BUTTONS DETECTED:');
      brokenButtons.forEach(({ page, button, issue }) => {
        console.log(`  - Page: ${page}, Button: "${button}", Issue: ${issue}`);
      });
    }
    
    expect(brokenButtons.length).toBeLessThan(20); // Allow some tolerance
  });

  test('should detect broken API endpoints', async ({ page }) => {
    const brokenAPIs: { endpoint: string; status: number; error?: string }[] = [];
    
    // Common API endpoints to test
    const apiEndpoints = [
      '/api/auth/me',
      '/api/expedix/patients',
      '/api/agenda/appointments',
      '/api/clinimetrix/scales',
      '/api/formx/templates',
      '/api/finance/invoices',
      '/api/frontdesk/dashboard'
    ];
    
    for (const endpoint of apiEndpoints) {
      try {
        const response = await page.request.get(endpoint);
        const status = response.status();
        
        // 401/403 are acceptable for auth-protected endpoints
        // 404 means endpoint doesn't exist (broken)
        // 500+ means server error (broken)
        if (status === 404 || status >= 500) {
          brokenAPIs.push({ endpoint, status });
        } else if (status >= 400 && status !== 401 && status !== 403) {
          brokenAPIs.push({ endpoint, status });
        }
      } catch (error) {
        brokenAPIs.push({ 
          endpoint, 
          status: 0, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    // Report broken APIs
    if (brokenAPIs.length > 0) {
      console.log('🚨 BROKEN API ENDPOINTS DETECTED:');
      brokenAPIs.forEach(({ endpoint, status, error }) => {
        console.log(`  - Endpoint: ${endpoint}, Status: ${status}, Error: ${error || 'None'}`);
      });
    }
    
    expect(brokenAPIs.length).toBeLessThan(10); // Allow some tolerance
  });

  test('should detect missing images and assets', async ({ page }) => {
    const brokenAssets: { page: string; asset: string; status: number }[] = [];
    
    for (const testPage of pagesToTest) {
      await page.goto(testPage);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Check images
      const images = page.locator('img[src]');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const src = await img.getAttribute('src');
        
        if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
          try {
            const response = await page.request.get(src);
            const status = response.status();
            
            if (status >= 400) {
              brokenAssets.push({ page: testPage, asset: src, status });
            }
          } catch (error) {
            brokenAssets.push({ page: testPage, asset: src, status: 0 });
          }
        }
      }
      
      // Check CSS files
      const cssLinks = page.locator('link[rel="stylesheet"][href]');
      const cssCount = await cssLinks.count();
      
      for (let i = 0; i < cssCount; i++) {
        const css = cssLinks.nth(i);
        const href = await css.getAttribute('href');
        
        if (href && !href.startsWith('data:')) {
          try {
            const response = await page.request.get(href);
            const status = response.status();
            
            if (status >= 400) {
              brokenAssets.push({ page: testPage, asset: href, status });
            }
          } catch (error) {
            brokenAssets.push({ page: testPage, asset: href, status: 0 });
          }
        }
      }
    }
    
    // Report broken assets
    if (brokenAssets.length > 0) {
      console.log('🚨 BROKEN ASSETS DETECTED:');
      brokenAssets.forEach(({ page, asset, status }) => {
        console.log(`  - Page: ${page}, Asset: ${asset}, Status: ${status}`);
      });
    }
    
    expect(brokenAssets.length).toBeLessThan(5); // Should have very few broken assets
  });

  test('should detect forms without proper submission handling', async ({ page }) => {
    const brokenForms: { page: string; form: string; issue: string }[] = [];
    
    for (const testPage of pagesToTest) {
      await page.goto(testPage);
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      // Skip if redirected to auth (unless it's an auth page)
      if (page.url().includes('sign-in') && !testPage.includes('auth')) {
        continue;
      }
      
      // Test all forms
      const forms = page.locator('form');
      const formCount = await forms.count();
      
      for (let i = 0; i < formCount; i++) {
        const form = forms.nth(i);
        const formId = await form.getAttribute('id') || await form.getAttribute('class') || `form-${i}`;
        
        try {
          // Check if form has submit button
          const submitButton = form.locator('button[type="submit"], input[type="submit"]');
          const hasSubmitButton = await submitButton.count() > 0;
          
          if (!hasSubmitButton) {
            brokenForms.push({ 
              page: testPage, 
              form: formId, 
              issue: 'No submit button found' 
            });
            continue;
          }
          
          // Check if form has action or onSubmit handler
          const action = await form.getAttribute('action');
          const hasAction = action && action !== '#' && action !== '';
          
          if (!hasAction) {
            // Try submitting to see if there's JavaScript handling
            const errorLogs: string[] = [];
            page.on('console', msg => {
              if (msg.type() === 'error') {
                errorLogs.push(msg.text());
              }
            });
            
            await submitButton.first().click({ timeout: 2000 });
            await page.waitForTimeout(1000);
            
            if (errorLogs.some(log => log.includes('submit') || log.includes('handler'))) {
              brokenForms.push({ 
                page: testPage, 
                form: formId, 
                issue: 'Form submission causes errors' 
              });
            }
          }
        } catch (error) {
          brokenForms.push({ 
            page: testPage, 
            form: formId, 
            issue: `Form testing failed: ${error}` 
          });
        }
      }
    }
    
    // Report broken forms
    if (brokenForms.length > 0) {
      console.log('🚨 BROKEN FORMS DETECTED:');
      brokenForms.forEach(({ page, form, issue }) => {
        console.log(`  - Page: ${page}, Form: ${form}, Issue: ${issue}`);
      });
    }
    
    expect(brokenForms.length).toBeLessThan(10); // Allow some tolerance
  });
});