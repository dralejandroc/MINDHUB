'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface NewPatientFormData {
  // Campos obligatorios
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  birth_date: string;
  gender: 'masculine' | 'feminine';
  email: string;
  cell_phone: string;
  
  // Campos opcionales
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  family_members?: string; // JSON string con familiares
  administrative_notes?: string;
  education_level?: string;
  occupation?: string;
  referral_source?: string; // Medio de llegada
}

interface NewPatientFormProps {
  onSave: (patientData: NewPatientFormData) => Promise<void>;
  onCancel: () => void;
}

export default function NewPatientForm({ onSave, onCancel }: NewPatientFormProps) {
  const [formData, setFormData] = useState<NewPatientFormData>({
    // Campos obligatorios
    first_name: '',
    paternal_last_name: '',
    maternal_last_name: '',
    birth_date: '',
    gender: 'masculine',
    email: '',
    cell_phone: '',
    
    // Campos opcionales
    address: '',
    city: '',
    state: '',
    postal_code: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    family_members: '',
    administrative_notes: '',
    education_level: '',
    occupation: '',
    referral_source: ''
  });
  
  const [errors, setErrors] = useState<Partial<NewPatientFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Partial<NewPatientFormData> = {};

    // Validaciones obligatorias
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'El nombre es obligatorio';
    } else if (formData.first_name.trim().length < 2) {
      newErrors.first_name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.paternal_last_name.trim()) {
      newErrors.paternal_last_name = 'El apellido paterno es obligatorio';
    } else if (formData.paternal_last_name.trim().length < 2) {
      newErrors.paternal_last_name = 'El apellido paterno debe tener al menos 2 caracteres';
    }

    if (!formData.maternal_last_name.trim()) {
      newErrors.maternal_last_name = 'El apellido materno es obligatorio';
    } else if (formData.maternal_last_name.trim().length < 2) {
      newErrors.maternal_last_name = 'El apellido materno debe tener al menos 2 caracteres';
    }

    if (!formData.birth_date) {
      newErrors.birth_date = 'La fecha de nacimiento es obligatoria';
    } else {
      const birthDate = new Date(formData.birth_date);
      const today = new Date();
      const maxDate = new Date();
      maxDate.setFullYear(today.getFullYear() - 120); // Máximo 120 años

      if (birthDate > today) {
        newErrors.birth_date = 'La fecha de nacimiento no puede ser futura';
      } else if (birthDate < maxDate) {
        newErrors.birth_date = 'Fecha de nacimiento no válida';
      }
    }

    // Validaciones de campos obligatorios con formato
    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    if (!formData.cell_phone.trim()) {
      newErrors.cell_phone = 'El teléfono celular es obligatorio';
    } else if (!/^\+?[1-9]\d{9,14}$/.test(formData.cell_phone.replace(/\s/g, ''))) {
      newErrors.cell_phone = 'Formato de teléfono inválido (ej: +526621234567)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof NewPatientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSuccessMessage(null);
    try {
      await onSave(formData);
      setSuccessMessage('Paciente registrado exitosamente');
      
      // Opcional: Limpiar el formulario después del éxito
      // setFormData({
      //   first_name: '',
      //   paternal_last_name: '',
      //   maternal_last_name: '',
      //   birth_date: '',
      //   gender: 'masculine',
      //   email: '',
      //   cell_phone: ''
      // });
    } catch (error) {
      console.error('Error al guardar paciente:', error);
    } finally {
      setIsLoading(false);
    }
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Paciente</h1>
          <p className="text-gray-600">Registro de nuevo expediente médico</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Guardando...</span>
              </>
            ) : (
              'Guardar Paciente'
            )}
          </Button>
        </div>
      </div>

      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <div className="text-green-600 mr-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Formulario */}
      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Personal */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre */}
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre(s) *
                </label>
                <input
                  type="text"
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.first_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Juan Carlos"
                  disabled={isLoading}
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                )}
              </div>

              {/* Apellido Paterno */}
              <div>
                <label htmlFor="paternal_last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido Paterno *
                </label>
                <input
                  type="text"
                  id="paternal_last_name"
                  value={formData.paternal_last_name}
                  onChange={(e) => handleInputChange('paternal_last_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.paternal_last_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: García"
                  disabled={isLoading}
                />
                {errors.paternal_last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.paternal_last_name}</p>
                )}
              </div>

              {/* Apellido Materno */}
              <div>
                <label htmlFor="maternal_last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido Materno *
                </label>
                <input
                  type="text"
                  id="maternal_last_name"
                  value={formData.maternal_last_name}
                  onChange={(e) => handleInputChange('maternal_last_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.maternal_last_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: López"
                  disabled={isLoading}
                />
                {errors.maternal_last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.maternal_last_name}</p>
                )}
              </div>

              {/* Género */}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  Género *
                </label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value="masculine">Masculino</option>
                  <option value="feminine">Femenino</option>
                </select>
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Fecha de Nacimiento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fecha de Nacimiento */}
              <div>
                <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Nacimiento *
                </label>
                <input
                  type="date"
                  id="birth_date"
                  value={formData.birth_date}
                  onChange={(e) => handleInputChange('birth_date', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.birth_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                />
                {errors.birth_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.birth_date}</p>
                )}
              </div>

              {/* Edad calculada */}
              {formData.birth_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Edad Calculada
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                    {calculateAge(formData.birth_date)} años
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Información de Contacto */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="ejemplo@correo.com"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label htmlFor="cell_phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono Celular *
                </label>
                <input
                  type="tel"
                  id="cell_phone"
                  value={formData.cell_phone}
                  onChange={(e) => handleInputChange('cell_phone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.cell_phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+526621234567"
                  disabled={isLoading}
                />
                {errors.cell_phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.cell_phone}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Incluye código de país (ej: +52 para México)
                </p>
              </div>
            </div>
          </div>

          {/* Información Adicional - Opcionales */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información Adicional (Opcional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Escolaridad */}
              <div>
                <label htmlFor="education_level" className="block text-sm font-medium text-gray-700 mb-1">
                  Escolaridad
                </label>
                <select
                  id="education_level"
                  value={formData.education_level}
                  onChange={(e) => handleInputChange('education_level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value="">Seleccionar...</option>
                  <option value="sin_estudios">Sin estudios</option>
                  <option value="primaria_incompleta">Primaria incompleta</option>
                  <option value="primaria_completa">Primaria completa</option>
                  <option value="secundaria_incompleta">Secundaria incompleta</option>
                  <option value="secundaria_completa">Secundaria completa</option>
                  <option value="preparatoria_incompleta">Preparatoria incompleta</option>
                  <option value="preparatoria_completa">Preparatoria completa</option>
                  <option value="tecnica">Carrera técnica</option>
                  <option value="universidad_incompleta">Universidad incompleta</option>
                  <option value="universidad_completa">Universidad completa</option>
                  <option value="posgrado">Posgrado</option>
                </select>
              </div>

              {/* Ocupación */}
              <div>
                <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-1">
                  Ocupación
                </label>
                <input
                  type="text"
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Estudiante, Empleado, Hogar, etc."
                  disabled={isLoading}
                />
              </div>

              {/* Medio de llegada */}
              <div>
                <label htmlFor="referral_source" className="block text-sm font-medium text-gray-700 mb-1">
                  ¿Cómo llegó al consultorio?
                </label>
                <select
                  id="referral_source"
                  value={formData.referral_source}
                  onChange={(e) => handleInputChange('referral_source', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value="">Seleccionar...</option>
                  <option value="referido_medico">Referido por médico</option>
                  <option value="referido_familiar">Referido por familiar/amigo</option>
                  <option value="iniciativa_propia">Iniciativa propia</option>
                  <option value="redes_sociales">Redes sociales</option>
                  <option value="internet">Búsqueda en internet</option>
                  <option value="directorio_medico">Directorio médico</option>
                  <option value="seguro_medico">Seguro médico</option>
                  <option value="emergencia">Emergencia</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Información de Dirección */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Dirección (Opcional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dirección completa */}
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección completa
                </label>
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Calle, número, colonia..."
                  disabled={isLoading}
                />
              </div>

              {/* Ciudad */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Tijuana"
                  disabled={isLoading}
                />
              </div>

              {/* Estado */}
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <input
                  type="text"
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Baja California"
                  disabled={isLoading}
                />
              </div>

              {/* Código Postal */}
              <div>
                <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
                  Código Postal
                </label>
                <input
                  type="text"
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 22000"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Contacto de Emergencia */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contacto de Emergencia (Opcional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre del contacto */}
              <div>
                <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: María González"
                  disabled={isLoading}
                />
              </div>

              {/* Teléfono del contacto */}
              <div>
                <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+526621234567"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Información de Familiares */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Familiares (Opcional)</h3>
            <div>
              <label htmlFor="family_members" className="block text-sm font-medium text-gray-700 mb-1">
                Información de familiares
              </label>
              <textarea
                id="family_members"
                value={formData.family_members}
                onChange={(e) => handleInputChange('family_members', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Madre: Ana García, 45 años - Padre: Juan López, 48 años - Hermana: María López, 20 años"
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Liste familiares cercanos con nombre, parentesco y edad si es relevante
              </p>
            </div>
          </div>

          {/* Notas Administrativas */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notas Administrativas (Opcional)</h3>
            <div>
              <label htmlFor="administrative_notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notas y detalles del paciente
              </label>
              <textarea
                id="administrative_notes"
                value={formData.administrative_notes}
                onChange={(e) => handleInputChange('administrative_notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Información administrativa relevante, preferencias, observaciones generales..."
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Información administrativa (no médica) que pueda ser útil para el manejo del paciente
              </p>
            </div>
          </div>

          {/* Botones de acción en el formulario */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Guardando...</span>
                </>
              ) : (
                'Guardar Paciente'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}