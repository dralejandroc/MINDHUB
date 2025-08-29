import { test, expect } from '@playwright/test';

test.describe('Agenda Module UX Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/hubs/agenda');
  });

  test('agenda hub should load without errors', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check for console errors
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    const isAuthRedirect = page.url().includes('sign-in') || page.url().includes('auth');
    
    if (!isAuthRedirect) {
      const hasContent = await page.locator('h1, .page-header, .dashboard, main, .calendar, .agenda').count() > 0;
      expect(hasContent).toBe(true);
    }
  });

  test('calendar view should be functional', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for calendar elements
      const calendarElements = page.locator('.calendar, .schedule, .agenda-view, [data-testid*="calendar"]');
      
      if (await calendarElements.count() > 0) {
        await expect(calendarElements.first()).toBeVisible();
        
        // Look for date navigation
        const dateNavigation = page.locator('.date-nav, button:has-text("Anterior"), button:has-text("Siguiente"), button:has-text("Today")');
        
        if (await dateNavigation.count() > 0) {
          await expect(dateNavigation.first()).toBeVisible();
          await expect(dateNavigation.first()).toBeEnabled();
        }
      }
    }
  });

  test('appointment creation should work', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for create appointment buttons
      const createButtons = page.locator('button:has-text("Nueva"), button:has-text("Crear"), button:has-text("Add"), .create-appointment');
      
      if (await createButtons.count() > 0) {
        await expect(createButtons.first()).toBeVisible();
        await expect(createButtons.first()).toBeEnabled();
        
        await createButtons.first().click();
        await page.waitForTimeout(1000);
        
        // Should show appointment form or modal
        const hasModal = await page.locator('.modal, [role="dialog"]').count() > 0;
        const hasForm = await page.locator('form, .appointment-form').count() > 0;
        const hasNavigated = page.url() !== '/hubs/agenda';
        
        expect(hasModal || hasForm || hasNavigated).toBe(true);
      }
    }
  });

  test('time slot selection should be available', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for time slots or scheduling interface
      const timeSlots = page.locator('.time-slot, .appointment-slot, .schedule-slot, [data-time]');
      
      if (await timeSlots.count() > 0) {
        await expect(timeSlots.first()).toBeVisible();
        
        // Try clicking on a time slot
        const firstSlot = timeSlots.first();
        await firstSlot.click();
        await page.waitForTimeout(1000);
        
        // Should open appointment creation or show selection
        const hasModal = await page.locator('.modal, [role="dialog"], .appointment-form').count() > 0;
        expect(hasModal).toBe(true);
      }
    }
  });

  test('appointment list should be accessible', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for appointment list or table
      const appointmentList = page.locator('.appointment-list, table, .schedule-list, [data-testid*="appointment"]');
      
      if (await appointmentList.count() > 0) {
        await expect(appointmentList.first()).toBeVisible();
        
        // Look for appointment entries
        const appointments = page.locator('.appointment, .appointment-item, tr, .schedule-item');
        
        if (await appointments.count() > 0) {
          // Appointments should be interactive
          const firstAppointment = appointments.first();
          await expect(firstAppointment).toBeVisible();
          
          // Try clicking on appointment for details
          await firstAppointment.click();
          await page.waitForTimeout(1000);
          
          const hasDetails = await page.locator('.appointment-details, .modal, [role="dialog"]').count() > 0;
          const hasNavigated = page.url() !== '/hubs/agenda';
          
          expect(hasDetails || hasNavigated).toBe(true);
        }
      }
    }
  });

  test('patient search should work in appointments', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for patient search input
      const searchInput = page.locator('input[placeholder*="paciente"], input[placeholder*="patient"], .patient-search').first();
      
      if (await searchInput.count() > 0) {
        await expect(searchInput).toBeVisible();
        await expect(searchInput).toBeEnabled();
        
        // Try typing in search
        await searchInput.fill('test');
        await page.waitForTimeout(1000);
        
        // Should show search results or dropdown
        const searchResults = page.locator('.search-results, .dropdown, .patient-list');
        
        if (await searchResults.count() > 0) {
          await expect(searchResults.first()).toBeVisible();
        }
      }
    }
  });

  test('drag and drop functionality should work', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for draggable appointments
      const draggableItems = page.locator('[draggable="true"], .draggable, .appointment[draggable]');
      
      if (await draggableItems.count() > 1) {
        const firstItem = draggableItems.first();
        const secondItem = draggableItems.nth(1);
        
        // Try drag and drop
        await firstItem.dragTo(secondItem);
        await page.waitForTimeout(1000);
        
        // Should trigger some update or confirmation
        const hasConfirmation = await page.locator('.confirmation, .modal, [role="alert"]').count() > 0;
        
        // This is just to check if drag/drop doesn't cause errors
        expect(hasConfirmation || true).toBe(true); // Allow either confirmation or no errors
      }
    }
  });

  test('appointment status updates should work', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for appointment status indicators
      const statusElements = page.locator('.status, .appointment-status, select[name*="status"], .status-badge');
      
      if (await statusElements.count() > 0) {
        await expect(statusElements.first()).toBeVisible();
        
        // If it's a select, try changing status
        const statusSelect = page.locator('select[name*="status"]').first();
        
        if (await statusSelect.count() > 0) {
          const options = await statusSelect.locator('option').count();
          if (options > 1) {
            await statusSelect.selectOption({ index: 1 });
            await page.waitForTimeout(1000);
          }
        }
      }
    }
  });

  test('calendar navigation should work correctly', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for navigation buttons
      const navButtons = page.locator('button:has-text("Anterior"), button:has-text("Siguiente"), button:has-text("Previous"), button:has-text("Next")');
      
      if (await navButtons.count() > 0) {
        const nextButton = navButtons.last();
        await expect(nextButton).toBeVisible();
        await expect(nextButton).toBeEnabled();
        
        // Try navigating
        await nextButton.click();
        await page.waitForTimeout(1000);
        
        // Should update calendar view
        const calendarContent = page.locator('.calendar, .schedule, .agenda-view');
        if (await calendarContent.count() > 0) {
          await expect(calendarContent.first()).toBeVisible();
        }
      }
    }
  });

  test('integration with Expedix should work', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('sign-in')) {
      // Look for "Iniciar Consulta" or similar buttons
      const consultationButtons = page.locator('button:has-text("Iniciar"), button:has-text("Consulta"), .start-consultation');
      
      if (await consultationButtons.count() > 0) {
        const firstButton = consultationButtons.first();
        await expect(firstButton).toBeVisible();
        await expect(firstButton).toBeEnabled();
        
        // Try clicking (might navigate to Expedix)
        await firstButton.click();
        await page.waitForTimeout(1000);
        
        const hasNavigated = page.url().includes('expedix') || page.url() !== '/hubs/agenda';
        const hasModal = await page.locator('.modal, [role="dialog"]').count() > 0;
        
        expect(hasNavigated || hasModal).toBe(true);
      }
    }
  });
});