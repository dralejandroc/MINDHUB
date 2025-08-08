import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.BACKEND_URL || 'https://mindhub-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token de verificación requerido' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Email verification API error:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Handle GET requests from email links
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  
  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Token de verificación requerido' },
      { status: 400 }
    );
  }
  
  // Redirect to the verify-email page with the token
  return NextResponse.redirect(new URL(`/verify-email?token=${token}`, request.url));
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}