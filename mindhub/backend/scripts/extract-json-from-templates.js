#!/usr/bin/env node

/**
 * EXTRACT JSON FROM TEMPLATES
 * 
 * Extrae bloques JSON de archivos markdown template y los convierte a JSON puros
 * para ser procesados por el universal-scale-importer
 */

const fs = require('fs');
const path = require('path');

class JSONExtractor {
  constructor() {
    this.processed = 0;
    this.successful = 0;
    this.failed = 0;
    this.errors = [];
  }

  /**
   * Extrae JSON del contenido markdown
   */
  extractJSON(markdownContent, filename) {
    try {
      // Buscar el bloque JSON entre ```json y ```
      const jsonMatch = markdownContent.match(/```json\s*([\s\S]*?)\s*```/);
      
      if (!jsonMatch) {
        throw new Error('No JSON block found in markdown');
      }

      const jsonString = jsonMatch[1].trim();
      
      // Validar que sea JSON válido
      const parsedJSON = JSON.parse(jsonString);
      
      console.log(`✅ Extracted JSON from ${filename}`);
      return {
        success: true,
        json: parsedJSON,
        jsonString: JSON.stringify(parsedJSON, null, 2)
      };
      
    } catch (error) {
      console.error(`❌ Failed to extract JSON from ${filename}: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Procesa un archivo template
   */
  processTemplate(templatePath, outputDir) {
    const filename = path.basename(templatePath);
    console.log(`🔍 Processing ${filename}`);
    
    try {
      // Leer archivo markdown
      const content = fs.readFileSync(templatePath, 'utf8');
      
      // Extraer JSON
      const result = this.extractJSON(content, filename);
      
      if (!result.success) {
        this.failed++;
        this.errors.push({ file: filename, error: result.error });
        return false;
      }

      // Crear archivo JSON puro
      const outputFilename = filename.replace(/\.(json|md)$/, '.json');
      const outputPath = path.join(outputDir, outputFilename);
      
      fs.writeFileSync(outputPath, result.jsonString, 'utf8');
      
      console.log(`💾 Saved pure JSON to ${outputPath}`);
      this.successful++;
      return true;
      
    } catch (error) {
      console.error(`❌ Error processing ${filename}: ${error.message}`);
      this.failed++;
      this.errors.push({ file: filename, error: error.message });
      return false;
    } finally {
      this.processed++;
    }
  }

  /**
   * Procesa todos los templates en un directorio
   */
  processAllTemplates(templateDir, outputDir) {
    console.log(`🚀 Starting extraction from ${templateDir}`);
    
    // Crear directorio de salida si no existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`📁 Created output directory: ${outputDir}`);
    }

    // Obtener archivos template (excluyendo templates que no son escalas)
    const templateFiles = fs.readdirSync(templateDir)
      .filter(file => file.endsWith('.json') || file.endsWith('.md'))
      .filter(file => !file.includes('template') && !file.includes('ESTRUCTURA'))
      .map(file => path.join(templateDir, file));

    if (templateFiles.length === 0) {
      console.log('❌ No template files found');
      return;
    }

    console.log(`📋 Found ${templateFiles.length} template files to process`);

    // Procesar cada archivo
    for (const templateFile of templateFiles) {
      this.processTemplate(templateFile, outputDir);
    }

    this.printSummary();
  }

  /**
   * Imprime resumen de procesamiento
   */
  printSummary() {
    console.log(`\n📈 EXTRACTION SUMMARY:`);
    console.log(`   Total processed: ${this.processed}`);
    console.log(`   Successful: ${this.successful}`);
    console.log(`   Failed: ${this.failed}`);
    
    if (this.errors.length > 0) {
      console.log(`\n❌ Errors:`);
      this.errors.forEach(error => {
        console.log(`   - ${error.file}: ${error.error}`);
      });
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
🔧 JSON Template Extractor

Usage:
  node scripts/extract-json-from-templates.js <templates-dir> <output-dir>

Example:
  node scripts/extract-json-from-templates.js database/templates database/extracted-scales
    `);
    process.exit(1);
  }
  
  const templatesDir = args[0];
  const outputDir = args[1];
  
  if (!fs.existsSync(templatesDir)) {
    console.error(`❌ Templates directory not found: ${templatesDir}`);
    process.exit(1);
  }
  
  const extractor = new JSONExtractor();
  extractor.processAllTemplates(templatesDir, outputDir);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = JSONExtractor;