// Simple mock API for ClinimetrixPro templates catalog
export async function GET() {
  try {
    const mockTemplates = [
      {
        id: 'phq9-1.0',
        template_id: 'phq9-1.0',
        abbreviation: 'PHQ-9',
        name: 'PHQ-9 - Cuestionario de Salud del Paciente',
        category: 'Depresión',
        subcategory: 'Screening',
        description: 'Instrumento de cribado para depresión mayor. Herramienta confiable para evaluar la severidad de síntomas depresivos.',
        version: '1.0',
        language: 'es',
        authors: ['Kurt Kroenke', 'Robert L. Spitzer', 'Janet B.W. Williams'],
        year: 2001,
        administration_mode: 'self_administered',
        estimated_duration_minutes: 5,
        target_population: ['Adultos', 'Adolescentes'],
        total_items: 9,
        score_range_min: 0,
        score_range_max: 27,
        is_public: true,
        is_featured: true,
        tags: ['depresión', 'screening', 'autoaplicado'],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'gad7-1.0',
        template_id: 'gad7-1.0',
        abbreviation: 'GAD-7',
        name: 'GAD-7 - Trastorno de Ansiedad Generalizada',
        category: 'Ansiedad',
        subcategory: 'Screening',
        description: 'Evaluación rápida y efectiva de síntomas de ansiedad generalizada.',
        version: '1.0',
        language: 'es',
        authors: ['Robert L. Spitzer', 'Kurt Kroenke'],
        year: 2006,
        administration_mode: 'self_administered',
        estimated_duration_minutes: 3,
        target_population: ['Adultos'],
        total_items: 7,
        score_range_min: 0,
        score_range_max: 21,
        is_public: true,
        is_featured: true,
        tags: ['ansiedad', 'screening', 'GAD'],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'beck-depression-1.0',
        template_id: 'beck-depression-1.0',
        abbreviation: 'BDI-II',
        name: 'BDI-II - Inventario de Depresión de Beck',
        category: 'Depresión',
        subcategory: 'Evaluación completa',
        description: 'Inventario completo y detallado para la evaluación de la severidad de la depresión.',
        version: '1.0',
        language: 'es',
        authors: ['Aaron T. Beck'],
        year: 1996,
        administration_mode: 'professional',
        estimated_duration_minutes: 10,
        target_population: ['Adultos', 'Adolescentes'],
        total_items: 21,
        score_range_min: 0,
        score_range_max: 63,
        is_public: true,
        is_featured: false,
        tags: ['depresión', 'beck', 'evaluación completa'],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    return new Response(JSON.stringify({
      success: true,
      data: mockTemplates,
      message: 'Mock templates catalog - ClinimetrixPro system ready',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error) {
    console.error('[ClinimetrixPro Catalog Mock] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch templates catalog',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      data: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}