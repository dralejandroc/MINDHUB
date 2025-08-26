'use client';

import { CheckIcon, ExclamationTriangleIcon, UserIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

interface PatientRegistrationMVPProps {
  onComplete: (patient: any) => void;
  onCancel?: () => void;
}

interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  consentToTreatment: boolean;
  consentToDataProcessing: boolean;
}

export const PatientRegistrationMVP: React.FC<PatientRegistrationMVPProps> = ({
  onComplete,
  onCancel
}) => {
  const [formData, setFormData] = useState<PatientFormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    consentToTreatment: false,
    consentToDataProcessing: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Form validation
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'El nombre es obligatorio';
      } else if (formData.firstName.trim().length < 2) {
        newErrors.firstName = 'El nombre debe tener al menos 2 caracteres';
      }

      if (!formData.lastName.trim()) {
        newErrors.lastName = 'El apellido es obligatorio';
      } else if (formData.lastName.trim().length < 2) {
        newErrors.lastName = 'El apellido debe tener al menos 2 caracteres';
      }

      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = 'La fecha de nacimiento es obligatoria';
      } else {
        const birthDate = new Date(formData.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 0 || age > 120) {
          newErrors.dateOfBirth = 'Fecha de nacimiento inválida';
        }
      }

      if (!formData.gender) {
        newErrors.gender = 'El género es obligatorio';
      }
    }

    if (step === 2) {
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Formato de email inválido';
      }

      if (formData.phone && !/^[\d\s\-\(\)\+]+$/.test(formData.phone)) {
        newErrors.phone = 'Formato de teléfono inválido';
      }

      if (!formData.emergencyContactName.trim()) {
        newErrors.emergencyContactName = 'El nombre del contacto de emergencia es obligatorio';
      }

      if (!formData.emergencyContactPhone.trim()) {
        newErrors.emergencyContactPhone = 'El teléfono del contacto de emergencia es obligatorio';
      } else if (!/^[\d\s\-\(\)\+]+$/.test(formData.emergencyContactPhone)) {
        newErrors.emergencyContactPhone = 'Formato de teléfono inválido';
      }
    }

    if (step === 3) {
      if (!formData.consentToTreatment) {
        newErrors.consentToTreatment = 'Debe aceptar el consentimiento para tratamiento';
      }
      if (!formData.consentToDataProcessing) {
        newErrors.consentToDataProcessing = 'Debe aceptar el procesamiento de datos';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof PatientFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/expedix/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          consentDate: new Date().toISOString()
        })
      });

      const result = await response.json();

      if (response.ok) {
        onComplete(result.data);
      } else {
        setErrors({ submit: result.error || 'Error al registrar paciente' });
      }
    } catch (error) {
      setErrors({ submit: 'Error de conexión. Intente nuevamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-expedix-50 to-white p-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-expedix-600 to-expedix-700 text-white p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <UserIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Registro de Nuevo Paciente</h1>
              <p className="text-expedix-100">Paso {currentStep} de {totalSteps}</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-expedix-500 focus:border-transparent ${
                        errors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Nombre del paciente"
                    />
                    {errors.firstName && (
                      <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-expedix-500 focus:border-transparent ${
                        errors.lastName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Apellido del paciente"
                    />
                    {errors.lastName && (
                      <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Nacimiento *
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-expedix-500 focus:border-transparent ${
                        errors.dateOfBirth ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {formData.dateOfBirth && (
                      <p className="text-sm text-gray-600 mt-1">
                        Edad: {calculateAge(formData.dateOfBirth)} años
                      </p>
                    )}
                    {errors.dateOfBirth && (
                      <p className="text-red-600 text-sm mt-1">{errors.dateOfBirth}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Género *
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-expedix-500 focus:border-transparent ${
                        errors.gender ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccionar género</option>
                      <option value="male">Masculino</option>
                      <option value="female">Femenino</option>
                      <option value="non_binary">No binario</option>
                      <option value="other">Otro</option>
                      <option value="prefer_not_to_say">Prefiero no decir</option>
                    </select>
                    {errors.gender && (
                      <p className="text-red-600 text-sm mt-1">{errors.gender}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de Contacto</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-expedix-500 focus:border-transparent ${
                        errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="ejemplo@correo.com"
                    />
                    {errors.email && (
                      <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-expedix-500 focus:border-transparent ${
                        errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="555-123-4567"
                    />
                    {errors.phone && (
                      <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-md font-medium text-gray-900 mb-4">Contacto de Emergencia</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre del Contacto
                        </label>
                        <input
                          type="text"
                          value={formData.emergencyContactName}
                          onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-expedix-500 focus:border-transparent ${
                            errors.emergencyContactName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="Nombre completo"
                        />
                        {errors.emergencyContactName && (
                          <p className="text-red-600 text-sm mt-1">{errors.emergencyContactName}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Teléfono de Emergencia
                        </label>
                        <input
                          type="tel"
                          value={formData.emergencyContactPhone}
                          onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-expedix-500 focus:border-transparent ${
                            errors.emergencyContactPhone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                          placeholder="555-123-4567"
                        />
                        {errors.emergencyContactPhone && (
                          <p className="text-red-600 text-sm mt-1">{errors.emergencyContactPhone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Consent */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Consentimientos</h2>
                
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border-2 ${
                    errors.consentToTreatment ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.consentToTreatment}
                        onChange={(e) => handleInputChange('consentToTreatment', e.target.checked)}
                        className="mt-1 h-4 w-4 text-expedix-600 border-gray-300 rounded focus:ring-expedix-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          Consentimiento para Tratamiento *
                        </span>
                        <p className="text-sm text-gray-600 mt-1">
                          Autorizo el tratamiento médico y psicológico, así como los procedimientos necesarios para mi cuidado.
                          Entiendo que puedo retirar este consentimiento en cualquier momento.
                        </p>
                      </div>
                    </label>
                    {errors.consentToTreatment && (
                      <p className="text-red-600 text-sm mt-2">{errors.consentToTreatment}</p>
                    )}
                  </div>

                  <div className={`p-4 rounded-lg border-2 ${
                    errors.consentToDataProcessing ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.consentToDataProcessing}
                        onChange={(e) => handleInputChange('consentToDataProcessing', e.target.checked)}
                        className="mt-1 h-4 w-4 text-expedix-600 border-gray-300 rounded focus:ring-expedix-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          Consentimiento para Procesamiento de Datos *
                        </span>
                        <p className="text-sm text-gray-600 mt-1">
                          Autorizo el procesamiento de mis datos personales de acuerdo con la NOM-024-SSA3-2010 
                          y las políticas de privacidad del sistema. Mis datos serán protegidos y utilizados únicamente 
                          para fines médicos y administrativos.
                        </p>
                      </div>
                    </label>
                    {errors.consentToDataProcessing && (
                      <p className="text-red-600 text-sm mt-2">{errors.consentToDataProcessing}</p>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Información Importante</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Sus datos están protegidos bajo la normativa mexicana NOM-024-SSA3-2010. 
                          Puede solicitar acceso, rectificación o cancelación de sus datos en cualquier momento.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Messages */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <div>
              {currentStep > 1 && (
                <button
                  onClick={handlePreviousStep}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  ← Anterior
                </button>
              )}
            </div>

            <div className="flex space-x-3">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Cancelar
                </button>
              )}

              {currentStep < totalSteps ? (
                <button
                  onClick={handleNextStep}
                  className="px-6 py-2 bg-expedix-600 text-white rounded-lg hover:bg-expedix-700 font-medium transition-colors"
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      <span>Completar Registro</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientRegistrationMVP;