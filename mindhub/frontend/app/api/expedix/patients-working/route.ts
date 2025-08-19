// Working patients endpoint - simplified and tested
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: Request) {
  try {
    console.log('[WORKING PATIENTS] Processing GET request');
    
    // Return mock data for now to test if the endpoint works
    return new Response(JSON.stringify({
      success: true,
      data: [
        {
          id: "test-1",
          first_name: "Juan",
          paternal_last_name: "Pérez",
          maternal_last_name: "García",
          birth_date: "1985-03-15",
          age: 38,
          gender: "masculine",
          email: "juan.perez@example.com",
          cell_phone: "+52 55 1234 5678"
        },
        {
          id: "test-2", 
          first_name: "María",
          paternal_last_name: "López",
          maternal_last_name: "Martínez",
          birth_date: "1992-07-22",
          age: 31,
          gender: "feminine",
          email: "maria.lopez@example.com",
          cell_phone: "+52 55 8765 4321"
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        pages: 1
      },
      message: "Mock data from working endpoint"
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[WORKING PATIENTS] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Working endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}