// Expedix prescription suggestions API - Fallback implementation
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

// Common prescription patterns
const PRESCRIPTION_TEMPLATES = [
  'Tomar 1 tableta por la mañana diario',
  'Tomar 1 tableta por las noches',
  'Media tableta cada 12 horas',
  'Tomar 1 tableta cada 8 horas',
  'Una tableta diaria con alimentos',
  'Media tableta por la mañana, aumentar según tolerancia',
  'Tomar según necesidad, máximo 3 veces al día',
  'Una tableta antes de dormir',
  'Media tableta sublingual en crisis',
  'Tomar 1 tableta cada 24 horas',
  'Iniciar con media tableta, aumentar gradualmente',
  'Una dosis diaria en ayunas',
  'Según indicación médica estricta',
  'No suspender abruptamente',
  'Tomar con abundante agua',
  'Evitar alcohol durante el tratamiento'
];

export async function GET(request: Request) {
  try {
    console.log('[PRESCRIPTIONS API] Processing prescription suggestions request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.toLowerCase() || '';
    const medication = url.searchParams.get('medication') || '';

    if (query.length < 2) {
      return createResponse({
        success: true,
        prescriptions: [],
        total: 0
      });
    }

    // Filter prescription templates based on query
    const results = PRESCRIPTION_TEMPLATES.filter(template =>
      template.toLowerCase().includes(query) ||
      (query.includes('tomar') && template.toLowerCase().includes('tomar')) ||
      (query.includes('tableta') && template.toLowerCase().includes('tableta')) ||
      (query.includes('mañana') && template.toLowerCase().includes('mañana')) ||
      (query.includes('noche') && template.toLowerCase().includes('noche'))
    ).slice(0, 10); // Limit to 10 results

    console.log(`[PRESCRIPTIONS API] Found ${results.length} prescriptions for query: ${query}`);

    return createResponse({
      success: true,
      prescriptions: results,
      total: results.length
    });

  } catch (error) {
    console.error('[PRESCRIPTIONS API] Error:', error);
    return createErrorResponse(
      'Failed to search prescriptions',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}