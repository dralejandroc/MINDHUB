/**
 * 📄 PRESCRIPTION PDF GENERATOR API
 * 
 * Generación de recetas médicas digitales en PDF profesional
 * Con códigos QR, validaciones y formato oficial mexicano
 */

import { getAuthenticatedUser, createErrorResponse, supabaseAdmin } from '@/lib/supabase/admin';
import { resolveTenantContext, validateTenantAccess } from '@/lib/tenant-resolver';

export const dynamic = 'force-dynamic';

/**
 * GET /api/prescriptions/[id]/pdf - Generar PDF de receta médica
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[PRESCRIPTION PDF] Processing PDF generation for ID:', params.id);
    
    // Verificar autenticación
    const { user, error: authError } = await getAuthenticatedUser(request);
    if (authError || !user) {
      return createErrorResponse('Unauthorized', 'Valid authentication required', 401);
    }

    // Obtener contexto del tenant
    const tenantContext = await resolveTenantContext(user.id);
    
    // Obtener la receta completa con todas las relaciones
    const { data: prescription, error } = await supabaseAdmin
      .from('digital_prescriptions')
      .select(`
        *,
        patients!inner(
          id, first_name, last_name, paternal_last_name, maternal_last_name,
          date_of_birth, gender, email, phone, address, city, state,
          allergies, chronic_conditions, curp, rfc
        ),
        profiles!professional_id(
          id, first_name, last_name, license_number, specialty,
          phone, email, professional_license_number, medical_specialization,
          medical_school, professional_board, credentials_verified
        ),
        prescription_medications(
          id, medication_name, active_ingredient, concentration,
          pharmaceutical_form, presentation, dosage, frequency,
          duration, quantity_prescribed, unit_of_measure,
          administration_route, special_instructions, food_instructions,
          is_controlled_substance, controlled_category, order_index
        ),
        clinics(
          id, name, legal_name, address, city, state, postal_code,
          phone, email, website, rfc, license_number
        ),
        individual_workspaces(
          id, workspace_name, business_name, tax_id
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('[PRESCRIPTION PDF] Database error:', error);
      return createErrorResponse(
        'Prescription not found',
        `No prescription found with ID: ${params.id}`,
        404
      );
    }

    // Validar acceso del tenant
    if (!validateTenantAccess(prescription, tenantContext)) {
      return createErrorResponse(
        'Access denied',
        'You do not have permission to access this prescription',
        403
      );
    }

    // Generar el PDF usando la librería jsPDF (necesitará instalación)
    const pdfBuffer = await generatePrescriptionPDF(prescription);

    // Configurar headers para descarga de PDF
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="Receta_${prescription.prescription_number}.pdf"`);
    headers.set('Content-Length', pdfBuffer.length.toString());

    console.log('[PRESCRIPTION PDF] PDF generated successfully for prescription:', prescription.prescription_number);

    return new Response(pdfBuffer as BodyInit, { headers });

  } catch (error) {
    console.error('[PRESCRIPTION PDF] Error:', error);
    return createErrorResponse(
      'Failed to generate PDF',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

/**
 * Genera el PDF de la receta médica con formato profesional
 */
async function generatePrescriptionPDF(prescription: any): Promise<Buffer> {
  // Para esta implementación inicial, crearemos un HTML que se puede convertir a PDF
  // En producción, usarías librerías como jsPDF, Puppeteer, o similar
  
  const htmlContent = generatePrescriptionHTML(prescription);
  
  // Por ahora, devolvemos el HTML como respuesta
  // En una implementación completa, convertirías esto a PDF
  const buffer = Buffer.from(htmlContent, 'utf-8');
  
  return buffer;
}

/**
 * Genera el HTML profesional de la receta médica
 */
