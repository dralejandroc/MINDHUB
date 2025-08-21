import { NextRequest, NextResponse } from 'next/server';

// Prevent static generation for this API route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: NextRequest) {
  try {
    // Forward authentication headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Forward Authorization header (Auth token)
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Forward user context
    const userContextHeader = request.headers.get('X-User-Context');
    if (userContextHeader) {
      headers['X-User-Context'] = userContextHeader;
    }

    const response = await fetch(`${BACKEND_URL}/api/frontdesk/tasks/pending`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying tasks/pending request:', error);
    return NextResponse.json(
      { 
        success: true, 
        message: 'Using mock data (backend unavailable)',
        data: [
          {
            id: '1',
            type: 'callback',
            description: 'Confirmar cita con María González',
            patientName: 'María González',
            priority: 'high',
            dueTime: '09:00'
          },
          {
            id: '2',
            type: 'followup',
            description: 'Enviar recordatorio a Carlos Ruiz',
            patientName: 'Carlos Ruiz',
            priority: 'medium',
            dueTime: '10:00'
          },
          {
            id: '3',
            type: 'payment',
            description: 'Procesar pago pendiente de Ana Martínez',
            patientName: 'Ana Martínez',
            priority: 'high',
            dueTime: '11:00'
          }
        ]
      }, 
      { status: 500 }
    );
  }
}