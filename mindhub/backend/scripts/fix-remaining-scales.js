#!/usr/bin/env node

/**
 * FIX REMAINING SCALES
 * 
 * Script especializado para corregir y extraer las 9 escalas faltantes
 * con manejo robusto de errores JSON
 */

const fs = require('fs');
const path = require('path');

class ScaleFixer {
  constructor() {
    this.processed = 0;
    this.successful = 0;
    this.failed = 0;
    this.errors = [];
  }

  /**
   * Limpia y corrige JSON malformado
   */
  cleanJSON(jsonString) {
    // Limpiar caracteres problemáticos
    let cleaned = jsonString
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Control characters
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n')
      .trim();

    // Arreglar comas faltantes comunes
    cleaned = cleaned
      .replace(/}(\s*)"([^"]+)":/g, '},\n  "$2":') // Missing comma after objects
      .replace(/](\s*)"([^"]+)":/g, '],\n  "$2":') // Missing comma after arrays
      .replace(/"(\s*)"([^"]+)":/g, '",\n  "$2":') // Missing comma after strings
      .replace(/(\d)(\s*)"([^"]+)":/g, '$1,\n  "$3":'); // Missing comma after numbers

    return cleaned;
  }

  /**
   * Extrae y corrige JSON de archivo markdown
   */
  extractAndFixJSON(content, filename) {
    try {
      // Método 1: Bloque JSON estándar
      let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      
      if (jsonMatch) {
        let jsonString = jsonMatch[1].trim();
        
        // Intentar parsear directamente
        try {
          const parsedJSON = JSON.parse(jsonString);
          console.log(`✅ Direct parse successful for ${filename}`);
          return {
            success: true,
            json: parsedJSON,
            jsonString: JSON.stringify(parsedJSON, null, 2)
          };
        } catch (parseError) {
          console.log(`⚠️  JSON parse failed for ${filename}, attempting to fix...`);
          
          // Intentar limpiar y corregir
          const cleanedJSON = this.cleanJSON(jsonString);
          
          try {
            const parsedJSON = JSON.parse(cleanedJSON);
            console.log(`✅ Fixed JSON parse successful for ${filename}`);
            return {
              success: true,
              json: parsedJSON,
              jsonString: JSON.stringify(parsedJSON, null, 2)
            };
          } catch (cleanError) {
            console.log(`❌ Failed to fix JSON for ${filename}: ${cleanError.message}`);
            
            // Último intento: buscar el objeto válido más grande
            try {
              const braceMatch = jsonString.match(/\{[\s\S]*\}/);
              if (braceMatch) {
                const objString = this.cleanJSON(braceMatch[0]);
                const parsedJSON = JSON.parse(objString);
                console.log(`✅ Object extraction successful for ${filename}`);
                return {
                  success: true,
                  json: parsedJSON,
                  jsonString: JSON.stringify(parsedJSON, null, 2)
                };
              }
            } catch (objError) {
              // Si nada funciona, reportar error detallado
              return {
                success: false,
                error: `JSON parsing failed: ${parseError.message}. Clean attempt: ${cleanError.message}. Object extraction: ${objError.message}`
              };
            }
          }
        }
      }

      // Método 2: Buscar después de "JSON Validado"
      const validadoMatch = content.match(/## JSON Validado\s*\n\s*([\s\S]*?)(?=\n##|\n#|$)/);
      
      if (validadoMatch) {
        let jsonString = validadoMatch[1].trim()
          .replace(/^```json\s*/, '')
          .replace(/\s*```$/, '');
        
        const cleanedJSON = this.cleanJSON(jsonString);
        
        try {
          const parsedJSON = JSON.parse(cleanedJSON);
          console.log(`✅ JSON Validado method successful for ${filename}`);
          return {
            success: true,
            json: parsedJSON,
            jsonString: JSON.stringify(parsedJSON, null, 2)
          };
        } catch (error) {
          return {
            success: false,
            error: `JSON Validado parsing failed: ${error.message}`
          };
        }
      }

      return {
        success: false,
        error: 'No valid JSON block found in markdown'
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Extraction error: ${error.message}`
      };
    }
  }

  /**
   * Procesa un archivo específico
   */
  processFile(filePath, outputDir) {
    const filename = path.basename(filePath);
    console.log(`\n🔧 Fixing ${filename}`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const result = this.extractAndFixJSON(content, filename);
      
      if (!result.success) {
        this.failed++;
        this.errors.push({ file: filename, error: result.error });
        console.log(`❌ Failed: ${result.error}`);
        return false;
      }

      // Validar estructura de escala
      if (!result.json.scale) {
        const error = 'JSON does not contain "scale" object';
        console.log(`❌ ${filename}: ${error}`);
        this.failed++;
        this.errors.push({ file: filename, error });
        return false;
      }

      // Guardar archivo corregido
      const outputPath = path.join(outputDir, filename);
      fs.writeFileSync(outputPath, result.jsonString, 'utf8');
      
      console.log(`💾 Fixed and saved: ${outputPath}`);
      console.log(`   Scale: ${result.json.scale.name} (${result.json.scale.id})`);
      console.log(`   Items: ${result.json.items?.length || 0}`);
      
      this.successful++;
      return true;
      
    } catch (error) {
      console.log(`❌ Process error for ${filename}: ${error.message}`);
      this.failed++;
      this.errors.push({ file: filename, error: error.message });
      return false;
    } finally {
      this.processed++;
    }
  }

  /**
   * Procesa los archivos faltantes específicos
   */
  fixRemainingScales(templatesDir, outputDir) {
    const missingFiles = [
      'aq-adolescent.json',
      'bdi-13.json', 
      'bdi-21.json',
      'bite.json',
      'ipde-dsm-iv.json',
      'ipde-icd10.json',
      'sss-v-abreviada.json',
      'vanderbilt-tdah-maestros.json',
      'y-bocs.json'
    ];

    console.log(`🚀 FIXING ${missingFiles.length} REMAINING SCALES`);
    console.log('=' .repeat(60));

    // Crear directorio de salida si no existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const filename of missingFiles) {
      const filePath = path.join(templatesDir, filename);
      
      if (fs.existsSync(filePath)) {
        this.processFile(filePath, outputDir);
      } else {
        console.log(`⚠️  File not found: ${filePath}`);
        this.failed++;
        this.errors.push({ file: filename, error: 'File not found' });
        this.processed++;
      }
    }

    this.printSummary();
  }

  /**
   * Imprime resumen
   */
  printSummary() {
    console.log(`\n📈 FIXING SUMMARY:`);
    console.log(`   Total processed: ${this.processed}`);
    console.log(`   Successfully fixed: ${this.successful}`);
    console.log(`   Still failed: ${this.failed}`);
    
    if (this.errors.length > 0) {
      console.log(`\n❌ Remaining errors:`);
      this.errors.forEach(error => {
        console.log(`   - ${error.file}: ${error.error}`);
      });
    }
    
    if (this.successful > 0) {
      console.log(`\n✅ Fixed ${this.successful} scales, ready for import!`);
    }
  }
}

// CLI
async function main() {
  const templatesDir = 'database/templates';
  const outputDir = 'database/extracted-scales';
  
  const fixer = new ScaleFixer();
  fixer.fixRemainingScales(templatesDir, outputDir);
}

if (require.main === module) {
  main();
}

module.exports = ScaleFixer;