// Zero environment variables API
export async function GET() {
  const patients = [
    {
      id: 'pat_001',
      first_name: 'María José',
      paternal_last_name: 'Sánchez',
      maternal_last_name: 'López',
      email: 'maria.sanchez@email.com'
    },
    {
      id: 'pat_002',
      first_name: 'Carlos Eduardo', 
      paternal_last_name: 'Méndez',
      maternal_last_name: 'García',
      email: 'carlos.mendez@email.com'
    }
  ];

  return new Response(JSON.stringify({
    success: true,
    data: patients,
    pagination: {
      page: 1,
      limit: 20,
      total: patients.length,
      pages: 1
    },
    timestamp: new Date().toISOString()
  }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}