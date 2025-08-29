/**
 * ADAPTADORES - Traducen entre la lógica de dominio y servicios externos
 * Implementan interfaces de repositorios definidas en casos de uso
 */

import { ConsultationData } from '../entities/ConsultationData';
import { 
  ConsultationRepository, 
  MedicationRepository, 
  TemplateRepository 
} from '../usecases/ConsultationUseCases';
import { consultationAutosaveApi } from '@/hooks/useAutosave';
import { expedixMedicationsApi } from '@/lib/api/expedix-medications';
import { useConsultationTemplates } from '@/hooks/useConsultationTemplates';

export class ConsultationApiAdapter implements ConsultationRepository {
  async save(consultation: ConsultationData, patientId: string): Promise<void> {
    // Transformar entidad de dominio a formato de API
    const apiData = this.transformToApiFormat(consultation, patientId);
    
    // Llamar a la API
    const response = await fetch('/api/expedix/django/consultations/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiData)
    });

    if (!response.ok) {
      throw new Error('Error al guardar la consulta');
    }
  }

  async load(consultationId: string): Promise<ConsultationData> {
    const response = await fetch(`/api/expedix/django/consultations/${consultationId}/`);
    
    if (!response.ok) {
      throw new Error('Error al cargar la consulta');
    }

    const apiData = await response.json();
    return this.transformFromApiFormat(apiData);
  }

  async autosave(consultation: ConsultationData, patientId: string): Promise<void> {
    // Usar el hook existente de autosave
    const autosaveData = this.transformToAutosaveFormat(consultation, patientId);
    await consultationAutosaveApi.saveConsultation(patientId, autosaveData);
  }

  private transformToApiFormat(consultation: ConsultationData, patientId: string): any {
    return {
      patient_id: patientId,
      consultation_type: consultation.noteType,
      consultation_date: consultation.date,
      current_condition: consultation.currentCondition,
      vital_signs: consultation.vitalSigns,
      physical_examination: consultation.physicalExamination,
      lab_results: consultation.labResults,
      diagnosis: consultation.diagnosis,
      temporality: consultation.temporality,
      medications: consultation.medications,
      additional_instructions: consultation.additionalInstructions,
      lab_orders: consultation.labOrders,
      next_appointment: consultation.nextAppointment,
      mental_exam: consultation.mentalExam,
      specialty_fields: consultation.specialtyFields
    };
  }

  private transformFromApiFormat(apiData: any): ConsultationData {
    return new ConsultationData(
      apiData.consultation_type || '',
      apiData.consultation_date || '',
      apiData.patient_office || '',
      apiData.current_condition || '',
      apiData.vital_signs || ConsultationData.createEmpty().vitalSigns,
      apiData.physical_examination || '',
      apiData.lab_results || '',
      apiData.diagnosis || '',
      apiData.temporality || 'chronic',
      apiData.medications || [],
      apiData.additional_instructions || '',
      apiData.lab_orders || '',
      apiData.next_appointment || { time: '', date: '' },
      apiData.mental_exam || ConsultationData.createEmpty().mentalExam,
      apiData.specialty_fields || {}
    );
  }

  private transformToAutosaveFormat(consultation: ConsultationData, patientId: string): any {
    // Formato específico para el sistema de autosave existente
    return {
      patientId,
      data: {
        ...consultation,
        timestamp: new Date().toISOString()
      }
    };
  }
}

export class MedicationApiAdapter implements MedicationRepository {
  async search(query: string): Promise<any[]> {
    try {
      return await expedixMedicationsApi.search(query);
    } catch (error) {
      console.error('Error searching medications:', error);
      return [];
    }
  }

  async getByIds(ids: number[]): Promise<any[]> {
    try {
      const results = await Promise.all(
        ids.map(id => expedixMedicationsApi.getById(id))
      );
      return results.filter(Boolean);
    } catch (error) {
      console.error('Error getting medications by IDs:', error);
      return [];
    }
  }
}

export class TemplateApiAdapter implements TemplateRepository {
  private templatesHook = useConsultationTemplates();

  async getAll(): Promise<any[]> {
    // Usar el hook existente pero adaptarlo para uso async
    return new Promise((resolve) => {
      // En un escenario real, esto sería una llamada directa a la API
      // Por ahora usamos los datos del hook
      if (!this.templatesHook.loading) {
        resolve(this.templatesHook.noteTemplates);
      }
    });
  }

  async getDefault(): Promise<any> {
    return new Promise((resolve) => {
      if (!this.templatesHook.loading) {
        resolve(this.templatesHook.getDefaultTemplate());
      }
    });
  }
}