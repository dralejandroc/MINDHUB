/**
 * Script para aplicar migraciones de escalas con documentación
 * Ejecuta las migraciones SQL generadas por el procesador de escalas
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

class ScaleMigrationApplier {
  constructor() {
    this.seedsDir = path.join(__dirname, '../database/seeds');
    this.migrationsDir = path.join(__dirname, '../database/migrations');
    this.config = {
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'mindhub', // Base de datos correcta en MAMP
      port: 8889 // Puerto de MAMP
    };
  }

  /**
   * Aplica todas las migraciones pendientes
   */
  async applyMigrations() {
    try {
      console.log('🚀 Iniciando aplicación de migraciones de escalas...\n');

      // 1. Crear tabla de documentación si no existe
      await this.createDocumentationTable();

      // 2. Encontrar y aplicar archivos SQL de escalas
      await this.applyScaleSeeds();

      // 3. Aplicar documentación
      await this.applyDocumentationSeeds();

      // 4. Verificar que todo se aplicó correctamente
      await this.verifyMigration();

      console.log('\n✅ Migraciones aplicadas exitosamente!');

    } catch (error) {
      console.error('\n❌ Error aplicando migraciones:', error.message);
      throw error;
    }
  }

  /**
   * Crea la tabla de documentación
   */
  async createDocumentationTable() {
    console.log('📋 Creando tabla de documentación...');
    
    const schemaPath = path.join(this.migrationsDir, 'create-scale-documentation-table.sql');
    
    try {
      await this.executeSQLFile(schemaPath);
      console.log('   ✅ Tabla scale_documentation creada/verificada');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ✅ Tabla scale_documentation ya existe');
      } else {
        throw error;
      }
    }
  }

  /**
   * Aplica seeds de escalas
   */
  async applyScaleSeeds() {
    console.log('\n📊 Aplicando seeds de escalas...');
    
    const files = await this.findSQLFiles(this.seedsDir, 'scales_');
    
    if (files.length === 0) {
      console.log('   ⚠️  No se encontraron archivos de seeds de escalas');
      return;
    }

    // Aplicar el más reciente
    const latestFile = files.sort().pop();
    console.log(`   📁 Aplicando: ${path.basename(latestFile)}`);
    
    await this.executeSQLFile(latestFile);
    console.log('   ✅ Seeds de escalas aplicados');
  }

  /**
   * Aplica seeds de documentación
   */
  async applyDocumentationSeeds() {
    console.log('\n📚 Aplicando seeds de documentación...');
    
    const docSeedsDir = path.join(this.seedsDir, 'documentation');
    const files = await this.findSQLFiles(docSeedsDir, 'documentation_');
    
    if (files.length === 0) {
      console.log('   ⚠️  No se encontraron archivos de seeds de documentación');
      return;
    }

    // Aplicar el más reciente
    const latestFile = files.sort().pop();
    console.log(`   📁 Aplicando: ${path.basename(latestFile)}`);
    
    await this.executeSQLFile(latestFile);
    console.log('   ✅ Seeds de documentación aplicados');
  }

  /**
   * Encuentra archivos SQL con un prefijo específico
   */
  async findSQLFiles(directory, prefix = '') {
    try {
      const files = await fs.readdir(directory);
      return files
        .filter(file => file.startsWith(prefix) && file.endsWith('.sql'))
        .map(file => path.join(directory, file));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Ejecuta un archivo SQL
   */
  async executeSQLFile(filePath) {
    const command = `mysql -h ${this.config.host} -P ${this.config.port} -u ${this.config.user} -p${this.config.password} ${this.config.database} < "${filePath}"`;
    
    try {
      const { stdout, stderr } = await execAsync(command);
      if (stderr && !stderr.includes('Warning')) {
        throw new Error(stderr);
      }
      return stdout;
    } catch (error) {
      throw new Error(`Error ejecutando ${path.basename(filePath)}: ${error.message}`);
    }
  }

  /**
   * Verifica que las migraciones se aplicaron correctamente
   */
  async verifyMigration() {
    console.log('\n🔍 Verificando migraciones...');

    const query = `
      SELECT 
        s.id, 
        s.name, 
        s.total_items,
        CASE WHEN sd.id IS NOT NULL THEN 'Sí' ELSE 'No' END as tiene_documentacion,
        s.created_at
      FROM scales s 
      LEFT JOIN scale_documentation sd ON s.id = sd.scale_id 
      WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
      ORDER BY s.created_at DESC
      LIMIT 10;
    `;

    try {
      const command = `mysql -h ${this.config.host} -P ${this.config.port} -u ${this.config.user} -p${this.config.password} ${this.config.database} -e "${query}"`;
      const { stdout } = await execAsync(command);
      
      console.log('\n📋 Escalas importadas recientemente:');
      console.log(stdout);
      
      // Verificar tabla de documentación
      const docQuery = `SELECT COUNT(*) as total_docs FROM scale_documentation;`;
      const docCommand = `mysql -h ${this.config.host} -P ${this.config.port} -u ${this.config.user} -p${this.config.password} ${this.config.database} -e "${docQuery}"`;
      const { stdout: docResult } = await execAsync(docCommand);
      
      console.log('📚 Documentación científica:');
      console.log(docResult);
      
    } catch (error) {
      console.warn('⚠️  No se pudo verificar las migraciones:', error.message);
    }
  }

  /**
   * Aplica un script de migración completo específico
   */
  async applyCompleteMigration(scriptName) {
    console.log(`🚀 Aplicando migración completa: ${scriptName}`);
    
    const scriptPath = path.join(this.seedsDir, scriptName);
    
    try {
      // Leer y procesar el script línea por línea
      const script = await fs.readFile(scriptPath, 'utf8');
      const lines = script.split('\n').filter(line => 
        line.trim() && 
        !line.trim().startsWith('--') && 
        !line.trim().startsWith('/*')
      );

      for (const line of lines) {
        if (line.trim().startsWith('SOURCE')) {
          const filePath = line.replace('SOURCE', '').trim().replace(/;$/, '');
          const fullPath = path.join(__dirname, '..', filePath);
          await this.executeSQLFile(fullPath);
          console.log(`   ✅ Ejecutado: ${filePath}`);
        }
      }

      await this.verifyMigration();
      console.log('\n✅ Migración completa aplicada exitosamente!');

    } catch (error) {
      throw new Error(`Error aplicando migración completa: ${error.message}`);
    }
  }

  /**
   * Configurar conexión a base de datos
   */
  setDatabaseConfig(config) {
    this.config = { ...this.config, ...config };
  }
}

// Función de utilidad para mostrar ayuda
function showHelp() {
  console.log(`
🔧 Script de aplicación de migraciones de escalas

Uso:
  node apply-scale-migrations.js [opciones]

Opciones:
  --complete [script]    Aplica un script de migración completo específico
  --host [host]         Host de MySQL (default: localhost)
  --port [port]         Puerto de MySQL (default: 8889)
  --user [user]         Usuario de MySQL (default: root)
  --password [pass]     Contraseña de MySQL (default: root)
  --database [db]       Base de datos (default: clinimetrix)
  --help                Muestra esta ayuda

Ejemplos:
  node apply-scale-migrations.js
  node apply-scale-migrations.js --complete complete_migration_20240115_143022.sql
  node apply-scale-migrations.js --host localhost --port 3306 --user admin
`);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  const applier = new ScaleMigrationApplier();

  // Configurar base de datos desde argumentos
  const configArgs = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    if (['host', 'port', 'user', 'password', 'database'].includes(key) && value) {
      configArgs[key] = value;
    }
  }

  if (Object.keys(configArgs).length > 0) {
    applier.setDatabaseConfig(configArgs);
  }

  // Verificar si se especifica migración completa
  const completeIndex = args.indexOf('--complete');
  if (completeIndex !== -1 && args[completeIndex + 1]) {
    applier.applyCompleteMigration(args[completeIndex + 1])
      .then(() => console.log('\n🎯 Migración completa terminada'))
      .catch(error => {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
      });
  } else {
    applier.applyMigrations()
      .then(() => console.log('\n🎯 Todas las migraciones completadas'))
      .catch(error => {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
      });
  }
}

module.exports = ScaleMigrationApplier;