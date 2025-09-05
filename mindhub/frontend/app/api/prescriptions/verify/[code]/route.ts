/**
 * 🔐 PRESCRIPTION VERIFICATION API
 * 
 * Verificación de recetas digitales mediante código de verificación
 * Para farmacias y validación externa
 */

import { createResponse, createErrorResponse, supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/prescriptions/verify/[code] - Verificar receta por código
 */
export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    console.log('[PRESCRIPTION VERIFY] Processing verification for code:', params.code);
    
    const verificationCode = params.code?.toUpperCase();
    
    if (!verificationCode || verificationCode.length < 6) {
      return createErrorResponse(
        'Invalid verification code',
        'Verification code must be at least 6 characters long',
        400
      );
    }

    // Buscar la receta por código de verificación
    const { data: prescription, error } = await supabaseAdmin
      .from('digital_prescriptions')
      .select(`
        id, prescription_number, prescription_date, valid_until,
        status, diagnosis, clinical_notes, is_chronic,
        refills_allowed, refills_used, digital_signature,
        patients!inner(
          id, first_name, last_name, paternal_last_name, maternal_last_name,
          date_of_birth, gender, email, phone, allergies, chronic_conditions
        ),
        profiles!professional_id(
          id, first_name, last_name, license_number, specialty,
          phone, email
        ),
        prescription_medications(
          id, medication_name, active_ingredient, concentration,
          pharmaceutical_form, presentation, dosage, frequency,
          duration, quantity_prescribed, unit_of_measure,
          administration_route, special_instructions, food_instructions,
          is_controlled_substance, controlled_category, order_index
        ),
        clinics(
          id, name, address, phone, email
        ),
        individual_workspaces(
          id, workspace_name, business_name
        )
      `)
      .eq('verification_code', verificationCode)
      .single();

    if (error) {
      console.error('[PRESCRIPTION VERIFY] Database error:', error);
      return createErrorResponse(
        'Prescription not found',
        'No prescription found with the provided verification code',
        404
      );
    }

    // Validar estado de la receta
    const currentDate = new Date();
    const validUntil = new Date(prescription.valid_until);
    const isExpired = currentDate > validUntil;

    // Determinar información de la clínica/workspace
    const clinic = Array.isArray(prescription.clinics) ? prescription.clinics[0] : prescription.clinics;
    const workspace = Array.isArray(prescription.individual_workspaces) ? prescription.individual_workspaces[0] : prescription.individual_workspaces;
    
    const organizationInfo = clinic ? {
      type: 'clinic',
      name: clinic.name,
      address: clinic.address,
      phone: clinic.phone,
      email: clinic.email
    } : workspace ? {
      type: 'individual',
      name: workspace.workspace_name || workspace.business_name,
      address: null,
      phone: null,
      email: null
    } : null;

    // Calcular estadísticas de surtimiento
    const { data: dispensingLog } = await supabaseAdmin
      .from('prescription_dispensing_log')
      .select('quantity_dispensed, remaining_quantity, dispensed_at, pharmacy_name')
      .eq('prescription_id', prescription.id)
      .order('dispensed_at', { ascending: false });

    const totalDispensed = dispensingLog?.reduce((sum, log) => sum + (log.quantity_dispensed || 0), 0) || 0;
    const hasBeenDispensed = totalDispensed > 0;
    const lastDispensing = dispensingLog?.[0] || null;

    // Preparar respuesta de verificación
    const verificationResult = {
      // Información básica de la receta
      prescription_number: prescription.prescription_number,
      prescription_date: prescription.prescription_date,
      valid_until: prescription.valid_until,
      status: prescription.status,
      is_expired: isExpired,
      
      // Estado de validez
      is_valid: prescription.status === 'active' && !isExpired,
      can_be_dispensed: prescription.status === 'active' && !isExpired && 
                       (prescription.refills_used < prescription.refills_allowed || prescription.refills_allowed === 0),
      
      // Información del paciente (datos mínimos por privacidad)
      patient: {
        full_name: `${(prescription.patients as any).first_name} ${(prescription.patients as any).last_name} ${(prescription.patients as any).paternal_last_name || ''} ${(prescription.patients as any).maternal_last_name || ''}`.trim(),
        date_of_birth: (prescription.patients as any).date_of_birth,
        gender: (prescription.patients as any).gender,
        allergies: (prescription.patients as any).allergies || [],
        chronic_conditions: (prescription.patients as any).chronic_conditions || []
      },
      
      // Información del médico prescriptor
      prescriber: {
        full_name: `${(prescription.profiles as any).first_name} ${(prescription.profiles as any).last_name}`,
        license_number: (prescription.profiles as any).license_number,
        specialty: (prescription.profiles as any).specialty,
        phone: (prescription.profiles as any).phone
      },
      
      // Información de la organización
      organization: organizationInfo,
      
      // Diagnóstico e información clínica
      diagnosis: prescription.diagnosis,
      clinical_notes: prescription.clinical_notes,
      is_chronic: prescription.is_chronic,
      
      // Medicamentos ordenados
      medications: prescription.prescription_medications
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        .map(med => ({
          medication_name: med.medication_name,
          active_ingredient: med.active_ingredient,
          concentration: med.concentration,
          pharmaceutical_form: med.pharmaceutical_form,
          presentation: med.presentation,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          quantity_prescribed: med.quantity_prescribed,
          unit_of_measure: med.unit_of_measure,
          administration_route: med.administration_route,
          special_instructions: med.special_instructions,
          food_instructions: med.food_instructions,
          is_controlled_substance: med.is_controlled_substance,
          controlled_category: med.controlled_category,
          safety_warning: med.is_controlled_substance ? 
            'MEDICAMENTO CONTROLADO - Requiere manejo especial' : null
        })),
      
      // Información de surtimiento
      dispensing_info: {
        refills_allowed: prescription.refills_allowed,
        refills_used: prescription.refills_used,
        total_dispensed: totalDispensed,
        has_been_dispensed: hasBeenDispensed,
        last_dispensing: lastDispensing ? {
          date: lastDispensing.dispensed_at,
          pharmacy: lastDispensing.pharmacy_name,
          quantity: lastDispensing.quantity_dispensed
        } : null
      },
      
      // Metadatos de verificación
      verification_info: {
        verified_at: new Date().toISOString(),
        verification_code: verificationCode,
        digital_signature_present: !!prescription.digital_signature
      }
    };

    // Log de verificación para auditoría
    console.log('[PRESCRIPTION VERIFY] Verification completed:', {
      prescription_number: prescription.prescription_number,
      status: prescription.status,
      is_valid: verificationResult.is_valid,
      verified_at: verificationResult.verification_info.verified_at
    });

    return createResponse({
      success: true,
      data: verificationResult,
      message: verificationResult.is_valid ? 
        'Prescription verified successfully' : 
        'Prescription found but not valid for dispensing'
    });

  } catch (error) {
    console.error('[PRESCRIPTION VERIFY] Error:', error);
    return createErrorResponse(
      'Verification failed',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

/**
 * POST /api/prescriptions/verify/[code] - Registrar surtimiento de medicamento
 */
export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    console.log('[PRESCRIPTION VERIFY] Processing dispensing for code:', params.code);
    
    const verificationCode = params.code?.toUpperCase();
    const body = await request.json();
    
    const {
      medication_id,
      quantity_dispensed,
      pharmacy_name,
      pharmacy_license,
      pharmacist_name,
      pharmacist_license,
      notes
    } = body;

    // Validar datos requeridos
    if (!medication_id || !quantity_dispensed || !pharmacy_name) {
      return createErrorResponse(
        'Missing required fields',
        'medication_id, quantity_dispensed, and pharmacy_name are required',
        400
      );
    }

    // Buscar la receta
    const { data: prescription, error: prescriptionError } = await supabaseAdmin
      .from('digital_prescriptions')
      .select(`
        id, prescription_number, status, valid_until,
        refills_allowed, refills_used
      `)
      .eq('verification_code', verificationCode)
      .single();

    if (prescriptionError || !prescription) {
      return createErrorResponse(
        'Prescription not found',
        'No valid prescription found with the provided verification code',
        404
      );
    }

    // Validar que la receta puede ser surtida
    const isExpired = new Date() > new Date(prescription.valid_until);
    if (prescription.status !== 'active' || isExpired) {
      return createErrorResponse(
        'Prescription not dispensable',
        'Prescription is not active or has expired',
        400
      );
    }

    // Validar que el medicamento pertenece a la receta
    const { data: medication, error: medicationError } = await supabaseAdmin
      .from('prescription_medications')
      .select('id, medication_name, quantity_prescribed, unit_of_measure')
      .eq('id', medication_id)
      .eq('prescription_id', prescription.id)
      .single();

    if (medicationError || !medication) {
      return createErrorResponse(
        'Medication not found',
        'The specified medication does not belong to this prescription',
        404
      );
    }

    // Registrar el surtimiento
    const { data: dispensingRecord, error: dispensingError } = await supabaseAdmin
      .from('prescription_dispensing_log')
      .insert({
        prescription_id: prescription.id,
        medication_id: medication_id,
        quantity_dispensed: quantity_dispensed,
        remaining_quantity: Math.max(0, medication.quantity_prescribed - quantity_dispensed),
        pharmacy_name,
        pharmacy_license,
        pharmacist_name,
        pharmacist_license,
        verification_method: 'qr_code',
        notes
      })
      .select()
      .single();

    if (dispensingError) {
      console.error('[PRESCRIPTION VERIFY] Dispensing log error:', dispensingError);
      return createErrorResponse(
        'Failed to record dispensing',
        `Database error: ${dispensingError.message}`,
        500
      );
    }

    // Actualizar el estado de la receta si es necesario
    const { data: allDispensings } = await supabaseAdmin
      .from('prescription_dispensing_log')
      .select('quantity_dispensed')
      .eq('prescription_id', prescription.id);

    const totalDispensed = allDispensings?.reduce((sum, log) => sum + log.quantity_dispensed, 0) || 0;
    
    // Si se ha surtido completamente, marcar como dispensed
    const { data: allMedications } = await supabaseAdmin
      .from('prescription_medications')
      .select('quantity_prescribed')
      .eq('prescription_id', prescription.id);

    const totalPrescribed = allMedications?.reduce((sum, med) => sum + med.quantity_prescribed, 0) || 0;
    
    let newStatus = prescription.status;
    if (totalDispensed >= totalPrescribed) {
      newStatus = 'dispensed';
    } else if (totalDispensed > 0) {
      newStatus = 'partial';
    }

    if (newStatus !== prescription.status) {
      await supabaseAdmin
        .from('digital_prescriptions')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', prescription.id);
    }

    console.log('[PRESCRIPTION VERIFY] Dispensing recorded:', {
      prescription_number: prescription.prescription_number,
      medication: medication.medication_name,
      quantity: quantity_dispensed,
      pharmacy: pharmacy_name
    });

    return createResponse({
      success: true,
      data: {
        dispensing_record: dispensingRecord,
        medication_info: {
          name: medication.medication_name,
          quantity_dispensed: quantity_dispensed,
          remaining_quantity: dispensingRecord.remaining_quantity
        },
        prescription_status: newStatus
      },
      message: `Dispensing recorded successfully for ${medication.medication_name}`
    });

  } catch (error) {
    console.error('[PRESCRIPTION VERIFY] Dispensing error:', error);
    return createErrorResponse(
      'Failed to record dispensing',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}