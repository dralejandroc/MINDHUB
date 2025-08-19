// Simple schedule configuration API 
export async function GET() {
  const scheduleConfig = {
    workingHours: {
      start: '09:00',
      end: '18:00'
    },
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
    appointmentDuration: 30,
    timeSlots: [],
    breaks: [
      { start: '13:00', end: '14:00', name: 'Lunch Break' }
    ],
    business_hours: {
      monday: { start: '09:00', end: '18:00', enabled: true },
      tuesday: { start: '09:00', end: '18:00', enabled: true },
      wednesday: { start: '09:00', end: '18:00', enabled: true },
      thursday: { start: '09:00', end: '18:00', enabled: true },
      friday: { start: '09:00', end: '17:00', enabled: true },
      saturday: { start: '10:00', end: '14:00', enabled: false },
      sunday: { start: '10:00', end: '14:00', enabled: false }
    },
    appointment_durations: [
      { label: '30 minutos', value: 30 },
      { label: '45 minutos', value: 45 },
      { label: '60 minutos', value: 60 },
      { label: '90 minutos', value: 90 }
    ],
    timezone: 'America/Mexico_City'
  };

  return new Response(JSON.stringify({
    success: true,
    data: scheduleConfig,
    message: 'Schedule configuration retrieved successfully',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    const updatedConfig = {
      ...body,
      updated_at: new Date().toISOString()
    };
    
    return new Response(JSON.stringify({
      success: true,
      data: updatedConfig,
      message: 'Schedule configuration updated successfully',
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update schedule configuration',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}