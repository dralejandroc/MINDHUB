// ClinimetrixPro Template by ID API Route - connects DIRECTLY to Supabase
import { supabaseAdmin, getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { templateId: string } }) {
  try {
    const { templateId } = params;
    console.log('[CLINIMETRIX TEMPLATE API] Processing GET request for templateId:', templateId);
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    console.log('[CLINIMETRIX TEMPLATE API] Authenticated user:', user.id);

    // Get specific template from Supabase
    const { data: template, error } = await supabaseAdmin
      .from('clinimetrix_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('[CLINIMETRIX TEMPLATE API] Supabase error:', error);
      if (error.code === 'PGRST116') {
        return createErrorResponse('Template not found', `Template with ID ${templateId} not found`, 404);
      }
      throw new Error(`Database error: ${error.message}`);
    }

    if (!template) {
      return createErrorResponse('Template not found', `Template with ID ${templateId} not found`, 404);
    }

    console.log('[CLINIMETRIX TEMPLATE API] Successfully fetched template:', template.id);

    return createResponse({
      success: true,
      data: template.template_data || template
    });

  } catch (error) {
    console.error('[CLINIMETRIX TEMPLATE API] Error:', error);
    return createErrorResponse(
      'Failed to fetch template',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}