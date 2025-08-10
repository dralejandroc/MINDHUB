import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { configId, ...discountData } = body;
    
    if (!configId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Configuration ID is required'
        }, 
        { status: 400 }
      );
    }

    const response = await fetch(`http://localhost:8080/api/finance/config/${configId}/discount-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discountData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating discount plan:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create discount plan',
        message: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}