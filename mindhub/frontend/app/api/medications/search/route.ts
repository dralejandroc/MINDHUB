/**
 * 🔍 MEDICATION SEARCH API
 * 
 * Búsqueda inteligente de medicamentos con autocompletado
 * Integración con base de datos local y futura conexión PLM
 */

import { getAuthenticatedUser, createResponse, createErrorResponse, supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

interface MedicationSearchResult {
  id: string;
  commercial_name: string;
  generic_name: string;
  active_ingredients: string[];
  concentration?: string;
  pharmaceutical_form?: string;
  presentation?: string;
  laboratory?: string;
  therapeutic_group?: string;
  is_controlled: boolean;
  controlled_substance_category?: string;
  unit_price?: number;
  availability_status: string;
  plm_id?: string;
  registry_number?: string;
}

/**
 * GET /api/medications/search?q={query}&limit={limit}
 */
export async function GET(request: Request) {
  try {
    console.log('[MEDICATIONS SEARCH] Processing search request');
    
    // Verificar autenticación
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Obtener parámetros de búsqueda
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category'); // Filtro por grupo terapéutico
    const controlled = searchParams.get('controlled'); // true/false/all
    const available = searchParams.get('available') !== 'false'; // Por defecto solo disponibles

    if (!query || query.length < 2) {
      return createResponse({
        success: true,
        data: [],
        message: 'Query must be at least 2 characters long'
      });
    }

    console.log('[MEDICATIONS SEARCH] Search params:', { query, limit, category, controlled, available });

    // Construir query de búsqueda con texto completo
    let searchQuery = supabaseAdmin
      .from('medication_database')
      .select(`
        id, commercial_name, generic_name, active_ingredients,
        concentration, pharmaceutical_form, presentation,
        laboratory, therapeutic_group, is_controlled,
        controlled_substance_category, unit_price,
        availability_status
      `)
      .or(`commercial_name.ilike.%${query}%,generic_name.ilike.%${query}%,active_ingredients.cs.{${query}}`)
      .order('commercial_name')
      .limit(limit);

    // Aplicar filtros adicionales
    if (available) {
      searchQuery = searchQuery.in('availability_status', ['available', 'limited']);
    }

    if (category) {
      searchQuery = searchQuery.eq('therapeutic_group', category);
    }

    if (controlled === 'true') {
      searchQuery = searchQuery.eq('is_controlled', true);
    } else if (controlled === 'false') {
      searchQuery = searchQuery.eq('is_controlled', false);
    }

    // Ejecutar búsqueda
    const { data: medications, error } = await searchQuery;

    if (error) {
      console.error('[MEDICATIONS SEARCH] Database error:', error);
      return createErrorResponse(
        'Search failed',
        `Database error: ${error.message}`,
        500
      );
    }

    // Ordenar resultados por relevancia
    const sortedResults = medications?.sort((a, b) => {
      const queryLower = query.toLowerCase();
      const aCommercial = a.commercial_name.toLowerCase();
      const bCommercial = b.commercial_name.toLowerCase();
      const aGeneric = a.generic_name.toLowerCase();
      const bGeneric = b.generic_name.toLowerCase();

      // Coincidencia exacta tiene prioridad
      if (aCommercial === queryLower) return -1;
      if (bCommercial === queryLower) return 1;
      if (aGeneric === queryLower) return -1;
      if (bGeneric === queryLower) return 1;

      // Coincidencia al inicio tiene segunda prioridad
      if (aCommercial.startsWith(queryLower) && !bCommercial.startsWith(queryLower)) return -1;
      if (bCommercial.startsWith(queryLower) && !aCommercial.startsWith(queryLower)) return 1;
      if (aGeneric.startsWith(queryLower) && !bGeneric.startsWith(queryLower)) return -1;
      if (bGeneric.startsWith(queryLower) && !aGeneric.startsWith(queryLower)) return 1;

      // Orden alfabético para el resto
      return aCommercial.localeCompare(bCommercial);
    }) || [];

    console.log('[MEDICATIONS SEARCH] Found', sortedResults.length, 'medications for query:', query);

    // Preparar respuesta con información adicional
    const enhancedResults = sortedResults.map(med => ({
      ...med,
      search_relevance: calculateRelevance(med, query),
      display_name: `${med.commercial_name} (${med.generic_name})`,
      full_presentation: `${med.concentration} - ${med.pharmaceutical_form} - ${med.presentation}`,
      safety_alerts: {
        is_controlled: med.is_controlled,
        controlled_category: med.controlled_substance_category,
        requires_special_handling: med.is_controlled
      }
    }));

    return createResponse({
      success: true,
      data: enhancedResults,
      total: sortedResults.length,
      query,
      filters_applied: { category, controlled, available }
    });

  } catch (error) {
    console.error('[MEDICATIONS SEARCH] Error:', error);
    return createErrorResponse(
      'Search failed',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

/**
 * Calcula la relevancia de un medicamento para la búsqueda
 */
function calculateRelevance(medication: any, query: string): number {
  const queryLower = query.toLowerCase();
  const commercialLower = medication.commercial_name.toLowerCase();
  const genericLower = medication.generic_name.toLowerCase();
  
  let relevance = 0;
  
  // Coincidencia exacta
  if (commercialLower === queryLower || genericLower === queryLower) {
    relevance += 100;
  }
  
  // Coincidencia al inicio
  if (commercialLower.startsWith(queryLower)) relevance += 50;
  if (genericLower.startsWith(queryLower)) relevance += 40;
  
  // Coincidencia en cualquier parte
  if (commercialLower.includes(queryLower)) relevance += 20;
  if (genericLower.includes(queryLower)) relevance += 15;
  
  // Ingredientes activos
  if (medication.active_ingredients?.some((ingredient: string) => 
    ingredient.toLowerCase().includes(queryLower))) {
    relevance += 30;
  }
  
  // Disponibilidad
  if (medication.availability_status === 'available') relevance += 10;
  if (medication.availability_status === 'limited') relevance += 5;
  
  return relevance;
}

/**
 * POST /api/medications/search - Búsqueda avanzada con filtros complejos
 */
export async function POST(request: Request) {
  try {
    console.log('[MEDICATIONS SEARCH] Processing advanced search');
    
    // Verificar autenticación
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    const body = await request.json();
    const {
      query,
      therapeutic_groups,
      active_ingredients,
      pharmaceutical_forms,
      controlled_only,
      max_price,
      laboratory,
      limit = 20
    } = body;

    console.log('[MEDICATIONS SEARCH] Advanced search params:', body);

    // Construir query compleja
    let searchQuery = supabaseAdmin
      .from('medication_database')
      .select(`
        id, commercial_name, generic_name, active_ingredients,
        concentration, pharmaceutical_form, presentation,
        laboratory, therapeutic_group, is_controlled,
        controlled_substance_category, unit_price,
        availability_status
      `)
      .in('availability_status', ['available', 'limited'])
      .limit(limit);

    // Filtro de texto
    if (query && query.length >= 2) {
      searchQuery = searchQuery.or(`commercial_name.ilike.%${query}%,generic_name.ilike.%${query}%`);
    }

    // Filtros específicos
    if (therapeutic_groups?.length > 0) {
      searchQuery = searchQuery.in('therapeutic_group', therapeutic_groups);
    }

    if (pharmaceutical_forms?.length > 0) {
      searchQuery = searchQuery.in('pharmaceutical_form', pharmaceutical_forms);
    }

    if (controlled_only === true) {
      searchQuery = searchQuery.eq('is_controlled', true);
    }

    if (max_price) {
      searchQuery = searchQuery.lte('unit_price', max_price);
    }

    if (laboratory) {
      searchQuery = searchQuery.ilike('laboratory', `%${laboratory}%`);
    }

    // Filtro por ingredientes activos (requiere query más compleja)
    if (active_ingredients?.length > 0) {
      const ingredientFilters = active_ingredients.map((ingredient: string) => 
        `active_ingredients.cs.{${ingredient}}`
      );
      searchQuery = searchQuery.or(ingredientFilters.join(','));
    }

    // Ejecutar búsqueda
    const { data: medications, error } = await searchQuery;

    if (error) {
      console.error('[MEDICATIONS SEARCH] Advanced search error:', error);
      return createErrorResponse(
        'Advanced search failed',
        `Database error: ${error.message}`,
        500
      );
    }

    console.log('[MEDICATIONS SEARCH] Advanced search found', medications?.length || 0, 'results');

    return createResponse({
      success: true,
      data: medications || [],
      total: medications?.length || 0,
      search_type: 'advanced',
      filters_applied: body
    });

  } catch (error) {
    console.error('[MEDICATIONS SEARCH] Advanced search error:', error);
    return createErrorResponse(
      'Advanced search failed',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}