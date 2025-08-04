#!/usr/bin/env node

/**
 * Pre-deployment Checklist for MindHub Beta
 * Verifies that everything is ready for production deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 MindHub Beta - Pre-Deployment Checklist\n');

let errors = 0;
let warnings = 0;

function checkError(condition, message) {
  if (!condition) {
    console.log('❌', message);
    errors++;
  } else {
    console.log('✅', message);
  }
}

function checkWarning(condition, message) {
  if (!condition) {
    console.log('⚠️ ', message);
    warnings++;
  } else {
    console.log('✅', message);
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function hasContent(filePath, content) {
  if (!fileExists(filePath)) return false;
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return fileContent.includes(content);
}

console.log('📁 Checking File Structure...');
checkError(fileExists('frontend/package.json'), 'Frontend package.json exists');
checkError(fileExists('backend/package.json'), 'Backend package.json exists');
checkError(fileExists('frontend/app/page.tsx'), 'Landing page exists');
checkError(fileExists('frontend/app/login/page.tsx'), 'Login page exists');
checkError(fileExists('frontend/app/register/page.tsx'), 'Register page exists');
checkError(fileExists('frontend/app/app/page.tsx'), 'App homepage exists');
checkError(fileExists('DEPLOYMENT_PLAN_BETA.md'), 'Deployment plan exists');
checkError(fileExists('BRAND_GUIDELINES.md'), 'Brand guidelines exist');

console.log('\n🔐 Checking Authentication System...');
checkError(fileExists('backend/shared/services/auth-service.js'), 'Auth service exists');
checkError(fileExists('backend/shared/routes/simple-auth.js'), 'Auth routes exist');
checkError(fileExists('backend/database/migrations/004_add_simple_auth_support.sql'), 'Auth migration exists');
checkError(fileExists('backend/scripts/apply-simple-auth-migration.js'), 'Migration script exists');

console.log('\n📱 Checking Frontend Components...');
checkError(fileExists('frontend/components/landing/LandingNavbar.tsx'), 'Landing navbar exists');
checkError(fileExists('frontend/components/landing/HeroSection.tsx'), 'Hero section exists');
checkError(fileExists('frontend/components/landing/FeaturesSection.tsx'), 'Features section exists');
checkError(fileExists('frontend/components/landing/PlansSection.tsx'), 'Plans section exists');
checkError(fileExists('frontend/components/landing/BetaRegistrationModal.tsx'), 'Beta modal exists');
checkError(fileExists('frontend/components/landing/Footer.tsx'), 'Footer exists');

console.log('\n🌐 Checking API Routes...');
checkError(fileExists('frontend/app/api/auth/login/route.ts'), 'Login API route exists');
checkError(fileExists('frontend/app/api/auth/register/route.ts'), 'Register API route exists');
checkError(fileExists('frontend/app/api/auth/logout/route.ts'), 'Logout API route exists');
checkError(fileExists('frontend/app/api/auth/beta-register/route.ts'), 'Beta register API route exists');

console.log('\n⚙️  Checking Configuration...');
checkError(fileExists('.env.production.example'), 'Production env example exists');
checkError(fileExists('.env.development.example'), 'Development env example exists');
checkWarning(fileExists('frontend/.env.local'), 'Frontend local env exists (optional)');
checkWarning(fileExists('backend/.env'), 'Backend env exists (optional)');

console.log('\n🎨 Checking Brand Assets...');
checkError(hasContent('frontend/tailwind.config.js', 'primary-blue'), 'Brand colors in Tailwind config');
checkError(hasContent('BRAND_GUIDELINES.md', 'MindHub'), 'Brand guidelines have content');

console.log('\n🚫 Checking Auth0 Removal...');
checkError(!hasContent('frontend/app/layout.tsx', 'auth0'), 'Auth0 removed from layout');
checkError(!hasContent('frontend/components/layout/MainLayout.tsx', 'auth0'), 'Auth0 removed from MainLayout');
checkWarning(!hasContent('backend/server.js', 'auth0'), 'Auth0 references removed from server');

console.log('\n📦 Checking MVP Modules...');
checkError(hasContent('frontend/components/layout/UnifiedSidebar.tsx', 'ClinimetrixPro'), 'ClinimetrixPro in sidebar');
checkError(!hasContent('frontend/components/layout/UnifiedSidebar.tsx', "'formx'"), 'FormX removed from sidebar navigation');
checkError(hasContent('frontend/components/layout/UnifiedSidebar.tsx', 'Expedix'), 'Expedix in sidebar');
checkError(hasContent('frontend/components/layout/UnifiedSidebar.tsx', 'Resources'), 'Resources in sidebar');
checkError(hasContent('frontend/components/layout/UnifiedSidebar.tsx', 'Finance'), 'Finance in sidebar');
checkError(hasContent('frontend/components/layout/UnifiedSidebar.tsx', 'FrontDesk'), 'FrontDesk in sidebar');

console.log('\n🗃️  Checking Database Schema...');
checkError(hasContent('backend/prisma/schema.prisma', 'Organization'), 'Organization model in schema');
checkError(hasContent('backend/prisma/schema.prisma', 'AuthSession'), 'AuthSession model in schema');
checkError(hasContent('backend/prisma/schema.prisma', 'BetaRegistration'), 'BetaRegistration model in schema');
checkError(hasContent('backend/prisma/schema.prisma', 'password'), 'Password field in User model');

console.log('\n📚 Checking Documentation...');
checkError(fileExists('DEPLOYMENT_README.md'), 'Deployment README exists');
checkError(hasContent('DEPLOYMENT_README.md', 'Railway'), 'Deployment guide mentions Railway');
checkError(hasContent('DEPLOYMENT_README.md', 'Vercel'), 'Deployment guide mentions Vercel');

console.log('\n📊 Summary');
console.log('='.repeat(50));

if (errors === 0 && warnings === 0) {
  console.log('🎉 Perfect! Everything is ready for deployment');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run migration: node backend/scripts/apply-simple-auth-migration.js');
  console.log('2. Test locally: npm run dev (frontend) + npm start (backend)');
  console.log('3. Deploy to Vercel + Railway');
  console.log('4. Configure production environment variables');
  process.exit(0);
} else if (errors === 0) {
  console.log(`⚠️  Ready with ${warnings} warnings`);
  console.log('');
  console.log('You can proceed with deployment, but consider addressing the warnings.');
  process.exit(0);
} else {
  console.log(`❌ Not ready: ${errors} errors, ${warnings} warnings`);
  console.log('');
  console.log('Please fix the errors before deployment.');
  process.exit(1);
}