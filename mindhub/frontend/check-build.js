#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Checking TypeScript compilation...\n');

try {
  // Remove any existing build artifacts
  if (fs.existsSync('.next')) {
    console.log('🧹 Cleaning previous build...');
    execSync('rm -rf .next', { stdio: 'inherit' });
  }

  // Run TypeScript compilation check
  console.log('⏳ Running TypeScript compilation check...');
  execSync('npx tsc --noEmit --pretty', { 
    stdio: 'inherit',
    timeout: 120000 // 2 minutes timeout
  });
  
  console.log('✅ TypeScript compilation successful!');
  
  // If TypeScript passes, try a build
  console.log('\n⏳ Running Next.js build...');
  execSync('npm run build', { 
    stdio: 'inherit',
    timeout: 300000 // 5 minutes timeout
  });
  
  console.log('🎉 Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:');
  console.error(error.message);
  
  if (error.stdout) {
    console.log('\n--- STDOUT ---');
    console.log(error.stdout.toString());
  }
  
  if (error.stderr) {
    console.log('\n--- STDERR ---');
    console.log(error.stderr.toString());
  }
  
  process.exit(1);
}