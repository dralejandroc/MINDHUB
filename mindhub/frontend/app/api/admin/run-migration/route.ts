import { NextRequest, NextResponse } from 'next/server';

// Internal backend URL for migration
const BACKEND_URL = process.env.BACKEND_URL || 'https://mindhub-django-backend.vercel.app';

export async function POST(request: NextRequest) {
  try {
    console.log('[MIGRATION] Starting email verification migration...');
    
    const { secret } = await request.json();
    
    if (secret !== 'migration-email-2025') {
      return NextResponse.json(
        { success: false, message: 'Invalid secret' },
        { status: 401 }
      );
    }
    
    // Forward the migration request to the backend
    const backendUrl = `${BACKEND_URL}/api/auth/run-email-migration`;
    console.log('[MIGRATION] Forwarding to backend:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MindHub-Migration/1.0',
      },
      body: JSON.stringify({ secret }),
    });

    console.log('[MIGRATION] Backend response status:', response.status);

    // Get response from backend
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const textResponse = await response.text();
      console.log('[MIGRATION] Non-JSON response:', textResponse);
      data = { 
        success: false, 
        message: `Backend returned non-JSON response (${response.status}): ${textResponse}` 
      };
    }

    console.log('[MIGRATION] Backend response data:', data);

    return NextResponse.json(data, {
      status: response.status,
    });
    
  } catch (error) {
    console.error('[MIGRATION] Migration error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error ejecutando migración',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Email Verification Migration Endpoint',
      usage: 'POST with {"secret": "migration-email-2025"}' 
    }
  );
}