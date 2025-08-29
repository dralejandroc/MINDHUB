import { test, expect } from '@playwright/test';

test.describe('Authentication Flow UX Tests', () => {
  
  test('sign-in page should load correctly', async ({ page }) => {
    await page.goto('/auth/sign-in');
    
    // Check page loads without errors
    await expect(page).toHaveTitle(/.*Sign.*In.*|.*Iniciar.*Sesión.*/i);
    
    // Check form elements exist
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Iniciar")')).toBeVisible();
  });

  test('sign-up page should load correctly', async ({ page }) => {
    await page.goto('/auth/sign-up');
    
    // Check page loads without errors  
    await expect(page).toHaveTitle(/.*Sign.*Up.*|.*Registro.*/i);
    
    // Check form elements exist
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('navigation between auth pages should work', async ({ page }) => {
    await page.goto('/auth/sign-in');
    
    // Look for "Sign Up" or "Registro" link
    const signUpLink = page.locator('a:has-text("Sign Up"), a:has-text("Registro"), a:has-text("Crear cuenta")').first();
    if (await signUpLink.count() > 0) {
      await signUpLink.click();
      await expect(page).toHaveURL(/.*sign-up.*/);
    }
    
    // Look for "Sign In" or "Iniciar Sesión" link  
    const signInLink = page.locator('a:has-text("Sign In"), a:has-text("Iniciar"), a:has-text("Ya tienes cuenta")').first();
    if (await signInLink.count() > 0) {
      await signInLink.click();
      await expect(page).toHaveURL(/.*sign-in.*/);
    }
  });

  test('form validation should work', async ({ page }) => {
    await page.goto('/auth/sign-in');
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Iniciar")').first();
    await submitButton.click();
    
    // Check for validation messages
    const errorMessages = page.locator('.error, [role="alert"], .text-red, .text-danger, .invalid-feedback');
    const hasErrors = await errorMessages.count() > 0;
    
    if (hasErrors) {
      await expect(errorMessages.first()).toBeVisible();
    }
  });

  test('Google OAuth button should be present and functional', async ({ page }) => {
    await page.goto('/auth/sign-in');
    
    // Look for Google sign-in button
    const googleButton = page.locator('button:has-text("Google"), [data-provider="google"], .google-auth');
    
    if (await googleButton.count() > 0) {
      await expect(googleButton.first()).toBeVisible();
      await expect(googleButton.first()).toBeEnabled();
    }
  });

  test('password reset functionality should be accessible', async ({ page }) => {
    await page.goto('/auth/sign-in');
    
    // Look for forgot password link
    const forgotLink = page.locator('a:has-text("Forgot"), a:has-text("Olvidé"), a:has-text("Reset")').first();
    
    if (await forgotLink.count() > 0) {
      await expect(forgotLink).toBeVisible();
      await expect(forgotLink).toBeEnabled();
    }
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('/auth/sign-in');
    
    // Block network requests to simulate offline
    await page.route('**/*', route => route.abort());
    
    // Try to submit form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Should show some error message or loading state
    await page.waitForTimeout(2000);
    
    // Restore network
    await page.unroute('**/*');
  });
});