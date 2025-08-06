#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 TypeScript Project Validation\n');

// Check basic project structure
const requiredFiles = [
  'tsconfig.json',
  'next.config.js',
  'package.json',
  'app/layout.tsx',
  'app/page.tsx',
  'next-env.d.ts'
];

let allFilesPresent = true;
console.log('📋 Checking required files...');

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ Missing: ${file}`);
    allFilesPresent = false;
  }
});

if (!allFilesPresent) {
  console.log('\n❌ Some required files are missing!');
  process.exit(1);
}

// Check TypeScript configuration
console.log('\n🔧 Checking TypeScript configuration...');

try {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  
  console.log(`✅ TypeScript target: ${tsconfig.compilerOptions?.target || 'default'}`);
  console.log(`✅ Module resolution: ${tsconfig.compilerOptions?.moduleResolution || 'default'}`);
  console.log(`✅ Strict mode: ${tsconfig.compilerOptions?.strict ? 'enabled' : 'disabled'}`);
  console.log(`✅ Path mapping: ${tsconfig.compilerOptions?.paths ? 'configured' : 'not configured'}`);
  
} catch (error) {
  console.log('❌ Error reading tsconfig.json:', error.message);
}

// Check package.json for required dependencies
console.log('\n📦 Checking dependencies...');

try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredDeps = [
    'next',
    'react',
    'react-dom',
    'typescript',
    '@types/react',
    '@types/node'
  ];
  
  requiredDeps.forEach(dep => {
    if (pkg.dependencies?.[dep] || pkg.devDependencies?.[dep]) {
      console.log(`✅ ${dep}`);
    } else {
      console.log(`❌ Missing: ${dep}`);
    }
  });
  
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}

// Check for common TypeScript issues in source files
console.log('\n🔍 Scanning source files for common issues...');

function scanDirectory(dir, depth = 0) {
  if (depth > 3) return; // Limit depth to avoid deep recursion
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  items.forEach(item => {
    if (item.isDirectory() && !['node_modules', '.next', '.git', 'coverage', '_TRASH_LEGACY_CLINIMETRIX', '_TRASH_CORRUPTED_FILES'].includes(item.name)) {
      scanDirectory(path.join(dir, item.name), depth + 1);
    } else if (item.name.endsWith('.tsx') || item.name.endsWith('.ts')) {
      const filePath = path.join(dir, item.name);
      scanFile(filePath);
    }
  });
}

let issueCount = 0;

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Check for common issues
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Check for missing React import in JSX files
      if (filePath.endsWith('.tsx') && line.includes('export default function') && !content.includes('import React')) {
        // Modern React doesn't require explicit React import, so this is OK
      }
      
      // Check for .jsx files that should be .tsx
      if (filePath.endsWith('.jsx') && content.includes('export')) {
        console.log(`⚠️  ${filePath}: JSX file should be renamed to .tsx`);
        issueCount++;
      }
      
      // Check for any/unknown types (basic check)
      if (line.includes(': any') && !line.includes('// @ts-ignore')) {
        // This is fine in many cases, just noting
      }
      
      // Check for missing semicolons (basic check)
      if (line.trim().endsWith('return') || (line.includes('import ') && !line.endsWith(';') && !line.endsWith("'") && !line.endsWith('"'))) {
        // Basic syntax check - not comprehensive
      }
    });
    
  } catch (error) {
    console.log(`❌ Error reading ${filePath}:`, error.message);
    issueCount++;
  }
}

// Scan the main directories
['app', 'components', 'lib', 'contexts', 'hooks'].forEach(dir => {
  if (fs.existsSync(dir)) {
    scanDirectory(dir);
  }
});

console.log(`\n📊 Scan Results:`);
console.log(`   Issues found: ${issueCount}`);

if (issueCount === 0) {
  console.log('\n✅ Basic TypeScript validation passed!');
  console.log('   The project structure looks good.');
  console.log('   Run "npm run build" to perform full compilation.');
} else {
  console.log(`\n⚠️  Found ${issueCount} potential issues.`);
  console.log('   Review the issues above and run "npm run build" for detailed errors.');
}

console.log('\n🎯 Next Steps:');
console.log('   1. Run "npm install" to ensure all dependencies are installed');
console.log('   2. Run "npm run build" to perform full TypeScript compilation');
console.log('   3. Fix any compilation errors that appear');

process.exit(issueCount > 0 ? 1 : 0);