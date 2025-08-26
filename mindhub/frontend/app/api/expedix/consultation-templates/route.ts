// Expedix consultation templates API route - connects to Django backend
import { supabaseAdmin, getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'
import { API_CONFIG } from '@/lib/config/api-endpoints'

export const dynamic = 'force-dynamic';

// Default templates as fallback
const DEFAULT_TEMPLATES = [
  {
    id: 'default-general',
    name: 'Consulta General',
    description: 'Plantilla básica para consulta médica general',
    template_type: 'general',
    fields_config: ['currentCondition', 'mentalExam', 'physicalExamination', 'diagnosis', 'medications'],
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
    fields_config: ['vitalSigns', 'currentCondition', 'mentalExam', 'physicalExamination', 'diagnosis', 'medications'],
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
    fields_config: ['currentCondition', 'mentalExam', 'physicalExamination', 'diagnosis', 'medications'],
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
    fields_config: ['vitalSigns', 'currentCondition', 'mentalExam', 'diagnosis', 'medications'],
    is_default: false,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'default-psych',
    name: 'Consulta Psicológica',
    description: 'Evaluación psicológica especializada',
    template_type: 'specialized',
    fields_config: ['currentCondition', 'mentalExam', 'diagnosis'],
    is_default: false,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'default-psychiatry',
    name: 'Consulta Psiquiátrica',
    description: 'Evaluación psiquiátrica con examen mental completo',
    template_type: 'specialized',
    fields_config: ['currentCondition', 'mentalExam', 'vitalSigns', 'physicalExamination', 'diagnosis', 'medications'],
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

    console.log('[CONSULTATION TEMPLATES API] Authenticated user:', user.id);

    try {
      // Try to fetch from Django backend
      const backendResponse = await fetch(`${API_CONFIG.BACKEND_URL}/api/expedix/consultation-templates/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'X-Proxy-Auth': 'verified',
          'X-User-ID': user.id,
          'X-User-Email': user.email || '',
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
        console.warn('[CONSULTATION TEMPLATES API] Backend not available, using default templates');
      }
    } catch (error) {
      console.warn('[CONSULTATION TEMPLATES API] Backend error, using default templates:', error);
    }

    // Fallback to default templates
    console.log('[CONSULTATION TEMPLATES API] Using default templates fallback');
    return createResponse({
      success: true,
      data: DEFAULT_TEMPLATES,
      source: 'default_fallback'
    });

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

    const body = await request.json();
    console.log('[CONSULTATION TEMPLATES API] Creating template with data:', Object.keys(body));

    // Validate required fields
    if (!body.name || !body.template_type) {
      return createErrorResponse('Validation error', 'name and template_type are required', 400);
    }

    try {
      // Try to create in Django backend
      const backendResponse = await fetch(`${API_CONFIG.BACKEND_URL}/api/expedix/consultation-templates/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'X-Proxy-Auth': 'verified',
          'X-User-ID': user.id,
          'X-User-Email': user.email || '',
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
      console.error('[CONSULTATION TEMPLATES API] Backend creation error:', error);
      return createErrorResponse(
        'Failed to create template',
        'Template creation temporarily unavailable',
        503
      );
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

    const url = new URL(request.url);
    const templateId = url.searchParams.get('id');
    
    if (!templateId) {
      return createErrorResponse('Validation error', 'Template ID is required', 400);
    }

    const body = await request.json();
    console.log('[CONSULTATION TEMPLATES API] Updating template:', templateId);

    try {
      // Try to update in Django backend
      const backendResponse = await fetch(`${API_CONFIG.BACKEND_URL}/api/expedix/consultation-templates/${templateId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'X-Proxy-Auth': 'verified',
          'X-User-ID': user.id,
          'X-User-Email': user.email || '',
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

    const url = new URL(request.url);
    const templateId = url.searchParams.get('id');
    
    if (!templateId) {
      return createErrorResponse('Validation error', 'Template ID is required', 400);
    }

    console.log('[CONSULTATION TEMPLATES API] Deleting template:', templateId);

    try {
      // Try to delete from Django backend
      const backendResponse = await fetch(`${API_CONFIG.BACKEND_URL}/api/expedix/consultation-templates/${templateId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'X-Proxy-Auth': 'verified',
          'X-User-ID': user.id,
          'X-User-Email': user.email || '',
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