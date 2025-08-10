import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const response = await fetch(`http://localhost:8080/api/finance/patients/${params.patientId}/services`, {
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
    console.error('Error fetching patient services:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch patient services',
        data: []
      }, 
      { status: 500 }
    );
  }
}