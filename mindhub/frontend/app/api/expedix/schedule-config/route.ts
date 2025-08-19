// Schedule configuration API route - Supabase version
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
    console.log('[Schedule Config API] Processing GET request');
    
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse()
    }
    
    // For now, return default schedule config
    // TODO: Store in Supabase database
    const defaultConfig = {
      workingHours: {
        start: '09:00',
        end: '18:00'
      },
      workingDays: [1, 2, 3, 4, 5], // Monday to Friday
      appointmentDuration: 30,
      timeSlots: [],
      breaks: [
        { start: '13:00', end: '14:00', name: 'Lunch Break' }
      ]
    };

    console.log('[Schedule Config API] Returning default config');
    
    return createSuccessResponse(defaultConfig, 'Schedule configuration retrieved successfully');

  } catch (error) {
    console.error('[Schedule Config API] Error:', error);
    return createErrorResponse('Failed to fetch schedule configuration', error as Error);
  }
}

export async function PUT(request: Request) {
  try {
    console.log('[Schedule Config API] Processing PUT request');
    const body = await request.json();
    
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse()
    }
    
    // For now, just return success
    // TODO: Store in Supabase database
    console.log('[Schedule Config API] Mock update successful');
    
    return createSuccessResponse({
      ...body,
      updated_at: new Date().toISOString()
    }, 'Schedule configuration updated successfully');

  } catch (error) {
    console.error('[Schedule Config API] Error updating:', error);
    return createErrorResponse('Failed to update schedule configuration', error as Error);
  }
}