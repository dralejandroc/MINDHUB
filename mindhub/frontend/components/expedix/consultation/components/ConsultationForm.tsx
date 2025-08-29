/**
 * COMPONENTE UI - Capa de Framework (Externa)
 * Componente React optimizado que usa los casos de uso para lógica de negocio
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConsultationData } from '../entities/ConsultationData';
import { 
  SaveConsultationUseCase, 
  AutosaveConsultationUseCase,
  SearchMedicationsUseCase,
  LoadTemplatesUseCase 
} from '../usecases/ConsultationUseCases';
import { 
  ConsultationApiAdapter, 
  MedicationApiAdapter, 
  TemplateApiAdapter 
} from '../adapters/ConsultationApiAdapter';
import { Patient } from '@/lib/api/expedix-client';
import { Save, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { validateConsultationSafety, type DrugInteraction } from '@/lib/validations/medical-validations';
import VitalSignsSection from './VitalSignsSection';
import MedicationsSection from './MedicationsSection';
import MentalExamSection from './MentalExamSection';

interface ConsultationFormProps {
  patient: Patient;
  onSave: (data: ConsultationData) => void;
  onCancel: () => void;
}

export default function ConsultationForm({ patient, onSave, onCancel }: ConsultationFormProps) {
  // Dependency Injection - Clean Architecture
  const consultationAdapter = useMemo(() => new ConsultationApiAdapter(), []);
  const medicationAdapter = useMemo(() => new MedicationApiAdapter(), []);
  const templateAdapter = useMemo(() => new TemplateApiAdapter(), []);
  
  const saveUseCase = useMemo(() => new SaveConsultationUseCase(consultationAdapter), [consultationAdapter]);
  const autosaveUseCase = useMemo(() => new AutosaveConsultationUseCase(consultationAdapter), [consultationAdapter]);
  const searchMedicationsUseCase = useMemo(() => new SearchMedicationsUseCase(medicationAdapter), [medicationAdapter]);
  const loadTemplatesUseCase = useMemo(() => new LoadTemplatesUseCase(templateAdapter), [templateAdapter]);

  // Estado local minimal - solo UI state
  const [consultationData, setConsultationData] = useState<ConsultationData>(() => ConsultationData.createEmpty());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  
  // Estados de validación médica
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [drugInteractions, setDrugInteractions] = useState<DrugInteraction[]>([]);
  const [showSafetyAlert, setShowSafetyAlert] = useState(false);
  
  // Cargar templates al montar - optimizado con useMemo
  useEffect(() => {
    let mounted = true;
    
    loadTemplatesUseCase.execute().then(({ templates, defaultTemplate }) => {
      if (mounted) {
        setTemplates(templates);
        if (defaultTemplate) {
          setConsultationData(prev => {
            // Create a new instance to maintain class methods
            const newData = Object.assign(Object.create(Object.getPrototypeOf(prev)), prev);
            newData.noteType = defaultTemplate.id;
            return newData;
          });
        }
      }
    });

    return () => { mounted = false; };
  }, [loadTemplatesUseCase]);

  // Autosave optimizado - debounced
  const debouncedAutosave = useCallback(
    debounce(async (data: ConsultationData) => {
      try {
        await autosaveUseCase.execute(data, patient.id);
      } catch (error) {
        console.warn('Autosave failed:', error);
      }
    }, 2000),
    [autosaveUseCase, patient.id]
  );

  // Validación médica en tiempo real
  const validateMedicalData = useCallback((data: ConsultationData) => {
    const validation = validateConsultationSafety(data);
    
    setValidationErrors(validation.errors);
    setValidationWarnings(validation.warnings);
    setDrugInteractions(validation.drugInteractions);
    
    // Mostrar alerta si hay errores críticos
    setShowSafetyAlert(validation.errors.length > 0 || validation.drugInteractions.length > 0);
    
    return validation;
  }, []);

  // Handler optimizado para cambios de datos
  const handleDataChange = useCallback((updates: Partial<ConsultationData>) => {
    setConsultationData(prev => {
      const newData = { ...prev, ...updates };
      
      // Validación médica en tiempo real
      validateMedicalData(newData);
      
      debouncedAutosave(newData);
      return newData;
    });
  }, [debouncedAutosave, validateMedicalData]);

  // Handler de guardado
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await saveUseCase.execute(consultationData, patient.id);
      onSave(consultationData);
    } catch (error) {
      console.error('Save failed:', error);
      // TODO: Show user feedback
    } finally {
      setIsSaving(false);
    }
  }, [saveUseCase, consultationData, patient.id, onSave]);

  // Búsqueda de medicamentos optimizada
  const handleMedicationSearch = useCallback(async (query: string) => {
    return await searchMedicationsUseCase.execute(query);
  }, [searchMedicationsUseCase]);

  if (isLoading) {
    return <div className="flex justify-center p-8">Cargando...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            Nueva Consulta - {patient.first_name} {patient.last_name}
          </h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !consultationData.hasRequiredFields()}
            >
              {isSaving ? <Save className="animate-spin w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>

        {/* Alertas de Seguridad Médica */}
        {showSafetyAlert && (validationErrors.length > 0 || drugInteractions.length > 0) && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <div className="p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-800 mb-2">
                    ⚠️ Alertas de Seguridad Médica
                  </h3>
                  
                  {validationErrors.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-red-700 mb-1">Errores Críticos:</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index} className="flex items-start">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {drugInteractions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-700 mb-1">Interacciones Medicamentosas:</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {drugInteractions.map((interaction, index) => (
                          <li key={index} className="flex items-start">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            <strong>{interaction.drug1}</strong> + <strong>{interaction.drug2}</strong>: {interaction.description}
                            <span className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
                              interaction.severity === 'high' ? 'bg-red-100 text-red-800' :
                              interaction.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {interaction.severity}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSafetyAlert(false)}
                  className="text-red-600 hover:text-red-800"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Advertencias Médicas (menos críticas) */}
        {validationWarnings.length > 0 && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <div className="p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                    ⚠️ Advertencias Médicas
                  </h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {validationWarnings.map((warning, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Consulta</label>
            <select
              value={consultationData.noteType}
              onChange={(e) => handleDataChange({ noteType: e.target.value })}
              className="w-full p-2 border rounded-md"
            >
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Fecha</label>
            <input
              type="date"
              value={consultationData.date}
              onChange={(e) => handleDataChange({ date: e.target.value })}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>

        {/* Condición actual - CAMPO OBLIGATORIO */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Condición Actual <span className="text-red-500">*</span>
          </label>
          <textarea
            value={consultationData.currentCondition}
            onChange={(e) => handleDataChange({ currentCondition: e.target.value })}
            className="w-full p-3 border rounded-md h-24"
            placeholder="Describa la condición actual del paciente..."
          />
        </div>

        {/* Secciones optimizadas - Lazy loaded */}
        <VitalSignsSection
          vitalSigns={consultationData.vitalSigns}
          onChange={(vitalSigns) => handleDataChange({ vitalSigns })}
        />

        <MedicationsSection
          medications={consultationData.medications}
          onSearch={handleMedicationSearch}
          onChange={(medications) => handleDataChange({ medications })}
        />

        <MentalExamSection
          mentalExam={consultationData.mentalExam}
          onChange={(mentalExam) => handleDataChange({ mentalExam })}
        />

        {/* Diagnóstico */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Diagnóstico</label>
          <textarea
            value={consultationData.diagnosis}
            onChange={(e) => handleDataChange({ diagnosis: e.target.value })}
            className="w-full p-3 border rounded-md h-24"
            placeholder="Ingrese el diagnóstico..."
          />
        </div>

        {/* Plan de tratamiento */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Instrucciones Adicionales</label>
          <textarea
            value={consultationData.additionalInstructions}
            onChange={(e) => handleDataChange({ additionalInstructions: e.target.value })}
            className="w-full p-3 border rounded-md h-24"
            placeholder="Instrucciones para el paciente..."
          />
        </div>
      </Card>
    </div>
  );
}

// Utility function - debounce
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  }) as T;
}