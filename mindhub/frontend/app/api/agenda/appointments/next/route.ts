// Agenda Next Appointments API - Get next appointment for patient
import { getAuthenticatedUser, createResponse, createErrorResponse, supabaseAdmin } from '@/lib/supabase/admin'
import { resolveTenantContext } from '@/lib/tenant-resolver'

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('[NEXT APPOINTMENTS] Processing next appointments request');
    
    // Verify authentication FIRST
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Extract patientId from query parameters
    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId');
    
    if (!patientId) {
      console.warn('[NEXT APPOINTMENTS] No patientId provided, returning null');
      return createResponse({ nextAppointment: null, message: 'No patient ID provided' });
    }

    console.log('[NEXT APPOINTMENTS] Looking for next appointment for patient:', patientId);

    // Resolve tenant context for proper data filtering
    const tenantContext = await resolveTenantContext(user.id);
    console.log('[NEXT APPOINTMENTS] Resolved tenant context:', tenantContext);

    try {
      // Try to get next appointment from Supabase directly with tenant filtering
      let query = supabaseAdmin
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .gte('appointment_date', new Date().toISOString())
        .order('appointment_date', { ascending: true })
        .limit(1);

      // Apply tenant filtering with simplified architecture
      if (tenantContext.clinic_id) {
        query = query.eq('clinic_id', true);
      } else {
        query = query.eq('user_id', tenantContext.user_id);
      }

      const { data: appointments, error } = await query;

      if (error) {
        console.warn('[NEXT APPOINTMENTS] Supabase query error:', error);
        return createResponse({ 
          nextAppointment: null, 
          message: 'No se pudieron cargar las próximas citas' 
        });
      }

      const nextAppointment = appointments && appointments.length > 0 ? appointments[0] : null;
      
      console.log('[NEXT APPOINTMENTS] Found next appointment:', nextAppointment ? 'Yes' : 'None');
      
      return createResponse({
        nextAppointment,
        message: nextAppointment ? 'Próxima cita encontrada' : 'No hay próximas citas programadas'
      });

    } catch (dbError) {
      console.warn('[NEXT APPOINTMENTS] Database error handled gracefully:', dbError);
      
      // Return null appointment without error for better UX
      return createResponse({
        nextAppointment: null,
        message: 'No hay próximas citas disponibles'
      });
    }

  } catch (error) {
    console.warn('[NEXT APPOINTMENTS] General error handled gracefully:', error);
    
    // Always return successful response with null data for better UX
    return createResponse({
      nextAppointment: null,
      message: 'Información de próximas citas no disponible'
    });
  }
}