'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  CalendarIcon, 
  BeakerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { expedixApi, type Patient } from '@/lib/api/expedix-client';

interface ExpedientsGridProps {
  onSelectPatient: (patient: Patient) => void;
}

export default function ExpedientsGrid({ onSelectPatient }: ExpedientsGridProps) {
  // Use the singleton API client with automatic auth handling
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await expedixApi.getPatients();
      if (response.data) {
        // Handle both possible response formats
        const patients = (response.data as any).patients || response.data;
        setPatients(Array.isArray(patients) ? patients : []);
      } else {
        setPatients([]);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      setError('Error al cargar los expedientes');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'activo':
        return 'text-green-600 bg-green-50';
      case 'inactive':
      case 'inactivo':
        return 'text-gray-600 bg-gray-50';
      case 'critical':
      case 'crítico':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'alta':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'medium':
      case 'media':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'low':
      case 'baja':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      default:
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    }
  };

  const formatLastVisit = (date: string) => {
    if (!date) return 'Sin consultas';
    try {
      return new Date(date).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando expedientes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={loadPatients}
              className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay expedientes registrados
        </h3>
        <p className="text-gray-500">
          Aquí estarán todas las fichas e historia de tus pacientes. 
          Los expedientes aparecerán una vez que tengas pacientes registrados en el sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact legend bar - like agenda */}
      <div className="bg-white rounded-lg p-3 border-t border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
            <span>{patients.length} expedientes</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>{patients.filter(p => !(p as any).status || (p as any).status === 'active').length} activos</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>{patients.filter(p => (p.consultations_count || 0) > 0).length} con consultas</span>
          </div>
        </div>
      </div>

      {/* Expedientes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.map((patient) => (
          <div
            key={patient.id}
            onClick={() => onSelectPatient(patient)}
            className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300 group"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-105 transition-transform"
                    style={{ 
                      background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))' 
                    }}
                  >
                    {(patient.first_name?.charAt(0) || 'P').toUpperCase()}{(patient.paternal_last_name?.charAt(0) || '').toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {patient.first_name || 'Sin nombre'} {patient.paternal_last_name || ''} {patient.maternal_last_name || ''}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Exp. #{(patient.id?.toString() || '').slice(-8).toUpperCase() || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getPriorityIcon((patient as any).priority || 'low')}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor((patient as any).status || 'active')}`}>
                    {(patient as any).status === 'active' || !(patient as any).status ? 'Activo' : (patient as any).status}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Patient Info - Compact without labels */}
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <span>{patient.age || 'N/A'}</span>
                <span>•</span>
                <span>{patient.gender === 'masculine' ? 'M' : patient.gender === 'feminine' ? 'F' : '-'}</span>
                <span>•</span>
                <span className="truncate">{patient.cell_phone || 'Sin teléfono'}</span>
              </div>
              <div className="text-xs text-gray-500">
                Última visita: {formatLastVisit(patient.updated_at)}
              </div>

              {/* Tags and Diagnoses */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <TagIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Diagnósticos:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {/* Placeholder para diagnósticos - se llenarán con datos reales */}
                  {(patient as any).medical_history ? (
                    <span className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded-full">
                      Con historial médico
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-gray-50 text-gray-500 rounded-full">
                      Sin diagnósticos registrados
                    </span>
                  )}
                  {patient.allergies && (
                    <span className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded-full">
                      Alergias registradas
                    </span>
                  )}
                  {(patient as any).current_medications && (
                    <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full">
                      Medicación actual
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="h-3 w-3" />
                    <span>{patient.consultations_count || 0} consultas</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BeakerIcon className="h-3 w-3" />
                    <span>{patient.evaluations_count || 0} evaluaciones</span>
                  </div>
                </div>
                <div className="text-xs text-blue-600 group-hover:text-blue-700 font-medium">
                  Ver expediente →
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}