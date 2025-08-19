// Ultra-simple consultations API to debug production issues
export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('[SIMPLE API] Processing consultations request');
  
  try {
    // Return minimal mock data without any complex logic
    const mockData = [
      {
        id: 'consultation-1',
        patient_id: 'patient-1',
        consultation_date: '2024-01-15',
        consultation_type: 'Initial Assessment',
        chief_complaint: 'Anxiety symptoms',
        assessment: 'Patient presents with generalized anxiety',
        created_at: '2024-01-15T10:00:00Z'
      },
      {
        id: 'consultation-2', 
        patient_id: 'patient-2',
        consultation_date: '2024-01-16',
        consultation_type: 'Follow-up',
        chief_complaint: 'Depression follow-up',
        assessment: 'Patient shows improvement with current treatment',
        created_at: '2024-01-16T11:00:00Z'
      }
    ];

    const response = {
      success: true,
      data: mockData,
      pagination: {
        page: 1,
        limit: 20,
        total: 2,
        pages: 1
      },
      timestamp: new Date().toISOString()
    };

    console.log('[SIMPLE API] Returning response:', response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('[SIMPLE API] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Simple API failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      data: [],
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST() {
  return new Response(JSON.stringify({
    success: false,
    error: 'POST not implemented in simple version'
  }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' }
  });
}