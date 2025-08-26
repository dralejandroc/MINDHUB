// Expedix diagnoses search API - Fallback implementation
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

// Basic CIE-10 diagnoses database for mental health
const DIAGNOSES_DB = [
  { code: 'F32.0', description: 'Episodio depresivo leve', category: 'Trastornos del estado de ánimo' },
  { code: 'F32.1', description: 'Episodio depresivo moderado', category: 'Trastornos del estado de ánimo' },
  { code: 'F32.2', description: 'Episodio depresivo grave sin síntomas psicóticos', category: 'Trastornos del estado de ánimo' },
  { code: 'F32.3', description: 'Episodio depresivo grave con síntomas psicóticos', category: 'Trastornos del estado de ánimo' },
  { code: 'F33.0', description: 'Trastorno depresivo recurrente, episodio actual leve', category: 'Trastornos del estado de ánimo' },
  { code: 'F33.1', description: 'Trastorno depresivo recurrente, episodio actual moderado', category: 'Trastornos del estado de ánimo' },
  { code: 'F33.2', description: 'Trastorno depresivo recurrente, episodio actual grave sin síntomas psicóticos', category: 'Trastornos del estado de ánimo' },
  { code: 'F41.0', description: 'Trastorno de pánico [ansiedad paroxística episódica]', category: 'Trastornos neuróticos' },
  { code: 'F41.1', description: 'Trastorno de ansiedad generalizada', category: 'Trastornos neuróticos' },
  { code: 'F41.2', description: 'Trastorno mixto ansioso-depresivo', category: 'Trastornos neuróticos' },
  { code: 'F40.0', description: 'Agorafobia', category: 'Trastornos neuróticos' },
  { code: 'F40.1', description: 'Fobias sociales', category: 'Trastornos neuróticos' },
  { code: 'F40.2', description: 'Fobias específicas (aisladas)', category: 'Trastornos neuróticos' },
  { code: 'F42.0', description: 'Trastorno obsesivo-compulsivo con predominio de pensamientos obsesivos', category: 'Trastornos neuróticos' },
  { code: 'F42.1', description: 'Trastorno obsesivo-compulsivo con predominio de actos compulsivos', category: 'Trastornos neuróticos' },
  { code: 'F43.0', description: 'Reacción a estrés agudo', category: 'Reacciones a estrés grave' },
  { code: 'F43.1', description: 'Trastorno de estrés postraumático', category: 'Reacciones a estrés grave' },
  { code: 'F43.2', description: 'Trastornos de adaptación', category: 'Reacciones a estrés grave' },
  { code: 'F50.0', description: 'Anorexia nerviosa', category: 'Trastornos de la conducta alimentaria' },
  { code: 'F50.2', description: 'Bulimia nerviosa', category: 'Trastornos de la conducta alimentaria' },
  { code: 'F60.3', description: 'Trastorno de inestabilidad emocional de la personalidad', category: 'Trastornos de la personalidad' },
  { code: 'F84.0', description: 'Autismo infantil', category: 'Trastornos generalizados del desarrollo' },
  { code: 'F90.0', description: 'Trastorno de la actividad y de la atención', category: 'Trastornos hipercinéticos' },
  { code: 'F25.0', description: 'Trastorno esquizoafectivo de tipo maníaco', category: 'Trastornos esquizofrénicos' },
  { code: 'F25.1', description: 'Trastorno esquizoafectivo de tipo depresivo', category: 'Trastornos esquizofrénicos' },
  { code: 'F20.0', description: 'Esquizofrenia paranoide', category: 'Trastornos esquizofrénicos' },
  { code: 'F31.0', description: 'Trastorno bipolar, episodio actual hipomaníaco', category: 'Trastornos del estado de ánimo' },
  { code: 'F31.1', description: 'Trastorno bipolar, episodio actual maníaco sin síntomas psicóticos', category: 'Trastornos del estado de ánimo' },
  { code: 'F31.2', description: 'Trastorno bipolar, episodio actual maníaco con síntomas psicóticos', category: 'Trastornos del estado de ánimo' },
  { code: 'F31.3', description: 'Trastorno bipolar, episodio actual depresivo leve o moderado', category: 'Trastornos del estado de ánimo' },
  { code: 'F31.4', description: 'Trastorno bipolar, episodio actual depresivo grave sin síntomas psicóticos', category: 'Trastornos del estado de ánimo' }
];

export async function GET(request: Request) {
  try {
    console.log('[DIAGNOSES SEARCH API] Processing search request');
    
    // Verify authentication
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    const url = new URL(request.url);
    const query = url.searchParams.get('q')?.toLowerCase() || '';

    if (query.length < 2) {
      return createResponse({
        success: true,
        diagnoses: [],
        total: 0
      });
    }

    // Search diagnoses
    const results = DIAGNOSES_DB.filter(diag =>
      diag.code.toLowerCase().includes(query) ||
      diag.description.toLowerCase().includes(query) ||
      diag.category.toLowerCase().includes(query)
    );

    console.log(`[DIAGNOSES SEARCH API] Found ${results.length} diagnoses for query: ${query}`);

    return createResponse({
      success: true,
      diagnoses: results,
      total: results.length
    });

  } catch (error) {
    console.error('[DIAGNOSES SEARCH API] Error:', error);
    return createErrorResponse(
      'Failed to search diagnoses',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}