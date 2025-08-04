#!/usr/bin/env node

/**
 * Script to remove hardcoded users from all files
 * and replace with auth checks
 */

const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  {
    path: 'mindhub/frontend/app/page.tsx',
    searchPattern: /const defaultUser = \{[\s\S]*?\};[\s\S]*?localStorage\.setItem\('currentUser', JSON\.stringify\(defaultUser\)\);/g,
    replacement: '// Redirect to login if no user\n      router.push(\'/login\');'
  },
  {
    path: 'mindhub/frontend/app/reports/layout.tsx', 
    searchPattern: /const defaultUser = \{[\s\S]*?\};[\s\S]*?setUser\(defaultUser\);[\s\S]*?localStorage\.setItem\('currentUser', JSON\.stringify\(defaultUser\)\);/g,
    replacement: '// No user found, redirect to login\n      window.location.href = \'/login\';'
  },
  {
    path: 'mindhub/frontend/app/settings/layout.tsx',
    searchPattern: /const defaultUser = \{[\s\S]*?\};[\s\S]*?setUser\(defaultUser\);[\s\S]*?localStorage\.setItem\('currentUser', JSON\.stringify\(defaultUser\)\);/g,
    replacement: '// No user found, redirect to login\n      window.location.href = \'/login\';'
  },
  {
    path: 'mindhub/frontend/components/layout/UnifiedSidebar.tsx',
    searchPattern: /id: 'user-dr-alejandro',[\s\S]*?role: 'professional'/g,
    replacement: 'id: \'\',\n    name: \'Loading...\',\n    email: \'\',\n    role: \'\''
  }
];

console.log('🧹 Removing hardcoded users from frontend...\n');

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file.path);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${file.path}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Apply the replacement
  content = content.replace(file.searchPattern, file.replacement);
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${file.path}`);
  } else {
    console.log(`⏭️  No changes needed: ${file.path}`);
  }
});

console.log('\n✨ Hardcoded users removal complete!');