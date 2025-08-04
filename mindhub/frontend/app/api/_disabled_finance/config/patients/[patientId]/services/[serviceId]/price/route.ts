import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string; serviceId: string } }
) {
  try {
    const response = await fetch(`http://localhost:8080/api/v1/finance/config/patients/${params.patientId}/services/${params.serviceId}/price`, {
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
    console.error('Error calculating patient service price:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to calculate service price',
        message: error.message
      }, 
      { status: 500 }
    );
  }
}