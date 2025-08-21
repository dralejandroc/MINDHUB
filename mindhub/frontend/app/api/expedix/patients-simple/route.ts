// Simplified patients endpoint for testing
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const samplePatients = [
      {
        id: 'sample-1',
        first_name: 'María',
        last_name: 'González',
        email: 'maria.gonzalez@email.com',
        phone: '+52 999 123 4567',
        date_of_birth: '1990-05-15',
        gender: 'F',
        address: 'Calle 60 #123, Centro, Mérida, Yuc.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active: true
      },
      {
        id: 'sample-2',
        first_name: 'Carlos',
        last_name: 'Ruiz',
        email: 'carlos.ruiz@email.com',
        phone: '+52 999 456 7890',
        date_of_birth: '1985-10-22',
        gender: 'M',
        address: 'Av. Itzaes #456, García Ginerés, Mérida, Yuc.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active: true
      },
      {
        id: 'sample-3',
        first_name: 'Ana',
        last_name: 'Martínez',
        email: 'ana.martinez@email.com',
        phone: '+52 999 789 0123',
        date_of_birth: '1995-03-08',
        gender: 'F',
        address: 'Calle 42 #789, Montejo, Mérida, Yuc.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active: true
      }
    ];

    return new Response(JSON.stringify({
      success: true,
      message: 'Sample patients data (backend unavailable)',
      results: samplePatients,
      count: samplePatients.length,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Simplified endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}