import { NextRequest, NextResponse } from 'next/server';

// Prevent static generation for this API route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'https://mindhub-production.up.railway.app';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Forward all query parameters
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });
    
    let url = `${BACKEND_URL}/api/resources`;
    if (params.toString()) {
      url += `?${params.toString()}`;
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
    console.error('Error proxying resources request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch resources from backend',
        data: [
          {
            id: '1',
            title: 'Técnicas de Relajación',
            category: 'Ansiedad',
            type: 'document',
            description: 'Guía práctica para manejar la ansiedad'
          },
          {
            id: '2',
            title: 'Ejercicios de Respiración',
            category: 'Bienestar',
            type: 'video',
            description: 'Video tutorial con ejercicios de respiración'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          pages: 1
        }
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/api/resources`, {
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
    console.error('Error creating resource:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create resource',
        message: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}