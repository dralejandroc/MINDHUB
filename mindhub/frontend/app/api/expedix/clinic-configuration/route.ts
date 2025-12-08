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
    
    // Clinic configuration matching the Settings component interface
    const clinicConfig = {
      configuration: {
        clinicInfo: {
          name: 'Glian Clinic',
          address: 'Av. Reforma 123, Col. Centro',
          city: 'Ciudad de México',
          state: 'CDMX',
          postalCode: '06000',
          phone: '+52 55 1234 5678',
          email: 'contacto@mindhub.cloud',
          website: 'https://mindhub.cloud',
          logoUrl: '/logo.png',
          logoPosition: 'top-left',
          logoSize: 100
        },
        printConfiguration: {
          marginLeft: 1.5,
          marginTop: 2.0,
          marginRight: 1.5,
          marginBottom: 1.5,
          fontSize: {
            header: 16,
            patientInfo: 12,
            medication: 12,
            instructions: 11,
            footer: 10,
            clinicName: 14,
            patientName: 13,
            actualDate: 11,
            diagnostics: 12,
            prescription: 12
          },
          showPatientAge: true,
          showPatientBirthdate: true,
          showMedicName: true,
          showActualDate: true,
          showPatientName: true,
          showNumbers: true,
          showDiagnostics: true,
          showMeasurements: false,
          boldMedicine: true,
          boldPrescription: true,
          boldPatientName: true,
          boldPatientAge: false,
          boldMedicName: true,
          boldDate: true,
          boldDiagnostics: true,
          boldIndications: false,
          treatmentsAtPage: 5
        },
        digitalSignature: {
          enabled: false,
          signatureImageUrl: '',
          signaturePosition: 'bottom-right',
          signatureSize: 80,
          showLicense: true,
          showSpecialization: true
        },
        medicalRecordFields: {
          patientDemographics: {
            showCURP: false,
            showRFC: false,
            showBloodType: true,
            showAllergies: true,
            showEmergencyContact: true,
            requireEmergencyContact: false
          },
          consultationFields: {
            showVitalSigns: true,
            showPhysicalExam: true,
            showDiagnostics: true,
            showTreatmentPlan: true,
            showFollowUp: true,
            customFields: []
          }
        },
        prescriptionSettings: {
          electronicPrescription: {
            enabled: false,
            vigency: 30,
            auto: false,
            anthropometrics: true,
            diagnostics: true,
            additional: false,
            info: ''
          },
          defaultDuration: '7 días',
          defaultFrequency: 'Cada 8 horas',
          showInteractionWarnings: true,
          requireClinicalIndication: true
        },
        userPreferences: {
          language: 'es',
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24h',
          currency: 'MXN',
          timezone: 'America/Mexico_City'
        }
      }
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