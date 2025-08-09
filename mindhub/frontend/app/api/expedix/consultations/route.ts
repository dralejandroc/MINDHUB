import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'https://mindhub-production.up.railway.app';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patient_id = searchParams.get('patient_id');
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    
    let url = `${BACKEND_URL}/api/v1/expedix/consultations?page=${page}&limit=${limit}`;
    if (patient_id) {
      url += `&patient_id=${encodeURIComponent(patient_id)}`;
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
    console.error('Error proxying consultations request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch consultations from backend',
        data: []
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/api/v1/expedix/consultations`, {
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
    console.error('Error creating consultation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create consultation',
        message: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}