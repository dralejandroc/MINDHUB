// Working consultations endpoint - simplified and tested
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'https://mindhub-production.up.railway.app';

export async function GET(request: Request) {
  try {
    console.log('[WORKING CONSULTATIONS] Processing GET request');
    
    // Return mock data for now to test if the endpoint works
    return new Response(JSON.stringify({
      success: true,
      data: [
        {
          id: "cons-1",
          patient_id: "test-1",
          patient_name: "Juan Pérez García",
          consultation_date: "2025-08-15",
          consultation_time: "10:00",
          type: "Primera consulta",
          status: "completed",
          chief_complaint: "Ansiedad generalizada",
          diagnosis: "F41.1 - Trastorno de ansiedad generalizada"
        },
        {
          id: "cons-2",
          patient_id: "test-2", 
          patient_name: "María López Martínez",
          consultation_date: "2025-08-14",
          consultation_time: "15:30",
          type: "Seguimiento",
          status: "completed",
          chief_complaint: "Control de tratamiento",
          diagnosis: "F32.1 - Episodio depresivo moderado"
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        pages: 1
      },
      message: "Mock data from working consultations endpoint"
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[WORKING CONSULTATIONS] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Working consultations endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}