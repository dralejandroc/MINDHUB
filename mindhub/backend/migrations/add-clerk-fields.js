/**
 * Migration: Add Clerk Authentication Fields
 * 
 * Adds clerk_user_id and related fields to users table
 * to support Clerk JWT authentication
 */

const { PrismaClient } = require('../generated/prisma');

async function runClerkMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Starting Clerk authentication migration...');
    
    // Check if clerk_user_id column already exists
    const checkColumns = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME IN ('clerk_user_id', 'first_name', 'last_name', 'avatar_url', 'role')
    `;
    
    console.log('Found existing columns:', checkColumns.map(c => c.COLUMN_NAME));
    
    // Add clerk_user_id if it doesn't exist
    if (!checkColumns.find(c => c.COLUMN_NAME === 'clerk_user_id')) {
      await prisma.$queryRaw`
        ALTER TABLE users 
        ADD COLUMN clerk_user_id VARCHAR(255) NULL UNIQUE AFTER auth0Id
      `;
      console.log('✅ Added clerk_user_id column');
    } else {
      console.log('ℹ️  clerk_user_id column already exists');
    }
    
    // Add first_name if it doesn't exist
    if (!checkColumns.find(c => c.COLUMN_NAME === 'first_name')) {
      await prisma.$queryRaw`
        ALTER TABLE users 
        ADD COLUMN first_name VARCHAR(255) NULL AFTER name
      `;
      console.log('✅ Added first_name column');
    } else {
      console.log('ℹ️  first_name column already exists');
    }
    
    // Add last_name if it doesn't exist
    if (!checkColumns.find(c => c.COLUMN_NAME === 'last_name')) {
      await prisma.$queryRaw`
        ALTER TABLE users 
        ADD COLUMN last_name VARCHAR(255) NULL AFTER first_name
      `;
      console.log('✅ Added last_name column');
    } else {
      console.log('ℹ️  last_name column already exists');
    }
    
    // Add avatar_url if it doesn't exist
    if (!checkColumns.find(c => c.COLUMN_NAME === 'avatar_url')) {
      await prisma.$queryRaw`
        ALTER TABLE users 
        ADD COLUMN avatar_url VARCHAR(500) NULL AFTER last_name
      `;
      console.log('✅ Added avatar_url column');
    } else {
      console.log('ℹ️  avatar_url column already exists');
    }
    
    // Add role if it doesn't exist
    if (!checkColumns.find(c => c.COLUMN_NAME === 'role')) {
      await prisma.$queryRaw`
        ALTER TABLE users 
        ADD COLUMN role VARCHAR(50) DEFAULT 'user' AFTER accountType
      `;
      console.log('✅ Added role column');
    } else {
      console.log('ℹ️  role column already exists');
    }
    
    // Add indexes if they don't exist
    try {
      await prisma.$queryRaw`
        CREATE INDEX idx_clerk_user_id ON users(clerk_user_id)
      `;
      console.log('✅ Added clerk_user_id index');
    } catch (e) {
      console.log('ℹ️  clerk_user_id index may already exist');
    }
    
    console.log('🎉 Clerk authentication migration completed successfully');
    
  } catch (error) {
    console.error('❌ Clerk migration failed:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runClerkMigration()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runClerkMigration };