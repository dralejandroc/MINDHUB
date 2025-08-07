#!/usr/bin/env node

/**
 * Production startup script for Railway deployment
 * Ensures database connectivity and Prisma client is ready
 */

const { spawn } = require('child_process');
const { PrismaClient } = require('./generated/prisma');

// Production environment check
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET'
];

console.log('🚀 MindHub Backend - Production Startup');
console.log('=====================================');

// Check environment variables
console.log('🔍 Checking required environment variables...');
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

console.log('✅ All required environment variables are present');

// Database connection check
async function checkDatabaseConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test a simple query to ensure tables exist
    const userCount = await prisma.user.count();
    console.log(`📊 Found ${userCount} users in database`);
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    if (error.message.includes('does not exist')) {
      console.log('📋 Running database migrations...');
      return runMigrations();
    }
    
    return false;
  }
}

// Run Prisma migrations
function runMigrations() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Applying database migrations...');
    
    const migrate = spawn('npx', ['prisma', 'db', 'push', '--accept-data-loss'], {
      stdio: 'inherit',
      env: process.env
    });

    migrate.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Database migrations completed');
        resolve(true);
      } else {
        console.error('❌ Database migrations failed');
        reject(new Error('Migration failed'));
      }
    });

    migrate.on('error', (error) => {
      console.error('❌ Migration error:', error);
      reject(error);
    });
  });
}

// Start the main server
function startServer() {
  console.log('🌟 Starting MindHub server...');
  
  const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    env: process.env
  });

  server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
    process.exit(code);
  });

  server.on('error', (error) => {
    console.error('Server error:', error);
    process.exit(1);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down server...');
    server.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down server...');
    server.kill('SIGINT');
  });
}

// Main startup sequence
async function startup() {
  try {
    // Check database connection
    const dbConnected = await checkDatabaseConnection();
    
    if (!dbConnected) {
      console.error('❌ Failed to establish database connection');
      process.exit(1);
    }

    // Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    const generate = spawn('npx', ['prisma', 'generate'], {
      stdio: 'inherit',
      env: process.env
    });

    generate.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Prisma client generated successfully');
        startServer();
      } else {
        console.error('❌ Failed to generate Prisma client');
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Startup failed:', error.message);
    process.exit(1);
  }
}

// Run startup sequence
startup();