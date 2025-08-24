// Resources categories API route - Supabase version
export const dynamic = 'force-dynamic';

import { 
  createSupabaseServer, 
  getAuthenticatedUser, 
  createAuthResponse, 
  createErrorResponse, 
  createSuccessResponse 
} from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    console.log('[Resource Categories API] Processing GET request with Supabase');
    
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse()
    }
    
    const supabase = createSupabaseServer()

    // Try to fetch from Supabase first
    const { data: categories, error } = await supabase
      .from('resource_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('[Resource Categories API] Supabase error, using mock data:', error);
      // Fallback to mock data if table doesn't exist yet
      const { mockResourceCategories } = await import('@/lib/mock-data');
      
      return createSuccessResponse({
        data: mockResourceCategories || []
      }, 'Resource categories retrieved successfully (mock)');
    }

    // If no categories in database, return default ones
    if (!categories || categories.length === 0) {
      const defaultCategories = [
        { id: 'psychoeducational', name: 'Psicoeducativo', description: 'Material educativo para pacientes' },
        { id: 'assessment', name: 'Evaluación', description: 'Herramientas y escalas de evaluación' },
        { id: 'therapeutic', name: 'Terapéutico', description: 'Recursos para terapia' },
        { id: 'administrative', name: 'Administrativo', description: 'Documentos y formularios administrativos' },
        { id: 'research', name: 'Investigación', description: 'Artículos y estudios científicos' },
        { id: 'templates', name: 'Plantillas', description: 'Plantillas reutilizables' }
      ];
      
      // Try to insert default categories
      const { data: insertedCategories } = await supabase
        .from('resource_categories')
        .insert(defaultCategories)
        .select();
      
      return createSuccessResponse({
        data: insertedCategories || defaultCategories
      }, 'Resource categories initialized');
    }
    
    console.log(`[Resource Categories API] Successfully retrieved ${categories.length} categories`);
    
    return createSuccessResponse({
      data: categories
    }, 'Resource categories retrieved successfully');

  } catch (error) {
    console.error('[Resource Categories API] Error:', error);
    return createErrorResponse('Failed to fetch resource categories', error as Error);
  }
}