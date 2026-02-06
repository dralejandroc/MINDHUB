'use client';

import { useState } from 'react';
import { 
  XMarkIcon, 
  UserIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { expedixApi } from '@/lib/api/expedix-client';
import { set } from 'date-fns';

interface PatientFormData {
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  birth_date: string;
  gender: 'male' | 'female';
  email: string;
  cell_phone: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  medical_history?: string;
  current_medications?: string;
  allergies?: string;
}

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (patient: any) => void;
  setSelectedPatientId?: (id: string | undefined) => void;
}

export default function NewPatientModal({ isOpen, onClose, onSuccess, setSelectedPatientId }: NewPatientModalProps) {
  const [formData, setFormData] = useState<PatientFormData>({
    first_name: '',
    paternal_last_name: '',
    maternal_last_name: '',
    birth_date: '',
    gender: 'male',
    email: '',
    cell_phone: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    medical_history: '',
    current_medications: '',
    allergies: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof PatientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    console.log('ENTRO ACAAAAA');
    
    try {
      // Calculate age
      const age = calculateAge(formData.birth_date);

      // Prepare data for API
      const patientData = {
        ...formData,
        age,
        // Add any other required fields based on your API schema
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Call API to create patient
      const response = await expedixApi.createPatient(patientData);
      console.log('RESPONSE', response);
      
      // if ((response as any).success || response.data) {
      //   onSuccess(response);
      //   onClose();
      //   setSelectedPatientId?.(response.data.id);
      //   // Reset form
      //   setFormData({
      //     first_name: '',
      //     paternal_last_name: '',
      //     maternal_last_name: '',
      //     birth_date: '',
      //     gender: 'male',
      //     email: '',
      //     cell_phone: '',
      //     phone: '',
      //     address: '',
      //     city: '',
      //     state: '',
      //     postal_code: '',
      //     emergency_contact_name: '',
      //     emergency_contact_phone: '',
      //     emergency_contact_relationship: '',
      //     medical_history: '',
      //     current_medications: '',
      //     allergies: ''
      //   });
      // } else {
      //   throw new Error((response as any).message || 'Error al crear el paciente');
      // }
    } catch (error) {
      console.error('Error creating patient:', error);
      setError(error instanceof Error ? error.message : 'Error al crear el paciente');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        style={{ boxShadow: 'var(--shadow-xl)' }}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--neutral-200)' }}
        >
          <h2 
            className="text-xl font-bold"
            style={{ 
              color: 'var(--dark-green)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            Nuevo Paciente
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <XMarkIcon className="h-5 w-5" style={{ color: 'var(--neutral-500)' }} />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="text-red-600 text-sm">
                ❌ {error}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" style={{ color: 'var(--primary-500)' }} />
                Información Personal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dark-green)' }}>
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid var(--neutral-300)' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dark-green)' }}>
                    Apellido Paterno *
                  </label>
                  <input
                    type="text"
                    value={formData.paternal_last_name}
                    onChange={(e) => handleInputChange('paternal_last_name', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid var(--neutral-300)' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dark-green)' }}>
                    Apellido Materno
                  </label>
                  <input
                    type="text"
                    value={formData.maternal_last_name}
                    onChange={(e) => handleInputChange('maternal_last_name', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid var(--neutral-300)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dark-green)' }}>
                    Fecha de Nacimiento *
                  </label>
                  <input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => handleInputChange('birth_date', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid var(--neutral-300)' }}
                    required
                  />
                  {formData.birth_date && (
                    <p className="text-xs text-gray-500 mt-1">
                      Edad: {calculateAge(formData.birth_date)} años
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dark-green)' }}>
                    Género *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value as 'male' | 'female')}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid var(--neutral-300)' }}
                    required
                  >
                    <option value="male">Masculino</option>
                    <option value="female">Femenino</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <PhoneIcon className="h-5 w-5 mr-2" style={{ color: 'var(--primary-500)' }} />
                Información de Contacto
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dark-green)' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid var(--neutral-300)' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dark-green)' }}>
                    Teléfono Celular *
                  </label>
                  <input
                    type="tel"
                    value={formData.cell_phone}
                    onChange={(e) => handleInputChange('cell_phone', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid var(--neutral-300)' }}
                    placeholder="Ej: +52 55 1234 5678"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dark-green)' }}>
                    Teléfono Fijo
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid var(--neutral-300)' }}
                    placeholder="Ej: 55 1234 5678"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2" style={{ color: 'var(--primary-500)' }} />
                Dirección
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dark-green)' }}>
                    Dirección (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid var(--neutral-300)' }}
                    placeholder="Calle, número, colonia"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dark-green)' }}>
                    Ciudad (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid var(--neutral-300)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dark-green)' }}>
                    Estado (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid var(--neutral-300)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dark-green)' }}>
                    Código Postal
                  </label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid var(--neutral-300)' }}
                    placeholder="Ej: 12345"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <IdentificationIcon className="h-5 w-5 mr-2" style={{ color: 'var(--primary-500)' }} />
                Contacto de Emergencia (Opcional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dark-green)' }}>
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid var(--neutral-300)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dark-green)' }}>
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid var(--neutral-300)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dark-green)' }}>
                    Parentesco
                  </label>
                  <select
                    value={formData.emergency_contact_relationship}
                    onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid var(--neutral-300)' }}
                  >
                    <option value="">Seleccionar parentesco</option>
                    <option value="madre">Madre</option>
                    <option value="padre">Padre</option>
                    <option value="esposo/a">Esposo/a</option>
                    <option value="hijo/a">Hijo/a</option>
                    <option value="hermano/a">Hermano/a</option>
                    <option value="abuelo/a">Abuelo/a</option>
                    <option value="tio/a">Tío/a</option>
                    <option value="amigo/a">Amigo/a</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" style={{ color: 'var(--primary-500)' }} />
                Información Médica (Opcional)
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dark-green)' }}>
                    Historial Médico Previo
                  </label>
                  <textarea
                    value={formData.medical_history}
                    onChange={(e) => handleInputChange('medical_history', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid var(--neutral-300)' }}
                    rows={3}
                    placeholder="Enfermedades previas, cirugías, hospitalizaciones..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dark-green)' }}>
                    Medicamentos Actuales
                  </label>
                  <textarea
                    value={formData.current_medications}
                    onChange={(e) => handleInputChange('current_medications', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid var(--neutral-300)' }}
                    rows={3}
                    placeholder="Medicamentos que toma actualmente..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--dark-green)' }}>
                    Alergias
                  </label>
                  <textarea
                    value={formData.allergies}
                    onChange={(e) => handleInputChange('allergies', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ border: '1px solid var(--neutral-300)' }}
                    rows={2}
                    placeholder="Alergias a medicamentos, alimentos, etc..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 mt-6 border-t" style={{ borderColor: 'var(--neutral-200)' }}>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                'Crear Paciente'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}