/**
 * SERVICIO DE EXPORTACIÓN PARA ESCALAS
 * Maneja exportación de escalas y evaluaciones a diferentes formatos
 */

const fs = require('fs');
const path = require('path');

class ScaleExportService {

  /**
   * Exporta una escala a formato JSON
   */
  exportScaleToJson(scale) {
    try {
      return {
        metadata: {
          exportedAt: new Date().toISOString(),
          version: '1.0',
          format: 'universal-scale-json'
        },
        scale: scale.toJSON()
      };
    } catch (error) {
      console.error('Error exportando escala a JSON:', error);
      throw error;
    }
  }

  /**
   * Exporta una escala a formato CSV
   */
  exportScaleToCSV(scale) {
    try {
      const csvData = {
        scale: this.scaleToCSV(scale),
        items: this.itemsToCSV(scale.items),
        responseOptions: this.responseOptionsToCSV(scale.responseOptions),
        interpretationRules: this.interpretationRulesToCSV(scale.interpretationRules)
      };

      return csvData;
    } catch (error) {
      console.error('Error exportando escala a CSV:', error);
      throw error;
    }
  }

  /**
   * Exporta evaluaciones a formato CSV
   */
  exportAssessmentsToCSV(assessments) {
    try {
      const headers = [
        'ID Evaluación',
        'ID Escala',
        'Nombre Escala',
        'Paciente',
        'Puntuación Total',
        'Completitud %',
        'Modo Administración',
        'Fecha Completada',
        'Severidad',
        'Interpretación'
      ];

      const rows = assessments.map(assessment => [
        assessment.id,
        assessment.scaleId,
        assessment.scaleName || assessment.scaleId,
        assessment.patientName || 'Anónimo',
        assessment.totalScore,
        assessment.completionPercentage,
        assessment.administrationMode,
        assessment.completedAt,
        assessment.interpretation?.severity || '',
        assessment.interpretation?.label || ''
      ]);

      return {
        headers,
        rows,
        filename: `evaluaciones_${new Date().toISOString().split('T')[0]}.csv`
      };
    } catch (error) {
      console.error('Error exportando evaluaciones a CSV:', error);
      throw error;
    }
  }

  /**
   * Exporta evaluaciones con respuestas detalladas
   */
  exportDetailedAssessmentsToCSV(assessments) {
    try {
      const headers = [
        'ID Evaluación',
        'ID Escala',
        'Paciente',
        'Número Item',
        'Texto Item',
        'Valor Respuesta',
        'Etiqueta Respuesta',
        'Puntuación',
        'Fecha Completada'
      ];

      const rows = [];
      assessments.forEach(assessment => {
        assessment.responses.forEach(response => {
          rows.push([
            assessment.id,
            assessment.scaleId,
            assessment.patientName || 'Anónimo',
            response.itemNumber,
            response.itemText || '',
            response.responseValue,
            response.responseLabel,
            response.scoreValue,
            assessment.completedAt
          ]);
        });
      });

      return {
        headers,
        rows,
        filename: `evaluaciones_detalladas_${new Date().toISOString().split('T')[0]}.csv`
      };
    } catch (error) {
      console.error('Error exportando evaluaciones detalladas a CSV:', error);
      throw error;
    }
  }

  /**
   * Exporta estadísticas de escalas
   */
  exportScaleStatsToCSV(stats) {
    try {
      const headers = [
        'ID Escala',
        'Nombre',
        'Abreviación',
        'Total Evaluaciones',
        'Último Uso',
        'Puntuación Promedio',
        'Puntuación Mínima',
        'Puntuación Máxima'
      ];

      const rows = stats.map(stat => [
        stat.id,
        stat.name,
        stat.abbreviation,
        stat.assessment_count || 0,
        stat.last_used || '',
        stat.avg_score || '',
        stat.min_score || '',
        stat.max_score || ''
      ]);

      return {
        headers,
        rows,
        filename: `estadisticas_escalas_${new Date().toISOString().split('T')[0]}.csv`
      };
    } catch (error) {
      console.error('Error exportando estadísticas a CSV:', error);
      throw error;
    }
  }

