import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const body = await request.json();
    
    const response = await fetch(`http://localhost:8080/api/v1/finance/config/patients/${params.patientId}/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error assigning service to patient:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to assign service to patient',
        message: error.message
      }, 
      { status: 500 }
    );
  }
}