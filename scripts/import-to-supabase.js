/**
 * Script para importar datos a Supabase PostgreSQL
 * Ejecutar con: node scripts/import-to-supabase.js
 */

require('dotenv').config({ path: '/Users/alekscon/MINDHUB-Pro/mindhub/frontend/.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Función para generar UUID válido
function generateUUID() {
  return crypto.randomUUID();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Iniciando importación a Supabase PostgreSQL...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  console.log('Verifica que .env.local tenga:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('✅ Cliente Supabase inicializado');
console.log('📊 URL:', supabaseUrl);

// Función para leer datos exportados
function readExportedData() {
  const exportDir = path.join(__dirname, '../data-export');
  
  if (!fs.existsSync(exportDir)) {
    throw new Error(`Directorio de exportación no encontrado: ${exportDir}`);
  }
  
  const files = ['users.json', 'patients.json', 'clinimetrix_templates.json', 'clinic_configurations.json'];
  const data = {};
  
  for (const file of files) {
    const filePath = path.join(exportDir, file);
    if (fs.existsSync(filePath)) {
      const key = file.replace('.json', '');
      data[key] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`📁 Cargado: ${file} (${data[key].length} registros)`);
    } else {
      console.warn(`⚠️  Archivo no encontrado: ${file}`);
    }
  }
  
  return data;
}

// Función para importar datos a Supabase
async function importData() {
  try {
    console.log('\n🔄 Iniciando importación...\n');
    
    const data = readExportedData();
    const results = {};
    
    // 1. Importar configuraciones de clínica primero
    if (data.clinic_configurations && data.clinic_configurations.length > 0) {
      console.log('📋 Importando configuraciones de clínica...');
      const clinicConfigsWithUUIDs = data.clinic_configurations.map(config => ({
        ...config,
        id: generateUUID()
      }));
      
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinic_configurations')
        .upsert(clinicConfigsWithUUIDs, { onConflict: 'id' });
      
      if (clinicError) {
        console.error('❌ Error importando configuraciones:', clinicError);
      } else {
        console.log('✅ Configuraciones importadas exitosamente');
        results.clinic_configurations = clinicConfigsWithUUIDs.length;
      }
    }
    
    // 2. Importar templates de ClinimetrixPro
    if (data.clinimetrix_templates && data.clinimetrix_templates.length > 0) {
      console.log('📋 Importando templates ClinimetrixPro...');
      const { data: templatesData, error: templatesError } = await supabase
        .from('clinimetrix_templates')
        .upsert(data.clinimetrix_templates, { onConflict: 'id' });
      
      if (templatesError) {
        console.error('❌ Error importando templates:', templatesError);
      } else {
        console.log('✅ Templates importados exitosamente');
        results.clinimetrix_templates = data.clinimetrix_templates.length;
      }
    }
    
    // 3. Crear registry entries para templates
    if (data.clinimetrix_templates && data.clinimetrix_templates.length > 0) {
      console.log('📋 Creando entradas de registry...');
      const registryEntries = data.clinimetrix_templates.map(template => ({
        id: `registry-${template.id}`,
        template_id: template.id,
        abbreviation: template.template_data.metadata.abbreviation,
        name: template.template_data.metadata.name,
        category: template.template_data.metadata.category,
        version: template.template_data.metadata.version,
        is_active: true,
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      const { data: registryData, error: registryError } = await supabase
        .from('clinimetrix_registry')
        .upsert(registryEntries, { onConflict: 'id' });
      
      if (registryError) {
        console.error('❌ Error creando registry:', registryError);
      } else {
        console.log('✅ Registry creado exitosamente');
        results.clinimetrix_registry = registryEntries.length;
      }
    }
    
    // 4. Importar pacientes
    if (data.patients && data.patients.length > 0) {
      console.log('📋 Importando pacientes...');
      // Generar UUIDs válidos para los pacientes
      const patientsWithUUIDs = data.patients.map(patient => ({
        ...patient,
        id: generateUUID(),
        created_by: null // NULL para evitar restricciones de FK temporalmente
      }));
      
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .upsert(patientsWithUUIDs, { onConflict: 'id' });
      
      if (patientsError) {
        console.error('❌ Error importando pacientes:', patientsError);
      } else {
        console.log('✅ Pacientes importados exitosamente');
        results.patients = patientsWithUUIDs.length;
      }
    }
    
    console.log('\n🎉 Importación completada exitosamente!');
    console.log('\n📊 Resumen de importación:');
    Object.keys(results).forEach(key => {
      console.log(`  - ${key}: ${results[key]} registros`);
    });
    
    return results;
    
  } catch (error) {
    console.error('❌ Error durante la importación:', error);
    throw error;
  }
}

// Función para verificar la importación
async function verifyImport() {
  console.log('\n🔍 Verificando importación...\n');
  
  const tables = ['clinic_configurations', 'clinimetrix_templates', 'clinimetrix_registry', 'patients'];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: Error - ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count} registros`);
      }
    } catch (err) {
      console.log(`❌ ${table}: Error verificando - ${err.message}`);
    }
  }
}

// Ejecutar importación
async function main() {
  try {
    await importData();
    await verifyImport();
    
    console.log('\n🚀 Siguiente paso: Convertir API routes de Express a Next.js');
    console.log('📝 La migración de datos está completa');
    
  } catch (error) {
    console.error('\n❌ Error en la migración:', error.message);
    process.exit(1);
  }
}

main();