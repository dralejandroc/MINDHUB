// Resources categories API route - Supabase version
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
    console.log('[Resource Categories API] Processing GET request with Supabase');
    
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse()
    }
    
    const supabase = createSupabaseServer()

    // For development: use mock data while setting up Supabase
    const { mockResourceCategories } = await import('@/lib/mock-data');
    
    console.log(`[Resource Categories API] Successfully retrieved ${mockResourceCategories.length} categories`);
    
    return createSuccessResponse({
      data: mockResourceCategories || []
    }, 'Resource categories retrieved successfully');

  } catch (error) {
    console.error('[Resource Categories API] Error:', error);
    return createErrorResponse('Failed to fetch resource categories', error as Error);
  }
}