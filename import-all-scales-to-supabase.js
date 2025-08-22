#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://jvbcpldzoyicefdtnwkd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ';

const supabase = createClient(supabaseUrl, supabaseKey);

// Lista de todas las escalas reales disponibles (excluyendo templates)
const scaleFiles = [
  'phq9-json.json',
  'bdi-13-json.json',
  'gds-5-json.json',
  'gds-15-json.json',
  'gds-30-json.json',
  'hars_complete_json.json',
  'hdrs-17-complete-json.json',
  'madrs-escala-depresion.json',
  'rads2-json.json',
  'gadi-json.json',
  'stai-json-completo.json',
  'aq-adolescent-json.json',
  'aq-child-json.json',
  'eat26-json.json',
  'moca-json.json',
  'dy-bocs-json.json',
  'ybocs-json.json',
  'panss-escala-json.json',
  'mos-sleep-scale-json.json',
  'ygtss-json.json',
  'ipde-cie10-completo.json',
  'ipde-dsmiv-json.json',
  'dts-json-completo.json',
  'sss-v-scale-json.json',
  'emun-ar-scale.json',
  'esadfun-json.json',
  'cuestionario-salamanca-v2007.json'
];

// Archivos a excluir explícitamente (templates y metadata)
const excludeFiles = [
  'FORMATO-JSON-CLINIMETRIX-PRO.json',
  'metadata-index.json'
];

async function importAllScalesToSupabase() {
  try {
    console.log('🚀 Starting import of ALL scales to Supabase...\n');
    
    // First, clear existing templates (optional - comment out if you want to keep existing)
    console.log('🧹 Clearing existing templates...');
    const { error: deleteError } = await supabase
      .from('clinimetrix_templates')
      .delete()
      .neq('id', 'keep-none'); // This will delete all
    
    if (deleteError && deleteError.code !== 'PGRST116') {
      console.error('⚠️ Error clearing templates:', deleteError.message);
    }
    
    const scalesDir = path.join(__dirname, 'mindhub/backend-django/scales');
    let successCount = 0;
    let failCount = 0;
    const importedScales = [];
    
    for (const fileName of scaleFiles) {
      const filePath = path.join(scalesDir, fileName);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`⏭️ Skipping ${fileName} (file not found)`);
        continue;
      }
      
      try {
        // Read scale JSON file
        const scaleData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Skip if it's the format template
        if (fileName === 'FORMATO-JSON-CLINIMETRIX-PRO.json' || fileName === 'metadata-index.json') {
          console.log(`⏭️ Skipping ${fileName} (template/index file)`);
          continue;
        }
        
        // Generate unique ID for the template
        const abbreviation = scaleData.metadata?.abbreviation || fileName.replace('.json', '');
        const templateId = `${abbreviation.toLowerCase().replace(/[^a-z0-9]/g, '-')}-template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Parse duration - handle ranges like "15-20" by taking the average
        let estimatedDuration = scaleData.metadata?.estimatedDurationMinutes;
        if (typeof estimatedDuration === 'string' && estimatedDuration.includes('-')) {
          const [min, max] = estimatedDuration.split('-').map(n => parseInt(n));
          estimatedDuration = Math.round((min + max) / 2);
        } else if (typeof estimatedDuration === 'string') {
          estimatedDuration = parseInt(estimatedDuration) || null;
        }
        
        // Prepare template data for Supabase
        const templateData = {
          id: templateId,
          template_data: scaleData,
          version: scaleData.metadata?.version || '1.0',
          is_active: true,
          is_public: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          
          // Additional searchable fields from metadata
          abbreviation: scaleData.metadata?.abbreviation || null,
          language: scaleData.metadata?.language || 'es',
          category: scaleData.metadata?.category || null,
          subcategory: scaleData.metadata?.subcategory || null,
          description: scaleData.metadata?.description || null,
          total_items: scaleData.structure?.totalItems || null,
          score_range_min: scaleData.scoring?.scoreRange?.min || 0,
          score_range_max: scaleData.scoring?.scoreRange?.max || null,
          administration_mode: scaleData.metadata?.administrationMode || null,
          estimated_duration_minutes: estimatedDuration
        };
        
        // Insert into Supabase
        const { data, error } = await supabase
          .from('clinimetrix_templates')
          .insert([templateData])
          .select();
        
        if (error) {
          console.error(`❌ Error inserting ${abbreviation}:`, error.message);
          failCount++;
        } else {
          console.log(`✅ Successfully imported: ${scaleData.metadata?.name || abbreviation} (${abbreviation})`);
          successCount++;
          importedScales.push({
            abbreviation: abbreviation,
            name: scaleData.metadata?.name || 'Unknown',
            category: scaleData.metadata?.category || 'General'
          });
        }
        
      } catch (parseError) {
        console.error(`❌ Error processing ${fileName}:`, parseError.message);
        failCount++;
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Successfully imported: ${successCount} scales`);
    console.log(`❌ Failed imports: ${failCount}`);
    console.log('\n📋 IMPORTED SCALES BY CATEGORY:\n');
    
    // Group by category
    const byCategory = {};
    importedScales.forEach(scale => {
      const cat = scale.category || 'Sin categoría';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(scale);
    });
    
    // Display by category
    Object.keys(byCategory).sort().forEach(category => {
      console.log(`\n🏷️ ${category}:`);
      byCategory[category].forEach(scale => {
        console.log(`   • ${scale.abbreviation}: ${scale.name}`);
      });
    });
    
    // Verify total in database
    const { data: allTemplates, error: verifyError } = await supabase
      .from('clinimetrix_templates')
      .select('id, abbreviation, template_data')
      .eq('is_active', true);
    
    if (!verifyError) {
      console.log('\n' + '='.repeat(80));
      console.log(`🎉 TOTAL ACTIVE TEMPLATES IN DATABASE: ${allTemplates.length}`);
      console.log('='.repeat(80));
    }
    
  } catch (error) {
    console.error('💥 Script error:', error);
  }
}

// Run the import
importAllScalesToSupabase();