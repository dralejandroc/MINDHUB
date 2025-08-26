// Expedix medications search API - Fallback implementation
import { getAuthenticatedUser, createResponse, createErrorResponse } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic';

// Basic medications database for fallback
const MEDICATIONS_DB = [
  {
    id: 1,
    name: 'Fluoxetina',
    generic_name: 'Fluoxetina',
    presentations: [
      { form: 'Cápsula', concentration: '20mg', substance: 'Fluoxetina' },
      { form: 'Cápsula', concentration: '40mg', substance: 'Fluoxetina' }
    ],
    category: 'Antidepresivo',
    common_prescriptions: [
      'Tomar 1 cápsula por la mañana diario',
      'Tomar 1 cápsula cada 24 horas por la mañana',
      'Una cápsula diaria en ayunas'
    ]
  },
  {
    id: 2,
    name: 'Sertralina',
    generic_name: 'Sertralina',
    presentations: [
      { form: 'Tableta', concentration: '50mg', substance: 'Sertralina' },
      { form: 'Tableta', concentration: '100mg', substance: 'Sertralina' }
    ],
    category: 'Antidepresivo',
    common_prescriptions: [
      'Tomar 1 tableta por la mañana diario',
      'Media tableta por la mañana durante 1 semana, luego 1 tableta',
      'Una tableta diaria con alimentos'
    ]
  },
  {
    id: 3,
    name: 'Alprazolam',
    generic_name: 'Alprazolam',
    presentations: [
      { form: 'Tableta', concentration: '0.5mg', substance: 'Alprazolam' },
      { form: 'Tableta', concentration: '1mg', substance: 'Alprazolam' }
    ],
    category: 'Ansiolítico',
    common_prescriptions: [
      'Media tableta cada 12 horas según necesidad',
      'Tomar 1 tableta antes de dormir',
      'Media tableta 3 veces al día máximo'
    ]
  },
  {
    id: 4,
    name: 'Clonazepam',
    generic_name: 'Clonazepam',
    presentations: [
      { form: 'Tableta', concentration: '0.5mg', substance: 'Clonazepam' },
      { form: 'Tableta', concentration: '2mg', substance: 'Clonazepam' }
    ],
    category: 'Ansiolítico',
    common_prescriptions: [
      'Media tableta por las noches',
      'Tomar 1 tableta antes de dormir',
      '1/4 de tableta cada 8 horas según necesidad'
    ]
  },
  {
    id: 5,
    name: 'Paroxetina',
    generic_name: 'Paroxetina',
    presentations: [
      { form: 'Tableta', concentration: '20mg', substance: 'Paroxetina' },
      { form: 'Tableta', concentration: '30mg', substance: 'Paroxetina' }
    ],
    category: 'Antidepresivo',
    common_prescriptions: [
      'Tomar 1 tableta por la mañana diario',
      'Media tableta por 1 semana, luego 1 tableta diaria',
      'Una tableta diaria con el desayuno'
    ]
  },
  {
    id: 6,
    name: 'Lorazepam',
    generic_name: 'Lorazepam',
    presentations: [
      { form: 'Tableta', concentration: '1mg', substance: 'Lorazepam' },
      { form: 'Tableta', concentration: '2mg', substance: 'Lorazepam' }
    ],
    category: 'Ansiolítico',
    common_prescriptions: [
      'Media tableta cada 12 horas según necesidad',
      'Tomar 1 tableta antes de dormir según necesidad',
      'Media tableta sublingual en crisis de ansiedad'
    ]
  },
  {
    id: 7,
    name: 'Escitalopram',
    generic_name: 'Escitalopram',
    presentations: [
      { form: 'Tableta', concentration: '10mg', substance: 'Escitalopram' },
      { form: 'Tableta', concentration: '20mg', substance: 'Escitalopram' }
    ],
    category: 'Antidepresivo',
    common_prescriptions: [
      'Tomar 1 tableta por la mañana diario',
      'Media tableta diaria por 1 semana, luego 1 tableta',
      'Una tableta diaria en ayunas'
    ]
  },
  {
    id: 8,
    name: 'Quetiapina',
    generic_name: 'Quetiapina',
    presentations: [
      { form: 'Tableta', concentration: '25mg', substance: 'Quetiapina' },
      { form: 'Tableta', concentration: '100mg', substance: 'Quetiapina' },
      { form: 'Tableta', concentration: '200mg', substance: 'Quetiapina' }
    ],
    category: 'Antipsicótico',
    common_prescriptions: [
      'Tomar 1 tableta por las noches',
      'Media tableta antes de dormir para iniciar',
      'Según indicación médica, aumentar gradualmente'
    ]
  }
];

export async function GET(request: Request) {
  try {
    console.log('[MEDICATIONS SEARCH API] Processing search request');
    
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
        medications: [],
        total: 0
      });
    }

    // Search medications
    const results = MEDICATIONS_DB.filter(med =>
      med.name.toLowerCase().includes(query) ||
      med.generic_name.toLowerCase().includes(query) ||
      med.category.toLowerCase().includes(query)
    );

    console.log(`[MEDICATIONS SEARCH API] Found ${results.length} medications for query: ${query}`);

    return createResponse({
      success: true,
      medications: results,
      total: results.length
    });

  } catch (error) {
    console.error('[MEDICATIONS SEARCH API] Error:', error);
    return createErrorResponse(
      'Failed to search medications',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}