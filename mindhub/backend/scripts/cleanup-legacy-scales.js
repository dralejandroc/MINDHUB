#!/usr/bin/env node

/**
 * Clean up Legacy Scales System
 * Removes all legacy scales tables - ClinimetrixPro is now the ONLY system
 */

const { getPrismaClient } = require('../shared/config/prisma');
const prisma = getPrismaClient();

async function cleanupLegacyTables() {
  try {
    console.log('🗑️  Eliminando tablas del sistema legacy de escalas...');
    
    const legacyTables = [
      'scales', 
      'scale_items', 
      'scale_response_options', 
      'scale_subscales',
      'scale_interpretation_rules',
      'scale_response_groups',
      'scale_item_specific_options',
      'scale_subscale_scores',
      'scale_administrations',
      'scale_documentation',
      'user_favorite_scales'
    ];
    
    // Disable foreign key checks to allow dropping tables
    await prisma.$queryRaw`SET FOREIGN_KEY_CHECKS = 0`;
    
    for (const table of legacyTables) {
      try {
        await prisma.$queryRawUnsafe(`DROP TABLE IF EXISTS \`${table}\``);
        console.log(`   ✅ Eliminada: ${table}`);
      } catch (error) {
        if (!error.message.includes("doesn't exist")) {
          console.log(`   ⚠️  Error eliminando ${table}: ${error.message}`);
        } else {
          console.log(`   ℹ️  ${table} no existía`);
        }
      }
    }
    
    // Re-enable foreign key checks
    await prisma.$queryRaw`SET FOREIGN_KEY_CHECKS = 1`;
    
    // Verify remaining tables
    console.log('\n🔍 Verificando tablas restantes...');
    const tables = await prisma.$queryRaw`SHOW TABLES`;
    const clinimetrixTables = tables.filter(table => 
      Object.values(table)[0].includes('clinimetrix')
    );
    
    console.log('📋 Tablas ClinimetrixPro activas:');
    clinimetrixTables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });
    
    console.log('\n🧹 Sistema legacy eliminado completamente');
    console.log('✅ Solo ClinimetrixPro permanece activo');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  cleanupLegacyTables();
}

module.exports = { cleanupLegacyTables };