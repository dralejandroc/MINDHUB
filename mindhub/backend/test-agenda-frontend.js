const fetch = require('node-fetch');

async function testAgendaEndpoints() {
  const baseUrl = 'http://localhost:8080';
  
  console.log('🔄 Testing agenda endpoints...\n');
  
  try {
    // Test 1: Schedule config
    console.log('1. Testing schedule config endpoint:');
    const configResponse = await fetch(`${baseUrl}/api/v1/expedix/schedule-config`);
    console.log(`   Status: ${configResponse.status}`);
    if (configResponse.ok) {
      const configData = await configResponse.json();
      console.log(`   ✅ Config loaded: ${JSON.stringify(configData, null, 2)}`);
    } else {
      console.log(`   ❌ Config failed: ${await configResponse.text()}`);
    }
    
    console.log('\n');
    
    // Test 2: Appointments
    console.log('2. Testing appointments endpoint:');
    const appointmentsResponse = await fetch(`${baseUrl}/api/v1/expedix/agenda/appointments`);
    console.log(`   Status: ${appointmentsResponse.status}`);
    if (appointmentsResponse.ok) {
      const appointmentsData = await appointmentsResponse.json();
      console.log(`   ✅ Appointments loaded: ${appointmentsData.data.length} appointments`);
      
      // Show sample of today's appointments
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = appointmentsData.data.filter(apt => apt.date === today);
      console.log(`   📅 Today (${today}): ${todayAppointments.length} appointments`);
      
      if (todayAppointments.length > 0) {
        console.log('   Sample appointment:', JSON.stringify(todayAppointments[0], null, 4));
      }
      
      // Show July 2025 appointments
      const july2025Appointments = appointmentsData.data.filter(apt => apt.date.startsWith('2025-07'));
      console.log(`   📅 July 2025: ${july2025Appointments.length} appointments`);
      
      if (july2025Appointments.length > 0) {
        console.log('   July 2025 appointments:');
        july2025Appointments.forEach(apt => {
          console.log(`     - ${apt.date} ${apt.time}: ${apt.patient.name} (${apt.status})`);
        });
      }
      
    } else {
      console.log(`   ❌ Appointments failed: ${await appointmentsResponse.text()}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
  }
}

testAgendaEndpoints();