  /**
   * Genera reporte PDF de evaluación (estructura básica)
   */
  generateAssessmentPDFData(assessment, scale) {
    try {
      return {
        title: `Reporte de Evaluación - ${scale.name}`,
        metadata: {
          scaleId: scale.id,
          scaleName: scale.name,
          scaleAbbreviation: scale.abbreviation,
          patientName: assessment.patientName || 'Anónimo',
          completedAt: assessment.completedAt,
          administrationMode: assessment.administrationMode
        },
        results: {
          totalScore: assessment.totalScore,
          completionPercentage: assessment.completionPercentage,
          interpretation: assessment.interpretation,
          alerts: assessment.alerts || []
        },
        responses: assessment.responses.map(response => ({
          itemNumber: response.itemNumber,
          itemText: scale.items.find(item => item.itemNumber === response.itemNumber)?.itemText || '',
          responseLabel: response.responseLabel,
          score: response.scoreValue
        })),
        subscaleResults: assessment.subscaleResults || [],
        recommendations: assessment.interpretation?.recommendations || [],
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generando datos para PDF:', error);
      throw error;
    }
  }

  /**
   * Exporta escala a formato SQL seed
   */
  exportScaleToSQLSeed(scale) {
    try {
      const sqlLines = [];
      
      // Comentario de encabezado
      sqlLines.push(`-- Seed SQL para escala: ${scale.name} (${scale.abbreviation})`);
      sqlLines.push(`-- Generado: ${new Date().toISOString()}`);
      sqlLines.push('');

      // Insertar escala principal
      sqlLines.push('-- Insertar escala principal');
      sqlLines.push(`INSERT INTO scales (
        id, name, abbreviation, version, category, subcategory, description,
        author, publication_year, estimated_duration_minutes, administration_mode,
        target_population, total_items, scoring_method, score_range_min,
        score_range_max, instructions_professional, instructions_patient, is_active
      ) VALUES (
        '${scale.id}',
        '${this.escapeSQLString(scale.name)}',
        '${scale.abbreviation}',
        '${scale.version}',
        '${scale.category || ''}',
        '${scale.subcategory || ''}',
        '${this.escapeSQLString(scale.description || '')}',
        '${this.escapeSQLString(scale.author || '')}',
        ${scale.publicationYear || 'NULL'},
        ${scale.estimatedDurationMinutes || 'NULL'},
        '${scale.administrationMode}',
        '${this.escapeSQLString(scale.targetPopulation || '')}',
        ${scale.totalItems},
        '${scale.scoringMethod || ''}',
        ${scale.scoreRangeMin || 'NULL'},
        ${scale.scoreRangeMax || 'NULL'},
        '${this.escapeSQLString(scale.instructionsProfessional || '')}',
        '${this.escapeSQLString(scale.instructionsPatient || '')}',
        1
      );`);
      sqlLines.push('');

      // Insertar items
      sqlLines.push('-- Insertar items');
      scale.items.forEach(item => {
        sqlLines.push(`INSERT INTO scale_items (id, scale_id, item_number, item_text, item_code, subscale, reverse_scored, is_active) VALUES (
          '${item.id}',
          '${scale.id}',
          ${item.itemNumber},
          '${this.escapeSQLString(item.itemText)}',
          '${item.itemCode || ''}',
          '${item.subscale || ''}',
          ${item.reverseScored ? 1 : 0},
          1
        );`);
      });
      sqlLines.push('');

      // Insertar opciones de respuesta
      sqlLines.push('-- Insertar opciones de respuesta');
      scale.responseOptions.forEach(option => {
        sqlLines.push(`INSERT INTO scale_response_options (id, scale_id, option_value, option_label, score_value, display_order, is_active) VALUES (
          '${option.id}',
          '${scale.id}',
          '${option.optionValue}',
          '${this.escapeSQLString(option.optionLabel)}',
          ${option.scoreValue},
          ${option.displayOrder || 0},
          1
        );`);
      });
      sqlLines.push('');

      // Insertar reglas de interpretación
      sqlLines.push('-- Insertar reglas de interpretación');
      scale.interpretationRules.forEach(rule => {
        sqlLines.push(`INSERT INTO scale_interpretation_rules (id, scale_id, min_score, max_score, severity_level, interpretation_label, color_code, description, recommendations, is_active) VALUES (
          '${rule.id || `${scale.id}_rule_${rule.min_score}`}',
          '${scale.id}',
          ${rule.min_score},
          ${rule.max_score},
          '${rule.severity_level}',
          '${this.escapeSQLString(rule.interpretation_label)}',
          '${rule.color_code || ''}',
          '${this.escapeSQLString(rule.description || '')}',
          '${this.escapeSQLString(rule.recommendations || '')}',
          1
        );`);
      });
      sqlLines.push('');

      // Insertar subescalas si existen
      if (scale.subscales && scale.subscales.length > 0) {
        sqlLines.push('-- Insertar subescalas');
        scale.subscales.forEach(subscale => {
          sqlLines.push(`INSERT INTO scale_subscales (id, scale_id, subscale_name, subscale_code, min_score, max_score, description, is_active) VALUES (
            '${subscale.id || `${scale.id}_subscale_${subscale.subscale_code}`}',
            '${scale.id}',
            '${this.escapeSQLString(subscale.subscale_name)}',
            '${subscale.subscale_code || ''}',
            ${subscale.min_score || 'NULL'},
            ${subscale.max_score || 'NULL'},
            '${this.escapeSQLString(subscale.description || '')}',
            1
          );`);
        });
      }

      return sqlLines.join('\n');
    } catch (error) {
      console.error('Error exportando escala a SQL seed:', error);
      throw error;
    }
  }

  /**
   * Guarda archivo de exportación
   */
  async saveExportFile(data, filename, format = 'json') {
    try {
      const exportDir = path.join(__dirname, '..', 'exports');
      
      // Crear directorio si no existe
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const filePath = path.join(exportDir, filename);
      
      let content;
      switch (format) {
        case 'json':
          content = JSON.stringify(data, null, 2);
          break;
        case 'csv':
          content = this.convertToCSVString(data);
          break;
        case 'sql':
          content = data;
          break;
        default:
          throw new Error(`Formato ${format} no soportado`);
      }

      fs.writeFileSync(filePath, content, 'utf8');
      return filePath;
    } catch (error) {
      console.error('Error guardando archivo de exportación:', error);
      throw error;
    }
  }

  // Métodos auxiliares

  scaleToCSV(scale) {
    const headers = ['id', 'name', 'abbreviation', 'version', 'category', 'totalItems', 'administrationMode'];
    const row = [
      scale.id,
      scale.name,
      scale.abbreviation,
      scale.version,
      scale.category || '',
      scale.totalItems,
      scale.administrationMode
    ];
    return { headers, rows: [row] };
  }

  itemsToCSV(items) {
    const headers = ['id', 'itemNumber', 'itemText', 'subscale', 'reverseScored'];
    const rows = items.map(item => [
      item.id,
      item.itemNumber,
      item.itemText,
      item.subscale || '',
      item.reverseScored ? 'true' : 'false'
    ]);
    return { headers, rows };
  }

  responseOptionsToCSV(options) {
    const headers = ['id', 'optionValue', 'optionLabel', 'scoreValue', 'displayOrder'];
    const rows = options.map(option => [
      option.id,
      option.optionValue,
      option.optionLabel,
      option.scoreValue,
      option.displayOrder || 0
    ]);
    return { headers, rows };
  }

  interpretationRulesToCSV(rules) {
    const headers = ['minScore', 'maxScore', 'severityLevel', 'interpretationLabel', 'description'];
    const rows = rules.map(rule => [
      rule.min_score,
      rule.max_score,
      rule.severity_level,
      rule.interpretation_label,
      rule.description || ''
    ]);
    return { headers, rows };
  }

  convertToCSVString(data) {
    if (!data.headers || !data.rows) {
      throw new Error('Datos CSV inválidos');
    }
    
    const csvRows = [data.headers.join(',')];
    data.rows.forEach(row => {
      const escapedRow = row.map(cell => {
        if (cell === null || cell === undefined) return '';
        const cellStr = cell.toString();
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      });
      csvRows.push(escapedRow.join(','));
    });
    
    return csvRows.join('\n');
  }

  escapeSQLString(str) {
    if (!str) return '';
    return str.replace(/'/g, "''");
  }
}

module.exports = ScaleExportService;