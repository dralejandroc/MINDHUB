import { NextRequest, NextResponse } from 'next/server';

// Prevent static generation for this API route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'https://mindhub-production.up.railway.app';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/frontdesk/tasks/pending`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
        success: false, 
        error: 'Failed to fetch data from backend',
        data: [
          {
            id: '1',
            task: 'Confirmar cita con María González',
            priority: 'high',
            type: 'appointment_confirmation'
          },
          {
            id: '2',
            task: 'Enviar recordatorio a Carlos Ruiz',
            priority: 'medium', 
            type: 'reminder'
          },
          {
            id: '3',
            task: 'Procesar pago pendiente',
            priority: 'high',
            type: 'payment_followup'
          }
        ]
      }, 
      { status: 500 }
    );
  }
}