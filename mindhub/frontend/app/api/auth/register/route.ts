import { NextRequest, NextResponse } from 'next/server';

// Use configured backend URL from environment
const BACKEND_URL = process.env.BACKEND_URL || 'https://mindhub.cloud';

export async function POST(request: NextRequest) {
  try {
    const { 
      name, 
      email, 
      password, 
      city, 
      country, 
      yearsOfPractice, 
      specialization, 
      howDidYouHear, 
      expectations,
      professionalType
    } = await request.json();
    
    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Nombre, email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Forward to backend registration
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        password,
        city,
        country,
        yearsOfPractice,
        specialization,
        howDidYouHear,
        expectations,
        professionalType
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Error en el registro' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Registro exitoso - Bienvenido a MindHub',
      data: {
        token: data.data.token,
        user: data.data.user
      }
    });
  } catch (error) {
    console.error('Register API error:', error);
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