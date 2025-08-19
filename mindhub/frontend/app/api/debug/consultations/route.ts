// Debug endpoint for consultations API issues
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[DEBUG] Starting debug consultations endpoint');
    
    // Test 1: Basic response
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        isProduction: process.env.NODE_ENV === 'production'
      },
      test: 'This is a debug endpoint for consultations',
      message: 'If you see this JSON, the endpoint is working correctly'
    };

    console.log('[DEBUG] Debug info:', debugInfo);

    return new Response(JSON.stringify(debugInfo, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('[DEBUG] Error in debug endpoint:', error);
    
    return new Response(JSON.stringify({
      error: 'Debug endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}