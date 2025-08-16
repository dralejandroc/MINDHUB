// Test simplified patients API route
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('Test patients endpoint called');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Test patients endpoint working',
      data: [],
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Test patients error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Test endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}