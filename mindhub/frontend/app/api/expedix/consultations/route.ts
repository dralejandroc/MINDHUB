// Force dynamic runtime for this API route
export const dynamic = 'force-dynamic'

// Zero environment variables API
export async function GET() {
  const consultations = [
    {
      id: 'cons_001',
      patient_id: 'pat_001',
      consultation_date: '2024-01-15',
      consultation_type: 'Initial Assessment',
      chief_complaint: 'Síntomas de ansiedad'
    },
    {
      id: 'cons_002',
      patient_id: 'pat_002',
      consultation_date: '2024-01-16', 
      consultation_type: 'Follow-up',
      chief_complaint: 'Seguimiento de depresión'
    }
  ];

  return new Response(JSON.stringify({
    success: true,
    data: consultations,
    pagination: {
      page: 1,
      limit: 20,
      total: consultations.length,
      pages: 1
    },
    timestamp: new Date().toISOString()
  }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}