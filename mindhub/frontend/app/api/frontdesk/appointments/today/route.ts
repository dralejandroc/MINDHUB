import { NextRequest, NextResponse } from 'next/server';

// Prevent static generation for this API route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'https://mindhub-production.up.railway.app';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/frontdesk/appointments/today`, {
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
    console.error('Error proxying frontdesk appointments today request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch today appointments from backend',
        data: [
          {
            id: '1',
            patient_name: 'María González',
            time: '09:00',
            type: 'Consulta General',
            status: 'confirmed'
          },
          {
            id: '2',
            patient_name: 'Carlos Ruiz',
            time: '10:30',
            type: 'Control',
            status: 'confirmed'
          },
          {
            id: '3',
            patient_name: 'Ana Martínez',
            time: '14:00',
            type: 'Primera Vez',
            status: 'pending'
          }
        ]
      }, 
      { status: 500 }
    );
  }
}