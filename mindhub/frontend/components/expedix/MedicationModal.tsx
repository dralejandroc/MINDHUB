'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  XMarkIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  CircleStackIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
import { MedicationDatabaseManager } from './MedicationDatabaseManager';

interface Medication {
  id?: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  special_instructions?: string;
}

interface MedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (medications: Medication[]) => void;
  currentMedications?: Medication[];
}

// Medicamentos comunes para autocomplete (basado en las imágenes)
const COMMON_MEDICATIONS = [
  { name: 'PARACETAMOL', description: 'gotas orales en solución 100 mg/ml', category: 'PRODUCTOS MAVER, S.A. DE C.V.' },
  { name: 'Paracetamol', description: 'gotas orales en solución 100 mg/ml', category: 'PRODUCTOS MAVER, S.A. DE C.V.' },
  { name: 'PARACETAMOL', description: 'gotas orales en solución 100 mg/ml', category: 'FÁRMACOS CONTINENTALES, S.A. DE C.V.' },
  { name: 'Paracetamol', description: 'gotas orales en solución 100 mg/ml', category: 'FÁRMACOS CONTINENTALES, S.A. DE C.V.' },
  { name: 'PARACETAMOL', description: 'gotas orales en solución 100 mg/ml', category: 'RUDEFSA, S.A. DE C.V.' },
  { name: 'Paracetamol', description: 'gotas orales en solución 100 mg/ml', category: 'RUDEFSA, S.A. DE C.V.' },
  { name: 'AVELOX', description: 'Moxifloxacino 400 mg', category: 'PRODUCTOS MAVER, S.A. DE C.V.' },
  { name: 'AVAPENA', description: 'Clorpromazina 25 mg', category: 'PRODUCTOS MAVER, S.A. DE C.V.' },
  { name: 'SEROQUEL', description: 'Quetiapina 25 mg', category: 'PRODUCTOS MAVER, S.A. DE C.V.' },
  { name: 'ADVIL', description: 'Ibuprofeno 200 mg', category: 'PRODUCTOS MAVER, S.A. DE C.V.' }
];

// Indicaciones favoritas predefinidas (basado en las imágenes)
const FAVORITE_INSTRUCTIONS = [
  'Tomar una cada 24 horas',
  'Tomar una cada 24 horas por 3 días',
  'Tomar una cada 24 horas por 5 días',
  'Tomar una cada 24 horas por 7 días',
  'Tomar una cada 24 horas por 10 días',
  'Tomar una cada 24 horas por 30 días',
  'Tomar una al día por 3 días',
  'Tomar una al día por 5 días',
  'Tomar una al día por 7 días',
  'Tomar una cada 8 horas por 5 días',
  'Tomar una cada 12 horas por 5 días',
  'Dos tabletas c/8 hrs por 5 días'
];

