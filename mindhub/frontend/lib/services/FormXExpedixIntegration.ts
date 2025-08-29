/**
 * SERVICIO DE INTEGRACIÓN - FormX ↔ Expedix
 * Sistema automático de identificación y almacenamiento de formularios
 */

import { expedixApi, Patient } from '@/lib/api/expedix-client';
import { supabase } from '@/lib/supabase/client';

export interface FormXSubmission {
  id: string;
  formId: string;
  formTitle: string;
  submissionDate: string;
  patientName?: string;
  birthDate?: string;
  email?: string;
  phone?: string;
  responses: Record<string, any>;
  rawData: any;
  status: 'pending_match' | 'matched' | 'confirmed' | 'archived';
  confidence: number; // 0-100
  matchedPatientId?: string;
  pdfUrl?: string;
}

export interface PatientMatch {
  patient: Patient;
  confidence: number;
  matchReasons: string[];
}

export interface MedicalBackground {
  allergies: string[];
  medications: string[];
  medicalHistory: string[];
  familyHistory: string[];
  symptoms: string[];
  surgeries: string[];
  immunizations: string[];
  socialHistory: {
    smoking: boolean;
    alcohol: boolean;
    drugs: boolean;
    exercise: string;
    diet: string;
  };
  vitalSigns?: {
    height?: string;
    weight?: string;
    bloodPressure?: string;
  };
}

export class FormXExpedixIntegration {
  
