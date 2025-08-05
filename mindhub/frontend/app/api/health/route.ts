import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const backendUrl = process.env.BACKEND_URL || 'https://mindhub.cloud/api';
  
  try {
    // Check backend health
    const backendResponse = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const backendData = await backendResponse.json();
    
    return NextResponse.json({
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
    });
  } catch (error) {
    return NextResponse.json({
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
    });
  }
}