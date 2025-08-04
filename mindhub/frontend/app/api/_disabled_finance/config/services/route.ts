import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { configId, ...serviceData } = body;
    
    if (!configId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Configuration ID is required'
        }, 
        { status: 400 }
      );
    }

    const response = await fetch(`http://localhost:8080/api/v1/finance/config/${configId}/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serviceData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create service',
        message: error.message
      }, 
      { status: 500 }
    );
  }
}