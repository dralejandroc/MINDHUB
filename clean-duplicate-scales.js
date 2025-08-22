#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://jvbcpldzoyicefdtnwkd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDuplicateScales() {
  try {
    console.log('🧹 Cleaning duplicate scales from Supabase...\n');
    
    // Get all templates
    const { data: allTemplates, error: fetchError } = await supabase
      .from('clinimetrix_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    
    if (fetchError) {
      console.error('❌ Error fetching templates:', fetchError);
      return;
    }
    
    console.log(`📊 Found ${allTemplates.length} total templates`);
    
    // Group by abbreviation to find duplicates
    const templatesByAbbreviation = {};
    allTemplates.forEach(template => {
      const abbr = template.template_data?.metadata?.abbreviation || template.abbreviation || 'unknown';
      if (!templatesByAbbreviation[abbr]) {
        templatesByAbbreviation[abbr] = [];
      }
      templatesByAbbreviation[abbr].push(template);
    });
    
    // Remove duplicates, keeping only the latest one
    let deletedCount = 0;
    for (const [abbr, templates] of Object.entries(templatesByAbbreviation)) {
      if (templates.length > 1) {
        console.log(`\n🔍 Found ${templates.length} copies of ${abbr}`);
        
        // Sort by created_at descending (newest first)
        templates.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Keep the first (newest) and delete the rest
        const toKeep = templates[0];
        const toDelete = templates.slice(1);
        
        console.log(`  ✅ Keeping: ${toKeep.id} (created: ${toKeep.created_at})`);
        
        for (const template of toDelete) {
          console.log(`  🗑️ Deleting: ${template.id} (created: ${template.created_at})`);
          
          const { error: deleteError } = await supabase
            .from('clinimetrix_templates')
            .delete()
            .eq('id', template.id);
          
          if (deleteError) {
            console.error(`  ❌ Error deleting ${template.id}:`, deleteError.message);
          } else {
            deletedCount++;
          }
        }
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`✅ Cleanup complete! Deleted ${deletedCount} duplicate templates`);
    
    // Verify final count
    const { data: finalTemplates, error: verifyError } = await supabase
      .from('clinimetrix_templates')
      .select('id, abbreviation, template_data')
      .eq('is_active', true);
    
    if (!verifyError) {
      console.log(`📊 Final count: ${finalTemplates.length} unique templates`);
      console.log('\n📋 Available scales:');
      
      const uniqueScales = {};
      finalTemplates.forEach(t => {
        const abbr = t.template_data?.metadata?.abbreviation || t.abbreviation || 'unknown';
        const name = t.template_data?.metadata?.name || 'Unknown';
        if (!uniqueScales[abbr]) {
          uniqueScales[abbr] = name;
        }
      });
      
      Object.entries(uniqueScales).sort().forEach(([abbr, name]) => {
        console.log(`  • ${abbr}: ${name}`);
      });
    }
    
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('💥 Script error:', error);
  }
}

cleanDuplicateScales();