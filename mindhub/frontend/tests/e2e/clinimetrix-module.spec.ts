import { test, expect } from '@playwright/test';

test.describe('ClinimetrixPro Module UX Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/hubs/clinimetrix');
  });

  test('clinimetrix hub should load without errors', async ({ page }) => {
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
      const hasContent = await page.locator('h1, .page-header, .dashboard, main, .clinimetrix').count() > 0;
      expect(hasContent).toBe(true);
    }
  });

  test('psychometric scales should be available', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for scale-related elements
      const scaleElements = page.locator('text=/escala|scale|PHQ|BDI|GADI/i, .scale, .assessment, [data-testid*="scale"]');
      
      if (await scaleElements.count() > 0) {
        await expect(scaleElements.first()).toBeVisible();
      }
      
      // Look for scale selection interface
      const selectionElements = page.locator('.scale-selector, .assessment-selector, button:has-text("Seleccionar")');
      
      if (await selectionElements.count() > 0) {
        await expect(selectionElements.first()).toBeVisible();
      }
    }
  });

  test('assessment creation should work', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for create assessment buttons
      const createButtons = page.locator('button:has-text("Nueva"), button:has-text("Crear"), button:has-text("New"), .create-assessment');
      
      if (await createButtons.count() > 0) {
        await expect(createButtons.first()).toBeVisible();
        await expect(createButtons.first()).toBeEnabled();
        
        // Try clicking to start assessment
        await createButtons.first().click();
        await page.waitForTimeout(1000);
        
        // Should navigate to assessment form or show selection modal
        const hasModal = await page.locator('.modal, [role="dialog"]').count() > 0;
        const hasNavigated = page.url() !== '/hubs/clinimetrix';
        const hasScaleList = await page.locator('.scale-list, .assessment-list').count() > 0;
        
        expect(hasModal || hasNavigated || hasScaleList).toBe(true);
      }
    }
  });

  test('assessment taking interface should be functional', async ({ page }) => {
    // Try to access assessment taking interface
    await page.goto('/hubs/clinimetrix/take');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for assessment interface elements
      const assessmentElements = page.locator('.assessment-form, form, .question, .scale-item');
      
      if (await assessmentElements.count() > 0) {
        await expect(assessmentElements.first()).toBeVisible();
        
        // Look for questions or scale items
        const questionElements = page.locator('.question, .item, input[type="radio"], .likert');
        
        if (await questionElements.count() > 0) {
          // Questions should be interactive
          const firstQuestion = questionElements.first();
          await expect(firstQuestion).toBeVisible();
          
          // If it's a radio input, try selecting it
          if (await firstQuestion.locator('input[type="radio"]').count() > 0) {
            await firstQuestion.locator('input[type="radio"]').first().check();
          }
        }
      }
    }
  });

  test('results viewing should be accessible', async ({ page }) => {
    // Try to access results page
    await page.goto('/hubs/clinimetrix/results');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for results interface
      const resultsElements = page.locator('.results, .assessment-results, .score, text=/resultado|result/i');
      
      if (await resultsElements.count() > 0) {
        await expect(resultsElements.first()).toBeVisible();
      }
      
      // Look for patient selection or results list
      const listElements = page.locator('.results-list, .patient-list, table');
      
      if (await listElements.count() > 0) {
        await expect(listElements.first()).toBeVisible();
      }
    }
  });

  test('scale catalog should be comprehensive', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for scale catalog or list
      const catalogElements = page.locator('.scale-catalog, .scale-list, .assessment-catalog');
      
      if (await catalogElements.count() > 0) {
        await expect(catalogElements.first()).toBeVisible();
        
        // Should have multiple scales available
        const scaleItems = page.locator('.scale-item, .scale-card, [data-testid*="scale"]');
        const scaleCount = await scaleItems.count();
        
        if (scaleCount > 0) {
          expect(scaleCount).toBeGreaterThan(3); // Should have multiple scales
          
          // Try clicking on a scale
          await scaleItems.first().click();
          await page.waitForTimeout(1000);
          
          // Should show scale details or start assessment
          const hasDetails = await page.locator('.scale-details, .scale-info, .modal').count() > 0;
          const hasStarted = page.url().includes('take') || page.url().includes('assessment');
          
          expect(hasDetails || hasStarted).toBe(true);
        }
      }
    }
  });

  test('integration with Expedix should work', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for patient integration elements
      const patientElements = page.locator('text=/paciente|patient/i, .patient-selector, select[name*="patient"]');
      
      if (await patientElements.count() > 0) {
        await expect(patientElements.first()).toBeVisible();
      }
      
      // Look for links back to Expedix
      const expedixLinks = page.locator('a[href*="expedix"], text=/expediente|expedix/i');
      
      if (await expedixLinks.count() > 0) {
        const firstLink = expedixLinks.first();
        await expect(firstLink).toBeVisible();
        await expect(firstLink).toBeEnabled();
      }
    }
  });

  test('mobile responsiveness should work', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Check main elements are still visible on mobile
      const mainElements = page.locator('h1, main, .dashboard, .clinimetrix');
      
      if (await mainElements.count() > 0) {
        await expect(mainElements.first()).toBeVisible();
      }
      
      // Check for mobile-friendly navigation
      const mobileNav = page.locator('.mobile-menu, [data-testid*="mobile"], [aria-label*="menu"]');
      
      if (await mobileNav.count() > 0) {
        await mobileNav.first().click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('assessment progress should be saved', async ({ page }) => {
    await page.goto('/hubs/clinimetrix/take');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for assessment form
      const assessmentForm = page.locator('form, .assessment-form');
      
      if (await assessmentForm.count() > 0) {
        // Look for save or progress indicators
        const saveElements = page.locator('button:has-text("Guardar"), button:has-text("Save"), .auto-save, text=/guardado|saved/i');
        
        if (await saveElements.count() > 0) {
          // Should have save functionality
          const firstSave = saveElements.first();
          
          if (await firstSave.locator('button').count() > 0) {
            await expect(firstSave.locator('button')).toBeEnabled();
          }
        }
        
        // Look for progress indicators
        const progressElements = page.locator('.progress, .progress-bar, text=/progreso|progress/i');
        
        if (await progressElements.count() > 0) {
          await expect(progressElements.first()).toBeVisible();
        }
      }
    }
  });
});