const express = require('express');
const { PrismaClient } = require('../../generated/prisma');
const router = express.Router();

// Admin secret for migrations (change this!)
const ADMIN_SECRET = process.env.ADMIN_MIGRATION_SECRET || 'temp-migration-secret-2025';

// Middleware to protect migration endpoints
const requireAdminSecret = (req, res, next) => {
  const secret = req.headers['x-admin-secret'] || req.query.secret;
  if (secret !== ADMIN_SECRET) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid admin secret'
    });
  }
  next();
};

// Email verification migration endpoint
router.post('/email-verification', requireAdminSecret, async (req, res) => {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Starting email verification migration...');
    
    // Check if columns already exist
    const checkColumns = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME IN ('emailVerified', 'emailVerificationToken', 'emailVerifiedAt')
    `;
    
    if (checkColumns.length === 3) {
      return res.json({
        success: true,
        message: 'Email verification fields already exist',
        alreadyExists: true
      });
    }
    
    console.log('📝 Adding email verification columns...');
    
    // Add emailVerified column
    await prisma.$queryRaw`
      ALTER TABLE users 
      ADD COLUMN emailVerified BOOLEAN DEFAULT FALSE AFTER password
    `;
    
    // Add emailVerificationToken column
    await prisma.$queryRaw`
      ALTER TABLE users 
      ADD COLUMN emailVerificationToken VARCHAR(255) NULL AFTER emailVerified
    `;
    
    // Add emailVerifiedAt column
    await prisma.$queryRaw`
      ALTER TABLE users 
      ADD COLUMN emailVerifiedAt DATETIME NULL AFTER emailVerificationToken
    `;
    
    console.log('📊 Adding index for verification token...');
    
    // Add index for emailVerificationToken
    await prisma.$queryRaw`
      CREATE INDEX idx_email_verification_token ON users(emailVerificationToken)
    `;
    
    console.log('🔄 Updating existing users...');
    
    // Set existing users as verified (they were created before verification system)
    await prisma.$queryRaw`
      UPDATE users 
      SET emailVerified = TRUE, emailVerifiedAt = NOW() 
      WHERE emailVerified IS NULL OR emailVerified = FALSE
    `;
    
    console.log('✅ Email verification migration completed successfully');
    
    // Verify the migration worked
    const updatedColumns = await prisma.$queryRaw`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME IN ('emailVerified', 'emailVerificationToken', 'emailVerifiedAt')
      ORDER BY ORDINAL_POSITION
    `;
    
    const userCount = await prisma.users.count();
    const verifiedCount = await prisma.users.count({
      where: { emailVerified: true }
    });
    
    res.json({
      success: true,
      message: 'Email verification migration completed successfully',
      details: {
        columnsAdded: updatedColumns,
        totalUsers: userCount,
        verifiedUsers: verifiedCount,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  } finally {
    await prisma.$disconnect();
  }
});

// Check migration status
router.get('/status', requireAdminSecret, async (req, res) => {
  const prisma = new PrismaClient();
  
  try {
    // Check if email verification columns exist
    const columns = await prisma.$queryRaw`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME IN ('emailVerified', 'emailVerificationToken', 'emailVerifiedAt')
    `;
    
    const hasEmailVerification = columns.length === 3;
    
    let userStats = null;
    if (hasEmailVerification) {
      const totalUsers = await prisma.users.count();
      const verifiedUsers = await prisma.users.count({
        where: { emailVerified: true }
      });
      const pendingUsers = await prisma.users.count({
        where: { emailVerified: false }
      });
      
      userStats = {
        totalUsers,
        verifiedUsers,
        pendingUsers
      };
    }
    
    res.json({
      emailVerificationMigration: {
        status: hasEmailVerification ? 'completed' : 'pending',
        columns: columns,
        userStats
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Status check failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
});

module.exports = router;