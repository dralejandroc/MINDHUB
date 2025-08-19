import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * ClinimetrixPro Templates Catalog API Route
 * Now uses Supabase directly instead of Railway backend
 */

// Remove dynamic export to avoid build issues

function createSupabaseServer() {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

export async function GET(request: NextRequest) {
  try {
    console.log('[ClinimetrixPro Catalog] Processing GET request with Supabase');
    
    const supabase = createSupabaseServer()
    
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        message: 'Please log in to access this resource',
        code: 'AUTHENTICATION_REQUIRED'
      }, { status: 401 });
    }

    // Get templates catalog from Supabase
    const { data: registry, error } = await supabase
      .from('clinimetrix_registry')
      .select(`
        id,
        template_id,
        abbreviation,
        name,
        category,
        subcategory,
        description,
        version,
        language,
        authors,
        year,
        administration_mode,
        estimated_duration_minutes,
        target_population,
        total_items,
        score_range_min,
        score_range_max,
        is_public,
        is_featured,
        tags,
        is_active,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .eq('is_public', true)
      .order('is_featured', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('[ClinimetrixPro Catalog] Supabase error:', error);
      throw new Error(error.message);
    }

    console.log(`[ClinimetrixPro Catalog] Successfully retrieved ${registry?.length || 0} templates`);

    return NextResponse.json({
      success: true,
      data: registry || [],
      message: 'Templates catalog retrieved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ClinimetrixPro Catalog] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch templates catalog',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      data: []
    }, { status: 500 });
  }
}