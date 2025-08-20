#!/usr/bin/env node

/**
 * SCALE VALIDATION SYSTEM
 * 
 * Valida que las escalas en la base de datos estén completas y funcionales
 * Verifica integridad, completitud y consistencia de datos
 */

const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

class ScaleValidator {
  constructor() {
    this.results = {
      total: 0,
      valid: 0,
      invalid: 0,
      issues: []
    };
  }

  /**
   * Valida una escala específica
   */
  async validateScale(scaleId) {
    console.log(`\n🔍 Validating scale: ${scaleId}`);
    
    const scale = await prisma.scale.findUnique({
      where: { id: scaleId },
      include: {
        items: {
          orderBy: { itemNumber: 'asc' },
          include: {
            scale_item_specific_options: true
          }
        },
        responseOptions: true,
        responseGroups: true,
        subscales: true,
        interpretationRules: true,
        scale_documentation: true
      }
    });

    if (!scale) {
      throw new Error(`Scale ${scaleId} not found`);
    }

    const issues = [];

    // 1. Validar información básica
    this.validateBasicInfo(scale, issues);
    
    // 2. Validar ítems
    this.validateItems(scale, issues);
    
    // 3. Validar opciones de respuesta
    this.validateResponseOptions(scale, issues);
    
    // 4. Validar subescalas
    this.validateSubscales(scale, issues);
    
    // 5. Validar reglas de interpretación
    this.validateInterpretationRules(scale, issues);
    
    // 6. Validar consistencia
    this.validateConsistency(scale, issues);

    const isValid = issues.length === 0;
    
    if (isValid) {
      console.log(`✅ Scale ${scaleId} is valid`);
      this.results.valid++;
    } else {
      console.log(`❌ Scale ${scaleId} has ${issues.length} issues:`);
      issues.forEach(issue => console.log(`   - ${issue.type}: ${issue.message}`));
      this.results.invalid++;
      this.results.issues.push({ scaleId, issues });
    }

    return {
      scaleId,
      valid: isValid,
      issues,
      stats: {
        items: scale.items.length,
        responseOptions: scale.responseOptions.length,
        responseGroups: scale.responseGroups.length,
        subscales: scale.subscales.length,
        interpretationRules: scale.interpretationRules.length,
        hasDocumentation: !!scale.scale_documentation
      }
    };
  }

  /**
   * Valida información básica de la escala
   */
  validateBasicInfo(scale, issues) {
    const required = ['id', 'name', 'abbreviation', 'description'];
    
    required.forEach(field => {
      if (!scale[field]) {
        issues.push({
          type: 'MISSING_FIELD',
          severity: 'error',
          message: `Missing required field: ${field}`
        });
      }
    });

    if (scale.totalItems && scale.items.length !== scale.totalItems) {
      issues.push({
        type: 'ITEM_COUNT_MISMATCH',
        severity: 'warning',
        message: `totalItems (${scale.totalItems}) doesn't match actual items (${scale.items.length})`
      });
    }
  }

  /**
   * Valida ítems de la escala
   */
  validateItems(scale, issues) {
    if (scale.items.length === 0) {
      issues.push({
        type: 'NO_ITEMS',
        severity: 'error',
        message: 'Scale has no items'
      });
      return;
    }

    // Verificar numeración secuencial
    const expectedNumbers = Array.from({ length: scale.items.length }, (_, i) => i + 1);
    const actualNumbers = scale.items.map(item => item.itemNumber).sort((a, b) => a - b);
    
    if (JSON.stringify(expectedNumbers) !== JSON.stringify(actualNumbers)) {
      issues.push({
        type: 'ITEM_NUMBERING',
        severity: 'error',
        message: `Item numbers are not sequential: expected 1-${scale.items.length}, got ${actualNumbers.join(', ')}`
      });
    }

    // Verificar campos requeridos en ítems
    scale.items.forEach(item => {
      if (!item.itemText) {
        issues.push({
          type: 'MISSING_ITEM_TEXT',
          severity: 'error',
          message: `Item ${item.itemNumber} missing text`
        });
      }

      if (!item.id) {
        issues.push({
          type: 'MISSING_ITEM_ID',
          severity: 'error',
          message: `Item ${item.itemNumber} missing ID`
        });
      }
    });

    // Verificar IDs únicos
    const itemIds = scale.items.map(item => item.id);
    const uniqueIds = [...new Set(itemIds)];
    if (itemIds.length !== uniqueIds.length) {
      issues.push({
        type: 'DUPLICATE_ITEM_IDS',
        severity: 'error',
        message: 'Duplicate item IDs found'
      });
    }
  }

