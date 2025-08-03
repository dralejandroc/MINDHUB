/**
 * GESTOR DE VERSIONES DE PLANTILLAS CLINIMETRIXPRO
 * 
 * Maneja el versionado semántico de plantillas científicas
 * Incluye migración automática y compatibilidad hacia atrás
 */

const semver = require('semver');
const crypto = require('crypto');

class TemplateVersionManager {
  constructor() {
    this.versionHistory = new Map();
    this.migrationRules = new Map();
    this.deprecationPlan = new Map();
  }

  /**
   * Crear una nueva versión de plantilla
   * @param {Object} template - Plantilla actual
   * @param {string} changeType - Tipo de cambio: 'major', 'minor', 'patch'
   * @param {Array} changes - Lista de cambios realizados
   * @returns {Object} - Nueva plantilla versionada
   */
  createNewVersion(template, changeType, changes = []) {
    const currentVersion = template.metadata.version || '1.0.0';
    const newVersion = this.incrementVersion(currentVersion, changeType);
    
    // Crear nueva plantilla con versión incrementada
    const newTemplate = {
      ...template,
      metadata: {
        ...template.metadata,
        version: newVersion,
        previousVersion: currentVersion,
        versionHistory: this.buildVersionHistory(template, changes),
        checksum: this.generateChecksum(template)
      }
    };

    // Registrar el cambio de versión
    this.registerVersionChange(template.metadata.id, currentVersion, newVersion, changeType, changes);

    return newTemplate;
  }

  /**
   * Incrementar versión según tipo de cambio
   * @param {string} currentVersion - Versión actual
   * @param {string} changeType - Tipo de cambio
   * @returns {string} - Nueva versión
   */
  incrementVersion(currentVersion, changeType) {
    switch (changeType) {
      case 'major':
        return semver.inc(currentVersion, 'major');
      case 'minor':
        return semver.inc(currentVersion, 'minor');
      case 'patch':
        return semver.inc(currentVersion, 'patch');
      default:
        throw new Error(`Invalid change type: ${changeType}`);
    }
  }

  /**
   * Analizar diferencias entre versiones
   * @param {Object} oldTemplate - Plantilla anterior
   * @param {Object} newTemplate - Plantilla nueva
   * @returns {Object} - Análisis de diferencias
   */
  analyzeChanges(oldTemplate, newTemplate) {
    const changes = {
      type: 'patch', // Default
      breaking: false,
      additions: [],
      modifications: [],
      deletions: [],
      details: []
    };

    // Analizar cambios en metadata
    const metadataChanges = this.compareMetadata(oldTemplate.metadata, newTemplate.metadata);
    if (metadataChanges.length > 0) {
      changes.modifications.push('metadata');
      changes.details.push(...metadataChanges);
    }

    // Analizar cambios en estructura
    const structureChanges = this.compareStructure(oldTemplate.structure, newTemplate.structure);
    if (structureChanges.breaking) {
      changes.type = 'major';
      changes.breaking = true;
    } else if (structureChanges.additions.length > 0) {
      changes.type = 'minor';
    }
    changes.additions.push(...structureChanges.additions);
    changes.modifications.push(...structureChanges.modifications);
    changes.deletions.push(...structureChanges.deletions);
    changes.details.push(...structureChanges.details);

    // Analizar cambios en scoring
    const scoringChanges = this.compareScoring(oldTemplate.scoring, newTemplate.scoring);
    if (scoringChanges.breaking) {
      changes.type = 'major';
      changes.breaking = true;
    }
    changes.details.push(...scoringChanges.details);

    // Analizar cambios en interpretación
    const interpretationChanges = this.compareInterpretation(oldTemplate.interpretation, newTemplate.interpretation);
    if (interpretationChanges.breaking) {
      changes.type = 'major';
      changes.breaking = true;
    }
    changes.details.push(...interpretationChanges.details);

    return changes;
  }

  /**
   * Comparar metadata entre versiones
   */
  compareMetadata(oldMeta, newMeta) {
    const changes = [];
    
    // Campos que no deben cambiar (breaking changes)
    const immutableFields = ['id', 'abbreviation', 'category'];
    for (const field of immutableFields) {
      if (oldMeta[field] !== newMeta[field]) {
        changes.push({
          type: 'breaking',
          field: `metadata.${field}`,
          old: oldMeta[field],
          new: newMeta[field]
        });
      }
    }

    // Campos que pueden cambiar sin breaking
    const mutableFields = ['name', 'description', 'estimatedDurationMinutes'];
    for (const field of mutableFields) {
      if (oldMeta[field] !== newMeta[field]) {
        changes.push({
          type: 'modification',
          field: `metadata.${field}`,
          old: oldMeta[field],
          new: newMeta[field]
        });
      }
    }

    return changes;
  }

