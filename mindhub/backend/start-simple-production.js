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

// Skip Prisma generation in Railway - assume it's already done in build phase
function skipPrismaGeneration() {
  return new Promise((resolve) => {
    console.log('⏭️ Skipping Prisma generation in production startup');
    console.log('✅ Assuming Prisma client is ready from build phase');
    resolve();
  });
}

// Start server directly
function startServer() {
  console.log('🌟 Starting server directly...');
  require('./server.js');
}

// Main startup - simplified for Railway
async function startup() {
  try {
    // Skip Prisma generation to avoid Railway timeout
    await skipPrismaGeneration();
    
    // Start server immediately
    startServer();
    
  } catch (error) {
    console.log('⚠️ Error during startup, but continuing:', error.message);
    // Start server anyway
    startServer();
  }
}

startup();