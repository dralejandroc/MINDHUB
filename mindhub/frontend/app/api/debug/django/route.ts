// Debug endpoint to check Django backend status
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[DEBUG] Checking Django backend status...');
    
    const DJANGO_API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';
    
    // Test multiple endpoints
    const tests = [
      { name: 'Health Check', url: `${DJANGO_API_BASE}/health/` },
      { name: 'API Root', url: `${DJANGO_API_BASE}/` },
      { name: 'Expedix Patients', url: `${DJANGO_API_BASE}/api/expedix/patients/` },
    ];
    
    const results = [];
    
    for (const test of tests) {
      try {
        console.log(`[DEBUG] Testing ${test.name}: ${test.url}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(test.url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        const statusText = response.statusText;
        let body = '';
        
        try {
          body = await response.text();
        } catch (e) {
          body = `Failed to read response: ${e}`;
        }
        
        results.push({
          name: test.name,
          url: test.url,
          status: response.status,
          statusText,
          body: body.substring(0, 500), // Limit body size
          headers: Object.fromEntries(response.headers.entries()),
        });
        
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? (error.name === 'AbortError' ? 'Request timeout (10s)' : error.message)
          : 'Unknown error occurred';
        results.push({
          name: test.name,
          url: test.url,
          status: 'ERROR',
          error: errorMessage,
        });
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      django_base_url: DJANGO_API_BASE,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        django_url: process.env.NEXT_PUBLIC_DJANGO_API_URL,
      },
      tests: results,
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}