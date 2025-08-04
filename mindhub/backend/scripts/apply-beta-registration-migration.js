#!/usr/bin/env node

/**
 * Apply Beta Registration Migration
 * Adds new fields to beta_registrations table
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 8889,
  user: 'root',
  password: 'root',
  database: 'mindhub_dev',
  multipleStatements: true
};

async function applyMigration() {
  console.log('🚀 Aplicando migración de campos adicionales para BetaRegistration...\n');

  let connection;

  try {
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a MySQL (MAMP)\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '005_expand_beta_registration_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute migration
    console.log('📝 Ejecutando migración...');
    await connection.execute(migrationSQL);
    console.log('✅ Migración aplicada exitosamente\n');

    // Verify changes
    console.log('🔍 Verificando cambios...');
    const [rows] = await connection.execute('DESCRIBE beta_registrations');
    
    console.log('📊 Estructura actual de beta_registrations:');
    console.table(rows.map(row => ({
      Field: row.Field,
      Type: row.Type,
      Null: row.Null,
      Key: row.Key,
      Default: row.Default
    })));

    console.log('\n✅ ¡Migración completada exitosamente!');
    console.log('\n📝 Nuevos campos agregados:');
    console.log('   - city (VARCHAR)');
    console.log('   - country (VARCHAR)');
    console.log('   - howDidYouHear (VARCHAR)');
    console.log('   - yearsOfPractice (VARCHAR)');
    console.log('   - specialization (VARCHAR)');
    console.log('   - expectations (TEXT)');

  } catch (error) {
    console.error('❌ Error aplicando migración:', error.message);
    
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('\n⚠️  Los campos ya existen en la tabla. Migración no necesaria.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Asegúrate de que MAMP esté ejecutándose y MySQL esté disponible en puerto 8889');
    } else {
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Run migration
applyMigration();