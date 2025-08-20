#!/usr/bin/env node

/**
 * EXTRACT ALL SCALES - UNIVERSAL PROCESSOR
 * 
 * Procesa todos los archivos de escalas, manejando diferentes formatos:
 * - Markdown con bloques ```json
 * - JSON directo después de "## JSON Validado"
 * - Formatos mixtos
 */

const fs = require('fs');
const path = require('path');

class UniversalScaleExtractor {
  constructor() {
    this.processed = 0;
    this.successful = 0;
    this.failed = 0;
    this.errors = [];
  }

  /**
   * Extrae JSON de diferentes formatos de contenido
   */
  extractJSON(content, filename) {
    try {
      // Método 1: Buscar bloque JSON entre ```json y ```
      let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      
      if (jsonMatch) {
        const jsonString = jsonMatch[1].trim();
        const parsedJSON = JSON.parse(jsonString);
        console.log(`✅ Method 1: Extracted JSON block from ${filename}`);
        return {
          success: true,
          json: parsedJSON,
          jsonString: JSON.stringify(parsedJSON, null, 2)
        };
      }

      // Método 2: Buscar JSON después de "## JSON Validado"
      const jsonValidadoMatch = content.match(/## JSON Validado\s*\n\s*([\s\S]*?)(?=\n##|\n#|$)/);
      
      if (jsonValidadoMatch) {
        let jsonString = jsonValidadoMatch[1].trim();
        
        // Limpiar posibles caracteres markdown
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        
        const parsedJSON = JSON.parse(jsonString);
        console.log(`✅ Method 2: Extracted JSON after "JSON Validado" from ${filename}`);
        return {
          success: true,
          json: parsedJSON,
          jsonString: JSON.stringify(parsedJSON, null, 2)
        };
      }

      // Método 3: Buscar JSON puro (para archivos que ya son JSON)
      try {
        const parsedJSON = JSON.parse(content);
        console.log(`✅ Method 3: File is pure JSON ${filename}`);
        return {
          success: true,
          json: parsedJSON,
          jsonString: JSON.stringify(parsedJSON, null, 2)
        };
      } catch (e) {
        // No es JSON puro, continuar
      }

      // Método 4: Buscar entre cualquier par de llaves principales
      const jsonObjectMatch = content.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        const jsonString = jsonObjectMatch[0];
        const parsedJSON = JSON.parse(jsonString);
        console.log(`✅ Method 4: Extracted JSON object from ${filename}`);
        return {
          success: true,
          json: parsedJSON,
          jsonString: JSON.stringify(parsedJSON, null, 2)
        };
      }

      throw new Error('No valid JSON found in any recognized format');
      
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
    
    // Saltar archivos de template y documentación
    if (filename.includes('template') || filename.includes('ESTRUCTURA')) {
      console.log(`⏭️  Skipping template/doc file: ${filename}`);
      return true;
    }
    
    console.log(`🔍 Processing ${filename}`);
    
    try {
      // Leer archivo
      const content = fs.readFileSync(templatePath, 'utf8');
      
      // Extraer JSON
      const result = this.extractJSON(content, filename);
      
      if (!result.success) {
        this.failed++;
        this.errors.push({ file: filename, error: result.error });
        return false;
      }

      // Validar que tenga estructura de escala
      if (!result.json.scale) {
        const error = 'JSON does not contain "scale" object';
        console.error(`❌ ${filename}: ${error}`);
        this.failed++;
        this.errors.push({ file: filename, error });
        return false;
      }

      // Crear archivo JSON puro
      const outputFilename = filename.replace(/\.(json|md)$/, '.json');
      const outputPath = path.join(outputDir, outputFilename);
      
      fs.writeFileSync(outputPath, result.jsonString, 'utf8');
      
      console.log(`💾 Saved pure JSON to ${outputPath}`);
      console.log(`   Scale: ${result.json.scale.name} (${result.json.scale.id})`);
      console.log(`   Items: ${result.json.items?.length || 0}`);
      
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
    console.log(`🚀 Starting UNIVERSAL extraction from ${templateDir}`);
    
    // Limpiar y crear directorio de salida
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created clean output directory: ${outputDir}`);

    // Obtener TODOS los archivos de escalas
    const templateFiles = fs.readdirSync(templateDir)
      .filter(file => file.endsWith('.json') || file.endsWith('.md'))
      .filter(file => !file.includes('template') && !file.includes('ESTRUCTURA'))
      .map(file => path.join(templateDir, file));

    if (templateFiles.length === 0) {
      console.log('❌ No scale files found');
      return;
    }

    console.log(`📋 Found ${templateFiles.length} scale files to process`);
    console.log('Files:', templateFiles.map(f => path.basename(f)));

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
    console.log(`\n📈 UNIVERSAL EXTRACTION SUMMARY:`);
    console.log(`   Total processed: ${this.processed}`);
    console.log(`   Successful: ${this.successful}`);
    console.log(`   Failed: ${this.failed}`);
    
    if (this.errors.length > 0) {
      console.log(`\n❌ Errors:`);
      this.errors.forEach(error => {
        console.log(`   - ${error.file}: ${error.error}`);
      });
    }
    
    if (this.successful > 0) {
      console.log(`\n✅ Successfully extracted ${this.successful} clinical scales`);
      console.log(`📁 All extracted JSON files ready for import`);
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
🔧 Universal Scale Extractor

Usage:
  node scripts/extract-all-scales.js <templates-dir> <output-dir>

Example:
  node scripts/extract-all-scales.js database/templates database/extracted-scales
    `);
    process.exit(1);
  }
  
  const templatesDir = args[0];
  const outputDir = args[1];
  
  if (!fs.existsSync(templatesDir)) {
    console.error(`❌ Templates directory not found: ${templatesDir}`);
    process.exit(1);
  }
  
  const extractor = new UniversalScaleExtractor();
  extractor.processAllTemplates(templatesDir, outputDir);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = UniversalScaleExtractor;