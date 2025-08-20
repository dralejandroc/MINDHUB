/**
 * Script para aplicar la actualización del esquema de consultations
 * - Amplía los campos reason, notes, diagnosis, treatmentPlan para soportar textos largos
 */

const mysql = require('mysql2/promise');

async function updateConsultationSchema() {
  console.log('🔧 Actualizando esquema de consultations para soportar notas largas...\n');

  let connection;
  
  try {
    // Conectar a MySQL
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 8889, // Puerto por defecto de MAMP
      user: 'root',
      password: 'root', // Contraseña por defecto de MAMP
      database: 'mindhub'
    });

    console.log('✅ Conectado a MySQL/MAMP');

    // Verificar esquema actual
    console.log('📋 Esquema actual de consultations:');
    const [currentSchema] = await connection.execute('DESCRIBE consultations');
    console.table(currentSchema);

    // Aplicar las modificaciones
    console.log('\n🔧 Aplicando modificaciones...');
    
    await connection.execute('ALTER TABLE consultations MODIFY COLUMN reason TEXT');
    console.log('✅ Campo reason actualizado a TEXT');
    
    await connection.execute('ALTER TABLE consultations MODIFY COLUMN notes LONGTEXT');
    console.log('✅ Campo notes actualizado a LONGTEXT');
    
    await connection.execute('ALTER TABLE consultations MODIFY COLUMN diagnosis TEXT');
    console.log('✅ Campo diagnosis actualizado a TEXT');
    
    await connection.execute('ALTER TABLE consultations MODIFY COLUMN treatmentPlan TEXT');
    console.log('✅ Campo treatmentPlan actualizado a TEXT');

    // Verificar esquema actualizado
    console.log('\n📋 Esquema actualizado de consultations:');
    const [updatedSchema] = await connection.execute('DESCRIBE consultations');
    console.table(updatedSchema);

    console.log('\n🎉 Esquema actualizado exitosamente!');
    console.log('💡 Ahora la tabla consultations puede almacenar:');
    console.log('   - reason: Hasta 65,535 caracteres (TEXT)');
    console.log('   - notes: Hasta 4GB de texto (LONGTEXT) ✨');
    console.log('   - diagnosis: Hasta 65,535 caracteres (TEXT)');
    console.log('   - treatmentPlan: Hasta 65,535 caracteres (TEXT)');

  } catch (error) {
    console.error('❌ Error actualizando esquema:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Asegúrate de que MAMP esté ejecutándose en el puerto 8889');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Verifica las credenciales de MySQL (usuario: root, password: root)');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('💡 La base de datos mindhub_db no existe');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar si el archivo es llamado directamente
if (require.main === module) {
  updateConsultationSchema();
}

module.exports = { updateConsultationSchema };