#!/usr/bin/env node

/**
 * Fix DTS Migration - Handle the extremely long author list
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

function generateScaleId(templateData) {
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

async function migrateDTS(connection, templateData) {
  const scaleName = templateData.metadata?.name || 'Escala de Trauma de Davidson';
  const abbreviation = templateData.metadata?.abbreviation || 'DTS';
  
  console.log(`\n🔄 Migrando: ${scaleName} (${abbreviation})`);

  const scaleId = generateScaleId(templateData);
  
  try {
    // Check if scale already exists
    const [existing] = await connection.execute('SELECT id FROM scales WHERE id = ?', [scaleId]);
    if (existing.length > 0) {
      console.log(`  ⚠️  Escala ya existe, saltando: ${scaleName}`);
      return;
    }

    // Handle the extremely long author list - get first 3 authors + "et al."
    let authorString = 'No especificado';
    if (Array.isArray(templateData.metadata?.authors) && templateData.metadata.authors.length > 0) {
      const authors = templateData.metadata.authors;
      if (authors.length <= 3) {
        authorString = authors.join(', ');
      } else {
        authorString = `${authors.slice(0, 3).join(', ')} et al.`;
      }
    }
    
    // Ensure it fits in 250 characters
    if (authorString.length > 250) {
      authorString = authorString.substring(0, 247) + '...';
    }

    // 1. Insert main scale with fixed author handling
    const scaleData = {
      id: scaleId,
      name: scaleName,
      abbreviation: abbreviation,
      version: templateData.metadata?.version || '1.0',
      category: templateData.metadata?.category || 'Trauma',
      subcategory: templateData.metadata?.subcategory || 'Trastorno de Estrés Postraumático',
      description: templateData.metadata?.description || '',
      author: authorString,
      publication_year: parseInt(templateData.metadata?.year) || 1997,
      estimated_duration_minutes: parseInt(templateData.metadata?.estimatedDurationMinutes) || 10,
      administration_mode: templateData.metadata?.administrationMode || 'both',
      target_population: templateData.metadata?.targetPopulation?.demographics || 'Adultos con exposición traumática',
      total_items: templateData.structure?.totalItems || 17,
      scoring_method: templateData.scoring?.method || 'sum',
      score_range_min: templateData.scoring?.scoreRange?.min || 0,
      score_range_max: templateData.scoring?.scoreRange?.max || 136,
      instructions_professional: templateData.metadata?.helpText?.instructions?.professional || '',
      instructions_patient: templateData.metadata?.helpText?.instructions?.patient || 'Complete todas las preguntas',
      is_active: true,
      tags: JSON.stringify(['trauma', 'tept', 'postraumatico'])
    };

    await connection.execute(`
      INSERT INTO scales (id, name, abbreviation, version, category, subcategory, description, author, 
                         publication_year, estimated_duration_minutes, administration_mode, target_population, 
                         total_items, scoring_method, score_range_min, score_range_max, 
                         instructions_professional, instructions_patient, is_active, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, Object.values(scaleData));

    console.log(`  ✅ Escala creada: ${scaleData.name}`);
    console.log(`  📝 Autores: ${authorString}`);

    // 2. Insert items from sections structure
    let allItems = [];
    
    if (templateData.structure?.sections && Array.isArray(templateData.structure.sections)) {
      for (const section of templateData.structure.sections) {
        if (section.items && Array.isArray(section.items)) {
          allItems = allItems.concat(section.items);
        }
      }
    }

    if (allItems.length > 0) {
      let itemCount = 0;
      for (const item of allItems) {
        const itemNumber = item.number || (itemCount + 1);
        const itemId = generateItemId(scaleId, itemNumber);
        
        await connection.execute(`
          INSERT INTO scale_items (id, scale_id, item_number, item_text, item_code, subscale, response_group, 
                                  reverse_scored, question_type, required, help_text, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          itemId,
          scaleId,
          itemNumber,
          item.text || `Ítem ${itemNumber}`,
          item.id || `item_${itemNumber}`,
          null, // DTS doesn't have predefined subscales in this structure
          'multi_factor', // DTS uses frequency + severity ratings
          item.reversed || false,
          item.responseType || 'multi_factor',
          item.required !== false,
          item.metadata?.helpText || null
        ]);

        itemCount++;
      }
      console.log(`  ✅ ${itemCount} ítems migrados`);
    }

    // 3. Insert response groups for frequency and severity
    if (templateData.responseGroups) {
      const responseGroups = templateData.responseGroups;
      
      // Insert frequency response options
      if (responseGroups.frequency && Array.isArray(responseGroups.frequency)) {
        for (let optIndex = 0; optIndex < responseGroups.frequency.length; optIndex++) {
          const option = responseGroups.frequency[optIndex];
          await connection.execute(`
            INSERT INTO scale_response_options (id, scale_id, response_group, option_value, option_label, score_value, display_order, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `, [
            `${scaleId}_freq_${optIndex + 1}`,
            scaleId,
            'frequency',
            option.value,
            option.label,
            option.score,
            optIndex + 1
          ]);
        }
      }

      // Insert severity response options
      if (responseGroups.severity && Array.isArray(responseGroups.severity)) {
        for (let optIndex = 0; optIndex < responseGroups.severity.length; optIndex++) {
          const option = responseGroups.severity[optIndex];
          await connection.execute(`
            INSERT INTO scale_response_options (id, scale_id, response_group, option_value, option_label, score_value, display_order, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `, [
            `${scaleId}_sev_${optIndex + 1}`,
            scaleId,
            'severity',
            option.value,
            option.label,
            option.score,
            optIndex + 1
          ]);
        }
      }
      
      console.log(`  ✅ Opciones de respuesta para frecuencia y gravedad migradas`);
    }

    // 4. Insert subscales if defined in scoring
    if (templateData.scoring?.subscales && Array.isArray(templateData.scoring.subscales)) {
      for (let subIndex = 0; subIndex < templateData.scoring.subscales.length; subIndex++) {
        const subscale = templateData.scoring.subscales[subIndex];
        const subscaleId = `${scaleId}_sub_${subscale.id}`;
        
        await connection.execute(`
          INSERT INTO scale_subscales (id, scale_id, subscale_name, subscale_code, items, min_score, max_score, description, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          subscaleId,
          scaleId,
          subscale.name,
          subscale.id.toUpperCase(),
          JSON.stringify(subscale.items.split(', ').map(item => parseInt(item.trim()))),
          subscale.scoreRange?.min || 0,
          subscale.scoreRange?.max || 40,
          `Subescala ${subscale.name} del DTS`,
          true
        ]);
      }
      console.log(`  ✅ ${templateData.scoring.subscales.length} subescalas migradas`);
    }

    // 5. Insert interpretation rules
    if (templateData.interpretation?.rules && Array.isArray(templateData.interpretation.rules)) {
      for (let ruleIndex = 0; ruleIndex < templateData.interpretation.rules.length; ruleIndex++) {
        const rule = templateData.interpretation.rules[ruleIndex];
        const interpretationId = `${scaleId}_int_${rule.label.toLowerCase().replace(/\s/g, '_')}`;
        
        await connection.execute(`
          INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, interpretation_label, severity_level, color_code, description, recommendations, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          interpretationId,
          scaleId,
          rule.minScore,
          rule.maxScore,
          rule.label,
          rule.severity,
          rule.color,
          rule.clinicalInterpretation,
          JSON.stringify(rule.professionalRecommendations || {})
        ]);
      }
      console.log(`  ✅ ${templateData.interpretation.rules.length} reglas de interpretación migradas`);
    }

    console.log(`  🎯 Migración completada: ${scaleName}`);

  } catch (error) {
    console.error(`  ❌ Error migrando DTS:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🩺 Corrigiendo migración del DTS con manejo especial de autores');

  let connection;

  try {
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a MySQL (MAMP)\n');

    // Read DTS template
    const filePath = path.join(__dirname, '..', 'database', 'templates', 'dts-json-completo.json');
    if (!fs.existsSync(filePath)) {
      throw new Error('DTS template file not found');
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const templateData = JSON.parse(content);

    // Start transaction
    await connection.beginTransaction();

    // Migrate DTS with special handling
    await migrateDTS(connection, templateData);

    // Commit transaction
    await connection.commit();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DTS MIGRACIÓN COMPLETADA');
    console.log('='.repeat(60));
    
    // Verify total scales
    const [rows] = await connection.execute('SELECT COUNT(*) as total FROM scales');
    console.log(`📈 Total de escalas en sistema: ${rows[0].total}`);

    console.log('\n✨ DTS (Davidson Trauma Scale) ahora disponible en ClinimetrixPro');

  } catch (error) {
    if (connection) {
      await connection.rollback();
      console.log('🔄 Transaction rolled back due to error');
    }
    console.error('💥 Error crítico en migración DTS:', error.message);
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