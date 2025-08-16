// Agenda appointments API route
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'https://mindhub-production.up.railway.app';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });
    
    let url = `${BACKEND_URL}/api/expedix/agenda/appointments`;
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error proxying appointments request:', error);
    
    // Return default appointments if backend is not available
    return new Response(JSON.stringify({
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function POST(request: Request) {
  try {
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
    
    const response = await fetch(`${BACKEND_URL}/api/expedix/agenda/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    
    return new Response(JSON.stringify({
      success: false, 
      error: 'Failed to create appointment',
      message: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}