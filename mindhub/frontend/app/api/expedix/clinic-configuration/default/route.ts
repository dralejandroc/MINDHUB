import { NextRequest } from 'next/server';
// import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
// import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'https://mindhub-django-backend.vercel.app';

export async function GET(request: NextRequest) {
  try {
    console.log('[Default Clinic Config] Processing GET request');

    // Try to forward request to backend
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${BACKEND_URL}/api/expedix/clinic-configuration/default`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return Response.json(data, { 
          status: response.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        });
      }
    } catch (backendError) {
      console.warn('[Default Clinic Config] Backend unavailable, using fallback configuration');
    }

    // Fallback default configuration matching Settings interface
    const defaultConfig = {
      data: {
        clinicInfo: {
          name: '',
          address: '',
          city: '',
          state: '',
          postalCode: '',
          phone: '',
          email: '',
          website: '',
          logoUrl: '',
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
    
    return Response.json(defaultConfig, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (error) {
    console.error('[Default Clinic Config] Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
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