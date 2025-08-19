// Clinic configuration API route - Supabase version
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
    console.log('[Clinic Config API] Processing GET request');
    
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse()
    }
    
    // Mock clinic configuration
    const clinicConfig = {
      id: 'clinic-001',
      clinic_name: 'MindHub Clinic',
      address: 'Av. Reforma 123, Col. Centro, CDMX',
      phone: '+52 55 1234 5678',
      email: 'contacto@mindhub.cloud',
      tax_id: 'MHC123456789',
      logo_url: '/logo.png',
      settings: {
        timezone: 'America/Mexico_City',
        language: 'es',
        currency: 'MXN',
        appointment_duration: 30,
        working_hours: {
          monday: { start: '09:00', end: '18:00' },
          tuesday: { start: '09:00', end: '18:00' },
          wednesday: { start: '09:00', end: '18:00' },
          thursday: { start: '09:00', end: '18:00' },
          friday: { start: '09:00', end: '18:00' },
          saturday: { start: '09:00', end: '14:00' },
          sunday: null
        }
      },
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    };

    console.log('[Clinic Config API] Returning clinic configuration');
    
    return createSuccessResponse(clinicConfig, 'Clinic configuration retrieved successfully');

  } catch (error) {
    console.error('[Clinic Config API] Error:', error);
    return createErrorResponse('Failed to fetch clinic configuration', error as Error);
  }
}

export async function POST(request: Request) {
  try {
    console.log('[Clinic Config API] Processing POST request');
    const body = await request.json();
    
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse()
    }
    
    // For now, just return the updated config
    // TODO: Store in Supabase database
    console.log('[Clinic Config API] Mock update successful');
    
    return createSuccessResponse({
      ...body,
      id: 'clinic-001',
      updated_at: new Date().toISOString()
    }, 'Clinic configuration created successfully', 201);

  } catch (error) {
    console.error('[Clinic Config API] Error creating:', error);
    return createErrorResponse('Failed to create clinic configuration', error as Error);
  }
}

export async function PUT(request: Request) {
  try {
    console.log('[Clinic Config API] Processing PUT request');
    const body = await request.json();
    
    const user = await getAuthenticatedUser()
    if (!user) {
      return createAuthResponse()
    }
    
    // For now, just return the updated config
    // TODO: Store in Supabase database
    console.log('[Clinic Config API] Mock update successful');
    
    return createSuccessResponse({
      ...body,
      updated_at: new Date().toISOString()
    }, 'Clinic configuration updated successfully');

  } catch (error) {
    console.error('[Clinic Config API] Error updating:', error);
    return createErrorResponse('Failed to update clinic configuration', error as Error);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}