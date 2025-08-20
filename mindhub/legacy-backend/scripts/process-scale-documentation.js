/**
 * Script integrado para procesar escalas con documentación científica
 * Procesa archivos markdown de escalas y genera tanto seeds como documentación
 */

const fs = require('fs').promises;
const path = require('path');
const ScaleMarkdownParser = require('./scale-markdown-parser');
const { v4: uuidv4 } = require('uuid');

class ScaleDocumentationProcessor {
  constructor() {
    this.parser = new ScaleMarkdownParser();
    this.templatesDir = path.join(__dirname, '../database/templates');
    this.seedsDir = path.join(__dirname, '../database/seeds');
    this.documentationSeedsDir = path.join(__dirname, '../database/seeds/documentation');
    this.results = {
      processed: [],
      errors: [],
      scalesSQLGenerated: [],
      documentationSQLGenerated: []
    };
  }

  /**
   * Procesa todos los archivos markdown de escalas
   */
  async processAllScales() {
    try {
      console.log('🚀 Iniciando procesamiento de escalas con documentación...\n');

      // Crear directorios si no existen
      await this.ensureDirectories();

      // Buscar archivos markdown en templates
      const files = await this.findMarkdownFiles();
      console.log(`📋 Encontrados ${files.length} archivos de escalas para procesar\n`);

      // Procesar cada archivo
      for (const file of files) {
        await this.processScaleFile(file);
      }

      // Generar archivos SQL
      await this.generateSQLFiles();

      // Mostrar resumen final
      this.showSummary();

      return this.results;

    } catch (error) {
      console.error('❌ Error en el procesamiento:', error.message);
      throw error;
    }
  }

  /**
   * Procesa todos los archivos en una carpeta específica
   */
  async processScalesFromDirectory(directoryPath) {
    try {
      const files = await fs.readdir(directoryPath);
      const markdownFiles = files.filter(file => 
        file.endsWith('.json') && !file.startsWith('.')
      );

      console.log(`📂 Procesando ${markdownFiles.length} archivos desde ${directoryPath}\n`);

      for (const file of markdownFiles) {
        const filePath = path.join(directoryPath, file);
        await this.processScaleFile(filePath);
      }

      await this.generateSQLFiles();
      this.showSummary();

      return this.results;
    } catch (error) {
      console.error('❌ Error procesando directorio:', error.message);
      throw error;
    }
  }

  /**
   * Procesa un archivo específico
   */
  async processScaleFile(filePath) {
    try {
      console.log(`📄 Procesando: ${path.basename(filePath)}`);

      // Parsear el archivo
      const parsed = await this.parser.parseScaleFile(filePath);
      
      // Validar datos básicos
      this.validateParsedData(parsed);

      // Agregar a resultados
      this.results.processed.push({
        fileName: path.basename(filePath),
        scaleId: parsed.scaleData.scale.id,
        scaleName: parsed.scaleData.scale.name || parsed.scaleData.scale.abbreviation,
        itemsCount: parsed.scaleData.items?.length || 0,
        hasDocumentation: !!parsed.documentation.bibliography,
        metadata: parsed.metadata
      });

      console.log(`   ✅ ${parsed.scaleData.scale.id} - ${parsed.scaleData.items?.length || 0} ítems`);
      
      // Guardar datos parseados para generación SQL
      this.results.scalesSQLGenerated.push(parsed.scaleData);
      this.results.documentationSQLGenerated.push(parsed.documentation);

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      this.results.errors.push({
        fileName: path.basename(filePath),
        error: error.message
      });
    }
  }

