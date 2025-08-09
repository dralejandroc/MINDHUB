'use client';

import { useState } from 'react';
import { 
  XMarkIcon, 
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  IdentificationIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

interface NewPatientData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: string;
  curp: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface NewPatientQuickModalProps {
  onClose: () => void;
  onSave: (patient: any) => void;
}

export default function NewPatientQuickModal({ onClose, onSave }: NewPatientQuickModalProps) {
  const [formData, setFormData] = useState<NewPatientData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
    curp: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const mexicanStates = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
    'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
    'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
    'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
    'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
    'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán',
    'Zacatecas'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Get current user from Clerk
      const userId = 'user-dr-alejandro'; // Default for now

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/expedix/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          birth_date: formData.birthDate ? `${formData.birthDate}T00:00:00.000Z` : null,
          gender: formData.gender,
          ...(formData.email && { email: formData.email }),
          ...(formData.phone && { cell_phone: formData.phone }),
          ...(formData.curp && { curp: formData.curp }),
          ...(formData.address && { address: formData.address }),
          ...(formData.city && { city: formData.city }),
          ...(formData.state && { state: formData.state }),
          ...(formData.zipCode && { postal_code: formData.zipCode }),
          createdBy: userId,
          isActive: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        onSave(data.data);
        onClose();
      } else {
        const errorData = await response.json();
        console.error('❌ Server error creating patient:', errorData);
        console.error('❌ Request data sent:', {
          first_name: formData.firstName,
          last_name: formData.lastName,
          birth_date: formData.birthDate,
          gender: formData.gender,
          email: formData.email,
          cell_phone: formData.phone,
          curp: formData.curp,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postal_code: formData.zipCode
        });
        alert(`Error al crear el paciente: ${errorData.error || 'Error desconocido'}\n${errorData.details ? JSON.stringify(errorData.details, null, 2) : ''}`);
      }
    } catch (error) {
      console.error('Error creating patient:', error);
      alert('Error al crear el paciente. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.firstName && formData.lastName && formData.phone && formData.birthDate && formData.gender;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div 
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: 'var(--shadow-xl)' }}
      >
        {/* Header */}
        <div 
          className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10"
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información básica */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--dark-green)' }}>
              Información Básica (Requerida)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neutral-700)' }}>
                  Nombre(s) *
                </label>
                <div className="relative">
                  <UserIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--primary-500)' }} />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg focus:outline-none"
                    style={{ 
                      border: '2px solid var(--neutral-200)',
                      fontFamily: 'var(--font-primary)'
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neutral-700)' }}>
                  Apellidos *
                </label>
                <div className="relative">
                  <UserIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--primary-500)' }} />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg focus:outline-none"
                    style={{ 
                      border: '2px solid var(--neutral-200)',
                      fontFamily: 'var(--font-primary)'
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neutral-700)' }}>
                  Teléfono *
                </label>
                <div className="relative">
                  <PhoneIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--primary-500)' }} />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+52 555 123 4567"
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg focus:outline-none"
                    style={{ 
                      border: '2px solid var(--neutral-200)',
                      fontFamily: 'var(--font-primary)'
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neutral-700)' }}>
                  Email
                </label>
                <div className="relative">
                  <EnvelopeIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--primary-500)' }} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg focus:outline-none"
                    style={{ 
                      border: '2px solid var(--neutral-200)',
                      fontFamily: 'var(--font-primary)'
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neutral-700)' }}>
                  Fecha de Nacimiento *
                </label>
                <div className="relative">
                  <CalendarIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--primary-500)' }} />
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg focus:outline-none"
                    style={{ 
                      border: '2px solid var(--neutral-200)',
                      fontFamily: 'var(--font-primary)'
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neutral-700)' }}>
                  Género *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full px-4 py-2 text-sm rounded-lg focus:outline-none appearance-none"
                  style={{ 
                    border: '2px solid var(--neutral-200)',
                    fontFamily: 'var(--font-primary)'
                  }}
                  required
                >
                  <option value="">Seleccionar</option>
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                  <option value="other">Otro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Información adicional (opcional) */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--dark-green)' }}>
              Información Adicional (Opcional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neutral-700)' }}>
                  CURP
                </label>
                <div className="relative">
                  <IdentificationIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--primary-500)' }} />
                  <input
                    type="text"
                    value={formData.curp}
                    onChange={(e) => setFormData(prev => ({ ...prev, curp: e.target.value.toUpperCase() }))}
                    placeholder="ABCD123456HGFEDCBA01"
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg focus:outline-none"
                    style={{ 
                      border: '2px solid var(--neutral-200)',
                      fontFamily: 'var(--font-primary)'
                    }}
                    maxLength={18}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neutral-700)' }}>
                  Dirección
                </label>
                <div className="relative">
                  <MapPinIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--primary-500)' }} />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Calle, número, colonia"
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg focus:outline-none"
                    style={{ 
                      border: '2px solid var(--neutral-200)',
                      fontFamily: 'var(--font-primary)'
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neutral-700)' }}>
                  Ciudad
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-4 py-2 text-sm rounded-lg focus:outline-none"
                  style={{ 
                    border: '2px solid var(--neutral-200)',
                    fontFamily: 'var(--font-primary)'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neutral-700)' }}>
                  Estado
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full px-4 py-2 text-sm rounded-lg focus:outline-none appearance-none"
                  style={{ 
                    border: '2px solid var(--neutral-200)',
                    fontFamily: 'var(--font-primary)'
                  }}
                >
                  <option value="">Seleccionar</option>
                  {mexicanStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--neutral-700)' }}>
                  Código Postal
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                  className="w-full px-4 py-2 text-sm rounded-lg focus:outline-none"
                  style={{ 
                    border: '2px solid var(--neutral-200)',
                    fontFamily: 'var(--font-primary)'
                  }}
                  maxLength={5}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t" style={{ borderColor: 'var(--neutral-200)' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
              style={{ 
                backgroundColor: 'var(--neutral-200)',
                color: 'var(--neutral-700)'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-all duration-200 ${
                isFormValid && !isLoading ? 'hover:-translate-y-0.5' : 'opacity-50 cursor-not-allowed'
              }`}
              style={{ 
                background: isFormValid && !isLoading 
                  ? 'linear-gradient(135deg, var(--primary-500), var(--primary-600))'
                  : 'var(--neutral-400)',
                boxShadow: isFormValid && !isLoading ? '0 4px 12px -2px rgba(8, 145, 178, 0.3)' : 'none'
              }}
            >
              {isLoading ? 'Creando...' : 'Crear Paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}