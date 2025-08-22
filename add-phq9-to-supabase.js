#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration (using service role key for admin operations)
const supabaseUrl = 'https://jvbcpldzoyicefdtnwkd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YmNwbGR6b3lpY2VmZHRud2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQwMTQ3MCwiZXhwIjoyMDcwOTc3NDcwfQ.-iooltGuYeGqXVh7pgRhH_Oo_R64VtHIssbE3u_y0WQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addPHQ9ToSupabase() {
  try {
    console.log('🚀 Starting PHQ-9 insertion to Supabase...');
    
    // Read PHQ-9 JSON file
    const phq9Path = path.join(__dirname, 'mindhub/backend-django/scales/phq9-json.json');
    const phq9Data = JSON.parse(fs.readFileSync(phq9Path, 'utf8'));
    
    console.log('📄 PHQ-9 data loaded:', phq9Data.metadata.name);
    
    // Prepare template data for Supabase
    const templateData = {
      id: 'phq9-template-1',
      template_data: phq9Data,
      version: '1.0',
      is_active: true,
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('clinimetrix_templates')
      .insert([templateData])
      .select();
    
    if (error) {
      console.error('❌ Error inserting PHQ-9:', error);
      return;
    }
    
    console.log('✅ PHQ-9 successfully inserted into Supabase!');
    console.log('📊 Inserted data:', data);
    
    // Verify insertion
    const { data: verify, error: verifyError } = await supabase
      .from('clinimetrix_templates')
      .select('*')
      .eq('is_active', true);
    
    if (verifyError) {
      console.error('❌ Error verifying:', verifyError);
      return;
    }
    
    console.log('🔍 Total active templates in database:', verify.length);
    verify.forEach(template => {
      console.log(`   - ${template.template_data?.metadata?.abbreviation}: ${template.template_data?.metadata?.name}`);
    });
    
  } catch (error) {
    console.error('💥 Script error:', error);
  }
}

addPHQ9ToSupabase();