import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { discountId: string } }
) {
  try {
    const body = await request.json();
    
    const response = await fetch(`http://localhost:8080/api/v1/finance/config/discount-plans/${params.discountId}`, {
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
    console.error('Error updating discount plan:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update discount plan',
        message: error.message
      }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { discountId: string } }
) {
  try {
    const response = await fetch(`http://localhost:8080/api/v1/finance/config/discount-plans/${params.discountId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || 'Failed to delete discount plan'
        }, 
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Discount plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting discount plan:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete discount plan',
        message: error.message
      }, 
      { status: 500 }
    );
  }
}