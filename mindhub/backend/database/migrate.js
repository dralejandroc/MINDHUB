/**
 * SISTEMA DE MIGRACIONES PARA ESCALAS UNIVERSALES
 * Script para ejecutar migraciones y seeds de forma automática
 */

const fs = require('fs');
const path = require('path');
const dbConnection = require('./connection');

class MigrationRunner {
  constructor() {
    this.migrationsDir = path.join(__dirname, 'migrations');
    this.seedsDir = path.join(__dirname, 'seeds');
  }

  /**
   * Ejecuta todas las migraciones pendientes
   */
  async runMigrations() {
    try {
      console.log('🚀 Iniciando migraciones...');
      
      // Conectar a la base de datos
      await dbConnection.connect();
      
      // Crear tabla de migraciones si no existe
      await this.createMigrationsTable();
      
      // Obtener migraciones ejecutadas
      const executedMigrations = await this.getExecutedMigrations();
      
      // Obtener archivos de migración
      const migrationFiles = fs.readdirSync(this.migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
      
      // Ejecutar migraciones pendientes
      for (const file of migrationFiles) {
        if (!executedMigrations.includes(file)) {
          await this.runMigration(file);
        }
      }
      
      console.log('✅ Migraciones completadas');
      
    } catch (error) {
      console.error('❌ Error ejecutando migraciones:', error);
      throw error;
    }
  }

  /**
   * Ejecuta seeds específicos
   */
  async runSeeds(seedFiles = []) {
    try {
      console.log('🌱 Iniciando seeds...');
      
      // Conectar a la base de datos
      await dbConnection.connect();
      
      // Si no se especifican seeds, ejecutar todos
      if (seedFiles.length === 0) {
        seedFiles = fs.readdirSync(this.seedsDir)
          .filter(file => file.endsWith('.sql'))
          .sort();
      }
      
      // Ejecutar seeds
      for (const file of seedFiles) {
        await this.runSeed(file);
      }
      
      console.log('✅ Seeds completados');
      
    } catch (error) {
      console.error('❌ Error ejecutando seeds:', error);
      throw error;
    }
  }

  /**
   * Crea la tabla de control de migraciones
   */
  async createMigrationsTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await dbConnection.run(sql);
  }

  /**
   * Obtiene las migraciones ya ejecutadas
   */
  async getExecutedMigrations() {
    try {
      const result = await dbConnection.query('SELECT migration_name FROM schema_migrations');
      return result.map(row => row.migration_name);
    } catch (error) {
      // Si la tabla no existe, devolver array vacío
      return [];
    }
  }

  /**
   * Ejecuta una migración específica
   */
  async runMigration(filename) {
    try {
      console.log(`📄 Ejecutando migración: ${filename}`);
      
      const filePath = path.join(this.migrationsDir, filename);
      const migrationSQL = fs.readFileSync(filePath, 'utf8');
      
      // Ejecutar migración
      await dbConnection.runMigration(migrationSQL);
      
      // Registrar migración ejecutada
      await dbConnection.run(
        'INSERT INTO schema_migrations (migration_name) VALUES (?)',
        [filename]
      );
      
      console.log(`✅ Migración completada: ${filename}`);
      
    } catch (error) {
      console.error(`❌ Error en migración ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Ejecuta un seed específico
   */
  async runSeed(filename) {
    try {
      console.log(`🌱 Ejecutando seed: ${filename}`);
      
      const filePath = path.join(this.seedsDir, filename);
      const seedSQL = fs.readFileSync(filePath, 'utf8');
      
      // Ejecutar seed
      await dbConnection.runMigration(seedSQL);
      
      console.log(`✅ Seed completado: ${filename}`);
      
    } catch (error) {
      console.error(`❌ Error en seed ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Verifica el estado de la base de datos
   */
  async checkStatus() {
    try {
      await dbConnection.connect();
      
      const schemaExists = await dbConnection.verifyUniversalScalesSchema();
      const stats = await dbConnection.getStats();
      
      console.log('\n📊 Estado de la Base de Datos:');
      console.log(`Schema universal: ${schemaExists ? '✅ Instalado' : '❌ No instalado'}`);
      console.log(`Escalas activas: ${stats.activeScales}`);
      console.log(`Items totales: ${stats.totalItems}`);
      console.log(`Evaluaciones: ${stats.totalAssessments}\n`);
      
      return { schemaExists, stats };
      
    } catch (error) {
      console.error('❌ Error verificando estado:', error);
      throw error;
    }
  }

  /**
   * Reinicia completamente el schema (¡CUIDADO!)
   */
  async resetSchema() {
    try {
      console.log('⚠️  REINICIANDO SCHEMA COMPLETO...');
      
      await dbConnection.connect();
      
      // Eliminar tablas en orden inverso (por claves foráneas)
      const tables = [
        'assessment_subscale_results',
        'assessment_responses',
        'assessments',
        'scale_subscales',
        'scale_interpretation_rules',
        'scale_response_options',
        'scale_items',
        'scales',
        'schema_migrations'
      ];
      
      for (const table of tables) {
        await dbConnection.run(`DROP TABLE IF EXISTS ${table}`);
      }
      
      console.log('✅ Schema reiniciado completamente');
      
    } catch (error) {
      console.error('❌ Error reiniciando schema:', error);
      throw error;
    }
  }
}

// Función principal para CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const runner = new MigrationRunner();
  
  try {
    switch (command) {
      case 'migrate':
        await runner.runMigrations();
        break;
        
      case 'seed':
        const seedFiles = args.slice(1);
        await runner.runSeeds(seedFiles);
        break;
        
      case 'reset':
        await runner.resetSchema();
        break;
        
      case 'status':
        await runner.checkStatus();
        break;
        
      case 'setup':
        await runner.runMigrations();
        await runner.runSeeds();
        await runner.checkStatus();
        break;
        
      default:
        console.log(`
🛠️  Sistema de Migraciones - Escalas Universales

Comandos disponibles:
  migrate  - Ejecutar migraciones pendientes
  seed     - Ejecutar seeds (opcional: especificar archivos)
  reset    - Reiniciar schema completamente (¡CUIDADO!)
  status   - Verificar estado de la base de datos
  setup    - Configuración completa (migrate + seed + status)

Ejemplos:
  node migrate.js setup
  node migrate.js migrate
  node migrate.js seed phq9-seed.sql
  node migrate.js status
        `);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await dbConnection.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = MigrationRunner;