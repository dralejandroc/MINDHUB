// ClinimetrixPro Scales List API Route - NEW: Uses psychometric_scales table
import { supabaseAdmin, getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('[CLINIMETRIX SCALES LIST API] Processing GET request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    console.log('[CLINIMETRIX SCALES LIST API] Authenticated user:', user.id);

    // Get URL search params
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');

    // Build query
    let query = supabaseAdmin
      .from('psychometric_scales')
      .select('*')
      .eq('is_active', true);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`scale_name.ilike.%${search}%,abbreviation.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Execute query with ordering
    const { data: scales, error } = await query.order('scale_name', { ascending: true });

    if (error) {
      console.error('[CLINIMETRIX SCALES LIST API] Supabase error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('[CLINIMETRIX SCALES LIST API] Found scales:', scales?.length || 0);

    // Transform scales to match frontend expectations
    const transformedScales = scales?.map(scale => ({
      id: scale.id,
      name: scale.scale_name,
      abbreviation: scale.abbreviation,
      description: scale.description || '',
      category: scale.category,
      version: scale.version || '1.0',
      totalItems: scale.total_items || 0,
      estimatedDuration: scale.estimated_duration_minutes || 10,
      isActive: scale.is_active,
      createdAt: scale.created_at,
      updatedAt: scale.updated_at,
      // Add preview info
      preview: {
        difficulty: 'medium',
        applications: ['clinical', 'research'],
        populations: ['adults']
      }
    })) || [];

    // Get unique categories for filtering
    const categories = [...new Set(transformedScales.map(scale => scale.category).filter(Boolean))];

    return createResponse({
      success: true,
      data: transformedScales,
      meta: {
        total: transformedScales.length,
        categories,
        filters: {
          category: category || null,
          search: search || null
        }
      }
    });

  } catch (error) {
    console.error('[CLINIMETRIX SCALES LIST API] Error:', error);
    return createErrorResponse(
      'Failed to fetch scales',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}