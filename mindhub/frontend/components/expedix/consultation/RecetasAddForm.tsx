'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PlusIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { PredictiveComboInput } from '@/components/inputs/PredictiveTextinput';
import { MEDICATION_TEXT_CATALOG } from '@/lib/catalogs/mediation-text';
import { buildDosageSuggestions } from '@/lib/catalogs/dosage-generator';
import {ConsultationData} from '@/types/expedix-models';

const dosageSuggestions = [
  ...MEDICATION_TEXT_CATALOG.dosage,
  ...buildDosageSuggestions({ includePerDay: true }),
];

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

interface Props {
  prescriptions: Medication[];
  treatment_plan: string;
  handleDeletePrescription: () => void;
  updateConsultationFn: (updatedFields: Partial<ConsultationData>) => void;
}

export default function RecetasAddForm({ prescriptions, treatment_plan, handleDeletePrescription, updateConsultationFn }: Props) {
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
  const [prescriptionNotes, setPrescriptionNotes] = useState(treatment_plan ?? '');

  useEffect(() => {
    setPrescriptionNotes(treatment_plan ?? '');
  }, [treatment_plan]);

  useEffect(() => {
    if (prescriptions && prescriptions.length > 0) {
      setMedications(prescriptions);
    }
  }, [prescriptions])
  
  

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
    updateConsultationFn({ prescriptions: updatedMedications });
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
    updateConsultationFn({ prescriptions: updatedMedications })
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
    updateConsultationFn({ prescriptions: [...medications, newMedication] })
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
      updateConsultationFn({ prescriptions: reindexedMedications });
    }
  };

  const validateForm = (): boolean => {
    
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
    }
    
    return true;
  };

  return (
    <form className="p-6 space-y-6">

      {/* Medicamentos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={addMedication}
            className="flex items-center space-x-1 px-3 py-2 bg-primary-teal text-white rounded-lg bg-teal-600 transition-colors"
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
                <div className='md:col-span-2'>
                  {/* <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dosis *
                  </label> */}
                  <PredictiveComboInput
                    label="Dosis / Frecuencia"
                    value={medication.dosage ?? ''}
                    onChange={(v: any) => updateMedication(index, 'dosage', v)}
                    placeholder="Ej: 1 tableta cada 8 horas"
                    suggestions={dosageSuggestions}
                    maxHeightPx={200}  // <- limita alto
                    maxItems={40}      // <- limita items mostrados
                  />
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
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Indicaciones / Notas de la receta
          </label>
          <textarea
            value={prescriptionNotes}
            onChange={(e) => {
              const v = e.target.value;
              setPrescriptionNotes(v);
              updateConsultationFn({ treatment_plan: v }); // ✅ aquí lo guardas
            }}
            rows={4}
            placeholder="Ej: Tomar con alimentos. No manejar si causa somnolencia. Regresar si hay fiebre > 38.5°C..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
          />
          
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={handleDeletePrescription}
          className="px-6 py-2 border border-red-400 rounded-lg hover:bg-red-600 transition-colors flex bg-red-400 text-white"
        >
          <TrashIcon className="h-5 w-5 text-white" />
          Borrar Receta
        </button>
      </div>
    </form>
  );
}