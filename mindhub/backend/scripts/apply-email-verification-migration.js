const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function applyEmailVerificationMigration() {
  let connection;

  try {
    // Database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'caboose.proxy.rlwy.net',
      port: process.env.DB_PORT || 41591,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'mindhub'
    });

    console.log('✅ Database connection established');

    // Check if migration has already been applied
    try {
      await connection.execute('SELECT emailVerified FROM users LIMIT 1');
      console.log('⚠️  Migration appears to already be applied - emailVerified column exists');
      return;
    } catch (error) {
      console.log('📦 Migration needed - applying email verification fields...');
    }

    // Read and execute migration
    const migrationPath = path.join(__dirname, '../database/migrations/008_add_email_verification_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by statements and execute each one
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.trim().substring(0, 50)}...`);
        await connection.execute(statement.trim());
      }
    }

    console.log('✅ Email verification migration applied successfully');

    // Test the new columns
    const [rows] = await connection.execute('DESCRIBE users');
    const hasEmailVerified = rows.some(row => row.Field === 'emailVerified');
    const hasEmailVerificationToken = rows.some(row => row.Field === 'emailVerificationToken');
    const hasEmailVerifiedAt = rows.some(row => row.Field === 'emailVerifiedAt');

    console.log('🔍 Column verification:');
    console.log(`  - emailVerified: ${hasEmailVerified ? '✅' : '❌'}`);
    console.log(`  - emailVerificationToken: ${hasEmailVerificationToken ? '✅' : '❌'}`);
    console.log(`  - emailVerifiedAt: ${hasEmailVerifiedAt ? '✅' : '❌'}`);

  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('📦 Database connection closed');
    }
  }
}

// Execute migration
applyEmailVerificationMigration();