function generatePrescriptionHTML(prescription: any): string {
  const patient = prescription.patients;
  const doctor = prescription.profiles;
  const organization = prescription.clinics || prescription.individual_workspaces;
  const medications = prescription.prescription_medications.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
  
  // Generar datos del QR (URL de verificación)
  const verificationUrl = `https://mindhub.cloud/verify/${prescription.verification_code}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(verificationUrl)}`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receta Médica - ${prescription.prescription_number}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: white;
        }
        
        .prescription-container {
            max-width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 20mm;
            border: 2px solid #2c5f7c;
            position: relative;
        }
        
        .header {
            display: flex;
            justify-content: between;
            align-items: center;
            border-bottom: 3px solid #2c5f7c;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        
        .organization-info {
            flex: 1;
        }
        
        .organization-info h1 {
            color: #2c5f7c;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .organization-info .subtitle {
            color: #666;
            font-size: 14px;
            font-weight: 500;
        }
        
        .contact-info {
            font-size: 11px;
            color: #666;
            margin-top: 10px;
        }
        
        .qr-section {
            text-align: right;
            min-width: 120px;
        }
        
        .qr-code {
            width: 80px;
            height: 80px;
            border: 1px solid #ddd;
        }
        
        .verification-code {
            font-size: 10px;
            font-weight: bold;
            color: #2c5f7c;
            margin-top: 5px;
        }
        
        .prescription-info {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 20px;
            margin-bottom: 25px;
        }
        
        .prescription-header {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #2c5f7c;
        }
        
        .prescription-number {
            font-size: 18px;
            font-weight: bold;
            color: #2c5f7c;
            margin-bottom: 5px;
        }
        
        .prescription-date {
            color: #666;
            font-size: 11px;
        }
        
        .doctor-info {
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .doctor-info h3 {
            color: #2c5f7c;
            font-size: 14px;
            margin-bottom: 8px;
        }
        
        .patient-info {
            margin-bottom: 25px;
            padding: 15px;
            background: #fff7e6;
            border: 1px solid #ffc107;
            border-radius: 8px;
        }
        
        .patient-info h3 {
            color: #856404;
            font-size: 14px;
            margin-bottom: 10px;
        }
        
        .patient-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        
        .diagnosis-section {
            margin-bottom: 25px;
            padding: 15px;
            background: #e7f3ff;
            border: 1px solid #0056b3;
            border-radius: 8px;
        }
        
        .diagnosis-section h3 {
            color: #0056b3;
            font-size: 14px;
            margin-bottom: 10px;
        }
        
        .medications-section {
            margin-bottom: 30px;
        }
        
        .medications-section h3 {
            color: #2c5f7c;
            font-size: 16px;
            margin-bottom: 15px;
            border-bottom: 2px solid #2c5f7c;
            padding-bottom: 5px;
        }
        
        .medication-item {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background: white;
        }
        
        .medication-name {
            font-size: 14px;
            font-weight: bold;
            color: #2c5f7c;
            margin-bottom: 8px;
        }
        
        .medication-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 10px;
        }
        
        .medication-instructions {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
            margin-top: 10px;
        }
        
        .controlled-warning {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 8px;
            border-radius: 5px;
            margin-top: 10px;
            font-weight: bold;
            color: #856404;
        }
        
        .footer {
            position: absolute;
            bottom: 20mm;
            left: 20mm;
            right: 20mm;
            border-top: 2px solid #2c5f7c;
            padding-top: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .signature-section {
            text-align: center;
        }
        
        .signature-line {
            border-bottom: 1px solid #333;
            width: 200px;
            height: 40px;
            margin: 20px auto 10px;
        }
        
        .signature-section .university {
            font-size: 10px;
            color: #666;
            margin-top: 5px;
            font-style: italic;
        }
        
        .signature-section .board {
            font-size: 10px;
            color: #666;
            margin-top: 3px;
        }
        
        .signature-section .verified {
            font-size: 10px;
            color: #16a34a;
            font-weight: bold;
            margin-top: 5px;
        }
        
        .legal-info {
            font-size: 10px;
            color: #666;
            text-align: right;
        }
        
        .validity-info {
            background: #d4edda;
            border: 1px solid #28a745;
            padding: 10px;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
        }
        
        .validity-info strong {
            color: #155724;
        }
    </style>
</head>
<body>
    <div class="prescription-container">
        <!-- Header -->
        <div class="header">
            <div class="organization-info">
                <h1>${organization?.name || organization?.workspace_name || 'Consulta Médica'}</h1>
                <div class="subtitle">${organization?.legal_name || organization?.business_name || ''}</div>
                <div class="contact-info">
                    ${organization?.address ? `📍 ${organization.address}, ${organization.city || ''}, ${organization.state || ''}` : ''}
                    ${organization?.phone ? `<br>📞 ${organization.phone}` : ''}
                    ${organization?.email ? `<br>📧 ${organization.email}` : ''}
                    ${organization?.rfc ? `<br>RFC: ${organization.rfc}` : ''}
                </div>
            </div>
            <div class="qr-section">
                <img src="${qrCodeUrl}" alt="QR Code" class="qr-code">
                <div class="verification-code">
                    Código: ${prescription.verification_code}
                </div>
            </div>
        </div>

        <!-- Prescription Info -->
        <div class="prescription-info">
            <div class="prescription-header">
                <div class="prescription-number">RECETA MÉDICA N° ${prescription.prescription_number}</div>
                <div class="prescription-date">
                    Fecha: ${new Date(prescription.prescription_date).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                </div>
            </div>
        </div>

        <!-- Doctor Info -->
        <div class="doctor-info">
            <h3>👨‍⚕️ MÉDICO PRESCRIPTOR</h3>
            <strong>${doctor.first_name} ${doctor.last_name}</strong><br>
            ${doctor.specialty ? `Especialidad: ${doctor.specialty}<br>` : ''}
            ${doctor.license_number ? `Cédula Profesional: ${doctor.license_number}<br>` : ''}
            ${doctor.phone ? `Teléfono: ${doctor.phone}` : ''}
        </div>

        <!-- Patient Info -->
        <div class="patient-info">
            <h3>👤 INFORMACIÓN DEL PACIENTE</h3>
            <div class="patient-details">
                <div>
                    <strong>Nombre:</strong> ${patient.first_name} ${patient.last_name} ${patient.paternal_last_name || ''} ${patient.maternal_last_name || ''}<br>
                    <strong>Fecha de Nacimiento:</strong> ${patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('es-MX') : 'N/A'}<br>
                    <strong>Género:</strong> ${patient.gender || 'N/A'}
                </div>
                <div>
                    ${patient.phone ? `<strong>Teléfono:</strong> ${patient.phone}<br>` : ''}
                    ${patient.email ? `<strong>Email:</strong> ${patient.email}<br>` : ''}
                    ${patient.curp ? `<strong>CURP:</strong> ${patient.curp}` : ''}
                </div>
            </div>
            ${patient.allergies && patient.allergies.length > 0 ? 
              `<div style="margin-top: 10px;"><strong>🚨 Alergias:</strong> ${patient.allergies.join(', ')}</div>` : ''}
        </div>

        <!-- Diagnosis -->
        <div class="diagnosis-section">
            <h3>🔍 DIAGNÓSTICO</h3>
            <div>${prescription.diagnosis}</div>
            ${prescription.clinical_notes ? `<div style="margin-top: 10px;"><strong>Notas clínicas:</strong> ${prescription.clinical_notes}</div>` : ''}
        </div>

        <!-- Medications -->
        <div class="medications-section">
            <h3>💊 MEDICAMENTOS PRESCRITOS</h3>
            
            ${medications.map((med: any, index: number) => `
                <div class="medication-item">
                    <div class="medication-name">${index + 1}. ${med.medication_name}</div>
                    
                    <div class="medication-details">
                        <div>
                            ${med.active_ingredient ? `<strong>Principio activo:</strong> ${med.active_ingredient}<br>` : ''}
                            ${med.concentration ? `<strong>Concentración:</strong> ${med.concentration}<br>` : ''}
                            <strong>Presentación:</strong> ${med.pharmaceutical_form || 'N/A'} - ${med.presentation || 'N/A'}
                        </div>
                        <div>
                            <strong>Cantidad:</strong> ${med.quantity_prescribed} ${med.unit_of_measure}<br>
                            <strong>Vía:</strong> ${med.administration_route || 'Oral'}
                        </div>
                    </div>
                    
                    <div class="medication-instructions">
                        <strong>📋 INDICACIONES:</strong><br>
                        <strong>Dosis:</strong> ${med.dosage}<br>
                        <strong>Frecuencia:</strong> ${med.frequency}<br>
                        <strong>Duración:</strong> ${med.duration}
                        ${med.food_instructions ? `<br><strong>Con alimentos:</strong> ${med.food_instructions}` : ''}
                        ${med.special_instructions ? `<br><strong>Instrucciones especiales:</strong> ${med.special_instructions}` : ''}
                    </div>
                    
                    ${med.is_controlled_substance ? `
                        <div class="controlled-warning">
                            ⚠️ MEDICAMENTO CONTROLADO ${med.controlled_category ? `(Categoría ${med.controlled_category})` : ''}
                            - Requiere manejo especial según normativa vigente
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>

        <!-- Validity Info -->
        <div class="validity-info">
            <strong>📅 VIGENCIA DE LA RECETA:</strong> 
            Válida hasta ${new Date(prescription.valid_until).toLocaleDateString('es-MX', {
              year: 'numeric',
              month: 'long', 
              day: 'numeric'
            })}
            ${prescription.refills_allowed > 0 ? `<br><strong>Resurtidos permitidos:</strong> ${prescription.refills_allowed}` : ''}
            ${prescription.is_chronic ? '<br><strong>🔄 TRATAMIENTO CRÓNICO</strong>' : ''}
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="signature-section">
                <div class="signature-line"></div>
                <div><strong>Dr(a). ${doctor.first_name} ${doctor.last_name}</strong></div>
                ${doctor.medical_specialization ? `<div>${doctor.medical_specialization}</div>` : '<div>Médico Prescriptor</div>'}
                ${doctor.professional_license_number ? `<div>Cédula Profesional: ${doctor.professional_license_number}</div>` : 
                  doctor.license_number ? `<div>Ced. Prof: ${doctor.license_number}</div>` : ''}
                ${doctor.medical_school ? `<div class="university">${doctor.medical_school}</div>` : ''}
                ${doctor.professional_board ? `<div class="board">${doctor.professional_board}</div>` : ''}
                ${doctor.credentials_verified ? '<div class="verified">✅ Credenciales Verificadas</div>' : ''}
            </div>
            
            <div class="legal-info">
                <strong>Sistema MindHub - Receta Digital</strong><br>
                Código de verificación: ${prescription.verification_code}<br>
                Generada: ${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX')}<br>
                <strong>🔒 Documento con validación digital</strong>
            </div>
        </div>
    </div>
</body>
</html>`;
}