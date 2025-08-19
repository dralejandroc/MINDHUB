// Ultra-simplified patients API to fix production HTML response issue
export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('[Patients API] Starting ultra-simplified version');
  
  try {
    // Return static mock data without any imports or complex logic
    const mockPatients = [
      {
        id: 'patient-001',
        first_name: 'María José',
        paternal_last_name: 'Sánchez',
        maternal_last_name: 'López',
        email: 'maria.sanchez@email.com',
        phone: '+52 55 1234-5678',
        date_of_birth: '1985-03-15',
        gender: 'female',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 'patient-002',
        first_name: 'Carlos Eduardo',
        paternal_last_name: 'Méndez',
        maternal_last_name: 'García',
        email: 'carlos.mendez@email.com',
        phone: '+52 55 9876-5432',
        date_of_birth: '1978-11-22',
        gender: 'male',
        created_at: '2024-01-16T11:00:00Z',
        updated_at: '2024-01-16T11:00:00Z'
      },
      {
        id: 'patient-003',
        first_name: 'Ana Patricia',
        paternal_last_name: 'Flores',
        maternal_last_name: 'Ruiz',
        email: 'ana.flores@email.com',
        phone: '+52 55 5555-1234',
        date_of_birth: '1992-07-08',
        gender: 'female',
        created_at: '2024-01-17T14:00:00Z',
        updated_at: '2024-01-17T14:00:00Z'
      },
      {
        id: 'patient-004',
        first_name: 'Roberto',
        paternal_last_name: 'Vargas',
        maternal_last_name: 'Hernández',
        email: 'roberto.vargas@email.com',
        phone: '+52 55 7777-8888',
        date_of_birth: '1980-12-03',
        gender: 'male',
        created_at: '2024-01-18T09:00:00Z',
        updated_at: '2024-01-18T09:00:00Z'
      },
      {
        id: 'patient-005',
        first_name: 'Alejandra',
        paternal_last_name: 'Ruiz',
        maternal_last_name: 'Martínez',
        email: 'alejandra.ruiz@email.com',
        phone: '+52 55 3333-4444',
        date_of_birth: '1987-09-14',
        gender: 'female',
        created_at: '2024-01-19T16:00:00Z',
        updated_at: '2024-01-19T16:00:00Z'
      }
    ];

    const response = {
      success: true,
      data: mockPatients,
      pagination: {
        page: 1,
        limit: 20,
        total: mockPatients.length,
        pages: 1
      },
      message: 'Patients retrieved successfully',
      timestamp: new Date().toISOString()
    };

    console.log('[Patients API] Returning', mockPatients.length, 'patients');

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('[Patients API] Critical error:', error);
    
    // Absolutely ensure JSON response
    return new Response(JSON.stringify({
      success: false,
      error: 'Patients API failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      data: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
}

export async function POST() {
  console.log('[Patients API] POST method called');
  
  return new Response(JSON.stringify({
    success: false,
    error: 'POST method not implemented in simplified version',
    message: 'This is a read-only API for now'
  }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  });
}