export function MedicationModal({ isOpen, onClose, onSave, currentMedications = [] }: MedicationModalProps) {
  const [medications, setMedications] = useState<Medication[]>(currentMedications);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMedications, setFilteredMedications] = useState(COMMON_MEDICATIONS);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeFieldIndex, setActiveFieldIndex] = useState<number | null>(null);
  const [showDatabaseManager, setShowDatabaseManager] = useState(false);

  useEffect(() => {
    setMedications(currentMedications);
  }, [currentMedications]);

  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = COMMON_MEDICATIONS.filter(med =>
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMedications(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredMedications(COMMON_MEDICATIONS);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  const addMedication = () => {
    const newMed: Medication = {
      id: Date.now().toString(),
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      special_instructions: ''
    };
    setMedications(prev => [...prev, newMed]);
  };

  const removeMedication = (index: number) => {
    setMedications(prev => prev.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    setMedications(prev => prev.map((med, i) => 
      i === index ? { ...med, [field]: value } : med
    ));
  };

  const selectMedication = (medication: typeof COMMON_MEDICATIONS[0], index: number) => {
    updateMedication(index, 'name', `${medication.name} ${medication.description}`);
    setSearchTerm('');
    setShowSuggestions(false);
    setActiveFieldIndex(null);
  };

  const handleSave = () => {
    const validMedications = medications.filter(med => med.name.trim() !== '');
    onSave(validMedications);
    onClose();
  };

  const handleInstructionSelect = (index: number, instruction: string) => {
    updateMedication(index, 'special_instructions', instruction);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">💊 Agregar Medicamentos</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDatabaseManager(true)}
              className="text-teal-600 border-teal-300 hover:bg-teal-50"
            >
              <CircleStackIcon className="h-4 w-4 mr-1" />
              Base de Datos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {medications.map((medication, index) => (
            <div key={medication.id || index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">{index + 1}. Medicamento</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeMedication(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre del Medicamento con Autocomplete */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Medicamento
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={medication.name}
                      onChange={(e) => {
                        updateMedication(index, 'name', e.target.value);
                        setSearchTerm(e.target.value);
                        setActiveFieldIndex(index);
                      }}
                      onFocus={() => {
                        setActiveFieldIndex(index);
                        if (medication.name) {
                          setSearchTerm(medication.name);
                          setShowSuggestions(true);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Buscar medicamento..."
                    />
                    <MagnifyingGlassIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>

                  {/* Suggestions Dropdown */}
                  {showSuggestions && activeFieldIndex === index && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredMedications.map((med, medIndex) => (
                        <div
                          key={medIndex}
                          onClick={() => selectMedication(med, index)}
                          className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="text-sm font-medium text-blue-600">{med.category}</div>
                          <div className="font-semibold text-gray-900">{med.name} {med.description}</div>
                          <div className="text-sm text-blue-500">{med.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Prescripción/Dosificación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dosificación
                  </label>
                  <input
                    type="text"
                    value={medication.dosage}
                    onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="ej: 100mg, 1 tableta"
                  />
                </div>

                {/* Frecuencia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frecuencia
                  </label>
                  <input
                    type="text"
                    value={medication.frequency}
                    onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="ej: cada 8 horas, 3 veces al día"
                  />
                </div>

                {/* Duración */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración
                  </label>
                  <input
                    type="text"
                    value={medication.duration}
                    onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="ej: 7 días, 2 semanas"
                  />
                </div>
              </div>

              {/* Indicaciones Adicionales con Favoritas */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Indicaciones Adicionales de la Receta
                </label>
                <div className="relative">
                  <textarea
                    value={medication.special_instructions || ''}
                    onChange={(e) => updateMedication(index, 'special_instructions', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Instrucciones especiales para el paciente..."
                  />
                  
                  {/* Favoritas Dropdown */}
                  <div className="mt-2">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleInstructionSelect(index, e.target.value);
                          e.target.value = ''; // Reset select
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
                    >
                      <option value="">📝 Seleccionar indicación favorita...</option>
                      {FAVORITE_INSTRUCTIONS.map((instruction, instIndex) => (
                        <option key={instIndex} value={instruction}>
                          {instruction}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add Medication Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={addMedication}
              className="flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Agregar Medicamento
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={medications.length === 0}
          >
            Guardar Medicamentos ({medications.filter(m => m.name.trim() !== '').length})
          </Button>
        </div>
      </div>

      {/* Database Manager Modal */}
      {showDatabaseManager && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-lg max-w-7xl w-full max-h-[95vh] overflow-hidden m-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Gestión de Base de Datos de Medicamentos</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDatabaseManager(false)}
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-[calc(95vh-120px)] overflow-y-auto">
              <MedicationDatabaseManager
                isSelectionMode={true}
                onMedicationSelect={(selectedMedication) => {
                  // Agregar medicamento seleccionado de la base de datos
                  const newMedication: Medication = {
                    id: Date.now().toString(),
                    name: `${selectedMedication.name} ${selectedMedication.description}`,
                    dosage: selectedMedication.concentration || '',
                    frequency: '',
                    duration: '',
                    special_instructions: ''
                  };
                  setMedications(prev => [...prev, newMedication]);
                  setShowDatabaseManager(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}