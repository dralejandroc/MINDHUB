// ClinimetrixPro Template by ID API Route - connects DIRECTLY to Supabase
import { supabaseAdmin, getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'
import { CLINIMETRIX_REGISTRY } from '@/lib/clinimetrix-registry'

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

    // Ensure proper data structure for frontend
    let templateData = template.template_data;
    
    // If template_data is a string, parse it
    if (typeof templateData === 'string') {
      try {
        templateData = JSON.parse(templateData);
      } catch (parseError) {
        console.error('[CLINIMETRIX TEMPLATE API] Failed to parse template_data:', parseError);
        templateData = template;
      }
    }

    // Get cutoff points from registry if not in database
    const registryEntry = CLINIMETRIX_REGISTRY.find(scale => scale.id === templateId || scale.template === templateId);
    const cutoffPoints = templateData?.cutoffPoints || templateData?.cutoff_points || registryEntry?.cutoffPoints;
    
    console.log('[CLINIMETRIX TEMPLATE API] Processing interpretation rules:', {
      templateId,
      hasRegistryEntry: !!registryEntry,
      hasCutoffPoints: !!cutoffPoints,
      cutoffPoints,
      registryId: registryEntry?.id,
      templateDataKeys: Object.keys(templateData || {})
    });
    
    // Generate interpretation rules from cutoff points if not present
    const generateInterpretationRules = (cutoffPoints: any) => {
      if (!cutoffPoints || typeof cutoffPoints !== 'object') {
        console.log('[CLINIMETRIX TEMPLATE API] No cutoff points available for rule generation');
        return [];
      }
      
      console.log('[CLINIMETRIX TEMPLATE API] Generating interpretation rules from cutoff points:', cutoffPoints);
      
      const rules = [];
      const keys = Object.keys(cutoffPoints).sort((a, b) => cutoffPoints[a] - cutoffPoints[b]);
      
      console.log('[CLINIMETRIX TEMPLATE API] Processing cutoff keys:', keys);
      
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const nextKey = keys[i + 1];
        const minScore = cutoffPoints[key];
        const maxScore = nextKey ? cutoffPoints[nextKey] - 1 : 100; // Default max or use next cutoff - 1
        
        // Generate appropriate clinical interpretation
        const getInterpretation = (severity: string) => {
          const interpretations: { [key: string]: any } = {
            minimal: {
              description: 'Síntomas mínimos o ausentes. No se requiere intervención inmediata.',
              recommendations: 'Mantener rutinas saludables y monitoreo preventivo.',
              color: '#10B981'
            },
            mild: {
              description: 'Síntomas leves que pueden beneficiarse de intervenciones psicológicas.',
              recommendations: 'Considerar terapia psicológica y técnicas de autoayuda.',
              color: '#F59E0B'
            },
            moderate: {
              description: 'Síntomas moderados que requieren atención profesional.',
              recommendations: 'Evaluación profesional recomendada, considerar terapia estructurada.',
              color: '#F97316'
            },
            moderatelySevere: {
              description: 'Síntomas moderadamente severos que requieren tratamiento activo.',
              recommendations: 'Tratamiento profesional necesario, evaluación médica recomendada.',
              color: '#EF4444'
            },
            severe: {
              description: 'Síntomas severos que requieren atención inmediata y tratamiento especializado.',
              recommendations: 'Atención profesional inmediata, considerar tratamiento farmacológico.',
              color: '#DC2626'
            }
          };
          return interpretations[severity] || interpretations.mild;
        };
        
        const interpretation = getInterpretation(key);
        
        rules.push({
          minScore,
          maxScore,
          severityLevel: key,
          severity: key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
          description: interpretation.description,
          recommendations: interpretation.recommendations,
          color: interpretation.color,
          clinicalSignificance: interpretation.description
        });
      }
      
      console.log('[CLINIMETRIX TEMPLATE API] Generated interpretation rules:', rules);
      return rules;
    };

    // Ensure the template has the required structure
    const responseData = {
      id: template.id,
      name: templateData?.name || template.name || 'Escala sin nombre',
      abbreviation: templateData?.abbreviation || template.abbreviation || '',
      description: templateData?.description || template.description || '',
      items: templateData?.items || templateData?.structure?.items || [],
      interpretationRules: templateData?.interpretationRules || templateData?.interpretation_rules || 
                          generateInterpretationRules(cutoffPoints),
      subscales: templateData?.subscales || registryEntry?.subscales || [],
      scoreRange: templateData?.scoreRange || { min: 0, max: 100 },
      metadata: templateData?.metadata || {},
      ...templateData
    };
    
    console.log('[CLINIMETRIX TEMPLATE API] Structured template data:', {
      items: responseData.items?.length || 0,
      interpretationRules: responseData.interpretationRules?.length || 0,
      subscales: responseData.subscales?.length || 0
    });

    return createResponse({
      success: true,
      data: responseData
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