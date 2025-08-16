// Debug endpoint to test Railway connection
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'https://mindhub-production.up.railway.app';

export async function GET() {
  try {
    console.log('Debug: Trying to connect to Railway:', BACKEND_URL);
    
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Debug: Railway response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Debug: Railway response data:', data);
    
    return new Response(JSON.stringify({
      status: "success",
      backend_url: BACKEND_URL,
      railway_status: response.status,
      railway_data: data,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Debug: Error connecting to Railway:', error);
    
    return new Response(JSON.stringify({
      status: "error",
      backend_url: BACKEND_URL,
      error_message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}