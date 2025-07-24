/**
 * Parser para archivos de escalas en formato Markdown
 * Extrae tanto el JSON de la escala como la documentación científica
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ScaleMarkdownParser {
  constructor() {
    this.sections = {
      sources: [],
      jsonData: null,
      implementationNotes: '',
      bibliography: '',
      psychometricProperties: {},
      clinicalConsiderations: ''
    };
  }

  /**
   * Parsea un archivo markdown de escala
   * @param {string} filePath - Ruta al archivo markdown
   * @returns {Object} Objeto con scaleData y documentation
   */
  async parseScaleFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      // Extraer el título/nombre de la escala
      const titleMatch = content.match(/^#\s+(.+?)(?:\s*-\s*(.+))?$/m);
      const scaleName = titleMatch ? titleMatch[1].trim() : 'Unknown Scale';
      const fullName = titleMatch && titleMatch[2] ? titleMatch[2].trim() : scaleName;

      // Parsear las diferentes secciones
      this.extractSources(content);
      this.extractJSON(content);
      this.extractImplementationNotes(content);
      this.extractPsychometricProperties(content);
      this.extractClinicalConsiderations(content);

      if (!this.sections.jsonData) {
        throw new Error('No se encontró JSON válido en el archivo');
      }

      // Generar documentación estructurada
      const documentation = {
        id: uuidv4(),
        scale_id: this.sections.jsonData.scale.id,
        bibliography: this.formatBibliography(),
        sources_consulted: JSON.stringify(this.sections.sources),
        implementation_notes: this.sections.implementationNotes,
        psychometric_properties: JSON.stringify(this.sections.psychometricProperties),
        clinical_considerations: this.sections.clinicalConsiderations,
        special_items_notes: this.extractSpecialItemsNotes(),
        version_notes: this.extractVersionNotes(content),
        target_population_details: this.extractTargetPopulationDetails(),
        clinical_interpretation: this.extractClinicalInterpretation()
      };

      return {
        scaleData: this.sections.jsonData,
        documentation: documentation,
        metadata: {
          originalFile: path.basename(filePath),
          scaleName: scaleName,
          fullName: fullName,
          parsedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      throw new Error(`Error parseando archivo ${filePath}: ${error.message}`);
    }
  }

  /**
   * Extrae las fuentes consultadas
   */
  extractSources(content) {
    const sourcesSection = content.match(/##\s*Fuentes Consultadas\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (sourcesSection) {
      const sources = sourcesSection[1].split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => {
          const sourceText = line.replace(/^-\s*/, '').trim();
          // Intentar parsear autor, año, título
          const match = sourceText.match(/^(.+?)\s*\((\d{4}(?:,\s*\d{4})?)\)\.\s*(.+)$/);
          if (match) {
            return {
              authors: match[1].trim(),
              year: match[2].trim(),
              title: match[3].trim(),
              fullReference: sourceText
            };
          }
          return { fullReference: sourceText };
        });
      this.sections.sources = sources;
    }
  }

  /**
   * Extrae el JSON de la escala
   */
  extractJSON(content) {
    const jsonMatch = content.match(/```json\s*\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        this.sections.jsonData = JSON.parse(jsonMatch[1]);
      } catch (error) {
        throw new Error(`Error parseando JSON: ${error.message}`);
      }
    }
  }

  /**
   * Extrae las notas de implementación
   */
  extractImplementationNotes(content) {
    const notesSection = content.match(/##\s*Notas de Implementación\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (notesSection) {
      this.sections.implementationNotes = notesSection[1].trim();
    }
  }

  /**
   * Extrae propiedades psicométricas del contenido
   */
  extractPsychometricProperties(content) {
    const properties = {};
    
    // Buscar alpha de Cronbach
    const alphaMatch = content.match(/(?:α|alpha|Alpha de Cronbach)[^\d]*([0-9.]+)/gi);
    if (alphaMatch) {
      properties.cronbach_alpha = alphaMatch.map(match => 
        match.match(/([0-9.]+)/)[1]
      );
    }

    // Buscar confiabilidad test-retest
    const testRetestMatch = content.match(/test-retest[^\d]*([0-9.]+)/gi);
    if (testRetestMatch) {
      properties.test_retest = testRetestMatch[0].match(/([0-9.]+)/)[1];
    }

    // Buscar validez
    const validityMatch = content.match(/validez[^\d]*([0-9.]+)/gi);
    if (validityMatch) {
      properties.validity = validityMatch.map(match => 
        match.match(/([0-9.]+)/)[1]
      );
    }

    // También extraer del JSON si existe
    if (this.sections.jsonData?.metadata?.psychometricProperties) {
      Object.assign(properties, this.sections.jsonData.metadata.psychometricProperties);
    }

    this.sections.psychometricProperties = properties;
  }

  /**
   * Extrae consideraciones clínicas
   */
  extractClinicalConsiderations(content) {
    const clinicalSection = content.match(/##\s*(?:Consideraciones Clínicas|Aplicación Clínica)\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (clinicalSection) {
      this.sections.clinicalConsiderations = clinicalSection[1].trim();
    }
  }

  /**
   * Formatea la bibliografía completa
   */
  formatBibliography() {
    if (this.sections.sources.length === 0) return '';
    
    return this.sections.sources
      .map(source => source.fullReference || 
        `${source.authors} (${source.year}). ${source.title}`)
      .join('\n\n');
  }

  /**
   * Extrae notas sobre ítems especiales (inversos, alertas, etc.)
   */
  extractSpecialItemsNotes() {
    const notes = {
      reverseScored: [],
      alertTriggers: [],
      conditionalItems: []
    };

    if (this.sections.jsonData?.items) {
      this.sections.jsonData.items.forEach(item => {
        if (item.reverseScored) {
          notes.reverseScored.push({
            itemNumber: item.number,
            itemId: item.id
          });
        }
        if (item.alertTrigger) {
          notes.alertTriggers.push({
            itemNumber: item.number,
            itemId: item.id,
            condition: item.alertCondition
          });
        }
      });
    }

    // También buscar en las notas de implementación
    const reverseNotesMatch = this.sections.implementationNotes.match(/[íi]tems?\s+inversos?[^:]*:\s*([^.]+)/i);
    if (reverseNotesMatch) {
      notes.reverseItemsNote = reverseNotesMatch[1].trim();
    }

    return JSON.stringify(notes);
  }

  /**
   * Extrae notas de versión
   */
  extractVersionNotes(content) {
    const versionMatch = content.match(/##\s*(?:Versión|Version|Adaptación)\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (versionMatch) {
      return versionMatch[1].trim();
    }
    
    // También buscar en el JSON
    if (this.sections.jsonData?.scale?.version) {
      return `Versión ${this.sections.jsonData.scale.version}`;
    }
    
    return '';
  }

  /**
   * Extrae detalles de población objetivo
   */
  extractTargetPopulationDetails() {
    if (this.sections.jsonData?.scale?.target_population) {
      return this.sections.jsonData.scale.target_population;
    }
    
    // Buscar en el contenido
    const populationMatch = this.sections.implementationNotes.match(/población[^:]*:\s*([^.]+)/i);
    if (populationMatch) {
      return populationMatch[1].trim();
    }
    
    return '';
  }

  /**
   * Extrae guías de interpretación clínica adicionales
   */
  extractClinicalInterpretation() {
    const interpretationNotes = [];
    
    // Buscar notas sobre interpretación en las notas de implementación
    const interpretMatch = this.sections.implementationNotes.match(/interpretación[^:]*:\s*([^.]+)/i);
    if (interpretMatch) {
      interpretationNotes.push(interpretMatch[1].trim());
    }
    
    // Agregar información de las reglas de interpretación
    if (this.sections.jsonData?.interpretationRules) {
      const rulesCount = this.sections.jsonData.interpretationRules.length;
      interpretationNotes.push(`La escala incluye ${rulesCount} reglas de interpretación predefinidas.`);
    }
    
    return interpretationNotes.join(' ');
  }
}

module.exports = ScaleMarkdownParser;