  /**
   * Busca archivos markdown en el directorio templates
   */
  async findMarkdownFiles() {
    try {
      const files = await fs.readdir(this.templatesDir);
      return files
        .filter(file => file.endsWith('.json') && !file.startsWith('.'))
        .map(file => path.join(this.templatesDir, file));
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`📁 Creando directorio templates: ${this.templatesDir}`);
        await fs.mkdir(this.templatesDir, { recursive: true });
        return [];
      }
      throw error;
    }
  }

  /**
   * Asegura que existan los directorios necesarios
   */
  async ensureDirectories() {
    const dirs = [this.seedsDir, this.documentationSeedsDir];
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
      }
    }
  }

  /**
   * Valida que los datos parseados sean correctos
   */
  validateParsedData(parsed) {
    if (!parsed.scaleData) {
      throw new Error('No se encontraron datos de escala válidos');
    }

    if (!parsed.scaleData.scale || !parsed.scaleData.scale.id) {
      throw new Error('La escala debe tener un ID válido');
    }

    if (!parsed.scaleData.items || parsed.scaleData.items.length === 0) {
      throw new Error('La escala debe tener al menos un ítem');
    }

    if (!parsed.documentation) {
      throw new Error('No se pudo generar documentación para la escala');
    }
  }

  /**
   * Genera archivos SQL para escalas y documentación
   */
  async generateSQLFiles() {
    if (this.results.scalesSQLGenerated.length === 0) {
      console.log('⚠️  No hay escalas para generar SQL');
      return;
    }

    console.log('\n🔧 Generando archivos SQL...');

    // Generar SQL para escalas
    await this.generateScalesSQL();

    // Generar SQL para documentación
    await this.generateDocumentationSQL();

    // Generar script de migración completo
    await this.generateMigrationScript();

    console.log('✅ Archivos SQL generados exitosamente');
  }

  /**
   * Genera SQL para las escalas
   */
  async generateScalesSQL() {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
    const fileName = `scales_${timestamp}.sql`;
    const filePath = path.join(this.seedsDir, fileName);

    let sql = `-- Escalas generadas automáticamente desde archivos markdown
-- Generado: ${new Date().toISOString()}
-- Escalas incluidas: ${this.results.scalesSQLGenerated.map(s => s.scale.id).join(', ')}

SET FOREIGN_KEY_CHECKS = 0;

`;

    for (const scaleData of this.results.scalesSQLGenerated) {
      sql += this.generateScaleSQL(scaleData);
      sql += '\n\n';
    }

    sql += 'SET FOREIGN_KEY_CHECKS = 1;\n';

    await fs.writeFile(filePath, sql, 'utf8');
    console.log(`   📁 Escalas SQL: ${fileName}`);
  }

  /**
   * Genera SQL para la documentación
   */
  async generateDocumentationSQL() {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
    const fileName = `documentation_${timestamp}.sql`;
    const filePath = path.join(this.documentationSeedsDir, fileName);

    let sql = `-- Documentación científica de escalas
-- Generado: ${new Date().toISOString()}

-- Crear tabla si no existe
${await this.getDocumentationTableSchema()}

`;

    for (const doc of this.results.documentationSQLGenerated) {
      sql += this.generateDocumentationSQL(doc);
      sql += '\n';
    }

    await fs.writeFile(filePath, sql, 'utf8');
    console.log(`   📚 Documentación SQL: ${fileName}`);
  }

  /**
   * Genera SQL para una escala individual
   */
  generateScaleSQL(scaleData) {
    const scale = scaleData.scale;
    const items = scaleData.items || [];
    const responseOptions = scaleData.responseOptions || [];
    const interpretationRules = scaleData.interpretationRules || [];
    const subscales = scaleData.subscales || [];

    let sql = `-- Escala: ${scale.name || scale.abbreviation}\n`;
    
    // Insert scale
    sql += `INSERT INTO scales (
      id, name, abbreviation, description, version, category, subcategory, 
      author, publication_year, total_items, estimated_duration_minutes, 
      administration_mode, target_population, scoring_method, score_range_min, 
      score_range_max, instructions_professional, instructions_patient, 
      created_at, updated_at
    ) VALUES (
      '${scale.id}',
      ${this.sqlString(scale.name || scale.abbreviation)},
      ${this.sqlString(scale.abbreviation || scale.name)},
      ${this.sqlString(scale.description)},
      ${this.sqlString(scale.version || '1.0')},
      ${this.sqlString(scale.category || 'general')},
      ${this.sqlString(scale.subcategory)},
      ${this.sqlString(scale.author)},
      ${scale.publication_year || null},
      ${scale.total_items || items.length},
      ${scale.estimated_duration_minutes || 15},
      ${this.sqlString(scale.administration_mode || 'self_administered')},
      ${this.sqlString(scale.target_population)},
      ${this.sqlString(scale.scoring_method || 'total')},
      ${scale.score_range_min || 0},
      ${scale.score_range_max || null},
      ${this.sqlString(scale.instructions_professional)},
      ${this.sqlString(scale.instructions_patient)},
      NOW(),
      NOW()
    );

`;

    // Insert scale response options
    responseOptions.forEach(option => {
      sql += `INSERT INTO scale_response_options (
        id, scale_id, option_value, option_label, score_value, display_order, 
        option_type, metadata, created_at, updated_at
      ) VALUES (
        '${option.id}',
        '${scale.id}',
        ${this.sqlString(option.value)},
        ${this.sqlString(option.label)},
        ${option.score || 0},
        ${option.orderIndex || 1},
        ${this.sqlString(option.optionType || 'standard')},
        ${this.sqlString(JSON.stringify(option.metadata || {}))},
        NOW(),
        NOW()
      );

`;
    });

    // Insert scale items
    items.forEach(item => {
      sql += `INSERT INTO scale_items (
        id, scale_id, item_number, item_text, question_type, reverse_scored, 
        alert_trigger, alert_condition, help_text, required, metadata, 
        subscale, created_at, updated_at
      ) VALUES (
        '${item.id}',
        '${scale.id}',
        ${item.number},
        ${this.sqlString(item.text)},
        ${this.sqlString(item.questionType || 'likert')},
        ${item.reverseScored ? 1 : 0},
        ${item.alertTrigger ? 1 : 0},
        ${this.sqlString(item.alertCondition || '')},
        ${this.sqlString(item.helpText || '')},
        ${item.required ? 1 : 0},
        ${this.sqlString(JSON.stringify(item.metadata || {}))},
        ${this.sqlString(item.metadata?.disorder || null)},
        NOW(),
        NOW()
      );

`;

      // Insert item response options relationships
      if (item.responseOptions && item.responseOptions.length > 0) {
        item.responseOptions.forEach(responseOptionId => {
          sql += `INSERT INTO scale_item_response_options (item_id, response_option_id) VALUES ('${item.id}', '${responseOptionId}');
`;
        });
      }
    });

    // Insert scale interpretation rules
    interpretationRules.forEach(rule => {
      sql += `INSERT INTO scale_interpretation_rules (
        id, scale_id, min_score, max_score, severity_level, interpretation_label, 
        color_code, description, recommendations, created_at, updated_at
      ) VALUES (
        '${rule.id}',
        '${scale.id}',
        ${rule.minScore},
        ${rule.maxScore},
        ${this.sqlString(rule.severityLevel)},
        ${this.sqlString(rule.label)},
        ${this.sqlString(rule.color)},
        ${this.sqlString(rule.description)},
        ${this.sqlString(rule.recommendations)},
        NOW(),
        NOW()
      );

`;
    });

    // Insert subscales
    if (subscales && subscales.length > 0) {
      subscales.forEach(subscale => {
        sql += `INSERT INTO scale_subscales (
          id, scale_id, subscale_name, subscale_code, min_score, max_score, 
          description, items, referencias_bibliograficas, indice_cronbach, 
          created_at, updated_at
        ) VALUES (
          '${subscale.id}',
          '${scale.id}',
          ${this.sqlString(subscale.name)},
          ${this.sqlString(subscale.id)},
          ${subscale.min_score || 0},
          ${subscale.max_score || 0},
          ${this.sqlString(subscale.description)},
          ${this.sqlString(JSON.stringify(subscale.items || []))},
          ${this.sqlString(subscale.referencias_bibliograficas)},
          ${subscale.indice_cronbach || null},
          NOW(),
          NOW()
        );

      });
    }

    return sql;
  }

  /**
   * Genera SQL para documentación individual
   */
  generateDocumentationSQL(doc) {
    return `INSERT INTO scale_documentation (
  id, scale_id, bibliography, sources_consulted, implementation_notes, 
  psychometric_properties, clinical_considerations, special_items_notes, 
  version_notes, target_population_details, clinical_interpretation, 
  created_at, updated_at
) VALUES (
  '${doc.id}',
  '${doc.scale_id}',
  ${this.sqlString(doc.bibliography)},
  ${this.sqlString(doc.sources_consulted)},
  ${this.sqlString(doc.implementation_notes)},
  ${this.sqlString(doc.psychometric_properties)},
  ${this.sqlString(doc.clinical_considerations)},
  ${this.sqlString(doc.special_items_notes)},
  ${this.sqlString(doc.version_notes)},
  ${this.sqlString(doc.target_population_details)},
  ${this.sqlString(doc.clinical_interpretation)},
  NOW(),
  NOW()
);`;
  }

  /**
   * Obtiene el schema de la tabla de documentación
   */
  async getDocumentationTableSchema() {
    const schemaPath = path.join(__dirname, '../database/migrations/create-scale-documentation-table.sql');
    try {
      return await fs.readFile(schemaPath, 'utf8');
    } catch (error) {
      return '-- Tabla scale_documentation debe existir';
    }
  }

  /**
   * Genera script de migración completo
   */
  async generateMigrationScript() {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_');
    const fileName = `complete_migration_${timestamp}.sql`;
    const filePath = path.join(this.seedsDir, fileName);

    const script = `-- Script de migración completa
-- Ejecuta primero la tabla de documentación, luego las escalas y por último la documentación
-- Generado: ${new Date().toISOString()}

-- 1. Crear tabla de documentación
SOURCE database/migrations/create-scale-documentation-table.sql;

-- 2. Importar escalas
SOURCE database/seeds/scales_${timestamp.split('_')[0]}_${timestamp.split('_')[1]}.sql;

-- 3. Importar documentación
SOURCE database/seeds/documentation/documentation_${timestamp.split('_')[0]}_${timestamp.split('_')[1]}.sql;

-- Verificar importación
SELECT 
  s.id, s.name, s.total_items,
  CASE WHEN sd.id IS NOT NULL THEN 'Sí' ELSE 'No' END as tiene_documentacion
FROM scales s 
LEFT JOIN scale_documentation sd ON s.id = sd.scale_id 
WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY s.created_at DESC;
`;

    await fs.writeFile(filePath, script, 'utf8');
    console.log(`   🚀 Script completo: ${fileName}`);
  }

  /**
   * Convierte un valor a string SQL seguro
   */
  sqlString(value) {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    return `'${String(value).replace(/'/g, "\\'")}'`;
  }

  /**
   * Muestra resumen del procesamiento
   */
  showSummary() {
    console.log('\n📊 RESUMEN DEL PROCESAMIENTO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log(`\n✅ Escalas procesadas exitosamente: ${this.results.processed.length}`);
    this.results.processed.forEach(scale => {
      console.log(`   📋 ${scale.scaleId} - ${scale.scaleName} (${scale.itemsCount} ítems) ${scale.hasDocumentation ? '📚' : '❌'}`);
    });

    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errores encontrados: ${this.results.errors.length}`);
      this.results.errors.forEach(error => {
        console.log(`   🚫 ${error.fileName}: ${error.error}`);
      });
    }

    console.log(`\n📁 Archivos SQL generados:`);
    console.log(`   • Escalas: database/seeds/scales_*.sql`);
    console.log(`   • Documentación: database/seeds/documentation/documentation_*.sql`);
    console.log(`   • Script completo: database/seeds/complete_migration_*.sql`);

    console.log('\n🚀 Para aplicar los cambios:');
    console.log('   mysql -u [usuario] -p [database] < database/seeds/complete_migration_*.sql');
    
    console.log('\n🎯 Sistema listo para usar escalas con documentación científica completa!');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const processor = new ScaleDocumentationProcessor();
  
  // Permitir procesamiento de directorio específico o por defecto
  const targetDir = process.argv[2];
  
  if (targetDir) {
    processor.processScalesFromDirectory(targetDir)
      .then(() => console.log('\n✅ Procesamiento completado'))
      .catch(error => {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
      });
  } else {
    processor.processAllScales()
      .then(() => console.log('\n✅ Procesamiento completado'))
      .catch(error => {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
      });
  }
}

module.exports = ScaleDocumentationProcessor;