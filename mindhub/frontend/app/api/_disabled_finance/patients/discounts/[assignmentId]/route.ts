import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const response = await fetch(`http://localhost:8080/api/v1/finance/patients/discounts/${params.assignmentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || 'Failed to remove discount assignment'
        }, 
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Discount assignment removed successfully'
    });
  } catch (error) {
    console.error('Error removing discount assignment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to remove discount assignment',
        message: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}