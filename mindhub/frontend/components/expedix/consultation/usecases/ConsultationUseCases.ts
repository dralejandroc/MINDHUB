/**
 * CASOS DE USO - Lógica de negocio específica de la aplicación
 * Orchestran las entidades y definen flujos de trabajo
 */

import { ConsultationData } from '../entities/ConsultationData';

export interface ConsultationRepository {
  save(consultation: ConsultationData, patientId: string): Promise<void>;
  load(consultationId: string): Promise<ConsultationData>;
  autosave(consultation: ConsultationData, patientId: string): Promise<void>;
}

export interface MedicationRepository {
  search(query: string): Promise<any[]>;
  getByIds(ids: number[]): Promise<any[]>;
}

export interface TemplateRepository {
  getAll(): Promise<any[]>;
  getDefault(): Promise<any>;
}

export class SaveConsultationUseCase {
  constructor(private consultationRepository: ConsultationRepository) {}

  async execute(consultation: ConsultationData, patientId: string): Promise<void> {
    // Validar reglas de negocio
    if (!consultation.hasRequiredFields()) {
      throw new Error('Faltan campos obligatorios para guardar la consulta');
    }

    // Guardar consulta
    await this.consultationRepository.save(consultation, patientId);
  }
}

export class AutosaveConsultationUseCase {
  constructor(private consultationRepository: ConsultationRepository) {}

  async execute(consultation: ConsultationData, patientId: string): Promise<void> {
    // Autosave no requiere validación completa, solo guarda el progreso
    await this.consultationRepository.autosave(consultation, patientId);
  }
}

export class LoadConsultationUseCase {
  constructor(private consultationRepository: ConsultationRepository) {}

  async execute(consultationId: string): Promise<ConsultationData> {
    return await this.consultationRepository.load(consultationId);
  }
}

export class SearchMedicationsUseCase {
  constructor(private medicationRepository: MedicationRepository) {}

  async execute(query: string): Promise<any[]> {
    if (query.trim().length < 2) {
      return [];
    }
    return await this.medicationRepository.search(query);
  }
}

export class LoadTemplatesUseCase {
  constructor(private templateRepository: TemplateRepository) {}

  async execute(): Promise<{ templates: any[], defaultTemplate: any }> {
    const [templates, defaultTemplate] = await Promise.all([
      this.templateRepository.getAll(),
      this.templateRepository.getDefault()
    ]);

    return { templates, defaultTemplate };
  }
}