#!/usr/bin/env node

/**
 * Script para arreglar problemas de escape en archivos SQL
 * Corrige comillas simples y caracteres especiales
 */

const fs = require('fs');
const path = require('path');

const seedsDir = path.join(__dirname, '..', 'database', 'seeds');

// Archivos con errores conocidos
const archivosConErrores = [
  'GDS-30-seed.sql',
  'bdi-13-seed.sql', 
  'bdi-21-seed.sql',
  'phq9-seed.sql',
  'rads-2-seed.sql'
];

function arreglarSQL(contenido) {
  // Buscar patrones problemáticos y corregirlos
  let arreglado = contenido;
  
  // 1. Arreglar "minutos" mal escapado
  arreglado = arreglado.replace(/(\d+)\s*'\s*minutos/g, "$1 minutos'");
  arreglado = arreglado.replace(/(\d+-\d+)\s*'\s*minutos/g, "$1 minutos'");
  
  // 2. Arreglar comillas simples dentro de strings
  // Buscar strings SQL y escapar comillas internas
  arreglado = arreglado.replace(/VALUES\s*\(([\s\S]*?)\);/g, function(match, values) {
    // Procesar cada valor entre comillas
    return match.replace(/'([^']*)'(?=[,)])/g, function(stringMatch, content) {
      // Si el contenido tiene comillas simples sin escapar, escaparlas
      const escapedContent = content.replace(/(?<!')'/g, "''");
      return `'${escapedContent}'`;
    });
  });
  
  // 3. Arreglar casos específicos conocidos
  arreglado = arreglado.replace(/'Sentirse mal consigo mismo(?!;)/g, 
    "'Sentirse mal consigo mismo; sentir que es un fracasado o que ha decepcionado a su familia o a sí mismo'");
  
  // 4. Asegurar que los finales de línea sean correctos
  arreglado = arreglado.replace(/\r\n/g, '\n');
  
  // 5. Asegurar que hay salto de línea al final
  if (!arreglado.endsWith('\n')) {
    arreglado += '\n';
  }
  
  return arreglado;
}

console.log('🔧 Arreglando archivos SQL con errores...\n');

archivosConErrores.forEach(archivo => {
  const rutaCompleta = path.join(seedsDir, archivo);
  
  if (!fs.existsSync(rutaCompleta)) {
    console.log(`⚠️  ${archivo} no encontrado - omitiendo`);
    return;
  }
  
  try {
    console.log(`📄 Procesando ${archivo}...`);
    
    // Leer archivo
    let contenido = fs.readFileSync(rutaCompleta, 'utf-8');
    
    // Hacer backup
    const backupPath = rutaCompleta + '.backup';
    fs.writeFileSync(backupPath, contenido);
    
    // Arreglar SQL
    const contenidoArreglado = arreglarSQL(contenido);
    
    // Guardar versión arreglada
    fs.writeFileSync(rutaCompleta, contenidoArreglado);
    
    console.log(`✅ ${archivo} arreglado\n`);
    
  } catch (error) {
    console.error(`❌ Error en ${archivo}: ${error.message}\n`);
  }
});

console.log('✨ Proceso completado. Ejecuta "npm run universal:migrate" para aplicar los cambios.');