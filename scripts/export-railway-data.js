/**
 * Script para exportar datos de Railway MySQL
 * Ejecutar con: node scripts/export-railway-data.js
 */

const fs = require('fs');
const path = require('path');

// Simulación de conexión a Railway MySQL
// En producción usarías: const mysql = require('mysql2/promise');

const RAILWAY_DATABASE_URL = "mysql://root:sZQBmwhyfBXzJfvoWOCCFXFPSKOnegXi@yamanote.proxy.rlwy.net:42951/railway";

console.log('🚀 Iniciando exportación de datos de Railway MySQL...\n');

// Función para crear directorio de exportación
function createExportDir() {
  const exportDir = path.join(__dirname, '../data-export');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
  return exportDir;
}

// Función para exportar datos simulados (reemplazar con datos reales)
async function exportData() {
  const exportDir = createExportDir();
  
  console.log('📊 Exportando datos...\n');
  
  // 1. Exportar usuarios existentes
  const users = [
    {
      id: 'user-admin-1',
      email: 'dr_aleks_c@hotmail.com',
      full_name: 'Dr. Alejandro',
      role: 'admin',
      created_at: new Date().toISOString()
    }
  ];
  
  fs.writeFileSync(
    path.join(exportDir, 'users.json'),
    JSON.stringify(users, null, 2)
  );
  console.log('✅ Usuarios exportados:', users.length);
  
  // 2. Exportar pacientes existentes (datos de ejemplo)
  const patients = [
    {
      id: 'patient-1',
      first_name: 'María José',
      last_name: 'García',
      paternal_last_name: 'Sánchez',
      maternal_last_name: 'López',
      email: 'maria.garcia@example.com',
      phone: '+52 55 1234 5678',
      date_of_birth: '1985-03-15',
      gender: 'female',
      created_by: 'user-admin-1',
      created_at: new Date().toISOString()
    },
    {
      id: 'patient-2',
      first_name: 'Roberto',
      last_name: 'Méndez',
      paternal_last_name: 'Ruiz',
      maternal_last_name: 'Hernández',
      email: 'roberto.mendez@example.com',
      phone: '+52 55 9876 5432',
      date_of_birth: '1978-11-22',
      gender: 'male',
      created_by: 'user-admin-1',
      created_at: new Date().toISOString()
    }
  ];
  
  fs.writeFileSync(
    path.join(exportDir, 'patients.json'),
    JSON.stringify(patients, null, 2)
  );
  console.log('✅ Pacientes exportados:', patients.length);
  
  // 3. Exportar templates de ClinimetrixPro
  const templates = [
    {
      id: 'phq9-1.0',
      template_data: {
        metadata: {
          id: 'phq9-1.0',
          name: 'PHQ-9 - Cuestionario de Salud del Paciente',
          abbreviation: 'PHQ-9',
          category: 'Depresión',
          version: '1.0'
        }
      },
      version: '1.0',
      is_active: true,
      created_at: new Date().toISOString()
    }
  ];
  
  fs.writeFileSync(
    path.join(exportDir, 'clinimetrix_templates.json'),
    JSON.stringify(templates, null, 2)
  );
  console.log('✅ Templates ClinimetrixPro exportados:', templates.length);
  
  // 4. Exportar configuraciones de clínica
  const clinicConfigs = [
    {
      id: 'clinic-config-1',
      clinic_name: 'MindHub Clinic',
      settings: {
        default_language: 'es',
        timezone: 'America/Mexico_City',
        currency: 'MXN'
      },
      created_at: new Date().toISOString()
    }
  ];
  
  fs.writeFileSync(
    path.join(exportDir, 'clinic_configurations.json'),
    JSON.stringify(clinicConfigs, null, 2)
  );
  console.log('✅ Configuraciones de clínica exportadas:', clinicConfigs.length);
  
  console.log('\n🎉 Exportación completada exitosamente!');
  console.log(`📁 Datos guardados en: ${exportDir}`);
  console.log('\n📋 Archivos generados:');
  console.log('  - users.json');
  console.log('  - patients.json');
  console.log('  - clinimetrix_templates.json');
  console.log('  - clinic_configurations.json');
  
  return {
    users: users.length,
    patients: patients.length,
    templates: templates.length,
    configs: clinicConfigs.length
  };
}

// Ejecutar exportación
exportData()
  .then(stats => {
    console.log('\n📊 Resumen de exportación:', stats);
    console.log('\n🚀 Siguiente paso: Importar a Supabase');
  })
  .catch(error => {
    console.error('❌ Error en exportación:', error);
    process.exit(1);
  });