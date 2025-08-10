import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const response = await fetch(`http://localhost:8080/api/finance/patients/services/${params.assignmentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { 
          success: false, 
          error: data.error || 'Failed to remove service assignment'
        }, 
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Service assignment removed successfully'
    });
  } catch (error) {
    console.error('Error removing service assignment:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to remove service assignment',
        message: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}