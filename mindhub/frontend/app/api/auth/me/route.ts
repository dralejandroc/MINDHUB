// User authentication endpoint - Get current user info
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('[AUTH ME] Getting current user info');
    
    // Get authenticated user
    const { user, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Authentication required', 401);
    }

    // Return user information - handle both real Supabase user and mock user
    const userInfo = {
      id: user.id,
      email: user.email,
      user_metadata: (user as any).user_metadata || {},
      app_metadata: (user as any).app_metadata || {},
      role: (user as any).app_metadata?.role || (user as any).user_metadata?.role || 'professional',
      created_at: (user as any).created_at || new Date().toISOString(),
      last_sign_in_at: (user as any).last_sign_in_at || new Date().toISOString()
    };

    console.log('[AUTH ME] Successfully retrieved user info');
    return createResponse(userInfo);

  } catch (error) {
    console.error('[AUTH ME] Error getting user:', error);
    return createErrorResponse(
      'Failed to get user information',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}