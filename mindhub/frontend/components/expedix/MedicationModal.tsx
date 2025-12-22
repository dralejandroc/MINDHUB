'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  XMarkIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  CircleStackIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { MedicationDatabaseManager } from './MedicationDatabaseManager';

// ✅ MEDICAMENTO - Solo información farmacológica
interface Medication {
  id?: string;
  // Información básica del medicamento
  molecula_sustancia_activa: string;       // ej: "Paracetamol", "Moxifloxacino"
  nombres_comerciales: string[];           // ej: ["Tempra", "Tylenol", "Panadol"]
  presentacion: string;                    // ej: "tabletas", "solución oral", "cápsulas", "grageas", "lib prolongada"
  dosificacion: string;                    // ej: "500 mg", "100 mg/ml"
  grupo_control: 'GII' | 'GIII' | 'GIV';  // GII (controlado), GIII (semicontrolado), GIV (no controlado)
  empaque?: string;                        // ej: "Caja con 20 tabletas" (opcional)
  
  // Información adicional del fabricante (existente en el sistema actual)
  laboratorio?: string;
  categoria?: string;
}

// ✅ INDICACIÓN - Solo instrucciones de uso (SEPARADA)
interface MedicationIndication {
  id?: string;
  medication_id: string;
  indicacion_completa: string;  // ej: "2 tabletas cada 8 horas por 5 días, vía oral, con alimentos"
}

interface MedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (medications: Medication[], indications: MedicationIndication[]) => void;
  currentMedications?: Medication[];
  currentIndications?: MedicationIndication[];
}

// Grupos de control según normativa mexicana
const CONTROL_GROUPS = [
  { value: 'GII', label: 'GII - Controlado', description: 'Requiere receta médica especial' },
  { value: 'GIII', label: 'GIII - Semicontrolado', description: 'Requiere receta médica retenida' },
  { value: 'GIV', label: 'GIV - No controlado', description: 'Venta libre o con receta simple' }
];

// Tipos de presentación farmacéutica
const PRESENTACIONES = [
  'tabletas',
  'cápsulas', 
  'grageas',
  'solución oral',
  'suspensión oral',
  'jarabe',
  'gotas orales',
  'liberación prolongada',
  'liberación inmediata',
  'comprimidos',
  'sobres',
  'ampolletas',
  'viales'
];

// Indicaciones favoritas SEPARADAS (para la otra base de datos)
const INDICACIONES_FAVORITAS = [
  'Tomar 1 tableta cada 24 horas por 7 días, vía oral',
  'Tomar 2 tabletas cada 8 horas por 5 días, vía oral con alimentos',
  'Tomar 1 cápsula cada 12 horas por 10 días, vía oral',
  'Aplicar 5 gotas cada 6 horas por 3 días, vía oral',
  'Tomar 1 tableta al acostarse por 30 días, vía oral',
  'Tomar 1/2 tableta cada 12 horas por 15 días, vía oral'
];

