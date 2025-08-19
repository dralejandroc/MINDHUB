// Agenda appointments API route - Supabase version
export const dynamic = 'force-dynamic';

import { 
  createSupabaseServer, 
  getAuthenticatedUser, 
  createAuthResponse, 
  createErrorResponse, 
  createSuccessResponse 
} from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    console.log('[Appointments API] Processing GET request with Supabase');
    const { searchParams } = new URL(request.url);
    
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse()
    }
    
    const supabase = createSupabaseServer()

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const date = searchParams.get('date') || '';
    const offset = (page - 1) * limit;

    // For now, return mock data since we're migrating to Supabase
    // TODO: Create appointments table and implement real queries
    const mockAppointments = [
      {
        id: '1',
        patient_id: 'patient-1',
        patient_name: 'Juan Pérez',
        appointment_time: '2025-08-19T09:00:00.000Z',
        duration: 60,
        type: 'consultation',
        status: 'confirmed',
        notes: 'Primera consulta'
      },
      {
        id: '2', 
        patient_id: 'patient-2',
        patient_name: 'María González',
        appointment_time: '2025-08-19T10:30:00.000Z',
        duration: 45,
        type: 'follow_up',
        status: 'confirmed',
        notes: 'Seguimiento mensual'
      }
    ];

    console.log(`[Appointments API] Successfully retrieved ${mockAppointments.length} appointments`);
    
    return createSuccessResponse({
      data: mockAppointments,
      pagination: {
        page,
        limit,
        total: mockAppointments.length,
        pages: Math.ceil(mockAppointments.length / limit)
      }
    }, 'Appointments retrieved successfully');

  } catch (error) {
    console.error('[Appointments API] Error:', error);
    return createErrorResponse('Failed to fetch appointments', error as Error);
  }
}

export async function POST(request: Request) {
  try {
    console.log('[Appointments API] Processing POST request with Supabase');
    const body = await request.json();
    
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse()
    }
    
    const supabase = createSupabaseServer()

    // For now, return mock success since we're migrating to Supabase
    // TODO: Create appointments table and implement real creation
    const mockAppointment = {
      id: 'new-appointment-' + Date.now(),
      ...body,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('[Appointments API] Mock appointment created:', mockAppointment.id);
    
    return createSuccessResponse(mockAppointment, 'Appointment created successfully', 201);

  } catch (error) {
    console.error('[Appointments API] Error creating appointment:', error);
    return createErrorResponse('Failed to create appointment', error as Error);
  }
}