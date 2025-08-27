// Expedix consultation templates API route - connects to Django backend
import { supabaseAdmin, getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'
import { API_CONFIG } from '@/lib/config/api-endpoints'

export const dynamic = 'force-dynamic';

// Default templates as fallback with complete field definitions
const DEFAULT_TEMPLATES = [
  {
    id: 'default-general',
    name: 'Consulta Médica Completa (SOAP)',
    description: 'Plantilla completa para consulta médica con formato SOAP y todas las secciones integradas',
    template_type: 'general',
    fields_config: [
      // SUBJETIVO - Información del paciente
      { field: 'subjective', label: 'Subjetivo', type: 'textarea', required: true, placeholder: 'Motivo de consulta, historia del problema actual, síntomas referidos por el paciente, antecedentes relevantes...' },
      
      // OBJETIVO - Hallazgos clínicos
      { field: 'objective', label: 'Objetivo', type: 'textarea', required: true, placeholder: 'Signos vitales, exploración física, hallazgos objetivos, resultados de exploraciones...' },
      
      // EXAMEN MENTAL INTEGRADO
      { field: 'mental_exam', label: 'Examen del Estado Mental', type: 'mental_exam_component', required: true, placeholder: 'Evaluación completa del estado mental: apariencia, comportamiento, lenguaje, estado de ánimo, afecto, pensamiento, percepción, cognición, insight, juicio...' },
      
      // INTEGRACIÓN DE EVALUACIONES
      { field: 'clinimetrix_section', label: 'Evaluaciones Clinimétricas', type: 'integration', integration_type: 'clinimetrix', required: false, placeholder: 'Las evaluaciones psicométricas aplicadas aparecerán aquí automáticamente...' },
      
      { field: 'laboratories', label: 'Laboratorios y Estudios', type: 'textarea', required: false, placeholder: 'Resultados de laboratorio, estudios de imagen, análisis complementarios...' },
      
      { field: 'resources_section', label: 'Recursos Enviados', type: 'integration', integration_type: 'resources', required: false, placeholder: 'Recursos médicos enviados al paciente aparecerán aquí automáticamente...' },
      
      // ANÁLISIS Y PLAN
      { field: 'analysis', label: 'Análisis', type: 'textarea', required: true, placeholder: 'Interpretación de hallazgos, razonamiento clínico, diagnóstico diferencial, evaluación de riesgos...' },
      
      { field: 'plan', label: 'Plan', type: 'textarea', required: true, placeholder: 'Plan de tratamiento, recomendaciones, seguimiento, educación al paciente, medidas preventivas...' },
      
      // DIAGNÓSTICOS ESTRUCTURADOS
      { field: 'diagnosis_dsm5', label: 'Diagnóstico DSM-5-TR', type: 'textarea', required: false, placeholder: 'Diagnóstico según criterios DSM-5-TR con códigos específicos...' },
      
      { field: 'diagnosis_cie10', label: 'Diagnóstico CIE-10', type: 'textarea', required: false, placeholder: 'Diagnóstico según clasificación CIE-10 con códigos específicos...' },
      
      // PRESCRIPCIONES INTEGRADAS
      { field: 'prescriptions_section', label: 'Prescripciones (Recetix)', type: 'integration', integration_type: 'prescriptions', required: false, placeholder: 'Las recetas generadas aparecerán aquí automáticamente...' },
      
      // SEGUIMIENTO
      { field: 'next_appointment', label: 'Próxima Cita', type: 'datetime', required: false, placeholder: 'Fecha y hora sugerida para próxima consulta' },
      
      { field: 'next_appointment_notes', label: 'Notas para Próxima Cita', type: 'textarea', required: false, placeholder: 'Objetivos específicos, aspectos a revisar, preparación necesaria...' },
      
      // DOCUMENTOS ANEXOS
      { field: 'attached_documents', label: 'Documentos Anexos', type: 'file_upload', multiple: true, required: false, accept: 'image/*,.pdf,.doc,.docx', placeholder: 'Arrastrar archivos, imágenes o documentos relevantes...' }
    ],
    is_default: true,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'default-initial',
    name: 'Primera Consulta',
    description: 'Evaluación inicial completa con historia clínica detallada',
    template_type: 'initial',
    fields_config: [
      { field: 'vitalSigns', label: 'Signos Vitales', type: 'text', required: true, placeholder: 'TA: __/__mmHg, FC: __lpm, FR: __rpm, Temp: __°C, Peso: __kg, Talla: __cm' },
      { field: 'currentCondition', label: 'Padecimiento Actual', type: 'textarea', required: true, placeholder: 'Historia detallada del padecimiento actual, inicio, evolución, factores asociados...' },
      { field: 'personalHistory', label: 'Antecedentes Personales', type: 'textarea', required: false, placeholder: 'Antecedentes médicos, quirúrgicos, alergias, medicamentos actuales...' },
      { field: 'familyHistory', label: 'Antecedentes Familiares', type: 'textarea', required: false, placeholder: 'Historia familiar relevante de enfermedades...' },
      { field: 'mentalExam', label: 'Examen Mental', type: 'mental_exam_component', required: true, placeholder: 'Estado de conciencia, orientación, memoria, pensamiento, percepción, afecto, juicio, insight...' },
      { field: 'physicalExamination', label: 'Exploración Física', type: 'textarea', required: true, placeholder: 'Exploración por sistemas, hallazgos positivos y negativos relevantes...' },
      { field: 'diagnosis', label: 'Diagnóstico', type: 'textarea', required: true, placeholder: 'Diagnóstico principal, diagnósticos diferenciales...' },
      { field: 'treatmentPlan', label: 'Plan de Tratamiento', type: 'textarea', required: true, placeholder: 'Plan terapéutico, medicamentos, seguimiento, recomendaciones...' },
      { field: 'medications', label: 'Medicamentos Prescritos', type: 'textarea', required: false, placeholder: 'Lista detallada de medicamentos con dosis, vía, frecuencia...' }
    ],
    is_default: false,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'default-psychiatry',
    name: 'Consulta Psiquiátrica',
    description: 'Evaluación psiquiátrica especializada con examen mental completo',
    template_type: 'specialized',
    fields_config: [
      { field: 'currentCondition', label: 'Padecimiento Actual', type: 'textarea', required: true, placeholder: 'Historia del padecimiento psiquiátrico actual, síntomas, duración, severidad...' },
      { field: 'psychiatricHistory', label: 'Antecedentes Psiquiátricos', type: 'textarea', required: false, placeholder: 'Historia psiquiátrica previa, hospitalizaciones, tratamientos anteriores...' },
      { field: 'mentalStatusExam', label: 'Examen del Estado Mental', type: 'textarea', required: true, placeholder: 'Apariencia general, comportamiento, lenguaje, estado de ánimo, afecto, pensamiento (forma y contenido), percepción, cognición, insight, juicio...' },
      { field: 'cognitiveFunctions', label: 'Funciones Cognitivas', type: 'textarea', required: false, placeholder: 'Orientación (tiempo, lugar, persona), atención, concentración, memoria, cálculo, praxias...' },
      { field: 'riskAssessment', label: 'Evaluación de Riesgo', type: 'textarea', required: true, placeholder: 'Riesgo suicida, riesgo de heteroagresión, capacidad de insight y adherencia...' },
      { field: 'functionalAssessment', label: 'Evaluación Funcional', type: 'textarea', required: false, placeholder: 'Funcionamiento social, laboral, académico, actividades de la vida diaria...' },
      { field: 'diagnosis', label: 'Diagnóstico Psiquiátrico', type: 'textarea', required: true, placeholder: 'Diagnóstico principal según DSM-5/CIE-11, comorbilidades, severidad...' },
      { field: 'treatmentPlan', label: 'Plan de Tratamiento', type: 'textarea', required: true, placeholder: 'Plan farmacológico, psicoterapéutico, seguimiento, objetivos terapéuticos...' },
      { field: 'medications', label: 'Psicofármacos', type: 'textarea', required: false, placeholder: 'Medicamentos psicotrópicos con dosis específicas, efectos esperados, monitoreo...' }
    ],
    is_default: false,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'default-followup',
    name: 'Consulta de Seguimiento',
    description: 'Seguimiento y evaluación de progreso del paciente',
    template_type: 'followup',
    fields_config: [
      { field: 'progressSinceLastVisit', label: 'Evolución desde Última Consulta', type: 'textarea', required: true, placeholder: 'Cambios en síntomas, respuesta al tratamiento, efectos adversos...' },
      { field: 'currentCondition', label: 'Estado Actual', type: 'textarea', required: true, placeholder: 'Evaluación del estado actual del paciente...' },
      { field: 'adherence', label: 'Adherencia al Tratamiento', type: 'textarea', required: true, placeholder: 'Cumplimiento con medicamentos, citas, recomendaciones...' },
      { field: 'mentalExam', label: 'Examen Mental', type: 'mental_exam_component', required: true, placeholder: 'Estado mental actual, cambios respecto a consulta previa...' },
      { field: 'physicalExamination', label: 'Exploración Física', type: 'textarea', required: false, placeholder: 'Hallazgos físicos relevantes para seguimiento...' },
      { field: 'diagnosis', label: 'Diagnóstico Actual', type: 'textarea', required: true, placeholder: 'Confirmación o modificación de diagnósticos previos...' },
      { field: 'treatmentAdjustments', label: 'Ajustes al Tratamiento', type: 'textarea', required: true, placeholder: 'Modificaciones en el plan de tratamiento, nuevas intervenciones...' },
      { field: 'medications', label: 'Ajustes de Medicación', type: 'textarea', required: false, placeholder: 'Cambios en dosis, nuevos medicamentos, suspensiones...' }
    ],
    is_default: false,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'default-emergency',
    name: 'Consulta de Urgencias',
    description: 'Atención de urgencia médica',
    template_type: 'emergency',
    fields_config: [
      { field: 'chiefComplaint', label: 'Motivo de Urgencia', type: 'textarea', required: true, placeholder: 'Síntoma principal que motiva la consulta de urgencia...' },
      { field: 'vitalSigns', label: 'Signos Vitales', type: 'text', required: true, placeholder: 'TA: __/__mmHg, FC: __lpm, FR: __rpm, Temp: __°C, SatO2: __%' },
      { field: 'currentCondition', label: 'Historia Breve', type: 'textarea', required: true, placeholder: 'Historia breve del padecimiento actual, tiempo de evolución...' },
      { field: 'emergencyExam', label: 'Exploración de Urgencia', type: 'textarea', required: true, placeholder: 'Exploración física dirigida, hallazgos importantes...' },
      { field: 'mentalExam', label: 'Estado Neurológico/Mental', type: 'mental_exam_component', required: true, placeholder: 'Estado de conciencia, orientación, signos neurológicos...' },
      { field: 'riskAssessment', label: 'Evaluación de Riesgo', type: 'textarea', required: true, placeholder: 'Severidad del cuadro, estabilidad del paciente, riesgo inmediato...' },
      { field: 'diagnosis', label: 'Impresión Diagnóstica', type: 'textarea', required: true, placeholder: 'Diagnóstico de urgencia, diagnósticos diferenciales...' },
      { field: 'emergencyTreatment', label: 'Tratamiento de Urgencia', type: 'textarea', required: true, placeholder: 'Medidas inmediatas, estabilización, manejo inicial...' },
      { field: 'disposition', label: 'Disposición', type: 'textarea', required: true, placeholder: 'Alta, hospitalización, referencia, seguimiento requerido...' }
    ],
    is_default: false,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export async function GET(request: Request) {
  try {
    console.log('[CONSULTATION TEMPLATES API] Processing GET request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get tenant context from headers
    const tenantId = request.headers.get('X-Tenant-ID');
    const tenantType = request.headers.get('X-Tenant-Type');
    
    console.log('[CONSULTATION TEMPLATES API] Authenticated user:', user.id, 'with tenant context:', { tenantId, tenantType });

    try {
      // Try to fetch from Django backend first
      const backendResponse = await fetch(`${API_CONFIG.BACKEND_URL}/api/expedix/consultation-templates/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'X-Proxy-Auth': 'verified',
          'X-User-ID': user.id,
          'X-User-Email': user.email || '',
          'X-Tenant-ID': tenantId || '',
          'X-Tenant-Type': tenantType || '',
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        console.log('[CONSULTATION TEMPLATES API] Successfully fetched from Django backend');
        
        return createResponse({
          success: true,
          data: backendData.data || backendData || [],
          source: 'django_backend'
        });
      } else {
        console.warn('[CONSULTATION TEMPLATES API] Backend not available, trying Supabase fallback');
        throw new Error('Django backend unavailable');
      }
    } catch (error) {
      console.warn('[CONSULTATION TEMPLATES API] Backend error, using Supabase + default fallback:', error);
      
      // Django failed - try to get custom templates from Supabase and merge with defaults
      try {
        console.log('[CONSULTATION TEMPLATES API] Fetching custom templates from Supabase');
        
        // Get custom templates from Supabase with tenant filtering
        let query = supabaseAdmin
          .from('consultation_templates')
          .select('*')
          .eq('is_active', true);

        // Apply tenant filtering
        if (tenantType === 'clinic' && tenantId) {
          query = query.eq('clinic_id', tenantId);
        } else {
          // For individual workspace or when no tenant context, use user's workspace
          query = query.eq('created_by', user.id).eq('workspace_id', tenantId || user.id);
        }

        const { data: customTemplates, error: supabaseError } = await query
          .order('created_at', { ascending: false });

        if (supabaseError) {
          console.error('[CONSULTATION TEMPLATES API] Supabase query error:', supabaseError);
          throw new Error(`Supabase error: ${supabaseError.message}`);
        }

        // Merge custom templates with default templates
        const allTemplates = [
          ...DEFAULT_TEMPLATES,
          ...(customTemplates || [])
        ];

        console.log(`[CONSULTATION TEMPLATES API] Combined templates: ${DEFAULT_TEMPLATES.length} defaults + ${customTemplates?.length || 0} custom`);
        
        return createResponse({
          success: true,
          data: allTemplates,
          source: 'supabase_with_defaults',
          counts: {
            defaults: DEFAULT_TEMPLATES.length,
            custom: customTemplates?.length || 0
          }
        });

      } catch (supabaseError) {
        console.error('[CONSULTATION TEMPLATES API] Supabase fallback failed, using defaults only:', supabaseError);
        
        // Last resort - just return default templates
        console.log('[CONSULTATION TEMPLATES API] Using default templates only');
        return createResponse({
          success: true,
          data: DEFAULT_TEMPLATES,
          source: 'default_fallback_only'
        });
      }
    }

  } catch (error) {
    console.error('[CONSULTATION TEMPLATES API] Error:', error);
    return createErrorResponse(
      'Failed to fetch consultation templates',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('[CONSULTATION TEMPLATES API] Processing POST request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get tenant context from headers
    const tenantId = request.headers.get('X-Tenant-ID');
    const tenantType = request.headers.get('X-Tenant-Type');

    const body = await request.json();
    console.log('[CONSULTATION TEMPLATES API] Creating template with data:', Object.keys(body), 'with tenant context:', { tenantId, tenantType });

    // Validate required fields
    if (!body.name || !body.template_type) {
      return createErrorResponse('Validation error', 'name and template_type are required', 400);
    }

    try {
      // Try to create in Django backend first
      const backendResponse = await fetch(`${API_CONFIG.BACKEND_URL}/api/expedix/consultation-templates/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'X-Proxy-Auth': 'verified',
          'X-User-ID': user.id,
          'X-User-Email': user.email || '',
          'X-Tenant-ID': tenantId || '',
          'X-Tenant-Type': tenantType || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        cache: 'no-store'
      });

      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        console.log('[CONSULTATION TEMPLATES API] Successfully created in Django backend');
        
        return createResponse({
          success: true,
          data: backendData,
          message: 'Template created successfully'
        }, 201);
      } else {
        const errorText = await backendResponse.text();
        console.error('[CONSULTATION TEMPLATES API] Backend creation failed:', errorText);
        throw new Error(`Backend error: ${backendResponse.status}`);
      }
    } catch (error) {
      console.error('[CONSULTATION TEMPLATES API] Backend creation error, falling back to Supabase:', error);
      
      // Django failed - use Supabase fallback
      console.log('[CONSULTATION TEMPLATES API] Using Supabase fallback for template creation');
      
      try {
        // Prepare template data for Supabase with tenant context
        const templateData = {
          id: crypto.randomUUID(),
          name: body.name,
          description: body.description || '',
          template_type: body.template_type,
          fields_config: body.fields_config || [],
          is_default: body.is_default || false,
          is_active: body.is_active !== false, // Default to true
          created_by: user.id,
          // Apply tenant context using dual-system pattern
          clinic_id: tenantType === 'clinic' ? tenantId : null,
          workspace_id: tenantType === 'workspace' ? (tenantId || user.id) : (tenantType !== 'clinic' ? user.id : null),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Insert template into Supabase
        const { data: template, error: insertError } = await supabaseAdmin
          .from('consultation_templates')
          .insert(templateData)
          .select()
          .single();

        if (insertError) {
          console.error('[CONSULTATION TEMPLATES API] Supabase insert error:', insertError);
          throw new Error(`Failed to create template in database: ${insertError.message}`);
        }

        console.log('[CONSULTATION TEMPLATES API] Supabase fallback success - template created:', template.id);
        return createResponse({
          success: true,
          data: template,
          message: 'Template created successfully',
          source: 'supabase_fallback'
        }, 201);

      } catch (supabaseError) {
        console.error('[CONSULTATION TEMPLATES API] Supabase fallback completely failed:', supabaseError);
        return createErrorResponse(
          'Failed to create template',
          `Could not create template in any database: ${supabaseError instanceof Error ? supabaseError.message : 'Unknown error'}`,
          500
        );
      }
    }

  } catch (error) {
    console.error('[CONSULTATION TEMPLATES API] Error:', error);
    return createErrorResponse(
      'Failed to create consultation template',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function PUT(request: Request) {
  try {
    console.log('[CONSULTATION TEMPLATES API] Processing PUT request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get tenant context from headers
    const tenantId = request.headers.get('X-Tenant-ID');
    const tenantType = request.headers.get('X-Tenant-Type');

    const url = new URL(request.url);
    const templateId = url.searchParams.get('id');
    
    if (!templateId) {
      return createErrorResponse('Validation error', 'Template ID is required', 400);
    }

    const body = await request.json();
    console.log('[CONSULTATION TEMPLATES API] Updating template:', templateId, 'with tenant context:', { tenantId, tenantType });

    try {
      // Try to update in Django backend
      const backendResponse = await fetch(`${API_CONFIG.BACKEND_URL}/api/expedix/consultation-templates/${templateId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'X-Proxy-Auth': 'verified',
          'X-User-ID': user.id,
          'X-User-Email': user.email || '',
          'X-Tenant-ID': tenantId || '',
          'X-Tenant-Type': tenantType || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        cache: 'no-store'
      });

      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        console.log('[CONSULTATION TEMPLATES API] Successfully updated in Django backend');
        
        return createResponse({
          success: true,
          data: backendData,
          message: 'Template updated successfully'
        });
      } else {
        const errorText = await backendResponse.text();
        console.error('[CONSULTATION TEMPLATES API] Backend update failed:', errorText);
        throw new Error(`Backend error: ${backendResponse.status}`);
      }
    } catch (error) {
      console.error('[CONSULTATION TEMPLATES API] Backend update error:', error);
      return createErrorResponse(
        'Failed to update template',
        'Template update temporarily unavailable',
        503
      );
    }

  } catch (error) {
    console.error('[CONSULTATION TEMPLATES API] Error:', error);
    return createErrorResponse(
      'Failed to update consultation template',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function DELETE(request: Request) {
  try {
    console.log('[CONSULTATION TEMPLATES API] Processing DELETE request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Get tenant context from headers
    const tenantId = request.headers.get('X-Tenant-ID');
    const tenantType = request.headers.get('X-Tenant-Type');

    const url = new URL(request.url);
    const templateId = url.searchParams.get('id');
    
    if (!templateId) {
      return createErrorResponse('Validation error', 'Template ID is required', 400);
    }

    console.log('[CONSULTATION TEMPLATES API] Deleting template:', templateId, 'with tenant context:', { tenantId, tenantType });

    try {
      // Try to delete from Django backend
      const backendResponse = await fetch(`${API_CONFIG.BACKEND_URL}/api/expedix/consultation-templates/${templateId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'X-Proxy-Auth': 'verified',
          'X-User-ID': user.id,
          'X-User-Email': user.email || '',
          'X-Tenant-ID': tenantId || '',
          'X-Tenant-Type': tenantType || '',
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (backendResponse.ok) {
        console.log('[CONSULTATION TEMPLATES API] Successfully deleted from Django backend');
        
        return createResponse({
          success: true,
          message: 'Template deleted successfully'
        });
      } else {
        const errorText = await backendResponse.text();
        console.error('[CONSULTATION TEMPLATES API] Backend deletion failed:', errorText);
        throw new Error(`Backend error: ${backendResponse.status}`);
      }
    } catch (error) {
      console.error('[CONSULTATION TEMPLATES API] Backend deletion error:', error);
      return createErrorResponse(
        'Failed to delete template',
        'Template deletion temporarily unavailable',
        503
      );
    }

  } catch (error) {
    console.error('[CONSULTATION TEMPLATES API] Error:', error);
    return createErrorResponse(
      'Failed to delete consultation template',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}