  /**
   * Función principal: Procesa una nueva submission de FormX
   */
  async processFormSubmission(submissionData: any): Promise<FormXSubmission> {
    try {
      // 1. Extraer información del paciente del formulario
      const extractedPatientInfo = this.extractPatientInfo(submissionData);
      
      // 2. Buscar coincidencia automática en Expedix
      const matches = await this.findPatientMatches(extractedPatientInfo);
      
      // 3. Crear submission record
      const submission: FormXSubmission = {
        id: submissionData.id || `submission-${Date.now()}`,
        formId: submissionData.formId,
        formTitle: submissionData.formTitle || 'Formulario Médico',
        submissionDate: submissionData.submittedAt || new Date().toISOString(),
        patientName: extractedPatientInfo.fullName,
        birthDate: extractedPatientInfo.birthDate,
        email: extractedPatientInfo.email,
        phone: extractedPatientInfo.phone,
        responses: submissionData.responses || {},
        rawData: submissionData,
        status: matches.length > 0 ? 'matched' : 'pending_match',
        confidence: matches.length > 0 ? matches[0].confidence : 0,
        matchedPatientId: matches.length > 0 && matches[0].confidence > 85 ? matches[0].patient.id : undefined
      };

      // 4. Si hay match automático con alta confianza, procesar directamente
      if (submission.confidence > 85 && submission.matchedPatientId) {
        await this.processAutomaticMatch(submission, matches[0].patient);
        submission.status = 'confirmed';
      }

      // 5. Guardar submission para revisión posterior si es necesario
      await this.saveSubmissionRecord(submission);
      
      return submission;

    } catch (error) {
      console.error('Error processing FormX submission:', error);
      throw new Error(`Error procesando formulario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Extrae información del paciente desde las respuestas del formulario
   */
  private extractPatientInfo(submissionData: any): {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    email?: string;
    phone?: string;
  } {
    const responses = submissionData.responses || {};
    
    // Buscar campos comunes de información personal
    const personalInfo = {
      fullName: responses.full_name || responses.nombre_completo || responses.name,
      firstName: responses.first_name || responses.nombre || responses.nombres,
      lastName: responses.last_name || responses.apellidos || responses.apellido,
      birthDate: responses.birth_date || responses.fecha_nacimiento || responses.date_of_birth,
      email: responses.email || responses.correo || responses.email_address,
      phone: responses.phone || responses.telefono || responses.phone_number
    };

    // Si no hay nombre completo, construirlo desde nombre y apellido
    if (!personalInfo.fullName && personalInfo.firstName && personalInfo.lastName) {
      personalInfo.fullName = `${personalInfo.firstName} ${personalInfo.lastName}`;
    }

    // Normalizar fecha de nacimiento
    if (personalInfo.birthDate) {
      personalInfo.birthDate = this.normalizeBirthDate(personalInfo.birthDate);
    }

    return personalInfo;
  }

  /**
   * Normaliza diferentes formatos de fecha de nacimiento
   */
  private normalizeBirthDate(dateString: string): string {
    try {
      // Intentar parsear diferentes formatos comunes
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      }
    } catch {
      // Si no se puede parsear, devolver string original
    }
    return dateString;
  }

  /**
   * Busca coincidencias de pacientes en Expedix usando algoritmo de matching
   */
  async findPatientMatches(patientInfo: any): Promise<PatientMatch[]> {
    try {
      // Obtener todos los pacientes (en producción, usar búsqueda más eficiente)
      const patientsResult = await expedixApi.getPatients();
      const patients = patientsResult.data || [];

      const matches: PatientMatch[] = [];

      for (const patient of patients) {
        const matchResult = this.calculatePatientMatch(patientInfo, patient);
        if (matchResult.confidence > 50) { // Solo matches con > 50% confianza
          matches.push(matchResult);
        }
      }

      // Ordenar por confianza descendente
      return matches.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
      console.error('Error finding patient matches:', error);
      return [];
    }
  }

  /**
   * Calcula la confianza de coincidencia entre formulario y paciente
   */
  private calculatePatientMatch(formPatientInfo: any, expedixPatient: Patient): PatientMatch {
    let confidence = 0;
    const matchReasons: string[] = [];

    // Match por nombre completo (peso: 60%)
    if (formPatientInfo.fullName && expedixPatient.first_name && expedixPatient.paternal_last_name) {
      const formName = this.normalizeString(formPatientInfo.fullName);
      const patientName = this.normalizeString(`${expedixPatient.first_name} ${expedixPatient.paternal_last_name}`);
      
      const nameMatch = this.calculateStringSimilarity(formName, patientName);
      confidence += nameMatch * 60;
      
      if (nameMatch > 0.8) {
        matchReasons.push(`Nombre coincide ${Math.round(nameMatch * 100)}%`);
      }
    }

    // Match por fecha de nacimiento (peso: 30%)
    if (formPatientInfo.birthDate && expedixPatient.birth_date) {
      const formDate = this.normalizeBirthDate(formPatientInfo.birthDate);
      const patientDate = expedixPatient.birth_date;
      
      if (formDate === patientDate) {
        confidence += 30;
        matchReasons.push('Fecha de nacimiento exacta');
      }
    }

    // Match por email (peso: 10%)
    if (formPatientInfo.email && expedixPatient.email) {
      const emailMatch = this.normalizeString(formPatientInfo.email) === this.normalizeString(expedixPatient.email);
      if (emailMatch) {
        confidence += 10;
        matchReasons.push('Email coincide');
      }
    }

    // Match por teléfono (peso: 10%)
    if (formPatientInfo.phone && expedixPatient.phone) {
      const phoneMatch = this.normalizePhoneNumber(formPatientInfo.phone) === this.normalizePhoneNumber(expedixPatient.phone);
      if (phoneMatch) {
        confidence += 10;
        matchReasons.push('Teléfono coincide');
      }
    }

    return {
      patient: expedixPatient,
      confidence: Math.min(confidence, 100), // Cap at 100%
      matchReasons
    };
  }

  /**
   * Normaliza strings para comparación
   */
  private normalizeString(str: string): string {
    return str.toLowerCase()
              .trim()
              .replace(/[áàäâ]/g, 'a')
              .replace(/[éèëê]/g, 'e')
              .replace(/[íìïî]/g, 'i')
              .replace(/[óòöô]/g, 'o')
              .replace(/[úùüû]/g, 'u')
              .replace(/ñ/g, 'n')
              .replace(/\s+/g, ' ');
  }

  /**
   * Normaliza números de teléfono
   */
  private normalizePhoneNumber(phone: string): string {
    return phone.replace(/\D/g, ''); // Solo dígitos
  }

  /**
   * Calcula similaridad entre dos strings usando algoritmo de Levenshtein
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : (maxLen - matrix[len2][len1]) / maxLen;
  }

  /**
   * Procesa match automático de alta confianza
   */
  async processAutomaticMatch(submission: FormXSubmission, patient: Patient): Promise<void> {
    try {
      // 1. Generar y guardar PDF del formulario
      const pdfUrl = await this.generateAndStorePDF(submission, patient);
      submission.pdfUrl = pdfUrl;

      // 2. Extraer antecedentes médicos estructurados
      const medicalBackground = this.extractMedicalBackground(submission.responses);

      // 3. Almacenar antecedentes en el expediente
      await this.storeMedicalBackground(patient.id, medicalBackground, submission);

      // 4. Registrar en timeline del paciente
      await this.addToPatientTimeline(patient.id, submission);

    } catch (error) {
      console.error('Error in automatic processing:', error);
      throw error;
    }
  }

  /**
   * Genera PDF del formulario y lo almacena en documentos del paciente
   */
  private async generateAndStorePDF(submission: FormXSubmission, patient: Patient): Promise<string> {
    try {
      // Generar PDF usando jsPDF o similar
      const pdfContent = this.generateFormPDF(submission);
      
      // Subir a storage (Supabase Storage)
      const fileName = `formx-${submission.formId}-${submission.id}.pdf`;
      const filePath = `patients/${patient.id}/forms/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('patient-documents')
        .upload(filePath, pdfContent, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (error) throw error;

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('patient-documents')
        .getPublicUrl(filePath);

      // Registrar documento en base de datos
      await this.registerPatientDocument(patient.id, {
        title: `FormX: ${submission.formTitle}`,
        type: 'form',
        url: urlData.publicUrl,
        uploadDate: new Date().toISOString(),
        metadata: {
          formId: submission.formId,
          submissionId: submission.id,
          source: 'formx'
        }
      });

      return urlData.publicUrl;

    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Error generando PDF del formulario');
    }
  }

  /**
   * Genera contenido PDF del formulario
   */
  private generateFormPDF(submission: FormXSubmission): Blob {
    // Implementación simplificada - en producción usar jsPDF
    const content = `
      Formulario: ${submission.formTitle}
      Fecha: ${new Date(submission.submissionDate).toLocaleDateString()}
      Paciente: ${submission.patientName}
      
      Respuestas:
      ${Object.entries(submission.responses).map(([key, value]) => 
        `${key}: ${value}`
      ).join('\n')}
    `;
    
    return new Blob([content], { type: 'application/pdf' });
  }

  /**
   * Registra documento en base de datos del paciente
   */
  private async registerPatientDocument(patientId: string, document: any): Promise<void> {
    // Registrar en tabla de documentos del paciente
    const { error } = await supabase
      .from('patient_documents')
      .insert({
        patient_id: patientId,
        ...document,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error registering document:', error);
    }
  }

  /**
   * Extrae antecedentes médicos estructurados desde las respuestas
   */
  private extractMedicalBackground(responses: Record<string, any>): MedicalBackground {
    const background: MedicalBackground = {
      allergies: [],
      medications: [],
      medicalHistory: [],
      familyHistory: [],
      symptoms: [],
      surgeries: [],
      immunizations: [],
      socialHistory: {
        smoking: false,
        alcohol: false,
        drugs: false,
        exercise: '',
        diet: ''
      }
    };

    // Mapear campos comunes
    this.mapBackgroundField(responses, background, 'allergies', ['alergias', 'allergies', 'alergia']);
    this.mapBackgroundField(responses, background, 'medications', ['medicamentos', 'medications', 'medication']);
    this.mapBackgroundField(responses, background, 'medicalHistory', ['historial_medico', 'medical_history', 'enfermedades']);
    this.mapBackgroundField(responses, background, 'familyHistory', ['historial_familiar', 'family_history', 'antecedentes_familiares']);
    this.mapBackgroundField(responses, background, 'symptoms', ['sintomas', 'symptoms', 'molestias']);
    this.mapBackgroundField(responses, background, 'surgeries', ['cirugias', 'surgeries', 'operaciones']);
    this.mapBackgroundField(responses, background, 'immunizations', ['vacunas', 'immunizations', 'vacunacion']);

    // Mapear hábitos sociales
    background.socialHistory.smoking = this.extractBooleanResponse(responses, ['fuma', 'smoking', 'tabaco']);
    background.socialHistory.alcohol = this.extractBooleanResponse(responses, ['alcohol', 'bebe', 'drinking']);
    background.socialHistory.drugs = this.extractBooleanResponse(responses, ['drogas', 'drugs', 'sustancias']);
    background.socialHistory.exercise = this.extractStringResponse(responses, ['ejercicio', 'exercise', 'actividad_fisica']);
    background.socialHistory.diet = this.extractStringResponse(responses, ['dieta', 'diet', 'alimentacion']);

    return background;
  }

  /**
   * Mapea un campo específico desde las respuestas
   */
  private mapBackgroundField(responses: Record<string, any>, background: any, field: string, possibleKeys: string[]): void {
    for (const key of possibleKeys) {
      if (responses[key]) {
        const value = responses[key];
        if (typeof value === 'string') {
          background[field] = value.split(/[,;]/).map(item => item.trim()).filter(item => item);
          break;
        } else if (Array.isArray(value)) {
          background[field] = value;
          break;
        }
      }
    }
  }

  /**
   * Extrae respuesta booleana
   */
  private extractBooleanResponse(responses: Record<string, any>, possibleKeys: string[]): boolean {
    for (const key of possibleKeys) {
      if (responses[key] !== undefined) {
        const value = responses[key];
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          return ['sí', 'si', 'yes', 'true', '1'].includes(value.toLowerCase());
        }
      }
    }
    return false;
  }

  /**
   * Extrae respuesta de string
   */
  private extractStringResponse(responses: Record<string, any>, possibleKeys: string[]): string {
    for (const key of possibleKeys) {
      if (responses[key] && typeof responses[key] === 'string') {
        return responses[key];
      }
    }
    return '';
  }

  /**
   * Almacena antecedentes médicos en el expediente
   */
  private async storeMedicalBackground(patientId: string, background: MedicalBackground, submission: FormXSubmission): Promise<void> {
    try {
      const { error } = await supabase
        .from('patient_medical_background')
        .upsert({
          patient_id: patientId,
          allergies: background.allergies,
          medications: background.medications,
          medical_history: background.medicalHistory,
          family_history: background.familyHistory,
          symptoms: background.symptoms,
          surgeries: background.surgeries,
          immunizations: background.immunizations,
          social_history: background.socialHistory,
          vital_signs: background.vitalSigns,
          source_form_id: submission.formId,
          source_submission_id: submission.id,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'patient_id'
        });

      if (error) throw error;

    } catch (error) {
      console.error('Error storing medical background:', error);
    }
  }

  /**
   * Agrega entrada al timeline del paciente
   */
  private async addToPatientTimeline(patientId: string, submission: FormXSubmission): Promise<void> {
    try {
      const timelineEntry = {
        patient_id: patientId,
        event_type: 'form_submission',
        title: `FormX: ${submission.formTitle}`,
        description: 'Formulario médico completado por el paciente',
        event_date: submission.submissionDate,
        metadata: {
          formId: submission.formId,
          submissionId: submission.id,
          pdfUrl: submission.pdfUrl
        },
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('patient_timeline')
        .insert(timelineEntry);

      if (error) throw error;

    } catch (error) {
      console.error('Error adding to patient timeline:', error);
    }
  }

  /**
   * Guarda record de submission para revisión posterior
   */
  private async saveSubmissionRecord(submission: FormXSubmission): Promise<void> {
    try {
      const { error } = await supabase
        .from('formx_submissions')
        .insert({
          id: submission.id,
          form_id: submission.formId,
          form_title: submission.formTitle,
          submission_date: submission.submissionDate,
          patient_name: submission.patientName,
          birth_date: submission.birthDate,
          email: submission.email,
          phone: submission.phone,
          responses: submission.responses,
          raw_data: submission.rawData,
          status: submission.status,
          confidence: submission.confidence,
          matched_patient_id: submission.matchedPatientId,
          pdf_url: submission.pdfUrl,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

    } catch (error) {
      console.error('Error saving submission record:', error);
    }
  }
}

// Instancia singleton
export const formXIntegration = new FormXExpedixIntegration();