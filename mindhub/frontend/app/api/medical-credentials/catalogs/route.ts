/**
 * 📚 MEDICAL CATALOGS API
 * 
 * Catálogos de especializaciones médicas y universidades
 * Para formularios de configuración médica
 */

import { getAuthenticatedUser, createResponse, createErrorResponse, supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/medical-credentials/catalogs - Obtener catálogos médicos
 */
export async function GET(request: Request) {
  try {
    console.log('[MEDICAL CATALOGS] Fetching medical catalogs');
    
    // Verificar autenticación
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Obtener especializaciones médicas
    const { data: specializations, error: specializationsError } = await supabaseAdmin
      .from('medical_specializations')
      .select('*')
      .order('category, name');

    if (specializationsError) {
      console.error('[MEDICAL CATALOGS] Error fetching specializations:', specializationsError);
      return createErrorResponse('Database error', 'Error fetching medical specializations', 500);
    }

    // Obtener universidades médicas
    const { data: medicalSchools, error: schoolsError } = await supabaseAdmin
      .from('medical_schools')
      .select('*')
      .order('state, name');

    if (schoolsError) {
      console.error('[MEDICAL CATALOGS] Error fetching medical schools:', schoolsError);
      return createErrorResponse('Database error', 'Error fetching medical schools', 500);
    }

    // Agrupar especializaciones por categoría
    const specializationsByCategory = specializations?.reduce((acc: any, spec) => {
      if (!acc[spec.category]) {
        acc[spec.category] = [];
      }
      acc[spec.category].push({
        id: spec.id,
        name: spec.name,
        requires_subspecialty: spec.requires_subspecialty,
        years_of_residency: spec.years_of_residency
      });
      return acc;
    }, {});

    // Agrupar universidades por estado
    const schoolsByState = medicalSchools?.reduce((acc: any, school) => {
      if (!acc[school.state]) {
        acc[school.state] = [];
      }
      acc[school.state].push({
        id: school.id,
        name: school.name,
        acronym: school.acronym,
        city: school.city
      });
      return acc;
    }, {});

    console.log('[MEDICAL CATALOGS] Catalogs retrieved successfully');

    return createResponse({
      success: true,
      data: {
        specializations: specializations || [],
        specializations_by_category: specializationsByCategory || {},
        medical_schools: medicalSchools || [],
        schools_by_state: schoolsByState || {},
        categories: Object.keys(specializationsByCategory || {}),
        states: Object.keys(schoolsByState || {})
      },
      message: 'Medical catalogs retrieved successfully'
    });

  } catch (error) {
    console.error('[MEDICAL CATALOGS] Error:', error);
    return createErrorResponse(
      'Failed to fetch medical catalogs',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}