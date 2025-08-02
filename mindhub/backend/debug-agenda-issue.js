// Debug the agenda calendar issue by simulating what the frontend does

const fetch = require('node-fetch');

async function debugAgendaIssue() {
  try {
    console.log('🔍 Debugging agenda calendar issue...\n');
    
    // Step 1: Fetch appointments like the frontend does
    const response = await fetch('http://localhost:8080/api/v1/expedix/agenda/appointments');
    const appointmentsData = await response.json();
    
    console.log('1. Raw API response:', {
      success: appointmentsData.success,
      total: appointmentsData.data?.length || 0
    });
    
    if (!appointmentsData.success || !appointmentsData.data) {
      console.log('❌ API response not successful or no data');
      return;
    }
    
    // Step 2: Simulate the frontend processing
    const appointmentsByDate = {};
    
    appointmentsData.data.forEach((apt) => {
      const appointment = {
        id: apt.id,
        patientId: apt.patientId,
        patientName: apt.patient?.name || 'Paciente desconocido',
        time: apt.time,
        duration: apt.duration || 60,
        type: apt.type,
        status: apt.status,
        typeColor: apt.typeColor || '#6B7280',
        hasDeposit: apt.status === 'confirmed',
        notes: apt.notes || ''
      };
      
      if (!appointmentsByDate[apt.date]) {
        appointmentsByDate[apt.date] = [];
      }
      appointmentsByDate[apt.date].push(appointment);
    });
    
    console.log('2. Processed appointments by date:');
    Object.keys(appointmentsByDate).sort().forEach(date => {
      console.log(`   ${date}: ${appointmentsByDate[date].length} appointments`);
      appointmentsByDate[date].forEach(apt => {
        console.log(`     - ${apt.time}: ${apt.patientName} (${apt.status})`);
      });
    });
    
    // Step 3: Check specific dates that should be visible
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    console.log(`\n3. Checking today (${todayStr}):`);
    console.log(`   Today's appointments: ${appointmentsByDate[todayStr]?.length || 0}`);
    
    // Step 4: Check July 2025 dates
    console.log('\n4. July 2025 dates with appointments:');
    Object.keys(appointmentsByDate)
      .filter(date => date.startsWith('2025-07'))
      .sort()
      .forEach(date => {
        console.log(`   ${date}: ${appointmentsByDate[date].length} appointments`);
      });
    
    // Step 5: Check working days logic
    const workingDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    console.log('\n5. Checking working days filter:');
    Object.keys(appointmentsByDate)
      .filter(date => date.startsWith('2025-07'))
      .forEach(date => {
        const dateObj = new Date(date);
        const dayName = dayMap[dateObj.getDay()];
        const isWorkingDay = workingDays.includes(dayName);
        console.log(`   ${date} (${dayName}): ${isWorkingDay ? '✅ Working day' : '❌ Non-working day'}`);
      });
    
    // Step 6: Test formatDateKey function like the frontend
    console.log('\n6. Testing date formatting:');
    const testDate = new Date('2025-07-23');
    const formatDateKey = (date) => date.toISOString().split('T')[0];
    console.log(`   Input: ${testDate}`);
    console.log(`   Formatted: ${formatDateKey(testDate)}`);
    console.log(`   Has appointments: ${!!appointmentsByDate[formatDateKey(testDate)]}`);
    
  } catch (error) {
    console.error('❌ Error debugging agenda issue:', error);
  }
}

debugAgendaIssue();