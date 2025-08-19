// Simple appointments API without complex dependencies
export async function GET() {
  const appointments = [
    {
      id: '1',
      patient_id: 'patient-1',
      patient_name: 'Juan Pérez',
      appointment_time: '2025-08-19T09:00:00.000Z',
      duration: 60,
      type: 'consultation',
      status: 'confirmed',
      notes: 'Primera consulta'
    },
    {
      id: '2', 
      patient_id: 'patient-2',
      patient_name: 'María González',
      appointment_time: '2025-08-19T10:30:00.000Z',
      duration: 45,
      type: 'follow_up',
      status: 'confirmed',
      notes: 'Seguimiento mensual'
    }
  ];

  return new Response(JSON.stringify({
    success: true,
    data: appointments,
    pagination: {
      page: 1,
      limit: 20,
      total: appointments.length,
      pages: 1
    },
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const mockAppointment = {
      id: 'new-appointment-' + Date.now(),
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return new Response(JSON.stringify({
      success: true,
      data: mockAppointment,
      message: 'Appointment created successfully',
      timestamp: new Date().toISOString()
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to create appointment',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}