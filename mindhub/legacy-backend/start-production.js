#!/usr/bin/env node

/**
 * Production startup script for Railway deployment
 * Simplified version that ensures Prisma is ready before starting server
 */

const { spawn } = require('child_process');
const path = require('path');

// Production environment check
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET'
];

console.log('🚀 MindHub Backend - Production Startup');
console.log('=====================================');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT || 3002);

// Check environment variables
console.log('🔍 Checking required environment variables...');
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

console.log('✅ All required environment variables are present');

// Generate Prisma client first
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
        console.log('✅ Prisma client generated successfully');
        resolve();
      } else {
        console.error('❌ Failed to generate Prisma client');
        reject(new Error('Prisma generation failed'));
      }
    });

    generate.on('error', (error) => {
      console.error('❌ Prisma generate error:', error);
      reject(error);
    });
  });
}

// Push database schema (safer than migrations in production)
function pushDatabaseSchema() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Synchronizing database schema...');
    
    const push = spawn('npx', ['prisma', 'db', 'push', '--accept-data-loss'], {
      stdio: 'inherit',
      env: process.env,
      cwd: __dirname
    });

    push.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Database schema synchronized');
        resolve();
      } else {
        console.log('⚠️ Database push failed, but continuing...');
        resolve(); // Continue anyway, the database might already be set up
      }
    });

    push.on('error', (error) => {
      console.error('⚠️ Database push error:', error);
      resolve(); // Continue anyway
    });
  });
}

// Start the main server
function startServer() {
  console.log('🌟 Starting MindHub server...');
  console.log('Working directory:', __dirname);
  
  // Use node directly to run server.js
  require('./server.js');
}

// Main startup sequence
async function startup() {
  try {
    // Generate Prisma client first
    await generatePrismaClient();
    
    // Try to sync database schema
    await pushDatabaseSchema();
    
    // Start the server
    startServer();
    
  } catch (error) {
    console.error('❌ Startup failed:', error.message);
    process.exit(1);
  }
}

// Run startup sequence
startup();