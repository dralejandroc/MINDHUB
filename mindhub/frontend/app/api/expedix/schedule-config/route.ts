// Schedule configuration API route - connects to Django backend
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('[SCHEDULE CONFIG API] Processing GET request');
    console.log('[SCHEDULE CONFIG API] Backend URL:', BACKEND_URL);
    
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });
    
    let url = `${BACKEND_URL}/api/expedix/schedule-config`;
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    console.log('[SCHEDULE CONFIG API] Fetching from:', url);

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

    console.log('[SCHEDULE CONFIG API] Backend response status:', response.status);

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[SCHEDULE CONFIG API] Backend response data received');
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[SCHEDULE CONFIG API] Error:', error);
    
    return new Response(JSON.stringify({
      success: false, 
      error: 'Failed to fetch schedule config from backend',
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

export async function PUT(request: Request) {
  try {
    console.log('[SCHEDULE CONFIG API] Processing PUT request');
    const body = await request.json();
    
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

    const response = await fetch(`${BACKEND_URL}/api/expedix/schedule-config`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    console.log('[SCHEDULE CONFIG API] PUT Backend response status:', response.status);

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[SCHEDULE CONFIG API] PUT Backend response data received');
    
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('[SCHEDULE CONFIG API] PUT Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update schedule configuration',
      message: error instanceof Error ? error.message : "Unknown error",
      backend_url: BACKEND_URL
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}