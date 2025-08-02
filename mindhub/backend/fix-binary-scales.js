#!/usr/bin/env node

/**
 * FIXER PARA ESCALAS BINARIAS
 * Cambia question_type de "binary" a "likert" para usar opciones globales
 */

const fs = require('fs');

const files = [
  'database/templates/bite-json.json',
  'database/templates/ipde_cie10_json.json'
];

files.forEach(filePath => {
  console.log(`🔧 Fixing ${filePath}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixed = content.replace(/"question_type": "binary"/g, '"question_type": "likert"');
    
    fs.writeFileSync(filePath, fixed, 'utf8');
    console.log(`✅ Fixed binary questions in ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}: ${error.message}`);
  }
});

console.log('\n🎉 Binary questions fixed! Ready for import.');