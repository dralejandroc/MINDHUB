// Completely rewritten consultations API - zero dependencies  
export const dynamic = 'force-dynamic'

export async function GET() {
  // Static data with zero imports or dependencies
  const mockConsultations = [
    {
      id: 'cons_001',
      patient_id: 'pat_001',
      consultation_date: '2024-01-15',
      consultation_type: 'Initial Assessment',
      chief_complaint: 'Síntomas de ansiedad',
      assessment: 'Paciente presenta síntomas de ansiedad generalizada',
      plan: 'Iniciar terapia cognitivo-conductual',
      created_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 'cons_002',
      patient_id: 'pat_002', 
      consultation_date: '2024-01-16',
      consultation_type: 'Follow-up',
      chief_complaint: 'Seguimiento de depresión',
      assessment: 'Paciente muestra mejoría con tratamiento actual',
      plan: 'Continuar medicación actual',
      created_at: '2024-01-16T11:00:00Z'
    },
    {
      id: 'cons_003',
      patient_id: 'pat_003',
      consultation_date: '2024-01-17',
      consultation_type: 'Therapy Session', 
      chief_complaint: 'Problemas de relación',
      assessment: 'Paciente discute problemas de comunicación',
      plan: 'Continuar sesiones de terapia',
      created_at: '2024-01-17T14:00:00Z'
    }
  ]

  const responseData = {
    success: true,
    data: mockConsultations,
    pagination: {
      page: 1,
      limit: 20,
      total: mockConsultations.length,
      pages: 1
    },
    message: 'Consultations retrieved successfully', 
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