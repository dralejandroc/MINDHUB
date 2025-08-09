#!/usr/bin/env node

/**
 * Simplified production startup for Railway
 * Avoids Prisma operations during startup that might cause container to fail
 */

const { spawn } = require('child_process');

console.log('🚀 MindHub Backend - Simplified Production Startup');
console.log('=====================================');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT || 3002);

// Check critical environment variables only
if (!process.env.DATABASE_URL) {
  console.error('❌ Missing DATABASE_URL');
  process.exit(1);
}

console.log('✅ DATABASE_URL configured');

// Generate Prisma client if needed
function generatePrismaClient() {
  return new Promise((resolve, reject) => {
    console.log('🔧 Generating Prisma client...');
    
    const generate = spawn('npx', ['prisma', 'generate'], {
      stdio: 'inherit',
      env: process.env,
      cwd: __dirname
    });

    generate.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Prisma client ready');
        resolve();
      } else {
        console.log('⚠️ Prisma generate failed, but continuing...');
        resolve(); // Continue anyway
      }
    });

    generate.on('error', (error) => {
      console.log('⚠️ Prisma generate error, but continuing...');
      resolve(); // Continue anyway
    });
  });
}

// Start server directly
function startServer() {
  console.log('🌟 Starting server directly...');
  require('./server.js');
}

// Main startup
async function startup() {
  try {
    // Try to generate Prisma client but don't fail if it doesn't work
    await generatePrismaClient();
    
    // Start server immediately
    startServer();
    
  } catch (error) {
    console.log('⚠️ Error during startup, but continuing:', error.message);
    // Start server anyway
    startServer();
  }
}

startup();