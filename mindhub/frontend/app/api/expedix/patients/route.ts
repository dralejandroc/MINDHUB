// Expedix patients API route - connects to Django backend
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: Request) {
  try {
    console.log('[PATIENTS API] Processing GET request');
    console.log('[PATIENTS API] Backend URL:', BACKEND_URL);
    
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });
    
    let url = `${BACKEND_URL}/api/expedix/patients`;
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    console.log('[PATIENTS API] Fetching from:', url);

    // Forward authentication headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const userContextHeader = request.headers.get('X-User-Context');
    if (userContextHeader) {
      headers['X-User-Context'] = userContextHeader;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    console.log('[PATIENTS API] Backend response status:', response.status);

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[PATIENTS API] Backend response data received');
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[PATIENTS API] Error:', error);
    
    return new Response(JSON.stringify({
      success: false, 
      error: 'Failed to fetch patients from backend',
      message: error instanceof Error ? error.message : "Unknown error",
      backend_url: BACKEND_URL
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}