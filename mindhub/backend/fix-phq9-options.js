/**
 * Script para corregir las opciones del PHQ-9
 * Items 1-9 usan opciones generales (nunca, varios días, etc.)
 * Item 10 usa opciones específicas (ninguna dificultad, algunas, etc.)
 */
const { PrismaClient } = require('./generated/prisma');
const fs = require('fs');

const prisma = new PrismaClient();

async function fixPHQ9Options() {
  try {
    console.log('🔧 Corrigiendo opciones del PHQ-9...');
    
    // Leer JSON para verificar estructura correcta
    const jsonData = JSON.parse(fs.readFileSync('/Users/alekscon/Desktop/PROYECTO-MindHub/Escalas Json/phq9.json', 'utf8'));
    const { responseOptions, items } = jsonData;
    
    // Limpiar datos existentes del PHQ-9
    await prisma.$executeRaw`DELETE FROM scales WHERE id = 'phq9'`;
    
    console.log('  🗑️ Datos anteriores eliminados');
    
    // 1. Crear escala
    await prisma.$executeRaw`
      INSERT INTO scales (
        id, name, abbreviation, version, category, subcategory, description,
        author, publication_year, estimated_duration_minutes, administration_mode,
        application_type, target_population, total_items, scoring_method, score_range_min,
        score_range_max, instructions_professional, instructions_patient, is_active,
        created_at, updated_at
      ) VALUES (
        'phq9', 'Cuestionario de Salud del Paciente-9', 'PHQ-9', '1.0',
        'depression', 'screening', 'Cuestionario de autoevaluación para la detección y valoración de la gravedad de la depresión basado en los criterios diagnósticos del DSM-IV',
        'Kroenke, Spitzer y Williams', 2001, 5, 'self_administered', 'autoaplicada',
        'Adultos mayores de 18 años', 10, 'sum', 0, 27,
        'Escala breve con alta confiabilidades para test y retest para evaluar sintomatología depresiva, altamente recomendada por su confiabilidad y rapidez para aplicación en entornos clínicos',
        'Durante las últimas DOS SEMANAS, ¿con qué frecuencia le ha afectado alguno de los siguientes problemas?',
        1, NOW(), NOW()
      )
    `;
    
    // 2. Crear items
    for (const item of items) {
      await prisma.$executeRaw`
        INSERT INTO scale_items (
          id, scale_id, item_number, item_text, item_code, subscale, 
          reverse_scored, is_active, created_at, updated_at
        ) VALUES (
          ${item.id}, 'phq9', ${item.number}, ${item.text},
          ${`PHQ-9${item.number}`}, ${null},
          ${item.reverseScored ? 1 : 0}, 1, NOW(), NOW()
        )
      `;
    }
    
    console.log('  ✅ 10 items creados');
    
    // 3. Crear opciones GENERALES (items 1-9)
    for (const option of responseOptions) {
      await prisma.$executeRaw`
        INSERT INTO scale_response_options (
          id, scale_id, option_value, option_label, score_value, 
          display_order, is_active, created_at, updated_at
        ) VALUES (
          ${option.id}, 'phq9', ${option.value}, ${option.label},
          ${option.score}, ${option.orderIndex || 1}, 1, NOW(), NOW()
        )
      `;
    }
    
    // 4. Crear opciones ESPECÍFICAS del item 10
    const item10 = items.find(item => item.number === 10);
    if (item10 && Array.isArray(item10.responseOptions)) {
      for (const option of item10.responseOptions) {
        await prisma.$executeRaw`
          INSERT INTO scale_response_options (
            id, scale_id, option_value, option_label, score_value, 
            display_order, is_active, created_at, updated_at
          ) VALUES (
            ${option.id}, 'phq9', ${option.value}, ${option.label},
            ${option.score}, ${option.orderIndex || 1}, 1, NOW(), NOW()
          )
        `;
      }
    }
    
    console.log('  ✅ Opciones creadas (4 generales + 4 específicas)');
    
    // 5. Crear reglas de interpretación
    const { interpretationRules } = jsonData;
    for (const rule of interpretationRules) {
      await prisma.$executeRaw`
        INSERT INTO scale_interpretation_rules (
          id, scale_id, min_score, max_score, severity_level, interpretation_label,
          color_code, description, recommendations, is_active, created_at, updated_at
        ) VALUES (
          ${rule.id}, 'phq9', ${rule.minScore}, ${rule.maxScore},
          ${rule.severityLevel}, ${rule.label}, ${rule.color}, ${rule.description},
          ${rule.recommendations}, 1, NOW(), NOW()
        )
      `;
    }
    
    console.log('  ✅ 5 reglas de interpretación creadas');
    
    // 6. Ahora agregar lógica para indicar qué opciones usa cada item
    // Items 1-9 usan las opciones generales (phq9-opt-0 a phq9-opt-3)
    for (let i = 1; i <= 9; i++) {
      const itemId = `phq9-item-${i}`;
      // Referencias a las opciones generales
      const generalOptions = ['phq9-opt-0', 'phq9-opt-1', 'phq9-opt-2', 'phq9-opt-3'];
      
      // En lugar de crear tabla nueva, vamos a usar un campo JSON en scale_items
      await prisma.$executeRaw`
        UPDATE scale_items 
        SET item_code = ${JSON.stringify(generalOptions)}
        WHERE id = ${itemId}
      `;
    }
    
    // Item 10 usa las opciones funcionales (phq9-func-0 a phq9-func-3)
    const functionalOptions = ['phq9-func-0', 'phq9-func-1', 'phq9-func-2', 'phq9-func-3'];
    await prisma.$executeRaw`
      UPDATE scale_items 
      SET item_code = ${JSON.stringify(functionalOptions)}
      WHERE id = 'phq9-item-10'
    `;
    
    console.log('  ✅ Referencias de opciones por item configuradas');
    
    // Verificar resultado final
    const scale = await prisma.$queryRaw`SELECT * FROM scales WHERE id = 'phq9'`;
    const itemsCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM scale_items WHERE scale_id = 'phq9'`;
    const optionsCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM scale_response_options WHERE scale_id = 'phq9'`;
    const rulesCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM scale_interpretation_rules WHERE scale_id = 'phq9'`;
    
    console.log('\\n✅ PHQ-9 corregido exitosamente:');
    console.log(`  - Escala: ${scale[0].abbreviation} - ${scale[0].name}`);
    console.log(`  - Tipo: ${scale[0].application_type}`);
    console.log(`  - Items: ${itemsCount[0].count} (1-9 opciones generales, 10 opciones específicas)`);
    console.log(`  - Opciones: ${optionsCount[0].count} (4 generales + 4 funcionales)`);
    console.log(`  - Reglas: ${rulesCount[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixPHQ9Options();