import { test, expect } from '@playwright/test';

test.describe('Critical User Flows UX Tests', () => {
  
  test('complete patient management flow should work', async ({ page }) => {
    // Start from landing page
    await page.goto('/');
    
    // Navigate to sign-in
    const signInLink = page.locator('a:has-text("Sign In"), a:has-text("Iniciar"), a[href*="sign-in"]').first();
    if (await signInLink.count() > 0) {
      await signInLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      await page.goto('/auth/sign-in');
    }
    
    // Verify sign-in form is functional
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Try going to Expedix (will redirect to auth if needed)
    await page.goto('/hubs/expedix');
    await page.waitForLoadState('networkidle');
    
    // If not redirected to auth, test patient management features
    if (!page.url().includes('sign-in')) {
      // Look for patient management interface
      const patientElements = page.locator('text=/paciente|patient/i, .patient, [data-testid*="patient"]');
      
      if (await patientElements.count() > 0) {
        await expect(patientElements.first()).toBeVisible();
      }
      
      // Try accessing patient dashboard
      await page.goto('/hubs/expedix/patient/dashboard');
      await page.waitForLoadState('networkidle');
      
      const hasPatientDashboard = await page.locator('.patient-dashboard, .dashboard, .timeline').count() > 0;
      const isRedirectedToAuth = page.url().includes('sign-in');
      
      expect(hasPatientDashboard || isRedirectedToAuth).toBe(true);
    }
  });

  test('assessment creation and completion flow should work', async ({ page }) => {
    // Navigate to ClinimetrixPro
    await page.goto('/hubs/clinimetrix');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for assessment creation
      const createButtons = page.locator('button:has-text("Nueva"), button:has-text("Crear"), button:has-text("New")');
      
      if (await createButtons.count() > 0) {
        await createButtons.first().click();
        await page.waitForTimeout(1000);
        
        // Should show scale selection or go to assessment form
        const hasScaleSelection = await page.locator('.scale-selector, .scale-list, .assessment-catalog').count() > 0;
        const hasAssessmentForm = await page.locator('.assessment-form, form, .question').count() > 0;
        
        expect(hasScaleSelection || hasAssessmentForm).toBe(true);
        
        // If scale selection is available, try selecting a scale
        if (hasScaleSelection) {
          const scaleItems = page.locator('.scale-item, .scale-card, button:has-text("PHQ"), button:has-text("BDI")');
          
          if (await scaleItems.count() > 0) {
            await scaleItems.first().click();
            await page.waitForTimeout(1000);
            
            // Should navigate to assessment form
            const hasForm = await page.locator('.assessment-form, form, .question').count() > 0;
            expect(hasForm).toBe(true);
          }
        }
      }
      
      // Test assessment taking interface
      await page.goto('/hubs/clinimetrix/take');
      await page.waitForLoadState('networkidle');
      
      if (!page.url().includes('sign-in')) {
        const hasAssessmentInterface = await page.locator('.assessment-form, .question, .scale-item').count() > 0;
        expect(hasAssessmentInterface).toBe(true);
      }
    }
  });

  test('appointment scheduling flow should work', async ({ page }) => {
    // Navigate to Agenda
    await page.goto('/hubs/agenda');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for calendar or scheduling interface
      const calendarElements = page.locator('.calendar, .schedule, .agenda-view');
      
      if (await calendarElements.count() > 0) {
        await expect(calendarElements.first()).toBeVisible();
      }
      
      // Try creating a new appointment
      const createButtons = page.locator('button:has-text("Nueva"), button:has-text("Crear"), button:has-text("Add")');
      
      if (await createButtons.count() > 0) {
        await createButtons.first().click();
        await page.waitForTimeout(1000);
        
        // Should show appointment form or modal
        const hasModal = await page.locator('.modal, [role="dialog"]').count() > 0;
        const hasForm = await page.locator('form, .appointment-form').count() > 0;
        
        expect(hasModal || hasForm).toBe(true);
        
        // If form is available, check required fields
        if (hasForm) {
          const patientField = page.locator('input[name*="patient"], select[name*="patient"], .patient-selector').first();
          const timeField = page.locator('input[type="time"], input[type="datetime"], .time-selector').first();
          
          if (await patientField.count() > 0) {
            await expect(patientField).toBeVisible();
          }
          
          if (await timeField.count() > 0) {
            await expect(timeField).toBeVisible();
          }
        }
      }
    }
  });

  test('consultation initiation flow should work', async ({ page }) => {
    // Start from Agenda and try to initiate consultation
    await page.goto('/hubs/agenda');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for "Iniciar Consulta" buttons
      const consultationButtons = page.locator('button:has-text("Iniciar"), .start-consultation');
      
      if (await consultationButtons.count() > 0) {
        await consultationButtons.first().click();
        await page.waitForTimeout(1000);
        
        // Should navigate to Expedix or open consultation form
        const isInExpedix = page.url().includes('expedix');
        const hasConsultationForm = await page.locator('.consultation-form, form').count() > 0;
        
        expect(isInExpedix || hasConsultationForm).toBe(true);
        
        // If in Expedix, check consultation interface
        if (isInExpedix) {
          const consultationElements = page.locator('.consultation, .medical-form, .exam-form');
          
          if (await consultationElements.count() > 0) {
            await expect(consultationElements.first()).toBeVisible();
          }
        }
      } else {
        // Try direct navigation to consultation form
        await page.goto('/hubs/expedix/consultation/new');
        await page.waitForLoadState('networkidle');
        
        if (!page.url().includes('sign-in')) {
          const hasConsultationForm = await page.locator('.consultation-form, form').count() > 0;
          expect(hasConsultationForm).toBe(true);
        }
      }
    }
  });

  test('prescription generation flow should work', async ({ page }) => {
    // Navigate to Expedix for prescription generation
    await page.goto('/hubs/expedix');
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for prescription-related elements
      const prescriptionElements = page.locator('text=/receta|prescription/i, .prescription, [data-testid*="prescription"]');
      
      if (await prescriptionElements.count() > 0) {
        await prescriptionElements.first().click();
        await page.waitForTimeout(1000);
        
        // Should show prescription form
        const hasPrescriptionForm = await page.locator('.prescription-form, form').count() > 0;
        const hasNavigated = page.url().includes('prescription') || page.url().includes('receta');
        
        expect(hasPrescriptionForm || hasNavigated).toBe(true);
      } else {
        // Try direct navigation
        await page.goto('/hubs/expedix/prescription/new');
        await page.waitForLoadState('networkidle');
        
        if (!page.url().includes('sign-in')) {
          const hasPrescriptionInterface = await page.locator('.prescription-form, form, .medication').count() > 0;
          expect(hasPrescriptionInterface).toBe(true);
        }
      }
    }
  });

  test('module integration flow should work', async ({ page }) => {
    // Test navigation between modules
    const moduleRoutes = [
      '/hubs/expedix',
      '/hubs/agenda',
      '/hubs/clinimetrix',
      '/hubs/formx'
    ];
    
    for (let i = 0; i < moduleRoutes.length; i++) {
      await page.goto(moduleRoutes[i]);
      await page.waitForLoadState('networkidle');
      
      if (!page.url().includes('sign-in')) {
        // Check if current module loads properly
        const hasContent = await page.locator('h1, main, .dashboard, .hub').count() > 0;
        expect(hasContent).toBe(true);
        
        // Look for navigation to other modules
        const navLinks = page.locator('a[href^="/hubs/"], nav a');
        
        if (await navLinks.count() > 0) {
          // Try navigating to next module
          const nextModuleIndex = (i + 1) % moduleRoutes.length;
          const nextModulePath = moduleRoutes[nextModuleIndex];
          const nextModuleLink = page.locator(`a[href="${nextModulePath}"]`).first();
          
          if (await nextModuleLink.count() > 0) {
            await nextModuleLink.click();
            await page.waitForTimeout(1000);
            
            const hasNavigated = page.url().includes(nextModulePath.replace('/hubs/', ''));
            expect(hasNavigated).toBe(true);
          }
        }
      }
    }
  });

  test('responsive design flow should work on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test mobile navigation flow
    await page.goto('/');
    
    // Check mobile menu
    const mobileMenuButton = page.locator('[aria-label*="menu"], .mobile-menu-toggle, [data-testid*="mobile"]').first();
    
    if (await mobileMenuButton.count() > 0) {
      await mobileMenuButton.click();
      await page.waitForTimeout(500);
      
      const mobileMenu = page.locator('.mobile-menu, [role="navigation"]').first();
      if (await mobileMenu.count() > 0) {
        await expect(mobileMenu).toBeVisible();
        
        // Try navigating via mobile menu
        const mobileLinks = mobileMenu.locator('a').first();
        if (await mobileLinks.count() > 0) {
          await mobileLinks.click();
          await page.waitForTimeout(1000);
          
          // Should navigate somewhere
          expect(page.url()).not.toBe('/');
        }
      }
    }
    
    // Test responsive forms
    await page.goto('/auth/sign-in');
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      
      // Should be usable on mobile
      await expect(emailInput).toBeEnabled();
      await expect(passwordInput).toBeEnabled();
    }
  });
});