  /**
   * Valida opciones de respuesta
   */
  validateResponseOptions(scale, issues) {
    const hasGlobalOptions = scale.responseOptions.length > 0;
    const hasResponseGroups = scale.responseGroups.length > 0;
    const hasItemSpecificOptions = scale.items.some(item => 
      item.scale_item_specific_options && item.scale_item_specific_options.length > 0
    );

    // Debe tener al menos un tipo de opciones
    if (!hasGlobalOptions && !hasResponseGroups && !hasItemSpecificOptions) {
      issues.push({
        type: 'NO_RESPONSE_OPTIONS',
        severity: 'error',
        message: 'Scale has no response options (global, groups, or item-specific)'
      });
      return;
    }

    // Validar opciones globales
    if (hasGlobalOptions) {
      this.validateOptionSet(scale.responseOptions, 'global', issues);
    }

    // Validar grupos de respuesta
    if (hasResponseGroups) {
      scale.responseGroups.forEach(group => {
        if (!group.groupKey) {
          issues.push({
            type: 'MISSING_GROUP_KEY',
            severity: 'error',
            message: `Response group ${group.id} missing groupKey`
          });
        }
      });
    }

    // Verificar que todos los ítems tengan opciones disponibles
    scale.items.forEach(item => {
      const hasSpecific = item.scale_item_specific_options && item.scale_item_specific_options.length > 0;
      const hasGroup = item.responseGroup && hasResponseGroups;
      const canUseGlobal = !item.responseGroup && hasGlobalOptions;

      if (!hasSpecific && !hasGroup && !canUseGlobal) {
        issues.push({
          type: 'ITEM_NO_OPTIONS',
          severity: 'error',
          message: `Item ${item.itemNumber} has no available response options`
        });
      }
    });
  }

  /**
   * Valida un conjunto de opciones de respuesta
   */
  validateOptionSet(options, context, issues) {
    if (options.length === 0) return;

    // Verificar que tengan valores y etiquetas
    options.forEach((option, index) => {
      if (option.optionValue === null || option.optionValue === undefined) {
        issues.push({
          type: 'MISSING_OPTION_VALUE',
          severity: 'error',
          message: `${context} option ${index + 1} missing value`
        });
      }

      if (!option.optionLabel) {
        issues.push({
          type: 'MISSING_OPTION_LABEL',
          severity: 'error',
          message: `${context} option ${index + 1} missing label`
        });
      }

      if (typeof option.scoreValue !== 'number') {
        issues.push({
          type: 'INVALID_SCORE_VALUE',
          severity: 'error',
          message: `${context} option ${index + 1} has invalid score value`
        });
      }
    });

    // Verificar valores únicos
    const values = options.map(opt => opt.optionValue);
    const uniqueValues = [...new Set(values)];
    if (values.length !== uniqueValues.length) {
      issues.push({
        type: 'DUPLICATE_OPTION_VALUES',
        severity: 'error',
        message: `${context} options have duplicate values`
      });
    }
  }

  /**
   * Valida subescalas
   */
  validateSubscales(scale, issues) {
    if (scale.subscales.length === 0) {
      // No es error si no tiene subescalas
      return;
    }

    scale.subscales.forEach(subscale => {
      if (!subscale.subscaleName) {
        issues.push({
          type: 'MISSING_SUBSCALE_NAME',
          severity: 'error',
          message: `Subscale ${subscale.id} missing name`
        });
      }

      let items = [];
      try {
        items = JSON.parse(subscale.items || '[]');
      } catch (e) {
        issues.push({
          type: 'INVALID_SUBSCALE_ITEMS',
          severity: 'error',
          message: `Subscale ${subscale.id} has invalid items JSON`
        });
        return;
      }

      if (!Array.isArray(items) || items.length === 0) {
        issues.push({
          type: 'EMPTY_SUBSCALE',
          severity: 'error',
          message: `Subscale ${subscale.id} has no items`
        });
      }

      // Verificar que los ítems existen
      const maxItemNumber = Math.max(...scale.items.map(item => item.itemNumber));
      const invalidItems = items.filter(itemNum => itemNum < 1 || itemNum > maxItemNumber);
      
      if (invalidItems.length > 0) {
        issues.push({
          type: 'INVALID_SUBSCALE_ITEM_REFS',
          severity: 'error',
          message: `Subscale ${subscale.id} references invalid items: ${invalidItems.join(', ')}`
        });
      }
    });
  }

