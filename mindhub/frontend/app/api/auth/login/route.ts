import { NextRequest, NextResponse } from 'next/server';

// Backend URL - using environment variable
const BACKEND_URL = process.env.BACKEND_URL || 'http://mindhub-backend:8080';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('Attempting login to backend:', BACKEND_URL);
    
    // Forward to backend authentication
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log('Backend response status:', response.status);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Error de autenticación' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token: data.data.token,
        user: data.data.user
      }
    });
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, message: 'Error de conexión con el servidor' },
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