  /**
   * Comparar estructura entre versiones
   */
  compareStructure(oldStructure, newStructure) {
    const changes = {
      breaking: false,
      additions: [],
      modifications: [],
      deletions: [],
      details: []
    };

    // Cambio en totalItems es breaking change
    if (oldStructure.totalItems !== newStructure.totalItems) {
      const itemsAdded = newStructure.totalItems > oldStructure.totalItems;
      changes.details.push({
        type: itemsAdded ? 'addition' : 'breaking',
        field: 'structure.totalItems',
        old: oldStructure.totalItems,
        new: newStructure.totalItems
      });
      
      if (!itemsAdded) {
        changes.breaking = true;
      } else {
        changes.additions.push('items');
      }
    }

    // Comparar secciones
    const sectionChanges = this.compareSections(oldStructure.sections, newStructure.sections);
    changes.breaking = changes.breaking || sectionChanges.breaking;
    changes.additions.push(...sectionChanges.additions);
    changes.modifications.push(...sectionChanges.modifications);
    changes.deletions.push(...sectionChanges.deletions);
    changes.details.push(...sectionChanges.details);

    // Comparar subescalas
    const subscaleChanges = this.compareSubscales(oldStructure.subscales, newStructure.subscales);
    changes.additions.push(...subscaleChanges.additions);
    changes.modifications.push(...subscaleChanges.modifications);
    changes.deletions.push(...subscaleChanges.deletions);
    changes.details.push(...subscaleChanges.details);

    return changes;
  }

  /**
   * Comparar secciones
   */
  compareSections(oldSections, newSections) {
    const changes = {
      breaking: false,
      additions: [],
      modifications: [],
      deletions: [],
      details: []
    };

    const oldSectionIds = new Set(oldSections.map(s => s.id));
    const newSectionIds = new Set(newSections.map(s => s.id));

    // Secciones eliminadas (breaking change)
    for (const oldId of oldSectionIds) {
      if (!newSectionIds.has(oldId)) {
        changes.breaking = true;
        changes.deletions.push(`section:${oldId}`);
        changes.details.push({
          type: 'breaking',
          field: `sections.${oldId}`,
          action: 'deleted'
        });
      }
    }

    // Secciones agregadas
    for (const newId of newSectionIds) {
      if (!oldSectionIds.has(newId)) {
        changes.additions.push(`section:${newId}`);
        changes.details.push({
          type: 'addition',
          field: `sections.${newId}`,
          action: 'added'
        });
      }
    }

    // Secciones modificadas
    for (const section of newSections) {
      const oldSection = oldSections.find(s => s.id === section.id);
      if (oldSection) {
        const itemChanges = this.compareItems(oldSection.items, section.items);
        if (itemChanges.breaking) {
          changes.breaking = true;
        }
        if (itemChanges.details.length > 0) {
          changes.modifications.push(`section:${section.id}`);
          changes.details.push(...itemChanges.details);
        }
      }
    }

    return changes;
  }

  /**
   * Comparar ítems de una sección
   */
  compareItems(oldItems, newItems) {
    const changes = {
      breaking: false,
      details: []
    };

    const oldItemNumbers = new Set(oldItems.map(i => i.number));
    const newItemNumbers = new Set(newItems.map(i => i.number));

    // Ítems eliminados (breaking change)
    for (const oldNumber of oldItemNumbers) {
      if (!newItemNumbers.has(oldNumber)) {
        changes.breaking = true;
        changes.details.push({
          type: 'breaking',
          field: `item.${oldNumber}`,
          action: 'deleted'
        });
      }
    }

    // Ítems agregados
    for (const newNumber of newItemNumbers) {
      if (!oldItemNumbers.has(newNumber)) {
        changes.details.push({
          type: 'addition',
          field: `item.${newNumber}`,
          action: 'added'
        });
      }
    }

    // Ítems modificados
    for (const newItem of newItems) {
      const oldItem = oldItems.find(i => i.number === newItem.number);
      if (oldItem) {
        // Cambio en texto del ítem
        if (oldItem.text !== newItem.text) {
          changes.details.push({
            type: 'modification',
            field: `item.${newItem.number}.text`,
            old: oldItem.text,
            new: newItem.text
          });
        }

        // Cambio en opciones de respuesta (potencialmente breaking)
        if (JSON.stringify(oldItem.responseOptions) !== JSON.stringify(newItem.responseOptions)) {
          const responseChange = this.analyzeResponseOptionChanges(oldItem.responseOptions, newItem.responseOptions);
          if (responseChange.breaking) {
            changes.breaking = true;
          }
          changes.details.push({
            type: responseChange.breaking ? 'breaking' : 'modification',
            field: `item.${newItem.number}.responseOptions`,
            details: responseChange
          });
        }
      }
    }

    return changes;
  }

