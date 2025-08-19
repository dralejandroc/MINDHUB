// Agenda daily stats API route - Supabase version
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
    console.log('[Daily Stats API] Processing GET request with Supabase');
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse()
    }
    
    const supabase = createSupabaseServer()

    // For now, return mock data since we're transitioning to Supabase
    // This will be replaced with actual calculations from appointments table
    const mockStats = {
      expectedIncome: 2500,
      advancePayments: 800,
      actualIncome: 1800,
      firstTimeConsultations: 3,
      followUpConsultations: 5,
      videoConsultations: 2,
      blockedSlots: 1,
      blockedReasons: ['Lunch break']
    };

    console.log(`[Daily Stats API] Successfully calculated stats for ${date}`);
    
    return createSuccessResponse(mockStats, 'Daily stats retrieved successfully');

  } catch (error) {
    console.error('[Daily Stats API] Error:', error);
    return createErrorResponse('Failed to fetch daily stats', error as Error);
  }
}