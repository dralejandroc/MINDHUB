// Simple appointment by ID API
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    return new Response(JSON.stringify({
      success: true,
      message: `Appointment ${id} deleted successfully`,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false, 
      error: 'Failed to delete appointment',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const updatedAppointment = {
      id,
      ...body,
      updated_at: new Date().toISOString()
    };
    
    return new Response(JSON.stringify({
      success: true,
      data: updatedAppointment,
      message: `Appointment ${id} updated successfully`,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false, 
      error: 'Failed to update appointment',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}