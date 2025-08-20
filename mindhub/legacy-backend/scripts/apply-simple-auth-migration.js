#!/usr/bin/env node

/**
 * Apply Simple Auth Migration
 * Adds support for simple authentication without Auth0
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function applyMigration() {
  let connection;
  
  try {
    console.log('🚀 Starting Simple Auth Migration...');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 8889,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'mindhub'
    });

    console.log('✅ Database connection established');

    // Read migration file
    const migrationPath = path.join(__dirname, '../database/migrations/004_add_simple_auth_support.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}`);
        await connection.execute(statement);
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        // Some statements might fail if columns/tables already exist - that's OK
        if (error.code === 'ER_DUP_FIELDNAME' || 
            error.code === 'ER_TABLE_EXISTS_ERROR' ||
            error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  Statement ${i + 1} skipped (already exists): ${error.message}`);
        } else {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          console.error('Statement:', statement);
          throw error;
        }
      }
    }

    // Test the new schema
    console.log('🧪 Testing new schema...');
    
    // Check if new columns exist
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' 
      AND COLUMN_NAME IN ('password', 'organizationId', 'accountType', 'isActive', 'isBetaUser')
    `, [process.env.DB_NAME || 'mindhub']);
    
    console.log('📋 New user columns found:', columns.map(c => c.COLUMN_NAME));

    // Check if new tables exist
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('organizations', 'auth_sessions', 'beta_registrations')
    `, [process.env.DB_NAME || 'mindhub']);
    
    console.log('📋 New tables found:', tables.map(t => t.TABLE_NAME));

    // Check roles
    const [roles] = await connection.execute('SELECT COUNT(*) as count FROM roles');
    console.log(`📋 Total roles in database: ${roles[0].count}`);

    console.log('✅ Simple Auth Migration completed successfully!');
    console.log('');
    console.log('🎉 Your database is now ready for the new authentication system');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update your backend to use the new auth system');
    console.log('2. Test login/registration functionality');
    console.log('3. Deploy to production');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run migration
if (require.main === module) {
  applyMigration().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { applyMigration };