/**
 * Patient Medical Information Component
 * Displays and edits comprehensive patient medical data from real DB schema
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Patient } from '@/lib/api/expedix-client';

interface PatientMedicalInfoProps {
  patient: Patient;
  onUpdate: (updates: Partial<Patient>) => void;
  isEditing?: boolean;
}

export default function PatientMedicalInfo({ 
  patient, 
  onUpdate, 
  isEditing = false 
}: PatientMedicalInfoProps) {
  const [editMode, setEditMode] = useState(isEditing);
  const [formData, setFormData] = useState({
    blood_type: patient.blood_type || '',
    allergies: patient.allergies || [],
    chronic_conditions: patient.chronic_conditions || [],
    current_medications: patient.current_medications || [],
    emergency_contact_name: patient.emergency_contact_name || '',
    emergency_contact_phone: patient.emergency_contact_phone || '',
    emergency_contact_relationship: patient.emergency_contact_relationship || '',
    consent_to_treatment: patient.consent_to_treatment || false,
    consent_to_data_processing: patient.consent_to_data_processing || false,
    insurance_provider: patient.insurance_provider || '',
    insurance_number: patient.insurance_number || '',
    marital_status: patient.marital_status || '',
    occupation: patient.occupation || ''
  });

  const handleSave = () => {
    onUpdate(formData);
    setEditMode(false);
  };

  const addArrayItem = (field: 'allergies' | 'chronic_conditions' | 'current_medications', value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
    }
  };

  const removeArrayItem = (field: 'allergies' | 'chronic_conditions' | 'current_medications', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  if (!editMode) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Información Médica</h3>
          <Button onClick={() => setEditMode(true)} variant="outline" size="sm">
            Editar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic Medical Info */}
          <div>
            <label className="text-sm font-medium text-gray-600">Tipo de Sangre</label>
            <div className="text-sm">{patient.blood_type || 'No especificado'}</div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Estado Civil</label>
            <div className="text-sm">{patient.marital_status || 'No especificado'}</div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Ocupación</label>
            <div className="text-sm">{patient.occupation || 'No especificado'}</div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Seguro Médico</label>
            <div className="text-sm">
              {patient.insurance_provider ? 
                `${patient.insurance_provider} - ${patient.insurance_number}` : 
                'No especificado'
              }
            </div>
          </div>

          {/* Medical Arrays */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-600">Alergias</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {patient.allergies && patient.allergies.length > 0 ? 
                patient.allergies.map((allergy, index) => (
                  <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                    {allergy}
                  </span>
                )) : 
                <span className="text-sm text-gray-500">Sin alergias registradas</span>
              }
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-600">Condiciones Crónicas</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {patient.chronic_conditions && patient.chronic_conditions.length > 0 ? 
                patient.chronic_conditions.map((condition, index) => (
                  <span key={index} className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                    {condition}
                  </span>
                )) : 
                <span className="text-sm text-gray-500">Sin condiciones crónicas registradas</span>
              }
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-600">Medicamentos Actuales</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {patient.current_medications && patient.current_medications.length > 0 ? 
                patient.current_medications.map((medication, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {medication}
                  </span>
                )) : 
                <span className="text-sm text-gray-500">Sin medicamentos actuales registrados</span>
              }
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-600">Contacto de Emergencia</label>
            <div className="text-sm">
              {patient.emergency_contact_name ? 
                `${patient.emergency_contact_name} (${patient.emergency_contact_relationship}) - ${patient.emergency_contact_phone}` :
                'No especificado'
              }
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Editar Información Médica</h3>
        <div className="space-x-2">
          <Button onClick={() => setEditMode(false)} variant="outline" size="sm">
            Cancelar
          </Button>
          <Button onClick={handleSave} size="sm">
            Guardar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Fields */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Tipo de Sangre</label>
          <select
            value={formData.blood_type}
            onChange={(e) => setFormData(prev => ({ ...prev, blood_type: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Seleccionar...</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Estado Civil</label>
          <select
            value={formData.marital_status}
            onChange={(e) => setFormData(prev => ({ ...prev, marital_status: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Seleccionar...</option>
            <option value="soltero">Soltero(a)</option>
            <option value="casado">Casado(a)</option>
            <option value="divorciado">Divorciado(a)</option>
            <option value="viudo">Viudo(a)</option>
            <option value="union_libre">Unión Libre</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Ocupación</label>
          <input
            type="text"
            value={formData.occupation}
            onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
            placeholder="Ocupación del paciente"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Proveedor de Seguro</label>
          <input
            type="text"
            value={formData.insurance_provider}
            onChange={(e) => setFormData(prev => ({ ...prev, insurance_provider: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
            placeholder="IMSS, ISSSTE, Seguros Monterrey, etc."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">Número de Póliza</label>
          <input
            type="text"
            value={formData.insurance_number}
            onChange={(e) => setFormData(prev => ({ ...prev, insurance_number: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
            placeholder="Número de afiliación o póliza"
          />
        </div>

        {/* Emergency Contact */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Contacto de Emergencia</label>
          <input
            type="text"
            value={formData.emergency_contact_name}
            onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
            placeholder="Nombre completo"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Teléfono de Emergencia</label>
          <input
            type="tel"
            value={formData.emergency_contact_phone}
            onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
            placeholder="Número de teléfono"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">Relación</label>
          <select
            value={formData.emergency_contact_relationship}
            onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_relationship: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Seleccionar relación...</option>
            <option value="esposo">Esposo</option>
            <option value="esposa">Esposa</option>
            <option value="padre">Padre</option>
            <option value="madre">Madre</option>
            <option value="hijo">Hijo</option>
            <option value="hija">Hija</option>
            <option value="hermano">Hermano</option>
            <option value="hermana">Hermana</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        {/* Consent Checkboxes */}
        <div className="md:col-span-2 space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.consent_to_treatment}
              onChange={(e) => setFormData(prev => ({ ...prev, consent_to_treatment: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm">Consiente al tratamiento médico</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.consent_to_data_processing}
              onChange={(e) => setFormData(prev => ({ ...prev, consent_to_data_processing: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm">Consiente al procesamiento de datos personales</span>
          </label>
        </div>
      </div>

      {/* Array Fields */}
      <div className="mt-6 space-y-4">
        <ArrayEditor
          label="Alergias"
          items={formData.allergies}
          onAdd={(value) => addArrayItem('allergies', value)}
          onRemove={(index) => removeArrayItem('allergies', index)}
          placeholder="Agregar alergia..."
          colorClass="bg-red-100 text-red-800"
        />

        <ArrayEditor
          label="Condiciones Crónicas"
          items={formData.chronic_conditions}
          onAdd={(value) => addArrayItem('chronic_conditions', value)}
          onRemove={(index) => removeArrayItem('chronic_conditions', index)}
          placeholder="Agregar condición crónica..."
          colorClass="bg-orange-100 text-orange-800"
        />

        <ArrayEditor
          label="Medicamentos Actuales"
          items={formData.current_medications}
          onAdd={(value) => addArrayItem('current_medications', value)}
          onRemove={(index) => removeArrayItem('current_medications', index)}
          placeholder="Agregar medicamento actual..."
          colorClass="bg-blue-100 text-blue-800"
        />
      </div>
    </Card>
  );
}

// Helper component for array editing
interface ArrayEditorProps {
  label: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  colorClass: string;
}

function ArrayEditor({ label, items, onAdd, onRemove, placeholder, colorClass }: ArrayEditorProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
      
      <div className="flex space-x-2 mb-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
          placeholder={placeholder}
        />
        <Button onClick={handleAdd} size="sm">
          Agregar
        </Button>
      </div>

      <div className="flex flex-wrap gap-1">
        {items.map((item, index) => (
          <span key={index} className={`${colorClass} px-2 py-1 rounded-full text-xs flex items-center space-x-1`}>
            <span>{item}</span>
            <button
              onClick={() => onRemove(index)}
              className="ml-1 text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}