  /**
   * Valida reglas de interpretación
   */
  validateInterpretationRules(scale, issues) {
    if (scale.interpretationRules.length === 0) {
      issues.push({
        type: 'NO_INTERPRETATION_RULES',
        severity: 'warning',
        message: 'Scale has no interpretation rules'
      });
      return;
    }

    // Verificar campos requeridos
    scale.interpretationRules.forEach(rule => {
      if (typeof rule.minScore !== 'number' || typeof rule.maxScore !== 'number') {
        issues.push({
          type: 'INVALID_SCORE_RANGE',
          severity: 'error',
          message: `Rule ${rule.id} has invalid score range`
        });
      }

      if (rule.minScore > rule.maxScore) {
        issues.push({
          type: 'INVALID_SCORE_ORDER',
          severity: 'error',
          message: `Rule ${rule.id} has minScore > maxScore`
        });
      }

      if (!rule.interpretationLabel) {
        issues.push({
          type: 'MISSING_INTERPRETATION_LABEL',
          severity: 'error',
          message: `Rule ${rule.id} missing label`
        });
      }
    });

    // Verificar cobertura completa de rangos
    const sortedRules = scale.interpretationRules.sort((a, b) => a.minScore - b.minScore);
    
    for (let i = 0; i < sortedRules.length - 1; i++) {
      const current = sortedRules[i];
      const next = sortedRules[i + 1];
      
      if (current.maxScore + 1 !== next.minScore) {
        issues.push({
          type: 'INTERPRETATION_GAP',
          severity: 'warning',
          message: `Gap in interpretation rules between ${current.maxScore} and ${next.minScore}`
        });
      }
    }
  }

  /**
   * Valida consistencia general
   */
  validateConsistency(scale, issues) {
    // Verificar que scoreRangeMax sea consistente con las opciones
    if (scale.responseOptions.length > 0) {
      const maxOptionScore = Math.max(...scale.responseOptions.map(opt => opt.scoreValue));
      const theoreticalMax = maxOptionScore * scale.items.length;
      
      if (scale.scoreRangeMax && scale.scoreRangeMax !== theoreticalMax) {
        issues.push({
          type: 'INCONSISTENT_MAX_SCORE',
          severity: 'warning',
          message: `scoreRangeMax (${scale.scoreRangeMax}) doesn't match theoretical max (${theoreticalMax})`
        });
      }
    }
  }

  /**
   * Valida todas las escalas en la base de datos
   */
  async validateAllScales() {
    console.log('🔍 Starting validation of all scales in database\n');
    
    const scales = await prisma.scale.findMany({
      where: { isActive: true },
      select: { id: true, name: true }
    });

    if (scales.length === 0) {
      console.log('❌ No active scales found in database');
      return;
    }

    console.log(`📋 Found ${scales.length} active scales to validate`);
    this.results.total = scales.length;

    const validationResults = [];

    for (const scale of scales) {
      try {
        const result = await this.validateScale(scale.id);
        validationResults.push(result);
      } catch (error) {
        console.error(`❌ Error validating ${scale.id}: ${error.message}`);
        this.results.invalid++;
        this.results.issues.push({
          scaleId: scale.id,
          issues: [{ type: 'VALIDATION_ERROR', severity: 'error', message: error.message }]
        });
      }
    }

    this.printSummary(validationResults);
    return validationResults;
  }

  /**
   * Imprime resumen de validación
   */
  printSummary(results) {
    console.log('\n📈 VALIDATION SUMMARY:');
    console.log(`   Total scales: ${this.results.total}`);
    console.log(`   Valid: ${this.results.valid} ✅`);
    console.log(`   Invalid: ${this.results.invalid} ❌`);

    if (this.results.invalid > 0) {
      console.log('\n❌ ISSUES FOUND:');
      
      this.results.issues.forEach(({ scaleId, issues }) => {
        console.log(`\n   ${scaleId}:`);
        issues.forEach(issue => {
          const icon = issue.severity === 'error' ? '🔴' : '🟡';
          console.log(`     ${icon} ${issue.type}: ${issue.message}`);
        });
      });
    }

    // Estadísticas por tipo de issue
    const issueTypes = {};
    this.results.issues.forEach(({ issues }) => {
      issues.forEach(issue => {
        issueTypes[issue.type] = (issueTypes[issue.type] || 0) + 1;
      });
    });

    if (Object.keys(issueTypes).length > 0) {
      console.log('\n📊 ISSUE TYPES:');
      Object.entries(issueTypes)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
          console.log(`   ${type}: ${count}`);
        });
    }

    console.log(`\n🎯 Success rate: ${Math.round((this.results.valid / this.results.total) * 100)}%`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const validator = new ScaleValidator();

  try {
    if (args.length > 0) {
      // Validar escala específica
      const scaleId = args[0];
      const result = await validator.validateScale(scaleId);
      
      if (!result.valid) {
        process.exit(1);
      }
    } else {
      // Validar todas las escalas
      const results = await validator.validateAllScales();
      
      if (validator.results.invalid > 0) {
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

module.exports = ScaleValidator;