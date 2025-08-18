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
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('resources')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Add search filter if applicable
    if (search) {
      // Customize search fields based on table
      query = query.or(`name.ilike.%${search}%`);
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[resources API] Supabase error:', error);
      throw new Error(error.message);
    }

    const total = count || 0;
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
      throw new Error(error.message);
    }

    console.log('[resources API] Successfully created record:', record.id);

    return createSuccessResponse(record, 'Resources Management created successfully', 201);

  } catch (error) {
    console.error('[resources API] Error creating record:', error);
    return createErrorResponse('Failed to create resources', error as Error);
  }
}
