import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  try {
    const body = await request.json();
    
    const response = await fetch(`http://localhost:8080/api/finance/config/services/${params.serviceId}`, {
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
    console.error('Error updating service:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update service',
        message: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  try {
    const response = await fetch(`http://localhost:8080/api/finance/config/services/${params.serviceId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || 'Failed to delete service'
        }, 
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete service',
        message: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}