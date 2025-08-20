#!/usr/bin/env node

/**
 * Migrate All New Templates to ClinimetrixPro Universal System
 * This script processes 17 new clinical scales from JSON templates
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 8889,
  user: 'root',
  password: 'root',
  database: 'mindhub',
  multipleStatements: true
};

// List of new template files to migrate (17 scales)
const newTemplateFiles = [
  'aq-adolescent-json.json',     // AQ-Adolescent - Autism screening for adolescents
  'aq-child-json.json',          // AQ-Child - Autism screening for children
  'cuestionario-salamanca-v2007.json', // Salamanca - Personality disorders
  'dts-json-completo.json',      // DTS - Davidson Trauma Scale
  'dy-bocs-json.json',           // DY-BOCS - Dimensional Yale-Brown OCD Scale
  'eat26-json.json',             // EAT-26 - Eating Attitudes Test
  'emun-ar-scale.json',          // EMUN-AR - Manic-depressive scale
  'esadfun-json.json',           // EsADFUN - Depression and Functionality
  'hars_complete_json.json',     // HARS - Hamilton Anxiety Rating Scale
  'ipde-cie10-completo.json',    // IPDE-CIE10 - Personality Disorder Exam
  'ipde-dsmiv-json.json',        // IPDE-DSM-IV - Personality Disorder Exam
  'moca-json.json',              // MoCA - Montreal Cognitive Assessment
  'rads2-json.json',             // RADS-2 - Reynolds Adolescent Depression
  'sss-v-scale-json.json',       // SSS-V - Sensation Seeking Scale
  'stai-json-completo.json',     // STAI - State-Trait Anxiety Inventory
  'ybocs-json.json',             // Y-BOCS - Yale-Brown OCD Scale
  'ygtss-json.json'              // YGTSS - Yale Global Tic Severity Scale
];

async function readTemplateFile(filename) {
  const filePath = path.join(__dirname, '..', 'database', 'templates', filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Template file not found: ${filename}`);
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function generateScaleId(templateData) {
  // Try different sources for scale identification
  const abbreviation = templateData.metadata?.abbreviation || templateData.abbreviation;
  const name = templateData.metadata?.name || templateData.scaleName || templateData.name;
  
  const identifier = abbreviation || name || 'unknown_scale';
  return identifier.toLowerCase()
    .replace(/[\s\-\.]/g, '_')
    .replace(/[^\w]/g, '')
    .substring(0, 20);
}

function generateItemId(scaleId, itemNumber) {
  return `${scaleId}_item_${itemNumber.toString().padStart(2, '0')}`;
}

function generateSubscaleId(scaleId, subscaleIndex) {
  return `${scaleId}_sub_${(subscaleIndex + 1).toString().padStart(2, '0')}`;
}

function generateInterpretationId(scaleId, interpIndex) {
  return `${scaleId}_int_${(interpIndex + 1).toString().padStart(2, '0')}`;
}

async function migrateScale(connection, templateData, filename) {
  // Extract scale info from template structure
  const scaleName = templateData.metadata?.name || templateData.scaleName || 'Sin nombre';
  const abbreviation = templateData.metadata?.abbreviation || templateData.abbreviation || 'UNK';
  
  console.log(`\n🔄 Migrando: ${scaleName} (${abbreviation})`);

  const scaleId = generateScaleId(templateData);
  
  try {
    // 1. Insert main scale
    const scaleData = {
      id: scaleId,
      name: scaleName,
      abbreviation: abbreviation,
      version: templateData.metadata?.version || templateData.version || '1.0',
      category: templateData.metadata?.category || 'General',
      subcategory: templateData.metadata?.subcategory || null,
      description: templateData.metadata?.description || templateData.description || '',
      author: Array.isArray(templateData.metadata?.authors) 
        ? templateData.metadata.authors.join(', ').substring(0, 250) 
        : (templateData.metadata?.authors || 'No especificado').substring(0, 250),
      publication_year: templateData.metadata?.year || new Date().getFullYear(),
      estimated_duration_minutes: parseInt(templateData.metadata?.estimatedDurationMinutes) || parseInt(templateData.metadata?.estimatedDuration) || 15,
      administration_mode: templateData.metadata?.administrationMode || 'both',
      target_population: templateData.metadata?.targetPopulation?.demographics || 'Adultos',
      total_items: templateData.structure?.totalItems || 0,
      scoring_method: templateData.scoring?.method || 'sum',
      score_range_min: templateData.scoring?.scoreRange?.min || templateData.scoring?.totalRange?.min || 0,
      score_range_max: templateData.scoring?.scoreRange?.max || templateData.scoring?.totalRange?.max || 100,
      instructions_professional: templateData.metadata?.helpText?.instructions?.professional || '',
      instructions_patient: templateData.metadata?.helpText?.instructions?.patient || 'Complete todas las preguntas',
      is_active: true,
      tags: JSON.stringify(templateData.metadata?.tags || [])
    };

    await connection.execute(`
      INSERT INTO scales (id, name, abbreviation, version, category, subcategory, description, author, 
                         publication_year, estimated_duration_minutes, administration_mode, target_population, 
                         total_items, scoring_method, score_range_min, score_range_max, 
                         instructions_professional, instructions_patient, is_active, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, Object.values(scaleData));

    console.log(`  ✅ Escala creada: ${scaleData.name}`);

    // 2. Insert items - handle different item structures
    let allItems = [];
    
    // Collect items from different possible structures
    if (templateData.structure?.items && Array.isArray(templateData.structure.items)) {
      allItems = templateData.structure.items;
    } else if (templateData.structure?.sections && Array.isArray(templateData.structure.sections)) {
      // Items are in sections
      for (const section of templateData.structure.sections) {
        if (section.items && Array.isArray(section.items)) {
          allItems = allItems.concat(section.items);
        }
      }
    }

    if (allItems.length > 0) {
      let itemCount = 0;
      for (const item of allItems) {
        const itemNumber = item.number || item.itemNumber || (itemCount + 1);
        const itemId = generateItemId(scaleId, itemNumber);
        
        await connection.execute(`
          INSERT INTO scale_items (id, scale_id, item_number, item_text, item_code, subscale, response_group, 
                                  reverse_scored, question_type, required, help_text, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          itemId,
          scaleId,
          itemNumber,
          item.text || item.itemText || `Ítem ${itemNumber}`,
          item.id || `item_${itemNumber}`,
          item.subscale || null,
          item.responseGroup || 'default',
          item.reversed || false,
          item.responseType || item.itemType || 'likert',
          item.required !== false,
          item.metadata?.helpText || null
        ]);

        itemCount++;
      }
      console.log(`  ✅ ${itemCount} ítems migrados`);
    }

    // 3. Insert global response options for the scale (simplified)
    if (templateData.scoring?.responseOptions && Array.isArray(templateData.scoring.responseOptions)) {
      const responseGroup = 'default';
      for (let optIndex = 0; optIndex < templateData.scoring.responseOptions.length; optIndex++) {
        const option = templateData.scoring.responseOptions[optIndex];
        await connection.execute(`
          INSERT INTO scale_response_options (id, scale_id, response_group, option_value, option_label, score_value, display_order, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          `${scaleId}_opt_${optIndex + 1}`,
          scaleId,
          responseGroup,
          option.value || optIndex,
          option.text || option.label || `Opción ${optIndex + 1}`,
          option.score !== undefined ? option.score : optIndex,
          optIndex + 1
        ]);
      }
      console.log(`  ✅ Opciones de respuesta migradas`);
    }

    console.log(`  🎯 Migración completada: ${scaleName}`);

  } catch (error) {
    console.error(`  ❌ Error migrando ${scaleName}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Iniciando migración masiva de templates a ClinimetrixPro Universal System');
  console.log(`📊 Se migrarán ${newTemplateFiles.length} escalas nuevas\n`);

  let connection;
  let successCount = 0;
  let errorCount = 0;

  try {
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a MySQL (MAMP)\n');

    // Start transaction
    await connection.beginTransaction();

    // Process each template file
    for (let i = 0; i < newTemplateFiles.length; i++) {
      const filename = newTemplateFiles[i];
      console.log(`\n📋 Procesando (${i + 1}/${newTemplateFiles.length}): ${filename}`);

      try {
        const templateData = await readTemplateFile(filename);
        await migrateScale(connection, templateData, filename);
        successCount++;
      } catch (error) {
        console.error(`❌ Error procesando ${filename}:`, error.message);
        errorCount++;
        // Continue with next file instead of stopping
      }
    }

    // Commit transaction
    await connection.commit();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 MIGRACIÓN MASIVA COMPLETADA');
    console.log('='.repeat(60));
    console.log(`✅ Escalas migradas exitosamente: ${successCount}`);
    console.log(`❌ Escalas con errores: ${errorCount}`);
    console.log(`📊 Total procesadas: ${newTemplateFiles.length}`);
    
    if (successCount > 0) {
      console.log('\n🔍 Verificando migración...');
      const [rows] = await connection.execute('SELECT COUNT(*) as total FROM scales');
      console.log(`📈 Total de escalas en sistema: ${rows[0].total}`);
    }

    console.log('\n✨ ClinimetrixPro ahora tiene una biblioteca más amplia de escalas clínicas validadas');

  } catch (error) {
    if (connection) {
      await connection.rollback();
      console.log('🔄 Transaction rolled back due to error');
    }
    console.error('💥 Error crítico en migración:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Run migration
main();