// Prevent static generation for this API route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const backendUrl = process.env.BACKEND_URL || 'https://mindhub-production.up.railway.app';
  
  try {
    // Check backend health
    const backendResponse = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const backendData = await backendResponse.json();
    
    return new Response(JSON.stringify({
      status: 'ok',
      frontend: {
        status: 'healthy',
        url: process.env.NEXT_PUBLIC_APP_URL || 'https://mindhub.cloud',
      },
      backend: {
        status: backendResponse.ok ? 'healthy' : 'unhealthy',
        url: backendUrl,
        response: backendData,
      },
      environment: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        BACKEND_URL: process.env.BACKEND_URL,
        NODE_ENV: process.env.NODE_ENV,
      },
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      frontend: {
        status: 'healthy',
        url: process.env.NEXT_PUBLIC_APP_URL || 'https://mindhub.cloud',
      },
      backend: {
        status: 'unreachable',
        url: backendUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      environment: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        BACKEND_URL: process.env.BACKEND_URL,
        NODE_ENV: process.env.NODE_ENV,
      },
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}