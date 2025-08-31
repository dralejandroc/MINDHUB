// ClinimetrixPro Scales API Route - NEW: Uses scale_items table
import { supabaseAdmin, getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { scaleId: string } }) {
  try {
    const { scaleId } = params;
    console.log('[CLINIMETRIX SCALES API] Processing GET request for scaleId:', scaleId);
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    console.log('[CLINIMETRIX SCALES API] Authenticated user:', user.id);

    // Get scale information from psychometric_scales
    const { data: scale, error: scaleError } = await supabaseAdmin
      .from('psychometric_scales')
      .select('*')
      .eq('id', scaleId)
      .eq('is_active', true)
      .single();

    if (scaleError) {
      console.error('[CLINIMETRIX SCALES API] Scale error:', scaleError);
      if (scaleError.code === 'PGRST116') {
        return createErrorResponse('Scale not found', `Scale with ID ${scaleId} not found`, 404);
      }
      throw new Error(`Database error: ${scaleError.message}`);
    }

    if (!scale) {
      return createErrorResponse('Scale not found', `Scale with ID ${scaleId} not found`, 404);
    }

    // Get scale items from scale_items table
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('scale_items')
      .select('*')
      .eq('scale_id', scaleId)
      .order('item_number', { ascending: true });

    if (itemsError) {
      console.error('[CLINIMETRIX SCALES API] Items error:', itemsError);
      throw new Error(`Failed to fetch scale items: ${itemsError.message}`);
    }

    console.log('[CLINIMETRIX SCALES API] Found scale items:', items?.length || 0);

    // Transform items to match frontend expectations
    const transformedItems = items?.map(item => ({
      id: item.id,
      number: item.item_number,
      text: item.item_text,
      responseType: item.item_type || 'likert',
      options: item.options ? (typeof item.options === 'string' ? JSON.parse(item.options) : item.options) : {},
      scoring: item.scoring_weights ? (typeof item.scoring_weights === 'string' ? JSON.parse(item.scoring_weights) : item.scoring_weights) : {},
      reversed: item.is_reverse_scored || false,
      subscale: item.subscale || null,
      required: true
    })) || [];

    // Build response data structure
    const responseData = {
      id: scale.id,
      name: scale.scale_name,
      abbreviation: scale.abbreviation,
      description: scale.description || '',
      category: scale.category,
      version: scale.version || '1.0',
      totalItems: scale.total_items || items?.length || 0,
      estimatedDuration: scale.estimated_duration_minutes || 10,
      items: transformedItems,
      metadata: {
        isActive: scale.is_active,
        createdAt: scale.created_at,
        updatedAt: scale.updated_at
      },
      // Add default interpretation rules (can be expanded later)
      interpretationRules: [
        {
          id: 'default',
          minScore: 0,
          maxScore: transformedItems.length * 4, // Assuming 0-4 scale
          label: 'Resultado',
          description: 'Resultado de la evaluación'
        }
      ],
      scoreRange: {
        min: 0,
        max: transformedItems.length * 4 // Default scoring
      }
    };
    
    console.log('[CLINIMETRIX SCALES API] Successfully built scale data:', {
      scaleId: responseData.id,
      name: responseData.name,
      itemCount: responseData.items.length
    });

    return createResponse({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('[CLINIMETRIX SCALES API] Error:', error);
    return createErrorResponse(
      'Failed to fetch scale',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}