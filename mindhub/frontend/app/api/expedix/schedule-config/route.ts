// Schedule configuration API route - connects to MindHub backend
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const BACKEND_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';
  
  try {
    const url = new URL(request.url);
    let backendUrl = `${BACKEND_URL}/api/expedix/schedule-config`;
    if (url.search) {
      backendUrl += url.search;
    }

    const fetchHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      fetchHeaders['Authorization'] = authHeader;
    }

    const userContextHeader = request.headers.get('X-User-Context');
    if (userContextHeader) {
      fetchHeaders['X-User-Context'] = userContextHeader;
    }

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: fetchHeaders,
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false, 
      error: 'Failed to fetch schedule config',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT(request: Request) {
  const BACKEND_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';
  
  try {
    const body = await request.json();
    
    const fetchHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      fetchHeaders['Authorization'] = authHeader;
    }

    const userContextHeader = request.headers.get('X-User-Context');
    if (userContextHeader) {
      fetchHeaders['X-User-Context'] = userContextHeader;
    }

    const response = await fetch(`${BACKEND_URL}/api/expedix/schedule-config`, {
      method: 'PUT',
      headers: fetchHeaders,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update schedule configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}