  /**
   * Analizar cambios en opciones de respuesta
   */
  analyzeResponseOptionChanges(oldOptions, newOptions) {
    const analysis = {
      breaking: false,
      optionsAdded: 0,
      optionsRemoved: 0,
      optionsModified: 0
    };

    if (!oldOptions || !newOptions) {
      return analysis;
    }

    const oldValues = new Set(oldOptions.map(o => o.value));
    const newValues = new Set(newOptions.map(o => o.value));

    // Opciones eliminadas (breaking change)
    for (const oldValue of oldValues) {
      if (!newValues.has(oldValue)) {
        analysis.breaking = true;
        analysis.optionsRemoved++;
      }
    }

    // Opciones agregadas
    for (const newValue of newValues) {
      if (!oldValues.has(newValue)) {
        analysis.optionsAdded++;
      }
    }

    // Opciones modificadas
    for (const newOption of newOptions) {
      const oldOption = oldOptions.find(o => o.value === newOption.value);
      if (oldOption) {
        if (oldOption.score !== newOption.score) {
          analysis.breaking = true; // Cambio en puntuación es breaking
        }
        if (oldOption.label !== newOption.label) {
          analysis.optionsModified++;
        }
      }
    }

    return analysis;
  }

  /**
   * Comparar subescalas
   */
  compareSubscales(oldSubscales = [], newSubscales = []) {
    const changes = {
      additions: [],
      modifications: [],
      deletions: [],
      details: []
    };

    const oldIds = new Set(oldSubscales.map(s => s.id));
    const newIds = new Set(newSubscales.map(s => s.id));

    // Subescalas eliminadas
    for (const oldId of oldIds) {
      if (!newIds.has(oldId)) {
        changes.deletions.push(`subscale:${oldId}`);
        changes.details.push({
          type: 'deletion',
          field: `subscales.${oldId}`,
          action: 'deleted'
        });
      }
    }

    // Subescalas agregadas
    for (const newId of newIds) {
      if (!oldIds.has(newId)) {
        changes.additions.push(`subscale:${newId}`);
        changes.details.push({
          type: 'addition',
          field: `subscales.${newId}`,
          action: 'added'
        });
      }
    }

    return changes;
  }

  /**
   * Comparar scoring
   */
  compareScoring(oldScoring, newScoring) {
    const changes = {
      breaking: false,
      details: []
    };

    // Cambio en método de scoring (breaking)
    if (oldScoring.method !== newScoring.method) {
      changes.breaking = true;
      changes.details.push({
        type: 'breaking',
        field: 'scoring.method',
        old: oldScoring.method,
        new: newScoring.method
      });
    }

    // Cambio en rango de puntuación (breaking)
    if (JSON.stringify(oldScoring.scoreRange) !== JSON.stringify(newScoring.scoreRange)) {
      changes.breaking = true;
      changes.details.push({
        type: 'breaking',
        field: 'scoring.scoreRange',
        old: oldScoring.scoreRange,
        new: newScoring.scoreRange
      });
    }

    return changes;
  }

  /**
   * Comparar interpretación
   */
  compareInterpretation(oldInterpretation, newInterpretation) {
    const changes = {
      breaking: false,
      details: []
    };

    // Comparar reglas de interpretación
    const oldRules = oldInterpretation.rules || [];
    const newRules = newInterpretation.rules || [];

    if (JSON.stringify(oldRules) !== JSON.stringify(newRules)) {
      // Determinar si es breaking change
      const rulesAnalysis = this.analyzeInterpretationRulesChanges(oldRules, newRules);
      changes.breaking = rulesAnalysis.breaking;
      changes.details.push({
        type: rulesAnalysis.breaking ? 'breaking' : 'modification',
        field: 'interpretation.rules',
        details: rulesAnalysis
      });
    }

    return changes;
  }

