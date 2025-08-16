#!/usr/bin/env node

/**
 * Comprehensive API Endpoints Test Suite
 * 
 * Tests all the corrected endpoints to ensure they work properly
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3003/api';

const endpoints = [
  // Health checks
  { name: 'Health Check', method: 'GET', url: '/health' },
  
  // Expedix endpoints
  { name: 'Expedix Hub Info', method: 'GET', url: '/expedix' },
  { name: 'Schedule Config', method: 'GET', url: '/expedix/schedule-config' },
  { name: 'Agenda Appointments', method: 'GET', url: '/expedix/agenda/appointments' },
  
  // ClinimetrixPro endpoints
  { name: 'ClinimetrixPro Hub Info', method: 'GET', url: '/clinimetrix-pro' },
  { name: 'Templates Catalog', method: 'GET', url: '/clinimetrix-pro/templates/catalog' },
  
  // Other hubs
  { name: 'Finance Hub', method: 'GET', url: '/finance' },
  { name: 'FormX Hub', method: 'GET', url: '/formx' },
  { name: 'Resources Hub', method: 'GET', url: '/resources' },
];

async function testEndpoint(endpoint) {
  try {
    const url = `${API_BASE}${endpoint.url}`;
    console.log(`🔍 Testing ${endpoint.name}: ${endpoint.method} ${url}`);
    
    const response = await fetch(url, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const contentType = response.headers.get('content-type');
    
    if (response.ok) {
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        console.log(`✅ ${endpoint.name}: Status ${response.status} - JSON response received`);
        
        // Log a summary of the response
        if (data.data && Array.isArray(data.data)) {
          console.log(`   📊 Response contains ${data.data.length} items`);
        } else if (data.message) {
          console.log(`   💬 Message: ${data.message}`);
        } else if (data.name || data.hub) {
          console.log(`   📝 Hub: ${data.name || data.hub}`);
        }
      } else {
        console.log(`⚠️  ${endpoint.name}: Status ${response.status} - Non-JSON response (${contentType})`);
        const text = await response.text();
        console.log(`   📄 Content: ${text.substring(0, 100)}...`);
      }
    } else {
      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        console.log(`❌ ${endpoint.name}: Status ${response.status} - ${errorData.message || errorData.error}`);
      } else {
        const text = await response.text();
        console.log(`❌ ${endpoint.name}: Status ${response.status} - Non-JSON error response`);
        console.log(`   📄 Content: ${text.substring(0, 200)}...`);
      }
    }
  } catch (error) {
    console.log(`💥 ${endpoint.name}: Network error - ${error.message}`);
  }
  
  console.log(''); // Empty line for readability
}

async function runTests() {
  console.log('🚀 Starting comprehensive API endpoints test');
  console.log(`🔗 Base URL: ${API_BASE}`);
  console.log('=' .repeat(60));
  console.log('');
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('🏁 All endpoint tests completed!');
}

// Add retry capability for authentication-required endpoints
async function testWithAuth() {
  console.log('🔐 Note: Some endpoints may require authentication.');
  console.log('    For full testing, ensure Clerk auth is properly configured.');
  console.log('');
  
  await runTests();
}

if (require.main === module) {
  testWithAuth().catch(console.error);
}

module.exports = { testEndpoint, runTests };