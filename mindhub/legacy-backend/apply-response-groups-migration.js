/**
 * Apply response groups migration to support multi-option scales like STAI
 */

const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('🔧 Applying response groups migration...');
    
    // Add response_group to scale_items
    await prisma.$executeRawUnsafe(`
      ALTER TABLE scale_items 
      ADD COLUMN response_group VARCHAR(50) NULL AFTER subscale
    `);
    console.log('✅ Added response_group to scale_items');
    
    // Add index
    await prisma.$executeRawUnsafe(`
      ALTER TABLE scale_items 
      ADD INDEX idx_scale_items_response_group (scale_id, response_group)
    `);
    console.log('✅ Added index to scale_items.response_group');
    
    // Add response_group to scale_response_options
    await prisma.$executeRawUnsafe(`
      ALTER TABLE scale_response_options
      ADD COLUMN response_group VARCHAR(50) NULL AFTER scale_id
    `);
    console.log('✅ Added response_group to scale_response_options');
    
    // Add index
    await prisma.$executeRawUnsafe(`
      ALTER TABLE scale_response_options
      ADD INDEX idx_scale_response_options_group (scale_id, response_group)
    `);
    console.log('✅ Added index to scale_response_options.response_group');
    
    // Create response_groups table (without foreign key for now)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS scale_response_groups (
        id VARCHAR(100) PRIMARY KEY,
        scale_id VARCHAR(50) NOT NULL,
        group_key VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        UNIQUE KEY uk_scale_group (scale_id, group_key),
        INDEX idx_scale_response_groups_scale (scale_id)
      )
    `);
    console.log('✅ Created scale_response_groups table');
    
    console.log('🎉 Response groups migration completed successfully!');
    
  } catch (error) {
    if (error.message.includes('Duplicate column name') || error.message.includes('already applied')) {
      console.log('⚠️  Columns already exist, trying table creation...');
      
      try {
        // Try creating just the table
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS scale_response_groups (
            id VARCHAR(100) PRIMARY KEY,
            scale_id VARCHAR(50) NOT NULL,
            group_key VARCHAR(50) NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            display_order INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            UNIQUE KEY uk_scale_group (scale_id, group_key),
            INDEX idx_scale_response_groups_scale (scale_id)
          )
        `);
        console.log('✅ Created scale_response_groups table');
      } catch (tableError) {
        if (tableError.message.includes('already exists')) {
          console.log('✅ scale_response_groups table already exists');
        } else {
          console.error('❌ Error creating table:', tableError.message);
        }
      }
    } else {
      console.error('❌ Error applying migration:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();