#!/usr/bin/env node

/**
 * Migrate Local Database to Railway MySQL
 * This script migrates the complete MindHub database from local MAMP to Railway
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { execSync } = require('child_process');

// Database configurations
const localDbConfig = {
  host: 'localhost',
  port: 8889,
  user: 'root',
  password: 'root',
  database: 'mindhub',
  multipleStatements: true
};

const railwayDbConfig = {
  host: 'mysql.railway.internal',
  port: 3306,
  user: 'root',
  password: 'levBZLcxUaSGcMdTKSnloHHzFIgSOEay',
  database: 'railway',
  multipleStatements: true
};

// Railway external connection (obtained from dashboard)
const railwayExternalConfig = {
  host: 'caboose.proxy.rlwy.net',
  port: 41591,
  user: 'root',
  password: 'levBZLcxUaSGcMdTKSnloHHzFIgSOEay',
  database: 'railway',
  multipleStatements: true
};

async function testConnections() {
  console.log('🧪 Testing database connections...\n');
  
  try {
    // Test local connection
    const localConnection = await mysql.createConnection(localDbConfig);
    console.log('✅ Local MAMP connection successful');
    await localConnection.end();
    
    // Test Railway connection (we'll need to use external endpoint)
    console.log('🚂 Testing Railway connection...');
    console.log('ℹ️  Note: Railway internal host only works from Railway services');
    console.log('   We need the external connection details from Railway dashboard');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    throw error;
  }
}

async function dumpLocalDatabase() {
  console.log('\n📦 Creating database dump from local MAMP...');
  
  const dumpPath = path.join(__dirname, '..', 'database', 'mindhub_production_dump.sql');
  
  try {
    // Create dump using MAMP's mysqldump
    const mampMysqlDumpPath = '/Applications/MAMP/Library/bin/mysql80/bin/mysqldump';
    
    if (!fs.existsSync(mampMysqlDumpPath)) {
      throw new Error('MAMP mysqldump not found. Please check MAMP installation.');
    }
    
    console.log('🔧 Using MAMP mysqldump...');
    execSync(`"${mampMysqlDumpPath}" -h localhost -P 8889 -u root -proot --single-transaction --routines --triggers mindhub > "${dumpPath}"`, {
      stdio: 'pipe'
    });
    
    console.log(`✅ Database dump created: ${dumpPath}`);
    
    // Check dump file size
    const stats = fs.statSync(dumpPath);
    console.log(`📊 Dump file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    return dumpPath;
    
  } catch (error) {
    console.error('❌ Failed to create database dump:', error.message);
    throw error;
  }
}

async function getRailwayExternalEndpoint() {
  console.log('\n🔍 Railway External Connection Required');
  console.log('📋 To get the external connection details:');
  console.log('   1. Go to your Railway project dashboard');
  console.log('   2. Click on your MySQL service');
  console.log('   3. Go to "Connect" tab');
  console.log('   4. Look for "Public Networking" or external endpoint');
  console.log('   5. Copy the external host and port');
  console.log('');
  console.log('🔗 The connection will look like:');
  console.log('   Host: viaduct.proxy.rlwy.net (or similar)');
  console.log('   Port: 12345 (5-digit port number)');
  console.log('');
  console.log('⏸️  Script paused - please get external connection details and update the script');
  
  return null;
}

async function importToRailway(dumpPath) {
  console.log('\n🚂 Importing database to Railway...');
  
  const railwayConfig = railwayExternalConfig;
  
  try {
    const connection = await mysql.createConnection(railwayConfig);
    console.log('✅ Connected to Railway MySQL');
    
    // Read the dump file
    const dumpContent = fs.readFileSync(dumpPath, 'utf8');
    console.log('📖 Reading dump file...');
    
    // Execute the dump (this might take a while)
    console.log('⚡ Importing data to Railway (this may take several minutes)...');
    await connection.execute(dumpContent);
    
    console.log('✅ Database successfully imported to Railway!');
    
    // Verify import
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`📊 Imported ${tables.length} tables`);
    
    // Check scales count
    const [scalesCount] = await connection.execute('SELECT COUNT(*) as count FROM scales');
    console.log(`🧠 Clinical scales in production: ${scalesCount[0].count}`);
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Failed to import to Railway:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 MindHub Database Migration to Railway');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Test connections
    await testConnections();
    
    // Step 2: Create local dump
    const dumpPath = await dumpLocalDatabase();
    
    // Step 3: Get Railway external endpoint info
    await getRailwayExternalEndpoint();
    
    console.log('\n📝 Next Steps:');
    console.log('1. Get Railway external connection details from dashboard');
    console.log('2. Update this script with external host and port');
    console.log('3. Run: node scripts/migrate-to-railway.js --import');
    console.log('');
    console.log('💾 Your database dump is ready at:', dumpPath);
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// Check for import flag
if (process.argv.includes('--import')) {
  // Import mode - run the import directly
  const dumpPath = path.join(__dirname, '..', 'database', 'mindhub_production_dump.sql');
  
  if (!fs.existsSync(dumpPath)) {
    console.error('❌ Dump file not found. Run without --import flag first to create dump.');
    process.exit(1);
  }
  
  console.log('🚂 Starting Railway import process...');
  importToRailway(dumpPath).catch(error => {
    console.error('💥 Import failed:', error.message);
    process.exit(1);
  });
  
} else {
  main();
}