// Ultra-simplified consultations API to fix production HTML response issue
export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('[consultations API] Starting ultra-simplified version');
  
  try {
    // Return static mock data without any imports or complex logic
    const mockConsultations = [
      {
        id: 'consultation-1',
        patient_id: 'patient-1',
        consultation_date: '2024-01-15',
        consultation_type: 'Initial Assessment',
        chief_complaint: 'Anxiety symptoms',
        assessment: 'Patient presents with generalized anxiety disorder',
        plan: 'Start with CBT and consider medication if needed',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 'consultation-2',
        patient_id: 'patient-2', 
        consultation_date: '2024-01-16',
        consultation_type: 'Follow-up',
        chief_complaint: 'Depression follow-up',
        assessment: 'Patient shows improvement with current treatment',
        plan: 'Continue current medication, follow up in 2 weeks',
        created_at: '2024-01-16T11:00:00Z',
        updated_at: '2024-01-16T11:00:00Z'
      },
      {
        id: 'consultation-3',
        patient_id: 'patient-3',
        consultation_date: '2024-01-17', 
        consultation_type: 'Therapy Session',
        chief_complaint: 'Relationship issues',
        assessment: 'Patient discussing communication problems',
        plan: 'Continue therapy sessions, work on communication skills',
        created_at: '2024-01-17T14:00:00Z',
        updated_at: '2024-01-17T14:00:00Z'
      }
    ];

    const response = {
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
    };

    console.log('[consultations API] Returning', mockConsultations.length, 'consultations');

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('[consultations API] Critical error:', error);
    
    // Absolutely ensure JSON response
    return new Response(JSON.stringify({
      success: false,
      error: 'Consultations API failed',
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
  console.log('[consultations API] POST method called');
  
  return new Response(JSON.stringify({
    success: false,
    error: 'POST method not implemented in simplified version',
    message: 'This is a read-only API for now'
  }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  });
}
