// Debug file to check Vercel paths
const fs = require('fs');
const path = require('path');

console.log('=== VERCEL PATH DEBUG ===');
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

function checkPath(relativePath) {
  const fullPath = path.join(__dirname, relativePath);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? '✅' : '❌'} ${relativePath} -> ${fullPath}`);
  return exists;
}

console.log('\n=== CHECKING PATHS ===');
checkPath('components');
checkPath('components/layout');
checkPath('components/layout/UnifiedSidebar.tsx');
checkPath('components/dashboard');
checkPath('components/dashboard/DashboardSwitcher.tsx');
checkPath('contexts');
checkPath('contexts/UserMetricsContext.tsx');
checkPath('lib');
checkPath('lib/api');
checkPath('lib/api/remote-assessments-client.ts');

console.log('\n=== TSCONFIG CHECK ===');
checkPath('tsconfig.json');

if (fs.existsSync(path.join(__dirname, 'tsconfig.json'))) {
  try {
    const tsconfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'tsconfig.json'), 'utf8'));
    console.log('TypeScript baseUrl:', tsconfig.compilerOptions?.baseUrl);
    console.log('TypeScript paths:', JSON.stringify(tsconfig.compilerOptions?.paths, null, 2));
  } catch (error) {
    console.log('Error reading tsconfig:', error.message);
  }
}

console.log('\n=== ROOT DIRECTORY CHECK ===');
const rootFiles = fs.readdirSync(__dirname);
console.log('Files in root:', rootFiles.slice(0, 10).join(', '), rootFiles.length > 10 ? '...' : '');

module.exports = {};