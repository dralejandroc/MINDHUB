// Simple waiting list API without complex dependencies
export async function GET() {
  const waitingList = [
    {
      id: 'wait-1',
      patient_name: 'Carlos Ramírez',
      phone: '+1234567890',
      preferred_time: 'morning',
      priority: 'high',
      added_date: '2025-08-19',
      notes: 'Primera vez'
    }
  ];

  return new Response(JSON.stringify({
    success: true,
    data: waitingList,
    pagination: {
      page: 1,
      limit: 20,
      total: waitingList.length,
      pages: 1
    },
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const newWaitingEntry = {
      id: 'wait-' + Date.now(),
      ...body,
      added_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };
    
    return new Response(JSON.stringify({
      success: true,
      data: newWaitingEntry,
      message: 'Added to waiting list successfully',
      timestamp: new Date().toISOString()
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false, 
      error: 'Failed to add to waiting list',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}