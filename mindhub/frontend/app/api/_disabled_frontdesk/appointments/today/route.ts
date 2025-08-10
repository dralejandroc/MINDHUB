import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch('http://localhost:8080/api/frontdesk/appointments/today', {
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
    console.error('Error proxying appointments/today request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch data from backend',
        data: [
          {
            id: '1',
            patientName: 'María González',
            time: '10:00',
            type: 'Consulta General',
            status: 'confirmed'
          },
          {
            id: '2', 
            patientName: 'Carlos Ruiz',
            time: '14:30',
            type: 'Seguimiento',
            status: 'pending'
          }
        ]
      }, 
      { status: 500 }
    );
  }
}