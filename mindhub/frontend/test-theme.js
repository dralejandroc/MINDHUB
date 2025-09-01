const { chromium } = require('playwright');

async function inspectThemeImplementation() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🔍 Starting theme inspection...');
  
  try {
    // Navegar al dashboard
    await page.goto('http://localhost:3002/app');
    
    // Esperar a que cargue
    await page.waitForTimeout(3000);
    
    // Verificar si existe el toggle de tema (múltiples selectores)
    const themeToggleSelectors = [
      '[aria-label="Tema de la aplicación"]',
      'button[title*="Tema"]', 
      'button[title*="tema"]',
      'button[title*="Cambiar tema"]',
      'button[aria-label*="Tema"]',
      '[class*="theme"] button',
      'button svg[class*="Sun"]',
      'button svg[class*="Moon"]'
    ];
    
    let themeToggle = null;
    let hasThemeToggle = false;
    
    for (const selector of themeToggleSelectors) {
      themeToggle = await page.locator(selector).first();
      hasThemeToggle = await themeToggle.count() > 0;
      if (hasThemeToggle) {
        console.log(`✅ Theme Toggle encontrado con selector: ${selector}`);
        break;
      }
    }
    
    console.log(`📱 Theme Toggle presente: ${hasThemeToggle}`);
    
    if (hasThemeToggle) {
      await themeToggle.click();
      await page.waitForTimeout(1000);
    }
    
    // Inspeccionar el HTML actual
    const htmlElement = await page.locator('html').first();
    const dataTheme = await htmlElement.getAttribute('data-theme');
    const htmlClasses = await htmlElement.getAttribute('class');
    
    console.log(`🏷️  data-theme: ${dataTheme}`);
    console.log(`📝 html classes: ${htmlClasses}`);
    
    // Verificar si hay clases theme aplicadas
    const elementsWithThemeClasses = await page.locator('[class*="theme-"]').count();
    const elementsWithBgTheme = await page.locator('[class*="bg-theme"]').count();
    const elementsWithTextTheme = await page.locator('[class*="text-theme"]').count();
    
    console.log(`🎨 Elementos con clases theme-*: ${elementsWithThemeClasses}`);
    console.log(`🌈 Elementos con bg-theme-*: ${elementsWithBgTheme}`);
    console.log(`📝 Elementos con text-theme-*: ${elementsWithTextTheme}`);
    
    // Verificar CSS variables
    const rootStyles = await page.evaluate(() => {
      const root = document.documentElement;
      const computedStyles = getComputedStyle(root);
      return {
        bgPrimary: computedStyles.getPropertyValue('--color-bg-primary').trim(),
        textPrimary: computedStyles.getPropertyValue('--color-text-primary').trim(),
        borderPrimary: computedStyles.getPropertyValue('--color-border-primary').trim()
      };
    });
    
    console.log('🎯 CSS Variables:', rootStyles);
    
    // Capturar screenshot del estado actual
    await page.screenshot({ path: './theme-light.png', fullPage: true });
    console.log('📸 Screenshot guardado: theme-light.png');
    
    // Intentar cambiar al tema oscuro
    if (hasThemeToggle) {
      console.log('🌙 Intentando cambiar a tema oscuro...');
      
      // Buscar la opción de tema oscuro
      const darkOption = await page.locator('text=Oscuro, text="Oscuro", [title*="Oscuro"]').first();
      if (await darkOption.count() > 0) {
        await darkOption.click();
        await page.waitForTimeout(2000);
        
        // Verificar cambio
        const newDataTheme = await htmlElement.getAttribute('data-theme');
        console.log(`🌙 Nuevo data-theme: ${newDataTheme}`);
        
        // Screenshot del tema oscuro
        await page.screenshot({ path: './theme-dark.png', fullPage: true });
        console.log('📸 Screenshot tema oscuro guardado: theme-dark.png');
        
        // Verificar nuevas CSS variables
        const darkStyles = await page.evaluate(() => {
          const root = document.documentElement;
          const computedStyles = getComputedStyle(root);
          return {
            bgPrimary: computedStyles.getPropertyValue('--color-bg-primary').trim(),
            textPrimary: computedStyles.getPropertyValue('--color-text-primary').trim(),
            borderPrimary: computedStyles.getPropertyValue('--color-border-primary').trim()
          };
        });
        
        console.log('🌙 CSS Variables tema oscuro:', darkStyles);
        
      } else {
        console.log('❌ No se encontró opción de tema oscuro');
      }
    }
    
    // Navegar a otras páginas para verificar
    console.log('🔄 Verificando otras páginas...');
    
    const pagesToCheck = [
      { url: '/hubs/expedix', name: 'Expedix' },
      { url: '/hubs/agenda', name: 'Agenda' },
      { url: '/hubs/clinimetrix', name: 'Clinimetrix' }
    ];
    
    for (const pageCheck of pagesToCheck) {
      try {
        await page.goto(`http://localhost:3002${pageCheck.url}`);
        await page.waitForTimeout(2000);
        
        const pageDataTheme = await page.locator('html').getAttribute('data-theme');
        const pageThemeElements = await page.locator('[class*="theme-"]').count();
        
        console.log(`📄 ${pageCheck.name}: data-theme=${pageDataTheme}, elementos theme=${pageThemeElements}`);
        
        await page.screenshot({ path: `./page-${pageCheck.name.toLowerCase()}.png` });
        
      } catch (error) {
        console.log(`❌ Error en ${pageCheck.name}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error durante la inspección:', error);
  }
  
  await browser.close();
  console.log('✅ Inspección completada');
}

inspectThemeImplementation().catch(console.error);