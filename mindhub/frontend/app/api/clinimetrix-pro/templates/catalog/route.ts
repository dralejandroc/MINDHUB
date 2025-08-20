// ClinimetrixPro templates catalog API route - connects DIRECTLY to Supabase
import { supabaseAdmin, getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('[CLINIMETRIX TEMPLATES API] Processing GET request - Supabase Direct Connection');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    console.log('[CLINIMETRIX TEMPLATES API] Authenticated user:', user.id);

    // Extract query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category');
    const language = searchParams.get('language') || 'es';
    const isPublic = searchParams.get('is_public');

    console.log('[CLINIMETRIX TEMPLATES API] Query params:', { search, limit, offset, category, language, isPublic });

    // Build Supabase query for templates catalog
    let query = supabaseAdmin
      .from('clinimetrix_templates')
      .select(`*`, { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply search if provided (simplified for template data)
    if (search) {
      // Search in template JSON data would require more complex querying
      // For now, we'll skip search to test basic functionality
    }

    // Execute query
    const { data: catalog, error, count } = await query;

    if (error) {
      console.error('[CLINIMETRIX TEMPLATES API] Supabase error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('[CLINIMETRIX TEMPLATES API] Successfully fetched templates catalog:', count, 'total');

    // Transform data to match expected format
    const transformedCatalog = catalog.map(item => ({
      id: item.id,
      template_id: item.id,
      abbreviation: item.template_data?.metadata?.abbreviation || 'N/A',
      name: item.template_data?.metadata?.name || 'Unknown Template',
      category: item.template_data?.metadata?.category || 'general',
      subcategory: item.template_data?.metadata?.subcategory || '',
      description: item.template_data?.metadata?.description || '',
      version: item.version,
      language: item.template_data?.metadata?.language || 'es',
      authors: item.template_data?.metadata?.authors || [],
      year: item.template_data?.metadata?.year || new Date().getFullYear(),
      administration_mode: item.template_data?.metadata?.administrationMode || 'self_administered',
      estimated_duration_minutes: item.template_data?.metadata?.estimatedDurationMinutes || 10,
      total_items: item.template_data?.structure?.totalItems || 0,
      score_range: {
        min: item.template_data?.scoring?.scoreRange?.min || 0,
        max: item.template_data?.scoring?.scoreRange?.max || 100
      },
      is_public: item.is_public,
      is_active: item.is_active,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));

    return createResponse({
      success: true,
      data: transformedCatalog,
      total: count,
      limit,
      offset,
      search,
      category,
      language,
      is_public: isPublic
    });

  } catch (error) {
    console.error('[CLINIMETRIX TEMPLATES API] Error:', error);
    return createErrorResponse(
      'Failed to fetch templates catalog',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}