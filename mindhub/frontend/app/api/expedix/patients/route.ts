// Prevent static generation for this API route

const BACKEND_URL = process.env.BACKEND_URL || 'https://mindhub-production.up.railway.app';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Forward all query parameters
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });
    
    let url = `${BACKEND_URL}/api/expedix/patients`;
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    // Forward authentication headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Forward Authorization header (Clerk token)
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Forward user context
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
    console.error('Error proxying patients request:', error);
    console.error('Backend URL:', BACKEND_URL);
    console.error('Error details:', error instanceof Error ? error.message : error);
    
    // Check if it's an authentication error
    if (error instanceof Error && (error.message.includes('401') || error.message.includes('Authentication'))) {
      return new Response(JSON.stringify({
        success: false, 
        error: 'Authentication required',
        message: 'Please log in to access this resource',
        code: 'AUTHENTICATION_REQUIRED'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    return new Response(JSON.stringify({
      success: false, 
      error: 'Failed to fetch data from backend',
      message: error instanceof Error ? error.message : 'Unknown error',
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      }
    }), {
      status: 500,
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

    // Forward Authorization header (Clerk token)
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Forward user context
    const userContextHeader = request.headers.get('X-User-Context');
    if (userContextHeader) {
      headers['X-User-Context'] = userContextHeader;
    }
    
    const response = await fetch(`${BACKEND_URL}/api/expedix/patients`, {
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
    console.error('Error creating patient:', error);
    
    // Check if it's an authentication error
    if (error instanceof Error && (error.message.includes('401') || error.message.includes('Authentication'))) {
      return new Response(JSON.stringify({
        success: false, 
        error: 'Authentication required',
        message: 'Please log in to access this resource',
        code: 'AUTHENTICATION_REQUIRED'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    return new Response(JSON.stringify({
      success: false, 
      error: 'Failed to create patient',
      message: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}