  /**
   * Analizar cambios en reglas de interpretación
   */
  analyzeInterpretationRulesChanges(oldRules, newRules) {
    const analysis = {
      breaking: false,
      rulesAdded: 0,
      rulesRemoved: 0,
      rulesModified: 0
    };

    // Crear mapas por rango de puntuación
    const oldRanges = new Map();
    const newRanges = new Map();

    oldRules.forEach(rule => {
      const key = `${rule.minScore}-${rule.maxScore}`;
      oldRanges.set(key, rule);
    });

    newRules.forEach(rule => {
      const key = `${rule.minScore}-${rule.maxScore}`;
      newRanges.set(key, rule);
    });

    // Rangos eliminados (breaking change)
    for (const [range, rule] of oldRanges) {
      if (!newRanges.has(range)) {
        analysis.breaking = true;
        analysis.rulesRemoved++;
      }
    }

    // Rangos agregados
    for (const [range, rule] of newRanges) {
      if (!oldRanges.has(range)) {
        analysis.rulesAdded++;
      }
    }

    // Rangos modificados
    for (const [range, newRule] of newRanges) {
      const oldRule = oldRanges.get(range);
      if (oldRule) {
        if (oldRule.severity !== newRule.severity || oldRule.label !== newRule.label) {
          analysis.breaking = true; // Cambio en interpretación es breaking
        }
      }
    }

    return analysis;
  }

  /**
   * Construir historial de versiones
   */
  buildVersionHistory(template, changes) {
    const existingHistory = template.metadata.versionHistory || [];
    
    const newEntry = {
      version: template.metadata.version,
      timestamp: new Date().toISOString(),
      changes: changes,
      author: 'system', // TODO: integrar con sistema de usuarios
      checksum: this.generateChecksum(template)
    };

    return [...existingHistory, newEntry];
  }

  /**
   * Generar checksum de plantilla
   */
  generateChecksum(template) {
    // Crear una copia sin metadatos de versión para calcular checksum
    const templateForChecksum = {
      ...template,
      metadata: {
        ...template.metadata,
        version: undefined,
        previousVersion: undefined,
        versionHistory: undefined,
        checksum: undefined
      }
    };

    const content = JSON.stringify(templateForChecksum, Object.keys(templateForChecksum).sort());
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Registrar cambio de versión
   */
  registerVersionChange(templateId, oldVersion, newVersion, changeType, changes) {
    if (!this.versionHistory.has(templateId)) {
      this.versionHistory.set(templateId, []);
    }

    const history = this.versionHistory.get(templateId);
    history.push({
      oldVersion,
      newVersion,
      changeType,
      changes,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Obtener historial de versiones de una plantilla
   */
  getVersionHistory(templateId) {
    return this.versionHistory.get(templateId) || [];
  }

  /**
   * Validar compatibilidad entre versiones
   */
  isCompatible(fromVersion, toVersion) {
    const fromMajor = semver.major(fromVersion);
    const toMajor = semver.major(toVersion);
    
    // Versiones con diferentes major son incompatibles
    return fromMajor === toMajor;
  }

  /**
   * Crear regla de migración
   */
  createMigrationRule(fromVersion, toVersion, migrationFunction) {
    const key = `${fromVersion}->${toVersion}`;
    this.migrationRules.set(key, migrationFunction);
  }

  /**
   * Migrar datos entre versiones
   */
  async migrateData(data, fromVersion, toVersion) {
    const key = `${fromVersion}->${toVersion}`;
    const migrationRule = this.migrationRules.get(key);
    
    if (!migrationRule) {
      throw new Error(`No migration rule found for ${fromVersion} -> ${toVersion}`);
    }

    return await migrationRule(data);
  }

  /**
   * Planificar deprecación de versión
   */
  planDeprecation(templateId, version, deprecationDate, removalDate) {
    this.deprecationPlan.set(`${templateId}:${version}`, {
      deprecationDate,
      removalDate,
      isDeprecated: new Date() >= new Date(deprecationDate),
      isRemoved: new Date() >= new Date(removalDate)
    });
  }

  /**
   * Verificar si una versión está deprecada
   */
  isDeprecated(templateId, version) {
    const key = `${templateId}:${version}`;
    const plan = this.deprecationPlan.get(key);
    return plan ? plan.isDeprecated : false;
  }

  /**
   * Obtener versión más reciente de una plantilla
   */
  getLatestVersion(templateId) {
    const history = this.getVersionHistory(templateId);
    if (history.length === 0) return null;
    
    const versions = history.map(h => h.newVersion);
    return semver.maxSatisfying(versions, '*');
  }
}

module.exports = TemplateVersionManager;