// Import Playwright through npx execution instead of require

async function testClinimetrix() {
  console.log('🧪 Starting Clinimetrix functionality test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Go to Clinimetrix
    console.log('📋 Navigating to Clinimetrix...');
    await page.goto('https://mindhub.cloud/hubs/clinimetrix');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // 2. Check if we need to sign in
    const currentUrl = page.url();
    if (currentUrl.includes('/auth/sign-in')) {
      console.log('🔐 Need to sign in - attempting login...');
      
      // Fill login form (if visible)
      try {
        await page.fill('input[type="email"]', 'dr_aleks_c@hotmail.com');
        await page.waitForTimeout(500);
        await page.fill('input[type="password"]', 'Aa123456!');
        await page.waitForTimeout(500);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
      } catch (loginError) {
        console.log('⚠️ Could not login automatically:', loginError.message);
      }
    }
    
    // 3. Try to select a scale
    console.log('🎯 Looking for available scales...');
    
    // Look for scale cards or buttons
    await page.waitForSelector('[data-testid="scale-card"], .scale-card, button', { timeout: 10000 });
    
    const scales = await page.$$('[data-testid="scale-card"], .scale-card, button');
    console.log(`📊 Found ${scales.length} interactive elements`);
    
    if (scales.length > 0) {
      console.log('✅ Clicking on first scale...');
      await scales[0].click();
      await page.waitForTimeout(2000);
      
      // Check if we get the "No se encontraron ítems" error
      const errorMessages = await page.$$('text="No se encontraron ítems en la escala"');
      if (errorMessages.length > 0) {
        console.log('❌ ERROR FOUND: "No se encontraron ítems en la escala"');
        
        // Look for Django backend errors in console
        const logs = [];
        page.on('console', msg => logs.push(msg.text()));
        
        console.log('🔍 Recent console logs:');
        logs.slice(-10).forEach(log => console.log('  📝', log));
        
      } else {
        console.log('✅ No "items not found" error detected');
      }
      
      // Check for any Django backend endpoints being called
      const responses = [];
      page.on('response', response => {
        if (response.url().includes('mindhub-django-backend') || response.url().includes('/assessments/') || response.url().includes('/scales/')) {
          responses.push({
            url: response.url(),
            status: response.status()
          });
        }
      });
      
      await page.waitForTimeout(3000);
      
      if (responses.length > 0) {
        console.log('🌐 Django backend requests detected:');
        responses.forEach(resp => {
          console.log(`  ${resp.status === 200 ? '✅' : '❌'} ${resp.status} - ${resp.url}`);
        });
      } else {
        console.log('⚠️  No Django backend requests detected');
      }
      
    } else {
      console.log('❌ No scales found on page');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'clinimetrix-test.png', fullPage: true });
    console.log('📸 Screenshot saved as clinimetrix-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'clinimetrix-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testClinimetrix().then(() => {
  console.log('🏁 Test completed');
}).catch(console.error);