// Analytics Django Patient Classifications API
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

const DJANGO_API_BASE = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: Request) {
  try {
    console.log('[ANALYTICS PATIENT CLASSIFICATIONS] Processing patient classifications request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      console.error('[ANALYTICS PATIENT CLASSIFICATIONS] Authentication failed:', authError);
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    console.log('[ANALYTICS PATIENT CLASSIFICATIONS] User authenticated:', user.id, user.email);

    // Extract query parameters
    const url = new URL(request.url);
    const queryParams = url.searchParams.toString();
    
    // Forward request to Django analytics endpoint
    const djangoUrl = `${DJANGO_API_BASE}/api/analytics/patient-classifications/${queryParams ? '?' + queryParams : ''}`;
    console.log('[ANALYTICS PATIENT CLASSIFICATIONS] Forwarding to Django:', djangoUrl);
    
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log('[ANALYTICS PATIENT CLASSIFICATIONS] Service key configured:', !!serviceKey);
    
    const response = await fetch(djangoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'X-Proxy-Auth': 'verified',
        'X-User-ID': user.id,
        'X-User-Email': user.email || '',
        'X-MindHub-Analytics': 'patient-classifications',
      },
    });
    
    console.log('[ANALYTICS PATIENT CLASSIFICATIONS] Django response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ANALYTICS PATIENT CLASSIFICATIONS] Django error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      // Return fallback data if Django endpoint is not available
      console.log('[ANALYTICS PATIENT CLASSIFICATIONS] Using fallback patient classifications');
      const fallbackData = {
        classifications: [
          {
            id: 'anxiety-disorders',
            name: 'Trastornos de Ansiedad',
            count: 0,
            description: 'Pacientes con diagnósticos relacionados a ansiedad'
          },
          {
            id: 'mood-disorders',
            name: 'Trastornos del Estado de Ánimo',
            count: 0,
            description: 'Pacientes con depresión, trastorno bipolar, etc.'
          },
          {
            id: 'adhd',
            name: 'TDAH',
            count: 0,
            description: 'Trastorno por Déficit de Atención e Hiperactividad'
          },
          {
            id: 'autism-spectrum',
            name: 'Trastorno del Espectro Autista',
            count: 0,
            description: 'Pacientes con TEA'
          }
        ],
        total: 0,
        message: 'Fallback data - Django endpoint not available'
      };
      
      return createResponse(fallbackData);
    }

    const data = await response.json();
    console.log('[ANALYTICS PATIENT CLASSIFICATIONS] Successfully fetched patient classifications:', data);

    return createResponse(data);

  } catch (error) {
    console.error('[ANALYTICS PATIENT CLASSIFICATIONS] Error:', error);
    
    // Return fallback data on error
    const fallbackData = {
      classifications: [
        {
          id: 'anxiety-disorders',
          name: 'Trastornos de Ansiedad',
          count: 0,
          description: 'Pacientes con diagnósticos relacionados a ansiedad'
        },
        {
          id: 'mood-disorders',
          name: 'Trastornos del Estado de Ánimo',
          count: 0,
          description: 'Pacientes con depresión, trastorno bipolar, etc.'
        }
      ],
      total: 0,
      message: 'Fallback data due to error'
    };
    
    return createResponse(fallbackData);
  }
}