export function MedicationModal({ 
  isOpen, 
  onClose, 
  onSave, 
  currentMedications = [],
  currentIndications = []
}: MedicationModalProps) {
  const [medications, setMedications] = useState<Medication[]>(currentMedications);
  const [indications, setIndications] = useState<MedicationIndication[]>(currentIndications);
  const [showDatabaseManager, setShowDatabaseManager] = useState(false);

  useEffect(() => {
    setMedications(currentMedications);
    setIndications(currentIndications);
  }, [currentMedications, currentIndications]);

  const addMedication = () => {
    const newMed: Medication = {
      id: Date.now().toString(),
      molecula_sustancia_activa: '',
      nombres_comerciales: [''],
      presentacion: '',
      dosificacion: '',
      grupo_control: 'GIV',
      empaque: '',
      laboratorio: '',
      categoria: ''
    };
    setMedications(prev => [...prev, newMed]);
    
    // Crear indicación correspondiente vacía
    const newIndication: MedicationIndication = {
      id: Date.now().toString() + '_ind',
      medication_id: newMed.id!,
      indicacion_completa: ''
    };
    setIndications(prev => [...prev, newIndication]);
  };

  const removeMedication = (index: number) => {
    const medicationToRemove = medications[index];
    setMedications(prev => prev.filter((_, i) => i !== index));
    // Remover indicación correspondiente
    setIndications(prev => prev.filter(ind => ind.medication_id !== medicationToRemove.id));
  };

  const updateMedication = (index: number, field: keyof Medication, value: any) => {
    setMedications(prev => prev.map((med, i) => 
      i === index ? { ...med, [field]: value } : med
    ));
  };

  const updateIndication = (medicationId: string, indicacion: string) => {
    setIndications(prev => prev.map(ind => 
      ind.medication_id === medicationId ? { ...ind, indicacion_completa: indicacion } : ind
    ));
  };

  const addNombreComercial = (index: number) => {
    const medication = medications[index];
    updateMedication(index, 'nombres_comerciales', [...medication.nombres_comerciales, '']);
  };

  const removeNombreComercial = (medIndex: number, nameIndex: number) => {
    const medication = medications[medIndex];
    const newNames = medication.nombres_comerciales.filter((_, i) => i !== nameIndex);
    updateMedication(medIndex, 'nombres_comerciales', newNames);
  };

  const updateNombreComercial = (medIndex: number, nameIndex: number, value: string) => {
    const medication = medications[medIndex];
    const newNames = medication.nombres_comerciales.map((name, i) => 
      i === nameIndex ? value : name
    );
    updateMedication(medIndex, 'nombres_comerciales', newNames);
  };

  const handleSave = () => {
    const validMedications = medications.filter(med => 
      med.molecula_sustancia_activa.trim() !== '' && 
      med.nombres_comerciales.some(name => name.trim() !== '')
    );
    const validIndications = indications.filter(ind => ind.indicacion_completa.trim() !== '');
    
    onSave(validMedications, validIndications);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">💊 Base de Datos de Medicamentos</h2>
            <div className="bg-blue-50 px-3 py-1 rounded-full">
              <span className="text-xs text-blue-600 font-medium">Información Farmacológica Únicamente</span>
            </div>
          </div>
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
            <Button variant="outline" size="sm" onClick={onClose}>
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Información importante */}
        <div className="p-4 bg-amber-50 border-b">
          <div className="flex items-start gap-3">
            <InformationCircleIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">📋 Base de Datos de MEDICAMENTOS (Información Farmacológica)</p>
              <p>Esta sección maneja únicamente la información técnica del medicamento. Las <strong>indicaciones de uso</strong> (dosis, frecuencia, duración) se manejan en una base de datos separada.</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {medications.map((medication, index) => {
            const indication = indications.find(ind => ind.medication_id === medication.id);
            
            return (
              <div key={medication.id || index} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {index + 1}
                    </span>
                    Medicamento
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeMedication(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Columna 1: Información Principal */}
                  <div className="space-y-4">
                    {/* Molécula/Sustancia Activa */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🧪 Molécula/Sustancia Activa *
                      </label>
                      <input
                        type="text"
                        value={medication.molecula_sustancia_activa}
                        onChange={(e) => updateMedication(index, 'molecula_sustancia_activa', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ej: Paracetamol, Moxifloxacino, Ibuprofeno"
                        required
                      />
                    </div>

                    {/* Nombres Comerciales */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          🏷️ Nombre(s) Comercial(es) *
                        </label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addNombreComercial(index)}
                          className="text-xs"
                        >
                          <PlusIcon className="h-3 w-3 mr-1" />
                          Agregar
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {medication.nombres_comerciales.map((nombre, nameIndex) => (
                          <div key={nameIndex} className="flex gap-2">
                            <input
                              type="text"
                              value={nombre}
                              onChange={(e) => updateNombreComercial(index, nameIndex, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder={`ej: ${nameIndex === 0 ? 'Tempra, Tylenol, Panadol' : 'Nombre comercial adicional'}`}
                            />
                            {medication.nombres_comerciales.length > 1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeNombreComercial(index, nameIndex)}
                                className="text-red-600"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Presentación */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        💊 Presentación *
                      </label>
                      <select
                        value={medication.presentacion}
                        onChange={(e) => updateMedication(index, 'presentacion', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Seleccionar presentación</option>
                        {PRESENTACIONES.map((pres, presIndex) => (
                          <option key={presIndex} value={pres}>{pres}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Columna 2: Especificaciones Técnicas */}
                  <div className="space-y-4">
                    {/* Dosificación */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ⚖️ Dosificación *
                      </label>
                      <input
                        type="text"
                        value={medication.dosificacion}
                        onChange={(e) => updateMedication(index, 'dosificacion', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ej: 500 mg, 100 mg/ml, 25 mg"
                        required
                      />
                    </div>

                    {/* Grupo de Control */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🔒 Grupo de Control *
                      </label>
                      <select
                        value={medication.grupo_control}
                        onChange={(e) => updateMedication(index, 'grupo_control', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        {CONTROL_GROUPS.map((grupo, groupIndex) => (
                          <option key={groupIndex} value={grupo.value}>
                            {grupo.label} - {grupo.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Empaque */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📦 Empaque (Opcional)
                      </label>
                      <input
                        type="text"
                        value={medication.empaque || ''}
                        onChange={(e) => updateMedication(index, 'empaque', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ej: Caja con 20 tabletas, Frasco con 30 ml"
                      />
                    </div>

                    {/* Laboratorio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🏭 Laboratorio (Opcional)
                      </label>
                      <input
                        type="text"
                        value={medication.laboratorio || ''}
                        onChange={(e) => updateMedication(index, 'laboratorio', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ej: Bayer, Pfizer, Laboratorios Liomont"
                      />
                    </div>
                  </div>
                </div>

                {/* Sección de Indicaciones (SEPARADA) */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                      📝 Indicación de Uso (Base de Datos Separada)
                    </h4>
                    <div className="space-y-3">
                      <textarea
                        value={indication?.indicacion_completa || ''}
                        onChange={(e) => updateIndication(medication.id!, e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        placeholder="ej: 2 tabletas cada 8 horas por 5 días, vía oral con alimentos"
                      />
                      
                      {/* Indicaciones Favoritas */}
                      <div>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              updateIndication(medication.id!, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-green-500 focus:border-green-500 text-sm"
                        >
                          <option value="">📋 Seleccionar indicación predefinida...</option>
                          {INDICACIONES_FAVORITAS.map((indicacion, indIndex) => (
                            <option key={indIndex} value={indicacion}>
                              {indicacion}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Medication Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={addMedication}
              className="flex items-center bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Agregar Medicamento
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 bg-gray-50 border-t">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{medications.filter(m => m.molecula_sustancia_activa.trim() !== '').length}</span> medicamentos válidos
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={medications.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Guardar Medicamentos
            </Button>
          </div>
        </div>
      </div>

      {/* Database Manager Modal */}
      {showDatabaseManager && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-lg max-w-7xl w-full max-h-[95vh] overflow-hidden m-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">🏥 Base de Datos de Medicamentos</h2>
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
                  const newMedication: Medication = {
                    id: Date.now().toString(),
                    molecula_sustancia_activa: selectedMedication.molecula_sustancia_activa || '',
                    nombres_comerciales: selectedMedication.nombres_comerciales,
                    presentacion: selectedMedication.presentacion || '',
                    dosificacion: selectedMedication.dosificacion || '',
                    grupo_control: 'GIV', // Default
                    empaque: '',
                    laboratorio: selectedMedication.laboratorio || '',
                    categoria: selectedMedication.categoria || ''
                  };
                  
                  setMedications(prev => [...prev, newMedication]);
                  
                  // Crear indicación vacía correspondiente
                  const newIndication: MedicationIndication = {
                    id: Date.now().toString() + '_ind',
                    medication_id: newMedication.id!,
                    indicacion_completa: ''
                  };
                  setIndications(prev => [...prev, newIndication]);
                  
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