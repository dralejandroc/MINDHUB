// Agenda appointments API route - connects to MindHub backend
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindhub-backend.vercel.app';
  
  try {
    const url = new URL(request.url);
    let backendUrl = `${BACKEND_URL}/api/expedix/agenda/appointments`;
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
      error: 'Failed to fetch appointments',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(request: Request) {
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mindhub-backend.vercel.app';
  
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

    const response = await fetch(`${BACKEND_URL}/api/expedix/agenda/appointments`, {
      method: 'POST',
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
      error: 'Failed to create appointment',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}