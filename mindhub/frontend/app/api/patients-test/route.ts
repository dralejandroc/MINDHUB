// Test patients API at root level to see if nested paths are the issue
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const patients = [
      {
        id: 'patient-001',
        first_name: 'María José',
        paternal_last_name: 'Sánchez',
        maternal_last_name: 'López',
        email: 'maria.sanchez@email.com',
        phone: '+52 55 1234-5678'
      },
      {
        id: 'patient-002',
        first_name: 'Carlos Eduardo',
        paternal_last_name: 'Méndez',
        maternal_last_name: 'García',
        email: 'carlos.mendez@email.com',
        phone: '+52 55 9876-5432'
      }
    ];

    return new Response(JSON.stringify({
      success: true,
      data: patients,
      message: 'Patients from root-level API'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Root level API failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}