// Test file to verify Vercel is reading the correct directory
console.log('Vercel is reading from: mindhub/frontend');
console.log('Current working directory files:');
const fs = require('fs');
const path = require('path');

try {
  const componentsDir = path.join(__dirname, 'components');
  if (fs.existsSync(componentsDir)) {
    console.log('✅ components directory exists');
    const layoutDir = path.join(componentsDir, 'layout');
    if (fs.existsSync(layoutDir)) {
      console.log('✅ components/layout directory exists');
      const unifiedSidebar = path.join(layoutDir, 'UnifiedSidebar.tsx');
      if (fs.existsSync(unifiedSidebar)) {
        console.log('✅ UnifiedSidebar.tsx exists');
      } else {
        console.log('❌ UnifiedSidebar.tsx NOT found');
      }
    } else {
      console.log('❌ components/layout directory NOT found');
    }
  } else {
    console.log('❌ components directory NOT found');
  }
} catch (error) {
  console.error('Error checking files:', error);
}

module.exports = {};