import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch('http://localhost:8080/api/v1/frontdesk/stats/today', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Aquí puedes agregar headers de autenticación si es necesario
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying request to backend:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch data from backend',
        data: {
          appointments: 8,
          payments: 6,
          pendingPayments: 3,
          resourcesSent: 12
        }
      }, 
      { status: 500 }
    );
  }
}