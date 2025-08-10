import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://mindhub-production.up.railway.app';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Forward all query parameters
    const queryParams = new URLSearchParams();
    searchParams.forEach((value, key) => {
      queryParams.append(key, value);
    });
    
    let url = `${BACKEND_URL}/api/clinimetrix/patient-assessments/${params.id}`;
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    const response = await fetch(url, {
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
    console.error(`Error proxying patient assessments request for patient ${params.id}:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch patient assessments from backend',
        data: []
      }, 
      { status: 500 }
    );
  }
}