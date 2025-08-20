#!/usr/bin/env node

/**
 * UNIVERSAL SCALE IMPORTER
 * 
 * Sistema universal para importar escalas clínicas desde JSON a MySQL
 * Lee archivos JSON con formato estándar e importa COMPLETAMENTE:
 * - Escala principal
 * - Ítems con texto y helpText  
 * - Opciones de respuesta (globales/específicas/grupos)
 * - Subescalas
 * - Reglas de interpretación
 * - Documentación científica
 * 
 * Uso:
 *   node scripts/universal-scale-importer.js path/to/scale.json
 *   node scripts/universal-scale-importer.js --batch path/to/scales/
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

class UniversalScaleImporter {
  constructor() {
    this.stats = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    };
  }

  /**
   * Valida la estructura del JSON de escala
   */
  validateScaleJSON(scaleData, filename) {
    const errors = [];
    
    // Validar estructura principal
    if (!scaleData.scale) errors.push('Missing "scale" object');
    if (!scaleData.items || !Array.isArray(scaleData.items)) errors.push('Missing or invalid "items" array');
    
    if (scaleData.scale) {
      const required = ['id', 'name', 'abbreviation', 'description'];
      required.forEach(field => {
        if (!scaleData.scale[field]) errors.push(`Missing scale.${field}`);
      });
    }
    
    // Tipos de pregunta válidos
    const validQuestionTypes = [
      'likert', 'multiple_choice', 'dichotomous', 'text', 'slider', 'matrix',
      'vas', 'numeric', 'checklist', 'ranking', 'semantic_diff', 'frequency',
      'binary' // Mantener por compatibilidad
    ];
    
    // Validar items
    if (scaleData.items && Array.isArray(scaleData.items)) {
      scaleData.items.forEach((item, index) => {
        if (!item.id) errors.push(`Item ${index + 1}: Missing id`);
        if (!item.text) errors.push(`Item ${index + 1}: Missing text`);
        if (typeof item.number !== 'number') errors.push(`Item ${index + 1}: Missing or invalid number`);
        
        // Validar tipo de pregunta
        const questionType = item.question_type || 'likert';
        if (!validQuestionTypes.includes(questionType)) {
          errors.push(`Item ${index + 1}: Invalid question_type "${questionType}". Must be one of: ${validQuestionTypes.join(', ')}`);
        }
        
        // Validar opciones según tipo de pregunta
        if (questionType !== 'text' && questionType !== 'slider') {
          // Estos tipos requieren opciones
          const hasSpecificOptions = item.specific_options && item.specific_options.length > 0;
          const hasResponseGroup = item.response_group;
          const hasGlobalOptions = scaleData.response_options && scaleData.response_options.length > 0;
          
          if (!hasSpecificOptions && !hasResponseGroup && !hasGlobalOptions) {
            errors.push(`Item ${index + 1}: Question type "${questionType}" requires response options but none found`);
          }
        }
        
        // Validar opciones binarias
        if (questionType === 'binary' && item.specific_options) {
          if (item.specific_options.length !== 2) {
            errors.push(`Item ${index + 1}: Binary questions must have exactly 2 options, found ${item.specific_options.length}`);
          }
        }
      });
    }

    if (errors.length > 0) {
      console.error(`❌ Validation failed for ${filename}:`);
      errors.forEach(error => console.error(`   - ${error}`));
      return false;
    }

    console.log(`✅ JSON validation passed for ${filename}`);
    return true;
  }

  /**
   * Limpia datos existentes de una escala
   */
  async cleanExistingScale(scaleId) {
    console.log(`🗑️  Cleaning existing data for scale: ${scaleId}`);
    
    try {
      // Eliminar en orden correcto para evitar violaciones de FK
      await prisma.scaleAdministration.deleteMany({ where: { scaleId } });
      
      // Para scaleItemSpecificOption necesitamos eliminar via items
      const scaleItems = await prisma.scaleItem.findMany({ 
        where: { scaleId }, 
        select: { id: true } 
      });
      const itemIds = scaleItems.map(item => item.id);
      if (itemIds.length > 0) {
        await prisma.scaleItemSpecificOption.deleteMany({ 
          where: { itemId: { in: itemIds } } 
        });
      }
      
      await prisma.scaleResponseOption.deleteMany({ where: { scaleId } });
      await prisma.scaleResponseGroup.deleteMany({ where: { scaleId } });
      await prisma.scaleInterpretationRule.deleteMany({ where: { scaleId } });
      await prisma.scaleSubscale.deleteMany({ where: { scaleId } });
      await prisma.scaleDocumentation.deleteMany({ where: { scaleId } });
      await prisma.scaleItem.deleteMany({ where: { scaleId } });
      await prisma.scale.deleteMany({ where: { id: scaleId } });
      
      console.log(`✅ Cleaned existing data for ${scaleId}`);
    } catch (error) {
      console.error(`❌ Error cleaning ${scaleId}:`, error.message);
      throw error;
    }
  }

  /**
   * Importa la escala principal
   */
  async importMainScale(scaleData) {
    const scale = scaleData.scale;
    
    console.log(`📊 Importing main scale: ${scale.name} (${scale.id})`);
    
    const scaleRecord = await prisma.scale.create({
      data: {
        id: scale.id,
        name: scale.name,
        abbreviation: scale.abbreviation,
        description: scale.description,
        version: scale.version || '1.0',
        category: scale.category || 'general',
        subcategory: scale.subcategory || null,
        author: scale.author || null,
        publicationYear: scale.publication_year || scale.publicationYear || null,
        totalItems: scale.total_items || scaleData.items?.length || 0,
        estimatedDurationMinutes: scale.estimated_duration_minutes || scale.estimatedDurationMinutes || 10,
        administrationMode: scale.administration_mode || scale.administrationMode || 'self_administered',
        targetPopulation: scale.target_population || scale.targetPopulation || null,
        scoringMethod: scale.scoring_method || scale.scoringMethod || 'sum',
        scoreRangeMin: scale.score_range_min || scale.scoreRangeMin || 0,
        scoreRangeMax: scale.score_range_max || scale.scoreRangeMax || 100,
        instructionsProfessional: scale.instructions_professional || scale.instructionsProfessional || null,
        instructionsPatient: scale.instructions_patient || scale.instructionsPatient || null,
        isActive: true
      }
    });
    
    console.log(`✅ Created main scale record`);
    return scaleRecord;
  }

  /**
   * Importa grupos de respuesta si existen
   */
  async importResponseGroups(scaleId, responseGroups) {
    if (!responseGroups || !Array.isArray(responseGroups)) return {};
    
    console.log(`🔗 Importing ${responseGroups.length} response groups`);
    
    const groupMap = {};
    
    for (const group of responseGroups) {
      const groupRecord = await prisma.scaleResponseGroup.create({
        data: {
          id: group.id,
          scaleId: scaleId,
          groupKey: group.key || group.groupKey,
          name: group.name,
          description: group.description || null,
          displayOrder: group.display_order || group.displayOrder || 1
        }
      });
      
      groupMap[group.key || group.groupKey] = groupRecord;
    }
    
    console.log(`✅ Created ${Object.keys(groupMap).length} response groups`);
    return groupMap;
  }

  /**
   * Importa opciones de respuesta globales
   */
  async importGlobalResponseOptions(scaleId, responseOptions) {
    if (!responseOptions || !Array.isArray(responseOptions)) return [];
    
    console.log(`🎯 Importing ${responseOptions.length} global response options`);
    
    const optionRecords = [];
    
    for (const option of responseOptions) {
      const optionRecord = await prisma.scaleResponseOption.create({
        data: {
          id: option.id,
          scaleId: scaleId,
          responseGroup: null, // Global options
          optionValue: option.value,
          optionLabel: option.label,
          scoreValue: option.score,
          displayOrder: option.order_index || option.displayOrder || option.orderIndex || 1,
          option_type: option.option_type || option.optionType || 'standard',
          metadata: option.metadata ? JSON.stringify(option.metadata) : null,
          isActive: true
        }
      });
      
      optionRecords.push(optionRecord);
    }
    
    console.log(`✅ Created ${optionRecords.length} global response options`);
    return optionRecords;
  }

  /**
   * Importa opciones de respuesta por grupo
   */
  async importGroupResponseOptions(scaleId, responseGroups) {
    if (!responseGroups || !Array.isArray(responseGroups)) return;
    
    for (const group of responseGroups) {
      if (!group.options || !Array.isArray(group.options)) continue;
      
      console.log(`🎯 Importing ${group.options.length} options for group "${group.key || group.groupKey}"`);
      
      for (const option of group.options) {
        await prisma.scaleResponseOption.create({
          data: {
            id: option.id,
            scaleId: scaleId,
            responseGroup: group.key || group.groupKey,
            optionValue: option.value,
            optionLabel: option.label,
            scoreValue: option.score,
            displayOrder: option.order_index || option.displayOrder || option.orderIndex || 1,
            option_type: option.option_type || option.optionType || 'standard',
            metadata: option.metadata ? JSON.stringify(option.metadata) : null,
            isActive: true
          }
        });
      }
    }
  }

  /**
   * Importa ítems de la escala
   */
  async importScaleItems(scaleId, items) {
    console.log(`📝 Importing ${items.length} scale items`);
    
    const itemRecords = [];
    
    for (const item of items) {
      const itemRecord = await prisma.scaleItem.create({
        data: {
          id: item.id,
          scaleId: scaleId,
          itemNumber: item.number,
          itemText: item.text,
          itemCode: item.code || `${scaleId.toUpperCase()}-${item.number}`,
          responseGroup: item.response_group || item.responseGroup || null,
          reverseScored: item.reverse_scored || item.reverseScored || false,
          question_type: item.question_type || item.questionType || 'likert',
          alert_trigger: item.alert_trigger || item.alertTrigger || false,
          alert_condition: item.alert_condition || item.alertCondition || null,
          help_text: item.help_text || item.helpText || null,
          required: item.required !== undefined ? item.required : true,
          metadata: item.metadata ? JSON.stringify(item.metadata) : null,
          isActive: true
        }
      });
      
      itemRecords.push(itemRecord);
      
      // Importar opciones específicas del ítem si existen
      if (item.specific_options || item.specificOptions) {
        const specificOptions = item.specific_options || item.specificOptions;
        await this.importItemSpecificOptions(scaleId, item.id, specificOptions);
      }
    }
    
    console.log(`✅ Created ${itemRecords.length} items`);
    return itemRecords;
  }

  /**
   * Importa opciones específicas de un ítem
   */
  async importItemSpecificOptions(scaleId, itemId, specificOptions) {
    if (!specificOptions || !Array.isArray(specificOptions)) return;
    
    console.log(`   📎 Importing ${specificOptions.length} specific options for item ${itemId}`);
    
    for (const option of specificOptions) {
      await prisma.scaleItemSpecificOption.create({
        data: {
          id: option.id,
          itemId: itemId,
          optionValue: option.value,
          optionLabel: option.label,
          scoreValue: option.score,
          displayOrder: option.order_index || option.displayOrder || option.orderIndex || 1,
          metadata: option.metadata ? JSON.stringify(option.metadata) : null,
          isActive: true
        }
      });
    }
  }

  /**
   * Importa subescalas
   */
  async importSubscales(scaleId, subscales) {
    if (!subscales || !Array.isArray(subscales)) return [];
    
    console.log(`📊 Importing ${subscales.length} subscales`);
    
    const subscaleRecords = [];
    
    for (const subscale of subscales) {
      const subscaleRecord = await prisma.scaleSubscale.create({
        data: {
          id: subscale.id,
          scaleId: scaleId,
          subscaleName: subscale.name,
          items: JSON.stringify(subscale.items),
          minScore: subscale.min_score || subscale.minScore || 0,
          maxScore: subscale.max_score || subscale.maxScore || 100,
          description: subscale.description || null,
          referencias_bibliograficas: subscale.referencias_bibliograficas || subscale.references || null,
          indice_cronbach: subscale.indice_cronbach || subscale.cronbachAlpha || null
        }
      });
      
      subscaleRecords.push(subscaleRecord);
    }
    
    console.log(`✅ Created ${subscaleRecords.length} subscales`);
    return subscaleRecords;
  }

  /**
   * Importa reglas de interpretación
   */
  async importInterpretationRules(scaleId, interpretationRules) {
    if (!interpretationRules || !Array.isArray(interpretationRules)) return [];
    
    console.log(`🎯 Importing ${interpretationRules.length} interpretation rules`);
    
    const ruleRecords = [];
    
    for (const rule of interpretationRules) {
      const ruleRecord = await prisma.scaleInterpretationRule.create({
        data: {
          id: rule.id,
          scaleId: scaleId,
          minScore: rule.min_score || rule.minScore || 0,
          maxScore: rule.max_score || rule.maxScore || 100,
          severityLevel: rule.severity_level || rule.severityLevel,
          interpretationLabel: rule.label || rule.interpretationLabel,
          colorCode: rule.color || rule.colorCode || '#6b7280',
          description: rule.description || null,
          recommendations: rule.recommendations || null,
          isActive: true
        }
      });
      
      ruleRecords.push(ruleRecord);
    }
    
    console.log(`✅ Created ${ruleRecords.length} interpretation rules`);
    return ruleRecords;
  }

  /**
   * Importa documentación científica
   */
  async importDocumentation(scaleId, documentation) {
    if (!documentation) return null;
    
    console.log(`📚 Importing documentation for scale ${scaleId}`);
    
    const docRecord = await prisma.scaleDocumentation.create({
      data: {
        id: `${scaleId}-doc`,
        scaleId: scaleId,
        bibliography: documentation.bibliography || null,
        sources_consulted: documentation.sources_consulted ? JSON.stringify(documentation.sources_consulted) : null,
        implementation_notes: documentation.implementation_notes || null,
        psychometric_properties: documentation.psychometric_properties ? JSON.stringify(documentation.psychometric_properties) : null,
        clinical_considerations: documentation.clinical_considerations || null,
        special_items_notes: documentation.special_items_notes ? JSON.stringify(documentation.special_items_notes) : null,
        version_notes: documentation.version_notes || null,
        target_population_details: documentation.target_population_details || null,
        clinical_interpretation: documentation.clinical_interpretation || null
      }
    });
    
    console.log(`✅ Created documentation record`);
    return docRecord;
  }

  /**
   * Valida la importación verificando completitud
   */
  async validateImport(scaleId, originalData) {
    console.log(`🔍 Validating import completeness for ${scaleId}`);
    
    const scale = await prisma.scale.findUnique({
      where: { id: scaleId },
      include: {
        items: true,
        responseOptions: true,
        subscales: true,
        interpretationRules: true,
        scale_documentation: true
      }
    });

    // Get response groups separately as they don't have a direct relation
    const responseGroups = await prisma.scaleResponseGroup.findMany({
      where: { scaleId }
    });

    if (!scale) {
      throw new Error(`Scale ${scaleId} not found after import`);
    }

    const issues = [];

    // Validar items
    if (scale.items.length !== originalData.items.length) {
      issues.push(`Items count mismatch: expected ${originalData.items.length}, got ${scale.items.length}`);
    }

    // Validar subescalas
    const expectedSubscales = originalData.subscales?.length || 0;
    if (scale.subscales.length !== expectedSubscales) {
      issues.push(`Subscales count mismatch: expected ${expectedSubscales}, got ${scale.subscales.length}`);
    }

    // Validar reglas de interpretación
    const expectedRules = originalData.interpretation_rules?.length || 0;
    if (scale.interpretationRules.length !== expectedRules) {
      issues.push(`Interpretation rules count mismatch: expected ${expectedRules}, got ${scale.interpretationRules.length}`);
    }

    if (issues.length > 0) {
      console.warn(`⚠️  Import validation issues for ${scaleId}:`);
      issues.forEach(issue => console.warn(`   - ${issue}`));
    } else {
      console.log(`✅ Import validation successful for ${scaleId}`);
    }

    return {
      valid: issues.length === 0,
      issues: issues,
      stats: {
        items: scale.items.length,
        subscales: scale.subscales.length,
        interpretationRules: scale.interpretationRules.length,
        responseOptions: scale.responseOptions.length,
        responseGroups: responseGroups.length
      }
    };
  }

  /**
   * Importa una escala completa desde JSON
   */
  async importScale(jsonFilePath) {
    const filename = path.basename(jsonFilePath);
    console.log(`\n🚀 Starting import of ${filename}`);
    console.log(`📁 File: ${jsonFilePath}`);
    
    try {
      // Leer y parsear JSON
      const rawData = fs.readFileSync(jsonFilePath, 'utf8');
      const scaleData = JSON.parse(rawData);
      
      // Validar estructura JSON
      if (!this.validateScaleJSON(scaleData, filename)) {
        throw new Error('JSON validation failed');
      }
      
      const scaleId = scaleData.scale.id;
      
      // Limpiar datos existentes  
      await this.cleanExistingScale(scaleId);
      
      // Importar en orden correcto
      console.log(`\n📋 Importing components for ${scaleId}:`);
      
      // 1. Escala principal
      await this.importMainScale(scaleData);
      
      // 2. Grupos de respuesta
      await this.importResponseGroups(scaleId, scaleData.response_groups || scaleData.responseGroups);
      
      // 3. Opciones de respuesta globales
      await this.importGlobalResponseOptions(scaleId, scaleData.response_options || scaleData.responseOptions);
      
      // 4. Opciones de respuesta por grupo
      await this.importGroupResponseOptions(scaleId, scaleData.response_groups || scaleData.responseGroups);
      
      // 5. Ítems de la escala
      await this.importScaleItems(scaleId, scaleData.items);
      
      // 6. Subescalas
      await this.importSubscales(scaleId, scaleData.subscales);
      
      // 7. Reglas de interpretación
      await this.importInterpretationRules(scaleId, scaleData.interpretation_rules || scaleData.interpretationRules);
      
      // 8. Documentación
      await this.importDocumentation(scaleId, scaleData.documentation);
      
      // 9. Validar importación
      const validation = await this.validateImport(scaleId, scaleData);
      
      console.log(`\n🎉 Successfully imported ${scaleId}!`);
      console.log(`📊 Import stats:`, validation.stats);
      
      this.stats.successful++;
      return { success: true, scaleId, validation };
      
    } catch (error) {
      console.error(`\n❌ Failed to import ${filename}:`);
      console.error(`   Error: ${error.message}`);
      
      this.stats.failed++;
      this.stats.errors.push({ file: filename, error: error.message });
      
      return { success: false, error: error.message };
    } finally {
      this.stats.processed++;
    }
  }

  /**
   * Importa múltiples escalas desde un directorio
   */
  async importBatch(directory) {
    console.log(`\n📁 Batch import from directory: ${directory}`);
    
    const files = fs.readdirSync(directory)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(directory, file));
    
    if (files.length === 0) {
      console.log('❌ No JSON files found in directory');
      return;
    }
    
    console.log(`📋 Found ${files.length} JSON files to import`);
    
    for (const file of files) {
      await this.importScale(file);
    }
    
    this.printSummary();
  }

  /**
   * Imprime resumen de importación
   */
  printSummary() {
    console.log(`\n📈 IMPORT SUMMARY:`);
    console.log(`   Total processed: ${this.stats.processed}`);
    console.log(`   Successful: ${this.stats.successful}`);
    console.log(`   Failed: ${this.stats.failed}`);
    
    if (this.stats.errors.length > 0) {
      console.log(`\n❌ Errors:`);
      this.stats.errors.forEach(error => {
        console.log(`   - ${error.file}: ${error.error}`);
      });
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🔧 Universal Scale Importer

Usage:
  node scripts/universal-scale-importer.js <file.json>     # Import single scale
  node scripts/universal-scale-importer.js --batch <dir>  # Import all JSON files in directory

Examples:
  node scripts/universal-scale-importer.js scales/bdi-21.json
  node scripts/universal-scale-importer.js --batch scales/
    `);
    process.exit(1);
  }
  
  const importer = new UniversalScaleImporter();
  
  try {
    if (args[0] === '--batch') {
      if (!args[1]) {
        console.error('❌ Directory path required for batch import');
        process.exit(1);
      }
      await importer.importBatch(args[1]);
    } else {
      const result = await importer.importScale(args[0]);
      if (!result.success) {
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = UniversalScaleImporter;