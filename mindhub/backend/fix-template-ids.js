#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const templateFiles = [
  'database/templates/aq-adolescent-json.json',
  'database/templates/bdi_13_json.json', 
  'database/templates/bdi_21_json.json'
];

function fixDuplicateIds(filePath) {
  console.log(`🔧 Fixing IDs in ${filePath}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Get the scale ID prefix
    const scaleId = data.scale.id;
    
    // Create map of response option IDs to avoid duplicates
    const globalOptionIds = new Set();
    if (data.response_options) {
      data.response_options.forEach(opt => globalOptionIds.add(opt.id));
    }
    
    // Fix response group option IDs
    if (data.response_groups) {
      data.response_groups.forEach((group, groupIndex) => {
        if (group.options) {
          group.options.forEach((option, optIndex) => {
            if (globalOptionIds.has(option.id)) {
              const newId = `${scaleId}-grp-${groupIndex}-opt-${optIndex}`;
              console.log(`  📝 Changing ${option.id} to ${newId}`);
              option.id = newId;
            }
          });
        }
      });
    }
    
    // Write back fixed content
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ Fixed ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}: ${error.message}`);
  }
}

templateFiles.forEach(fixDuplicateIds);
console.log('\n🎉 All template IDs fixed!');