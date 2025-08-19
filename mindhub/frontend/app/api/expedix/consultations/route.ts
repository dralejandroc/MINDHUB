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
 * Consultations Management API Route
 * Now uses Supabase directly instead of Railway backend
 */

export async function GET(request: Request) {
  try {
    console.log('[consultations API] Processing GET request with Supabase');
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

    // For development: use mock data while setting up Supabase
    const { mockConsultations } = await import('@/lib/mock-data');
    
    // Filter consultations based on search
    let filteredConsultations = mockConsultations;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredConsultations = mockConsultations.filter(consultation => 
        consultation.chief_complaint.toLowerCase().includes(searchLower) ||
        consultation.consultation_type.toLowerCase().includes(searchLower) ||
        consultation.assessment.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply pagination
    const total = filteredConsultations.length;
    const data = filteredConsultations.slice(offset, offset + limit);
    const pages = Math.ceil(total / limit);

    console.log(`[consultations API] Successfully retrieved ${data?.length || 0} records`);
    
    return createSuccessResponse({
      data: data || [],
      pagination: {
        page,
        limit,
        total,
        pages
      }
    }, 'Consultations Management retrieved successfully');

  } catch (error) {
    console.error('[consultations API] Error:', error);
    return createErrorResponse('Failed to fetch consultations', error as Error);
  }
}

export async function POST(request: Request) {
  try {
    console.log('[consultations API] Processing POST request with Supabase');
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
      .from('consultations')
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error('[consultations API] Supabase error:', error);
      throw new Error(error.message);
    }

    console.log('[consultations API] Successfully created record:', record.id);

    return createSuccessResponse(record, 'Consultations Management created successfully', 201);

  } catch (error) {
    console.error('[consultations API] Error creating record:', error);
    return createErrorResponse('Failed to create consultations', error as Error);
  }
}
