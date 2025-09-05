/**
 * 💊 DIGITAL PRESCRIPTIONS API - CRUD COMPLETO
 * 
 * Endpoints principales para el sistema de recetas digitales
 * Integrado con tenant architecture y validaciones médicas
 */

import { getAuthenticatedUser, createResponse, createErrorResponse, supabaseAdmin } from '@/lib/supabase/admin';
import { resolveTenantContext, addTenantContext, getTenantFilter } from '@/lib/tenant-resolver';

export const dynamic = 'force-dynamic';

interface PrescriptionData {
  patient_id: string;
  consultation_id?: string;
  diagnosis: string;
  clinical_notes?: string;
  valid_until?: string;
  is_chronic?: boolean;
  refills_allowed?: number;
  medications: MedicationData[];
}

interface MedicationData {
  medication_name: string;
  active_ingredient?: string;
  concentration?: string;
  pharmaceutical_form?: string;
  presentation?: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity_prescribed: number;
  unit_of_measure: string;
  administration_route?: string;
  special_instructions?: string;
  food_instructions?: string;
  is_controlled_substance?: boolean;
  order_index?: number;
}

/**
 * GET /api/prescriptions - Lista todas las recetas
 */
export async function GET(request: Request) {
  try {
    console.log('[PRESCRIPTIONS API] Processing GET request');
    
    // Verificar autenticación
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Obtener contexto del tenant
    const tenantContext = await resolveTenantContext(user.id);
    const tenantFilter = getTenantFilter(tenantContext);
    
    // Obtener parámetros de consulta
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const patientId = searchParams.get('patient_id');
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    console.log('[PRESCRIPTIONS API] Query params:', { patientId, status, limit, offset });
    console.log('[PRESCRIPTIONS API] Tenant filter:', tenantFilter);

    // Construir query base
    let query = supabaseAdmin
      .from('digital_prescriptions')
      .select(`
        *,
        patients!inner(
          id, first_name, last_name, paternal_last_name, 
          maternal_last_name, date_of_birth, email
        ),
        profiles!professional_id(
          id, first_name, last_name, license_number, specialty
        ),
        prescription_medications(
          id, medication_name, active_ingredient, concentration,
          dosage, frequency, duration, quantity_prescribed, 
          unit_of_measure, special_instructions, order_index,
          is_controlled_substance
        ),
        consultations(
          id, consultation_type, consultation_date
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros
    if (tenantContext.type === 'clinic') {
      query = query.eq('clinic_id', tenantContext.id);
    } else {
      query = query.eq('workspace_id', tenantContext.id);
    }

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Ejecutar consulta
    const { data: prescriptions, error, count } = await query;

    if (error) {
      console.error('[PRESCRIPTIONS API] Database error:', error);
      return createErrorResponse(
        'Database error',
        `Failed to fetch prescriptions: ${error.message}`,
        500
      );
    }

    console.log('[PRESCRIPTIONS API] Successfully fetched', count, 'prescriptions');

    return createResponse({
      success: true,
      data: prescriptions || [],
      total: count || 0,
      limit,
      offset,
      filters: { patient_id: patientId, status },
      tenant_context: tenantContext.type
    });

  } catch (error) {
    console.error('[PRESCRIPTIONS API] GET Error:', error);
    return createErrorResponse(
      'Failed to fetch prescriptions',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

/**
 * POST /api/prescriptions - Crear nueva receta digital
 */
export async function POST(request: Request) {
  try {
    console.log('[PRESCRIPTIONS API] Processing POST request');
    
    // Verificar autenticación
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Obtener contexto del tenant
    const tenantContext = await resolveTenantContext(user.id);
    
    const body: PrescriptionData = await request.json();
    console.log('[PRESCRIPTIONS API] Creating prescription with data:', Object.keys(body));

    // Validar datos requeridos
    if (!body.patient_id || !body.diagnosis || !body.medications || body.medications.length === 0) {
      return createErrorResponse(
        'Validation error', 
        'patient_id, diagnosis, and medications are required',
        400
      );
    }

    // Validar que el paciente existe y pertenece al tenant correcto
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('id, first_name, last_name')
      .eq('id', body.patient_id)
      .eq(tenantContext.type === 'clinic' ? 'clinic_id' : 'workspace_id', tenantContext.id)
      .single();

    if (patientError || !patient) {
      return createErrorResponse(
        'Patient not found',
        'Patient does not exist or does not belong to your organization',
        404
      );
    }

    // Preparar datos de la receta principal
    const prescriptionData = addTenantContext({
      patient_id: body.patient_id,
      professional_id: user.id,
      consultation_id: body.consultation_id || null,
      diagnosis: body.diagnosis,
      clinical_notes: body.clinical_notes || null,
      valid_until: body.valid_until ? new Date(body.valid_until).toISOString().split('T')[0] : 
                   new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días por defecto
      is_chronic: body.is_chronic || false,
      refills_allowed: body.refills_allowed || 0,
      status: 'active'
    }, tenantContext);

    // Crear la receta principal
    const { data: prescription, error: prescriptionError } = await supabaseAdmin
      .from('digital_prescriptions')
      .insert(prescriptionData)
      .select()
      .single();

    if (prescriptionError) {
      console.error('[PRESCRIPTIONS API] Failed to create prescription:', prescriptionError);
      return createErrorResponse(
        'Database error',
        `Failed to create prescription: ${prescriptionError.message}`,
        500
      );
    }

    console.log('[PRESCRIPTIONS API] Prescription created:', prescription.id);

    // Crear los medicamentos asociados
    const medicationsData = body.medications.map((med, index) => ({
      prescription_id: prescription.id,
      medication_name: med.medication_name,
      active_ingredient: med.active_ingredient || null,
      concentration: med.concentration || null,
      pharmaceutical_form: med.pharmaceutical_form || null,
      presentation: med.presentation || null,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      quantity_prescribed: med.quantity_prescribed,
      unit_of_measure: med.unit_of_measure,
      administration_route: med.administration_route || 'oral',
      special_instructions: med.special_instructions || null,
      food_instructions: med.food_instructions || null,
      is_controlled_substance: med.is_controlled_substance || false,
      order_index: med.order_index || index + 1
    }));

    const { data: medications, error: medicationsError } = await supabaseAdmin
      .from('prescription_medications')
      .insert(medicationsData)
      .select();

    if (medicationsError) {
      console.error('[PRESCRIPTIONS API] Failed to create medications:', medicationsError);
      
      // Rollback: eliminar la receta si falló la creación de medicamentos
      await supabaseAdmin
        .from('digital_prescriptions')
        .delete()
        .eq('id', prescription.id);
      
      return createErrorResponse(
        'Database error',
        `Failed to create medications: ${medicationsError.message}`,
        500
      );
    }

    console.log('[PRESCRIPTIONS API] Created', medications.length, 'medications');

    // Obtener la receta completa con todas las relaciones
    const { data: completePrescription } = await supabaseAdmin
      .from('digital_prescriptions')
      .select(`
        *,
        patients!inner(
          id, first_name, last_name, paternal_last_name, maternal_last_name,
          date_of_birth, email
        ),
        profiles!professional_id(
          id, first_name, last_name, license_number, specialty
        ),
        prescription_medications(
          id, medication_name, active_ingredient, concentration,
          dosage, frequency, duration, quantity_prescribed,
          unit_of_measure, special_instructions, order_index,
          is_controlled_substance
        )
      `)
      .eq('id', prescription.id)
      .single();

    return createResponse({
      success: true,
      data: completePrescription,
      message: `Receta digital ${prescription.prescription_number} creada exitosamente`,
      verification_code: prescription.verification_code
    }, 201);

  } catch (error) {
    console.error('[PRESCRIPTIONS API] POST Error:', error);
    return createErrorResponse(
      'Failed to create prescription',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}