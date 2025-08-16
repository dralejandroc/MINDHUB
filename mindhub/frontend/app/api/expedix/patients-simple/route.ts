// Simplified patients endpoint for testing
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return new Response(JSON.stringify({
      success: true,
      message: 'Simplified patients endpoint working',
      data: [],
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