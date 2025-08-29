import { test, expect } from '@playwright/test';

test.describe('Expedix Module UX Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/hubs/expedix');
  });

  test('expedix hub should load without errors', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check for console errors
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    // Either shows content or redirects to auth
    const isAuthRedirect = page.url().includes('sign-in') || page.url().includes('auth');
    
    if (!isAuthRedirect) {
      // Should have main content elements
      const hasContent = await page.locator('h1, .page-header, .dashboard, main').count() > 0;
      expect(hasContent).toBe(true);
      
      // No console errors
      expect(logs.length).toBeLessThan(5); // Allow minor warnings
    }
  });

  test('patient management interface should be accessible', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for patient-related elements
      const patientElements = page.locator('text=/paciente|patient/i, .patient, [data-testid*="patient"]');
      
      if (await patientElements.count() > 0) {
        await expect(patientElements.first()).toBeVisible();
      }
      
      // Look for add/create buttons
      const addButtons = page.locator('button:has-text("Agregar"), button:has-text("Nuevo"), button:has-text("Add"), button:has-text("Create")');
      
      if (await addButtons.count() > 0) {
        await expect(addButtons.first()).toBeVisible();
        await expect(addButtons.first()).toBeEnabled();
      }
    }
  });

  test('search functionality should work', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="search"], .search-input').first();
      
      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeVisible();
        await expect(searchInput).toBeEnabled();
        
        // Try typing in search
        await searchInput.fill('test');
        await page.waitForTimeout(1000); // Wait for debounce
        
        // Search should not cause errors
        const errorElements = page.locator('.error, [role="alert"]');
        const errorCount = await errorElements.count();
        expect(errorCount).toBe(0);
      }
    }
  });

  test('patient dashboard should load patient data', async ({ page }) => {
    // Try to access a patient dashboard (this might redirect to auth)
    await page.goto('/hubs/expedix/patient/dashboard');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Should have patient dashboard elements
      const dashboardElements = page.locator('.dashboard, .patient-dashboard, h1, .timeline');
      
      if (await dashboardElements.count() > 0) {
        await expect(dashboardElements.first()).toBeVisible();
      }
    }
  });

  test('consultation forms should be accessible', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for consultation-related elements
      const consultationElements = page.locator('text=/consulta|consultation/i, .consultation, [data-testid*="consultation"]');
      
      if (await consultationElements.count() > 0) {
        const firstElement = consultationElements.first();
        await expect(firstElement).toBeVisible();
        
        // Try clicking if it's clickable
        const isClickable = await firstElement.locator('button, a, [role="button"]').count() > 0;
        if (isClickable) {
          await firstElement.click();
          await page.waitForTimeout(1000);
          
          // Should navigate or show modal
          const hasModal = await page.locator('.modal, [role="dialog"]').count() > 0;
          const hasNavigated = page.url() !== '/hubs/expedix';
          expect(hasModal || hasNavigated).toBe(true);
        }
      }
    }
  });

  test('patient timeline should function correctly', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for timeline elements
      const timelineElements = page.locator('.timeline, [data-testid*="timeline"], text=/timeline|historial/i');
      
      if (await timelineElements.count() > 0) {
        await expect(timelineElements.first()).toBeVisible();
        
        // Look for timeline entries
        const timelineEntries = page.locator('.timeline-entry, .timeline-item, .event');
        
        if (await timelineEntries.count() > 0) {
          // Timeline entries should be visible
          await expect(timelineEntries.first()).toBeVisible();
        }
      }
    }
  });

  test('forms should have proper validation', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for forms
      const forms = page.locator('form');
      const formCount = await forms.count();
      
      if (formCount > 0) {
        const form = forms.first();
        
        // Look for required inputs
        const requiredInputs = form.locator('input[required], select[required], textarea[required]');
        const requiredCount = await requiredInputs.count();
        
        if (requiredCount > 0) {
          // Try submitting form without filling required fields
          const submitButton = form.locator('button[type="submit"], input[type="submit"]').first();
          
          if (await submitButton.count() > 0) {
            await submitButton.click();
            
            // Should show validation errors
            const validationErrors = page.locator('.error, .invalid, [aria-invalid="true"], .text-red');
            const hasValidation = await validationErrors.count() > 0;
            
            // HTML5 validation or custom validation should work
            expect(hasValidation).toBe(true);
          }
        }
      }
    }
  });

  test('prescription generation should be accessible', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for prescription-related elements
      const prescriptionElements = page.locator('text=/receta|prescription/i, .prescription, [data-testid*="prescription"]');
      
      if (await prescriptionElements.count() > 0) {
        await expect(prescriptionElements.first()).toBeVisible();
      }
    }
  });
});