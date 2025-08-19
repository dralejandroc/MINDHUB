// Completely rewritten patients API - zero dependencies
export const dynamic = 'force-dynamic'

export async function GET() {
  // Static data with zero imports or dependencies
  const mockPatients = [
    {
      id: 'pat_001',
      first_name: 'María José',
      paternal_last_name: 'Sánchez', 
      maternal_last_name: 'López',
      email: 'maria.sanchez@email.com',
      phone: '+52 55 1234-5678',
      date_of_birth: '1985-03-15',
      gender: 'female',
      created_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 'pat_002', 
      first_name: 'Carlos Eduardo',
      paternal_last_name: 'Méndez',
      maternal_last_name: 'García', 
      email: 'carlos.mendez@email.com',
      phone: '+52 55 9876-5432',
      date_of_birth: '1978-11-22',
      gender: 'male',
      created_at: '2024-01-16T11:00:00Z'
    },
    {
      id: 'pat_003',
      first_name: 'Ana Patricia', 
      paternal_last_name: 'Flores',
      maternal_last_name: 'Ruiz',
      email: 'ana.flores@email.com',
      phone: '+52 55 5555-1234', 
      date_of_birth: '1992-07-08',
      gender: 'female',
      created_at: '2024-01-17T14:00:00Z'
    }
  ]

  const responseData = {
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
  }

  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
  })
}

export async function POST() {
  return new Response(JSON.stringify({
    success: false,
    error: 'POST not implemented',
    message: 'Read-only API'
  }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  })
}