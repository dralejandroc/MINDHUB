/**
 * BARREL EXPORT - Clean Architecture ConsultationNotes
 * Exporta los componentes optimizados de la nueva arquitectura
 */

// Entidades de dominio
export { ConsultationData, type VitalSigns, type MentalExam, type Medication, type Temporality } from './entities/ConsultationData';

// Casos de uso
export {
  SaveConsultationUseCase,
  AutosaveConsultationUseCase,
  LoadConsultationUseCase,
  SearchMedicationsUseCase,
  LoadTemplatesUseCase,
  type ConsultationRepository,
  type MedicationRepository,
  type TemplateRepository
} from './usecases/ConsultationUseCases';

// Adaptadores
export {
  ConsultationApiAdapter,
  MedicationApiAdapter,
  TemplateApiAdapter
} from './adapters/ConsultationApiAdapter';

// Componentes UI
export { default as ConsultationForm } from './components/ConsultationForm';
export { default as VitalSignsSection } from './components/VitalSignsSection';
export { default as MedicationsSection } from './components/MedicationsSection';
export { default as MentalExamSection } from './components/MentalExamSection';