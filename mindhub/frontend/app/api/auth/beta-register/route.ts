import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.BACKEND_URL || 'https://mindhub-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Beta register request received');
    console.log('[API] Backend URL:', API_BASE_URL);
    
    const body = await request.json();
    console.log('[API] Request body received:', { ...body, password: '***', confirmPassword: '***' });
    
    const backendUrl = `${API_BASE_URL}/auth/beta-register`;
    console.log('[API] Making request to:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MindHub-Frontend/1.0',
      },
      body: JSON.stringify(body),
    });

    console.log('[API] Backend response status:', response.status);
    console.log('[API] Backend response headers:', Object.fromEntries(response.headers.entries()));

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const textResponse = await response.text();
      console.log('[API] Non-JSON response from backend:', textResponse);
      data = { 
        success: false, 
        message: `Backend returned non-JSON response (${response.status}): ${textResponse}` 
      };
    }

    console.log('[API] Backend response data:', data);

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('[API] Beta register API error:', error);
    
    // More detailed error logging
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('[API] Network error - backend may be unreachable:', API_BASE_URL);
      return NextResponse.json(
        { 
          success: false, 
          message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
          debug: {
            backendUrl: API_BASE_URL,
            error: error.message,
            type: 'NETWORK_ERROR'
          }
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error interno del servidor',
        debug: {
          error: error instanceof Error ? error.message : 'Unknown error',
          type: 'INTERNAL_ERROR'
        }
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}