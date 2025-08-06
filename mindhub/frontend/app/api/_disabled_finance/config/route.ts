import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch('http://localhost:8080/api/v1/finance/config', {
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
    console.error('Error proxying finance config request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch finance configuration from backend',
        data: null
      }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract config ID from body or use a default approach
    const configId = body.id;
    if (!configId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Configuration ID is required'
        }, 
        { status: 400 }
      );
    }

    const response = await fetch(`http://localhost:8080/api/v1/finance/config/${configId}`, {
      method: 'PUT',
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
    console.error('Error updating finance config:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update finance configuration',
        message: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}