import { NextRequest, NextResponse } from 'next/server';

// Simple test route to verify backend connectivity
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing backend connectivity...');
    
    const response = await fetch(`${BACKEND_URL}/api/expedix/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Response data:', data);
    
    return NextResponse.json({
      success: true,
      message: 'Backend connectivity test successful',
      backendResponse: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Backend connectivity test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Backend connectivity test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}