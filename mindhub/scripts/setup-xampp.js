/**
 * XAMPP Database Setup Script for MindHub
 * 
 * Configura MindHub para usar XAMPP (MySQL/MariaDB)
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configuración de XAMPP/MAMP por defecto
const XAMPP_CONFIG = {
  host: 'localhost',
  port: process.env.DB_PORT || 8889, // MAMP usa 8889, XAMPP usa 3306
  user: 'root',
  password: process.env.DB_PASSWORD || 'root', // MAMP usa 'root', XAMPP usa ''
  database: 'mindhub'
};

/**
 * Crear conexión a MySQL
 */
async function createConnection(config = XAMPP_CONFIG) {
  try {
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password
    });
    
    console.log('✅ Conectado a MySQL');
    return connection;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    throw error;
  }
}

/**
 * Crear base de datos si no existe
 */
async function createDatabase(connection, dbName = 'mindhub') {
  try {
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Base de datos '${dbName}' creada/verificada`);
  } catch (error) {
    console.error('❌ Error creando base de datos:', error.message);
    throw error;
  }
}

/**
 * Configurar archivos para XAMPP
 */
async function setupXAMPPFiles() {
  console.log('🔧 Configurando archivos para XAMPP...');
  
  // Copiar schema MySQL
  const mysqlSchemaPath = path.join(__dirname, '..', 'prisma', 'schema-mysql.prisma');
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  
  if (fs.existsSync(mysqlSchemaPath)) {
    fs.copyFileSync(mysqlSchemaPath, schemaPath);
    console.log('✅ Schema de MySQL aplicado');
  }
  
  // Instalar driver MySQL si no existe
  try {
    require.resolve('mysql2');
    console.log('✅ Driver MySQL2 encontrado');
  } catch (error) {
    console.log('📦 Instalando driver MySQL2...');
    const { execSync } = require('child_process');
    
    try {
      execSync('npm install mysql2', { stdio: 'inherit' });
      console.log('✅ Driver MySQL2 instalado');
    } catch (installError) {
      console.error('❌ Error instalando MySQL2:', installError.message);
      throw installError;
    }
  }
}

/**
 * Verificar XAMPP está ejecutándose
 */
async function checkXAMPP() {
  console.log('🔍 Verificando XAMPP...');
  
  try {
    const connection = await createConnection();
    await connection.end();
    console.log('✅ XAMPP MySQL está ejecutándose');
    return true;
  } catch (error) {
    console.log('❌ XAMPP MySQL no está ejecutándose');
    console.log('\n💡 Asegúrate de que:');
    console.log('1. XAMPP esté instalado e iniciado');
    console.log('2. El servicio MySQL esté ejecutándose');
    console.log('3. El puerto 3306 esté disponible');
    return false;
  }
}

/**
 * Configuración principal
 */
async function setupXAMP() {
  console.log('🏥 MindHub - Configuración XAMPP');
  console.log('================================\n');
  
  try {
    // 1. Verificar XAMPP
    const xamppRunning = await checkXAMPP();
    if (!xamppRunning) {
      console.log('\n🚨 Inicia XAMPP y vuelve a ejecutar este script.');
      process.exit(1);
    }
    
    // 2. Configurar archivos
    await setupXAMPPFiles();
    
    // 3. Crear conexión
    const connection = await createConnection();
    
    // 4. Crear base de datos
    await createDatabase(connection, XAMPP_CONFIG.database);
    
    // 5. Cerrar conexión
    await connection.end();
    
    console.log('\n✅ Configuración XAMPP completada!');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Copia .env.example a .env');
    console.log('2. Ajusta la DATABASE_URL en .env si es necesario');
    console.log('3. Ejecuta: npm run db:push');
    console.log('4. Ejecuta: npm run db:seed');
    console.log('\n🌐 Credenciales por defecto XAMPP:');
    console.log('- Usuario: root');
    console.log('- Contraseña: (vacía)');
    console.log('- Puerto: 3306');
    console.log('- Base de datos: mindhub_dev');
    
  } catch (error) {
    console.error('\n❌ Error en configuración:', error.message);
    process.exit(1);
  }
}

/**
 * Probar conexión con configuración personalizada
 */
async function testConnection(host, port, user, password, database) {
  const config = { host, port, user, password, database };
  
  try {
    const connection = await mysql.createConnection(config);
    await connection.execute('SELECT 1');
    await connection.end();
    
    console.log('✅ Conexión exitosa con configuración personalizada');
    return true;
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    return false;
  }
}

// Manejo de argumentos de línea de comandos
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('MindHub XAMPP Setup\n');
  console.log('Uso:');
  console.log('  node scripts/setup-xampp.js              # Configuración automática');
  console.log('  node scripts/setup-xampp.js --test       # Solo probar conexión');
  console.log('  node scripts/setup-xampp.js --help       # Mostrar ayuda');
  console.log('\nVariables de entorno opcionales:');
  console.log('  MYSQL_HOST=localhost');
  console.log('  MYSQL_PORT=3306');
  console.log('  MYSQL_USER=root');
  console.log('  MYSQL_PASSWORD=');
  console.log('  MYSQL_DATABASE=mindhub_dev');
} else if (args.includes('--test')) {
  // Solo probar conexión
  checkXAMPP().then(success => {
    process.exit(success ? 0 : 1);
  });
} else {
  // Configuración completa
  setupXAMP();
}

module.exports = {
  createConnection,
  createDatabase,
  setupXAMPPFiles,
  checkXAMPP,
  testConnection
};