import { NextRequest, NextResponse } from 'next/server';

// Prevent static generation for this API route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const API_BASE_URL = process.env.BACKEND_URL || 'https://mindhub-production.up.railway.app';

export async function GET() {
  try {
    console.log('[HEALTH CHECK] Testing backend connectivity to:', API_BASE_URL);
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MindHub-Frontend-HealthCheck/1.0',
      },
    });

    console.log('[HEALTH CHECK] Backend response status:', response.status);
    console.log('[HEALTH CHECK] Backend response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.text();
    console.log('[HEALTH CHECK] Backend response body:', data);

    return NextResponse.json({
      success: true,
      backend: {
        url: API_BASE_URL,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: data,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[HEALTH CHECK] Backend connectivity error:', error);
    
    return NextResponse.json(
      {
        success: false,
        backend: {
          url: API_BASE_URL,
          error: error instanceof Error ? error.message : 'Unknown error',
          type: error instanceof TypeError ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}