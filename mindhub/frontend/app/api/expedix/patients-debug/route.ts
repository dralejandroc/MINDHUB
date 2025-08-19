// Debug patients endpoint - step by step
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: Request) {
  try {
    // Step 1: Log that we started
    console.log('=== PATIENTS DEBUG START ===');
    
    // Step 2: Test basic Request object access
    const url = request.url;
    console.log('Request URL:', url);
    
    // Step 3: Test environment variable
    console.log('Backend URL:', BACKEND_URL);
    
    // Step 4: Test URL constructor
    const { searchParams } = new URL(request.url);
    console.log('Search params parsed successfully');
    
    // Step 5: Test URLSearchParams
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });
    console.log('Params processed successfully');
    
    // Step 6: Test building target URL
    let targetUrl = `${BACKEND_URL}/api/expedix/patients`;
    if (params.toString()) {
      targetUrl += `?${params.toString()}`;
    }
    console.log('Target URL:', targetUrl);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'All debug steps passed',
      data: {
        requestUrl: url,
        backendUrl: BACKEND_URL,
        targetUrl: targetUrl,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('=== PATIENTS DEBUG ERROR ===', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Debug endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}