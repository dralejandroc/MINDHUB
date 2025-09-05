/**
 * 💊 PRESCRIPTION CREATOR COMPONENT
 * 
 * Componente principal para crear recetas médicas digitales
 * Con validación, búsqueda de medicamentos e integración completa
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PlusIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { DrugInteractionsModal } from './DrugInteractionsModal';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  paternal_last_name?: string;
  maternal_last_name?: string;
  date_of_birth?: string;
  email?: string;
  phone?: string;
  allergies?: string[];
  chronic_conditions?: string[];
}

interface Medication {
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

interface PrescriptionData {
  patient_id: string;
  consultation_id?: string;
  diagnosis: string;
  clinical_notes?: string;
  valid_until?: string;
  is_chronic?: boolean;
  refills_allowed?: number;
  medications: Medication[];
}

interface Props {
  patient?: Patient;
  consultationId?: string;
  onSuccess?: (prescription: any) => void;
  onCancel?: () => void;
}

export function PrescriptionCreator({ patient, consultationId, onSuccess, onCancel }: Props) {
  const router = useRouter();
  
  // Estados principales
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(patient || null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  
  // Estados del formulario de receta
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [isChronic, setIsChronic] = useState(false);
  const [refillsAllowed, setRefillsAllowed] = useState(0);
  const [validUntil, setValidUntil] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });
  
  // Estados de medicamentos
  const [medications, setMedications] = useState<Medication[]>([{
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity_prescribed: 1,
    unit_of_measure: 'tabletas',
    administration_route: 'oral',
    order_index: 1
  }]);
  
  // Estados de búsqueda de medicamentos
  const [medicationSearchResults, setMedicationSearchResults] = useState<any[]>([]);
  const [searchingMedications, setSearchingMedications] = useState(false);
  const [currentMedicationIndex, setCurrentMedicationIndex] = useState(-1);
  
  // Estado del modal de interacciones
  const [showInteractionsModal, setShowInteractionsModal] = useState(false);

  // Cargar pacientes si no se proporcionó uno específico
  useEffect(() => {
    if (!patient) {
      loadPatients();
    }
  }, [patient]);

  const loadPatients = async () => {
    try {
      setSearchingPatients(true);
      const response = await fetch('/api/expedix/patients?limit=50');
      const data = await response.json();
      
      if (data.success) {
        setPatients(data.data || []);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Error al cargar pacientes');
    } finally {
      setSearchingPatients(false);
    }
  };

  const searchMedications = async (query: string, medicationIndex: number) => {
    if (!query || query.length < 2) {
      setMedicationSearchResults([]);
      return;
    }

    try {
      setSearchingMedications(true);
      setCurrentMedicationIndex(medicationIndex);
      
      const response = await fetch(`/api/medications/search?q=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setMedicationSearchResults(data.data || []);
      }
    } catch (error) {
      console.error('Error searching medications:', error);
    } finally {
      setSearchingMedications(false);
    }
  };

  const selectMedication = (medicationIndex: number, selectedMed: any) => {
    const updatedMedications = [...medications];
    updatedMedications[medicationIndex] = {
      ...updatedMedications[medicationIndex],
      medication_name: selectedMed.commercial_name,
      active_ingredient: selectedMed.generic_name,
      concentration: selectedMed.concentration,
      pharmaceutical_form: selectedMed.pharmaceutical_form,
      presentation: selectedMed.presentation,
      is_controlled_substance: selectedMed.is_controlled
    };
    
    setMedications(updatedMedications);
    setMedicationSearchResults([]);
    setCurrentMedicationIndex(-1);
  };

  const updateMedication = (index: number, field: keyof Medication, value: any) => {
    const updatedMedications = [...medications];
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value
    };
    setMedications(updatedMedications);
  };

  const addMedication = () => {
    const newMedication: Medication = {
      medication_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity_prescribed: 1,
      unit_of_measure: 'tabletas',
      administration_route: 'oral',
      order_index: medications.length + 1
    };
    setMedications([...medications, newMedication]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      const updatedMedications = medications.filter((_, i) => i !== index);
      // Reajustar índices
      const reindexedMedications = updatedMedications.map((med, i) => ({
        ...med,
        order_index: i + 1
      }));
      setMedications(reindexedMedications);
    }
  };

  const validateForm = (): boolean => {
    if (!selectedPatient) {
      toast.error('Debe seleccionar un paciente');
      return false;
    }
    
    if (!diagnosis.trim()) {
      toast.error('El diagnóstico es obligatorio');
      return false;
    }
    
    if (medications.length === 0) {
      toast.error('Debe agregar al menos un medicamento');
      return false;
    }
    
    for (let i = 0; i < medications.length; i++) {
      const med = medications[i];
      if (!med.medication_name.trim()) {
        toast.error(`El nombre del medicamento #${i + 1} es obligatorio`);
        return false;
      }
      if (!med.dosage.trim()) {
        toast.error(`La dosis del medicamento #${i + 1} es obligatoria`);
        return false;
      }
      if (!med.frequency.trim()) {
        toast.error(`La frecuencia del medicamento #${i + 1} es obligatoria`);
        return false;
      }
      if (!med.duration.trim()) {
        toast.error(`La duración del medicamento #${i + 1} es obligatoria`);
        return false;
      }
      if (med.quantity_prescribed <= 0) {
        toast.error(`La cantidad del medicamento #${i + 1} debe ser mayor a 0`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Verificar si hay medicamentos para analizar interacciones
    const validMedications = medications.filter(med => med.medication_name.trim());
    if (validMedications.length > 0) {
      setShowInteractionsModal(true);
    } else {
      createPrescription();
    }
  };

  const createPrescription = async () => {
    try {
      setLoading(true);
      setShowInteractionsModal(false);
      
      const prescriptionData: PrescriptionData = {
        patient_id: selectedPatient!.id,
        consultation_id: consultationId,
        diagnosis: diagnosis.trim(),
        clinical_notes: clinicalNotes.trim() || undefined,
        valid_until: validUntil,
        is_chronic: isChronic,
        refills_allowed: refillsAllowed,
        medications: medications.map(med => ({
          ...med,
          medication_name: med.medication_name.trim(),
          dosage: med.dosage.trim(),
          frequency: med.frequency.trim(),
          duration: med.duration.trim()
        }))
      };
      
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prescriptionData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Receta médica creada exitosamente');
        
        if (onSuccess) {
          onSuccess(result.data);
        } else {
          router.push(`/hubs/expedix/prescriptions/${result.data.id}`);
        }
      } else {
        toast.error(result.message || 'Error al crear la receta');
      }
    } catch (error) {
      console.error('Error creating prescription:', error);
      toast.error('Error al crear la receta médica');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DocumentTextIcon className="h-6 w-6 text-primary-teal" />
            <h2 className="text-xl font-semibold text-gray-900">Nueva Receta Médica Digital</h2>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Selección de Paciente */}
        {!patient && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paciente *
            </label>
            {searchingPatients ? (
              <div className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <select
                value={selectedPatient?.id || ''}
                onChange={(e) => {
                  const patient = patients.find(p => p.id === e.target.value);
                  setSelectedPatient(patient || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                required
              >
                <option value="">Seleccionar paciente...</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name} {patient.paternal_last_name} - {patient.email}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Información del Paciente Seleccionado */}
        {selectedPatient && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Paciente Seleccionado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Nombre:</strong> {selectedPatient.first_name} {selectedPatient.last_name} {selectedPatient.paternal_last_name}
              </div>
              <div>
                <strong>Fecha de Nacimiento:</strong> {selectedPatient.date_of_birth ? 
                  new Date(selectedPatient.date_of_birth).toLocaleDateString('es-MX') : 'N/A'}
              </div>
              {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                <div className="md:col-span-2">
                  <strong className="text-red-600">🚨 Alergias:</strong> {selectedPatient.allergies.join(', ')}
                </div>
              )}
              {selectedPatient.chronic_conditions && selectedPatient.chronic_conditions.length > 0 && (
                <div className="md:col-span-2">
                  <strong className="text-orange-600">⚠️ Condiciones Crónicas:</strong> {selectedPatient.chronic_conditions.join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Diagnóstico */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Diagnóstico *
          </label>
          <textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="Ingrese el diagnóstico médico..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
            rows={3}
            required
          />
        </div>

        {/* Notas Clínicas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas Clínicas (Opcional)
          </label>
          <textarea
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            placeholder="Observaciones adicionales, recomendaciones generales..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
            rows={2}
          />
        </div>

        {/* Configuración de Receta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Válida hasta
            </label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resurtidos Permitidos
            </label>
            <select
              value={refillsAllowed}
              onChange={(e) => setRefillsAllowed(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
            >
              <option value={0}>Sin resurtidos</option>
              <option value={1}>1 resurtido</option>
              <option value={2}>2 resurtidos</option>
              <option value={3}>3 resurtidos</option>
              <option value={5}>5 resurtidos</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center space-x-2 mt-6">
              <input
                type="checkbox"
                checked={isChronic}
                onChange={(e) => setIsChronic(e.target.checked)}
                className="rounded border-gray-300 text-primary-teal focus:ring-primary-teal"
              />
              <span className="text-sm text-gray-700">Tratamiento Crónico</span>
            </label>
          </div>
        </div>

        {/* Medicamentos */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Medicamentos *</h3>
            <button
              type="button"
              onClick={addMedication}
              className="flex items-center space-x-1 px-3 py-2 bg-primary-teal text-white rounded-lg hover:bg-teal-600 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Agregar Medicamento</span>
            </button>
          </div>

          <div className="space-y-6">
            {medications.map((medication, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Medicamento #{index + 1}</h4>
                  {medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedication(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Búsqueda de Medicamento */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Medicamento *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={medication.medication_name}
                        onChange={(e) => {
                          updateMedication(index, 'medication_name', e.target.value);
                          searchMedications(e.target.value, index);
                        }}
                        placeholder="Buscar medicamento..."
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                        required
                      />
                      <MagnifyingGlassIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                      
                      {/* Resultados de búsqueda */}
                      {currentMedicationIndex === index && medicationSearchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {medicationSearchResults.map((med, medIndex) => (
                            <div
                              key={medIndex}
                              onClick={() => selectMedication(index, med)}
                              className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            >
                              <div className="font-medium">{med.commercial_name}</div>
                              <div className="text-sm text-gray-600">{med.generic_name}</div>
                              <div className="text-xs text-gray-500">
                                {med.concentration} - {med.pharmaceutical_form}
                              </div>
                              {med.is_controlled && (
                                <div className="text-xs text-red-600 font-medium">
                                  ⚠️ CONTROLADO
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dosis */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dosis *
                    </label>
                    <input
                      type="text"
                      value={medication.dosage}
                      onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                      placeholder="ej: 500mg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Frecuencia */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frecuencia *
                    </label>
                    <input
                      type="text"
                      value={medication.frequency}
                      onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                      placeholder="ej: Cada 8 horas"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Duración */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duración *
                    </label>
                    <input
                      type="text"
                      value={medication.duration}
                      onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                      placeholder="ej: 7 días"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Cantidad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad *
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        min="1"
                        value={medication.quantity_prescribed}
                        onChange={(e) => updateMedication(index, 'quantity_prescribed', parseFloat(e.target.value))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                        required
                      />
                      <select
                        value={medication.unit_of_measure}
                        onChange={(e) => updateMedication(index, 'unit_of_measure', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                      >
                        <option value="tabletas">tabletas</option>
                        <option value="cápsulas">cápsulas</option>
                        <option value="ml">ml</option>
                        <option value="mg">mg</option>
                        <option value="g">g</option>
                        <option value="ampolletas">ampolletas</option>
                        <option value="sobres">sobres</option>
                        <option value="aplicaciones">aplicaciones</option>
                      </select>
                    </div>
                  </div>

                  {/* Instrucciones especiales */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instrucciones Especiales
                    </label>
                    <textarea
                      value={medication.special_instructions || ''}
                      onChange={(e) => updateMedication(index, 'special_instructions', e.target.value)}
                      placeholder="Indicaciones adicionales para este medicamento..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                      rows={2}
                    />
                  </div>

                  {/* Vía de administración */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vía de Administración
                    </label>
                    <select
                      value={medication.administration_route || 'oral'}
                      onChange={(e) => updateMedication(index, 'administration_route', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                    >
                      <option value="oral">Oral</option>
                      <option value="sublingual">Sublingual</option>
                      <option value="topica">Tópica</option>
                      <option value="intravenosa">Intravenosa</option>
                      <option value="intramuscular">Intramuscular</option>
                      <option value="subcutanea">Subcutánea</option>
                      <option value="inhalatoria">Inhalatoria</option>
                      <option value="oftalmica">Oftálmica</option>
                      <option value="otica">Ótica</option>
                      <option value="nasal">Nasal</option>
                      <option value="rectal">Rectal</option>
                      <option value="vaginal">Vaginal</option>
                    </select>
                  </div>

                  {/* Instrucciones con alimentos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Con Alimentos
                    </label>
                    <select
                      value={medication.food_instructions || ''}
                      onChange={(e) => updateMedication(index, 'food_instructions', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                    >
                      <option value="">Sin especificar</option>
                      <option value="con alimentos">Con alimentos</option>
                      <option value="en ayunas">En ayunas</option>
                      <option value="antes de comidas">Antes de comidas</option>
                      <option value="despues de comidas">Después de comidas</option>
                      <option value="con abundante agua">Con abundante agua</option>
                    </select>
                  </div>

                  {/* Advertencia de medicamento controlado */}
                  {medication.is_controlled_substance && (
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                        <div className="text-sm text-yellow-800">
                          <strong>Medicamento Controlado:</strong> Este medicamento requiere manejo especial y seguimiento adicional.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          )}
          
          {/* Botón para verificar interacciones sin crear receta */}
          {medications.some(med => med.medication_name.trim()) && (
            <button
              type="button"
              onClick={() => setShowInteractionsModal(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <BeakerIcon className="h-5 w-5" />
              <span>Verificar Interacciones</span>
            </button>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2 bg-primary-teal text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <CheckCircleIcon className="h-5 w-5" />
            )}
            <span>{loading ? 'Creando...' : 'Crear Receta Digital'}</span>
          </button>
        </div>
      </form>

      {/* Modal de Interacciones Farmacológicas */}
      <DrugInteractionsModal
        isOpen={showInteractionsModal}
        onClose={() => setShowInteractionsModal(false)}
        onConfirm={createPrescription}
        medications={medications.filter(med => med.medication_name.trim())}
        patientAllergies={selectedPatient?.allergies}
        patientConditions={selectedPatient?.chronic_conditions}
        patientAge={selectedPatient?.date_of_birth ? 
          Math.floor((new Date().getTime() - new Date(selectedPatient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 
          undefined
        }
        patientName={selectedPatient ? 
          `${selectedPatient.first_name} ${selectedPatient.last_name} ${selectedPatient.paternal_last_name || ''}`.trim() : 
          'Paciente'
        }
      />
    </div>
  );
}