// Prevent static generation for this API route
export const dynamic = 'force-dynamic';

import { 
  createSupabaseServer, 
  getAuthenticatedUser, 
  createAuthResponse, 
  createErrorResponse, 
  createSuccessResponse 
} from '@/lib/supabase/server'

/**
 * Resources Management API Route
 * Now uses Supabase directly instead of Railway backend
 */

export async function GET(request: Request) {
  try {
    console.log('[resources API] Processing GET request with Supabase');
    const { searchParams } = new URL(request.url);
    
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse()
    }
    
    const supabase = createSupabaseServer()

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('q') || '';
    const libraryType = searchParams.get('libraryType') || 'all';
    const categoryId = searchParams.get('categoryId') || '';
    const offset = (page - 1) * limit;

    // For development: use mock data while setting up Supabase
    const { mockResources } = await import('@/lib/mock-data');
    
    // Filter resources based on parameters
    let filteredResources = mockResources;
    
    // Filter by library type
    if (libraryType !== 'all') {
      filteredResources = filteredResources.filter(resource => 
        resource.library_type === libraryType
      );
    }
    
    // Filter by search query
    if (search) {
      const searchLower = search.toLowerCase();
      filteredResources = filteredResources.filter(resource => 
        resource.title.toLowerCase().includes(searchLower) ||
        (resource.description && resource.description.toLowerCase().includes(searchLower)) ||
        (Array.isArray(resource.tags) && resource.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }
    
    // Filter by category (simple string match for now)
    if (categoryId) {
      filteredResources = filteredResources.filter(resource => 
        resource.category_name && resource.category_name.toLowerCase().includes(categoryId.toLowerCase())
      );
    }
    
    // Apply pagination
    const total = filteredResources.length;
    const data = filteredResources.slice(offset, offset + limit);
    const pages = Math.ceil(total / limit);

    console.log(`[resources API] Successfully retrieved ${data?.length || 0} records`);
    
    return createSuccessResponse({
      data: data || [],
      pagination: {
        page,
        limit,
        total,
        pages
      }
    }, 'Resources Management retrieved successfully');

  } catch (error) {
    console.error('[resources API] Error:', error);
    return createErrorResponse('Failed to fetch resources', error as Error);
  }
}

export async function POST(request: Request) {
  try {
    console.log('[resources API] Processing POST request with Supabase');
    const body = await request.json();
    
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse()
    }
    
    const supabase = createSupabaseServer()

    // Prepare data
    const data = {
      ...body,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert record
    const { data: record, error } = await supabase
      .from('resources')
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error('[resources API] Supabase error:', error);
      throw new Error(String(error));
    }

    console.log('[resources API] Successfully created record:', record.id);

    return createSuccessResponse(record, 'Resources Management created successfully', 201);

  } catch (error) {
    console.error('[resources API] Error creating record:', error);
    return createErrorResponse('Failed to create resources', error as Error);
  }
}
