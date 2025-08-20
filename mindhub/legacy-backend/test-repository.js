#!/usr/bin/env node

const ScaleRepository = require('./repositories/ScaleRepository');

async function testRepository() {
  const repo = new ScaleRepository();
  
  console.log('🧪 Testing ScaleRepository with BITE scale...');
  
  try {
    const biteScale = await repo.getScaleById('bite');
    
    console.log(`✅ Scale: ${biteScale.name}`);
    console.log(`📊 Items: ${biteScale.items.length}`);
    console.log(`🎯 Response Options: ${biteScale.responseOptions.length}`);
    
    if (biteScale.responseOptions.length > 0) {
      console.log('First few response options:');
      biteScale.responseOptions.slice(0, 5).forEach(opt => {
        console.log(`  - ${opt.label} (${opt.score}) [group: ${opt.group || 'none'}]`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRepository();