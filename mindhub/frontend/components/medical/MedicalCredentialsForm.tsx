/**
 * 🏥 MEDICAL CREDENTIALS FORM COMPONENT
 * 
 * Formulario para configurar credenciales médicas básicas
 * Incluye validación de cédula profesional mexicana
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  AcademicCapIcon,
  DocumentCheckIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface MedicalCredentials {
  professional_license_number?: string;
  medical_specialization?: string;
  medical_school?: string;
  graduation_year?: number;
  professional_board?: string;
  license_expiry_date?: string;
  credentials_verified?: boolean;
  verification_status?: string;
  secondary_specializations?: string[];
  professional_signature_url?: string;
}

interface MedicalCatalogs {
  specializations: any[];
  specializations_by_category: Record<string, any[]>;
  medical_schools: any[];
  schools_by_state: Record<string, any[]>;
  categories: string[];
  states: string[];
}

interface Props {
  onSave?: (credentials: MedicalCredentials) => void;
  onCancel?: () => void;
}

export function MedicalCredentialsForm({ onSave, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [catalogs, setCatalogs] = useState<MedicalCatalogs | null>(null);
  const [credentials, setCredentials] = useState<MedicalCredentials>({});

  // Estados del formulario
  const [professionalLicense, setProfessionalLicense] = useState('');
  const [medicalSpecialization, setMedicalSpecialization] = useState('');
  const [medicalSchool, setMedicalSchool] = useState('');
  const [graduationYear, setGraduationYear] = useState<number | undefined>();
  const [professionalBoard, setProfessionalBoard] = useState('');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [secondarySpecializations, setSecondarySpecializations] = useState<string[]>([]);

  // Estados de UI
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedState, setSelectedState] = useState('');

  useEffect(() => {
    loadCredentials();
    loadCatalogs();
  }, []);

  const loadCredentials = async () => {
    try {
      const response = await fetch('/api/medical-credentials');
      const data = await response.json();
      
      if (data.success) {
        const creds = data.data;
        setCredentials(creds);
        setProfessionalLicense(creds.professional_license_number || '');
        setMedicalSpecialization(creds.medical_specialization || '');
        setMedicalSchool(creds.medical_school || '');
        setGraduationYear(creds.graduation_year);
        setProfessionalBoard(creds.professional_board || '');
        setLicenseExpiryDate(creds.license_expiry_date || '');
        setSecondarySpecializations(creds.secondary_specializations || []);
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
    }
  };

  const loadCatalogs = async () => {
    try {
      setLoadingCatalogs(true);
      const response = await fetch('/api/medical-credentials/catalogs');
      const data = await response.json();
      
      if (data.success) {
        setCatalogs(data.data);
      }
    } catch (error) {
      console.error('Error loading catalogs:', error);
      toast.error('Error al cargar catálogos médicos');
    } finally {
      setLoadingCatalogs(false);
    }
  };

  const validateLicense = (license: string): boolean => {
    if (!license || license.trim().length === 0) return true; // Opcional
    
    // Remover espacios y guiones
    const cleanLicense = license.replace(/[^0-9]/g, '');
    
    // Formato básico: 7-12 dígitos
    return /^[0-9]{7,12}$/.test(cleanLicense);
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Validaciones básicas
      if (professionalLicense && !validateLicense(professionalLicense)) {
        toast.error('Formato de cédula profesional inválido. Use formato numérico de 7-12 dígitos.');
        return;
      }

      if (graduationYear && (graduationYear < 1950 || graduationYear > new Date().getFullYear())) {
        toast.error('Año de graduación inválido.');
        return;
      }

      const updateData: MedicalCredentials = {
        professional_license_number: professionalLicense.trim(),
        medical_specialization: medicalSpecialization.trim(),
        medical_school: medicalSchool.trim(),
        graduation_year: graduationYear,
        professional_board: professionalBoard.trim(),
        license_expiry_date: licenseExpiryDate || undefined,
        secondary_specializations: secondarySpecializations.filter(s => s.trim())
      };

      const response = await fetch('/api/medical-credentials', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Credenciales médicas actualizadas exitosamente');
        setCredentials(result.data);
        if (onSave) {
          onSave(result.data);
        }
      } else {
        toast.error(result.message || 'Error al actualizar credenciales');
      }

    } catch (error) {
      console.error('Error saving credentials:', error);
      toast.error('Error al guardar credenciales médicas');
    } finally {
      setLoading(false);
    }
  };

  const requestVerification = async () => {
    try {
      setLoading(true);

      if (!professionalLicense || !medicalSpecialization) {
        toast.error('Cédula profesional y especialización son requeridas para verificación');
        return;
      }

      const response = await fetch('/api/medical-credentials', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Solicitud de verificación enviada exitosamente');
        setCredentials(prev => ({ ...prev, verification_status: 'pending' }));
      } else {
        toast.error(result.message || 'Error al solicitar verificación');
      }

    } catch (error) {
      console.error('Error requesting verification:', error);
      toast.error('Error al solicitar verificación');
    } finally {
      setLoading(false);
    }
  };

  const getVerificationStatusBadge = () => {
    const status = credentials.verification_status;
    
    switch (status) {
      case 'verified':
        return (
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            <CheckCircleIcon className="h-4 w-4" />
            <span>Verificado</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
            <ClockIcon className="h-4 w-4" />
            <span>En revisión</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <span>Rechazado</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
            <DocumentCheckIcon className="h-4 w-4" />
            <span>Sin verificar</span>
          </div>
        );
    }
  };

  const filteredSpecializations = selectedCategory && catalogs
    ? catalogs.specializations_by_category[selectedCategory] || []
    : catalogs?.specializations || [];

  const filteredSchools = selectedState && catalogs
    ? catalogs.schools_by_state[selectedState] || []
    : catalogs?.medical_schools || [];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1949 }, (_, i) => currentYear - i);

  if (loadingCatalogs) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-teal border-t-transparent"></div>
        <span className="ml-2 text-gray-600">Cargando catálogos médicos...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <UserIcon className="h-8 w-8 text-primary-teal" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Credenciales Médicas</h2>
            <p className="text-gray-600">Configuración profesional básica</p>
          </div>
        </div>
        {getVerificationStatusBadge()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Información Profesional */}
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="flex items-center text-lg font-semibold text-blue-900 mb-4">
              <DocumentCheckIcon className="h-5 w-5 mr-2" />
              Información Profesional
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cédula Profesional *
                </label>
                <input
                  type="text"
                  value={professionalLicense}
                  onChange={(e) => setProfessionalLicense(e.target.value)}
                  placeholder="1234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato: 7-12 dígitos (sin espacios ni guiones)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Colegio Profesional
                </label>
                <input
                  type="text"
                  value={professionalBoard}
                  onChange={(e) => setProfessionalBoard(e.target.value)}
                  placeholder="Colegio Médico del Estado de..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Vencimiento de Licencia
                </label>
                <input
                  type="date"
                  value={licenseExpiryDate}
                  onChange={(e) => setLicenseExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Información Académica */}
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="flex items-center text-lg font-semibold text-green-900 mb-4">
              <AcademicCapIcon className="h-5 w-5 mr-2" />
              Información Académica
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialización Médica *
                </label>
                <div className="space-y-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setMedicalSpecialization(''); // Reset specialization
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                  >
                    <option value="">Todas las categorías</option>
                    {catalogs?.categories?.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={medicalSpecialization}
                    onChange={(e) => setMedicalSpecialization(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                  >
                    <option value="">Seleccionar especialización</option>
                    {filteredSpecializations?.map(spec => (
                      <option key={spec.id} value={spec.name}>
                        {spec.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Universidad de Medicina
                </label>
                <div className="space-y-2">
                  <select
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value);
                      setMedicalSchool(''); // Reset school
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                  >
                    <option value="">Todos los estados</option>
                    {catalogs?.states?.map(state => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={medicalSchool}
                    onChange={(e) => setMedicalSchool(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                  >
                    <option value="">Seleccionar universidad</option>
                    {filteredSchools?.map(school => (
                      <option key={school.id} value={school.name}>
                        {school.name} ({school.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Año de Graduación
                </label>
                <select
                  value={graduationYear || ''}
                  onChange={(e) => setGraduationYear(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
                >
                  <option value="">Seleccionar año</option>
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información de recetas */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Información para Recetas Médicas</p>
            <p>
              La cédula profesional y especialización aparecerán en todas las recetas digitales generadas. 
              Asegúrate de que la información sea correcta antes de crear recetas.
            </p>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        <div>
          {credentials.verification_status !== 'verified' && professionalLicense && medicalSpecialization && (
            <button
              onClick={requestVerification}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              <ShieldCheckIcon className="h-5 w-5" />
              <span>Solicitar Verificación</span>
            </button>
          )}
        </div>

        <div className="flex space-x-4">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2 bg-primary-teal text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <DocumentCheckIcon className="h-5 w-5" />
            )}
            <span>{loading ? 'Guardando...' : 'Guardar Credenciales'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}