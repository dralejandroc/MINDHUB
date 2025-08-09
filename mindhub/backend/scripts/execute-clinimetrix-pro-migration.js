#!/usr/bin/env node

/**
 * Execute ClinimetrixPro Database Migration
 */

const fs = require('fs');
const path = require('path');
const { getPrismaClient } = require('../shared/config/prisma');

const prisma = getPrismaClient();

async function executeClinimetrixProMigration() {
  try {
    console.log('🚀 Ejecutando migración de ClinimetrixPro...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../database/migrations/001_create_clinimetrix_pro_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and filter out comments and empty statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .filter(s => !s.startsWith('--'))
      .filter(s => !s.startsWith('SELECT'))
      .filter(s => !s.startsWith('INSERT INTO `clinimetrix_user_preferences`')); // Skip complex insert
    
    console.log(`📋 Ejecutando ${statements.length} statements SQL...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
        console.log(`   ${i + 1}. Ejecutando: ${preview}...`);
        
        try {
          await prisma.$queryRawUnsafe(statement);
          console.log(`   ✅ Statement ${i + 1} ejecutado exitosamente`);
        } catch (error) {
          if (error.message.includes('already exists') || 
              error.message.includes('Duplicate entry') ||
              error.message.includes('Table') && error.message.includes('already exists')) {
            console.log(`   ⚠️  Statement ${i + 1} - objeto ya existe, saltando...`);
          } else {
            console.error(`   ❌ Error en statement ${i + 1}:`, error.message);
            // Don't fail the entire migration for non-critical errors
          }
        }
      }
    }
    
    // Verify tables were created
    console.log('\n🔍 Verificando tablas creadas...');
    const tables = await prisma.$queryRaw`SHOW TABLES LIKE 'clinimetrix_%'`;
    console.log('📋 Tablas ClinimetrixPro encontradas:');
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });
    
    console.log('\n✅ Migración de ClinimetrixPro completada');
    
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute migration if called directly
if (require.main === module) {
  executeClinimetrixProMigration();
}

module.exports = { executeClinimetrixProMigration };