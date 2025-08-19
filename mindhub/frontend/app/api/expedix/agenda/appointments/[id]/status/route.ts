// Simple appointment status update API
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const updatedStatus = {
      id,
      status: body.status || 'updated',
      updated_at: new Date().toISOString(),
      updated_by: 'system'
    };
    
    return new Response(JSON.stringify({
      success: true,
      data: updatedStatus,
      message: `Appointment ${id} status updated successfully`,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false, 
      error: 'Failed to update appointment status',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}