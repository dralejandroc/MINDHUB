/**
 * 📋 PRESCRIPTIONS LIST COMPONENT
 * 
 * Lista y gestión de recetas médicas digitales
 * Con filtros, búsqueda y acciones rápidas
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DocumentTextIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  CalendarIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Prescription {
  id: string;
  prescription_number: string;
  prescription_date: string;
  valid_until: string;
  status: 'active' | 'dispensed' | 'expired' | 'cancelled' | 'partial';
  diagnosis: string;
  clinical_notes?: string;
  is_chronic: boolean;
  refills_allowed: number;
  refills_used: number;
  verification_code: string;
  patients: {
    id: string;
    first_name: string;
    last_name: string;
    paternal_last_name?: string;
    maternal_last_name?: string;
    date_of_birth?: string;
    email?: string;
  };
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    license_number?: string;
    specialty?: string;
  };
  prescription_medications: Array<{
    id: string;
    medication_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity_prescribed: number;
    unit_of_measure: string;
    is_controlled_substance: boolean;
  }>;
  consultations?: {
    id: string;
    consultation_type: string;
    consultation_date: string;
  };
}

interface Props {
  patientId?: string;
  showCreateButton?: boolean;
  onCreateNew?: () => void;
}

export function PrescriptionsList({ patientId, showCreateButton = true, onCreateNew }: Props) {
  const router = useRouter();
  
  // Estados principales
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados de filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0
  });

  // Cargar recetas al montar el componente
  useEffect(() => {
    loadPrescriptions();
  }, [patientId, statusFilter, pagination.offset]);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        status: statusFilter
      });
      
      if (patientId) {
        params.append('patient_id', patientId);
      }
      
      const response = await fetch(`/api/prescriptions?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setPrescriptions(data.data || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      } else {
        setError(data.message || 'Error al cargar las recetas');
      }
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      setError('Error al cargar las recetas');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: {
        color: 'bg-green-100 text-green-800',
        icon: CheckCircleIcon,
        label: 'Activa'
      },
      dispensed: {
        color: 'bg-blue-100 text-blue-800',
        icon: CheckCircleIcon,
        label: 'Surtida'
      },
      partial: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: ClockIcon,
        label: 'Parcialmente Surtida'
      },
      expired: {
        color: 'bg-gray-100 text-gray-800',
        icon: XCircleIcon,
        label: 'Expirada'
      },
      cancelled: {
        color: 'bg-red-100 text-red-800',
        icon: XCircleIcon,
        label: 'Cancelada'
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  const downloadPDF = async (prescriptionId: string, prescriptionNumber: string) => {
    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}/pdf`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Receta_${prescriptionNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('PDF descargado exitosamente');
      } else {
        toast.error('Error al descargar el PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Error al descargar el PDF');
    }
  };

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  const filteredPrescriptions = prescriptions.filter(prescription => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      prescription.prescription_number.toLowerCase().includes(searchLower) ||
      prescription.diagnosis.toLowerCase().includes(searchLower) ||
      `${prescription.patients.first_name} ${prescription.patients.last_name}`.toLowerCase().includes(searchLower) ||
      prescription.prescription_medications.some(med => 
        med.medication_name.toLowerCase().includes(searchLower)
      )
    );
  });

  if (loading && prescriptions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-teal border-t-transparent"></div>
        <span className="ml-2 text-gray-600">Cargando recetas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
        <button
          onClick={loadPrescriptions}
          className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header y controles */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {patientId ? 'Recetas del Paciente' : 'Recetas Médicas'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {pagination.total} receta{pagination.total !== 1 ? 's' : ''} encontrada{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
        
        {showCreateButton && (
          <button
            onClick={onCreateNew || (() => router.push('/hubs/expedix/prescriptions/new'))}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-teal text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Nueva Receta</span>
          </button>
        )}
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número, diagnóstico, paciente o medicamento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
          />
        </div>
        
        <div className="flex space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="dispensed">Surtidas</option>
            <option value="partial">Parcialmente Surtidas</option>
            <option value="expired">Expiradas</option>
            <option value="cancelled">Canceladas</option>
          </select>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FunnelIcon className="h-4 w-4" />
            <span>Filtros</span>
          </button>
        </div>
      </div>

      {/* Lista de recetas */}
      {filteredPrescriptions.length === 0 ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay recetas</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || statusFilter !== 'all' ? 
              'No se encontraron recetas con los filtros aplicados.' : 
              'Comienza creando una nueva receta médica.'
            }
          </p>
          {showCreateButton && !searchQuery && statusFilter === 'all' && (
            <div className="mt-6">
              <button
                onClick={onCreateNew || (() => router.push('/hubs/expedix/prescriptions/new'))}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-teal text-white rounded-lg hover:bg-teal-600 transition-colors mx-auto"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Nueva Receta</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {filteredPrescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className={`bg-white border rounded-lg p-6 hover:shadow-md transition-shadow ${
                  isExpired(prescription.valid_until) ? 'border-red-200 bg-red-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header de la receta */}
                    <div className="flex items-center space-x-4 mb-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {prescription.prescription_number}
                      </h3>
                      {getStatusBadge(prescription.status)}
                      {prescription.is_chronic && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          🔄 Crónico
                        </span>
                      )}
                    </div>
                    
                    {/* Información del paciente */}
                    <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <UserIcon className="h-4 w-4" />
                        <span>
                          {prescription.patients.first_name} {prescription.patients.last_name} {prescription.patients.paternal_last_name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>
                          {new Date(prescription.prescription_date).toLocaleDateString('es-MX')}
                        </span>
                      </div>
                      {isExpired(prescription.valid_until) && (
                        <span className="text-red-600 font-medium">
                          ⚠️ Expirada
                        </span>
                      )}
                    </div>
                    
                    {/* Diagnóstico */}
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-900">Diagnóstico:</p>
                      <p className="text-sm text-gray-700">{prescription.diagnosis}</p>
                    </div>
                    
                    {/* Medicamentos */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Medicamentos ({prescription.prescription_medications.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {prescription.prescription_medications.slice(0, 3).map((med, index) => (
                          <span
                            key={index}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              med.is_controlled_substance ? 
                                'bg-yellow-100 text-yellow-800' : 
                                'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {med.is_controlled_substance && '🔒 '}
                            {med.medication_name}
                          </span>
                        ))}
                        {prescription.prescription_medications.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            +{prescription.prescription_medications.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Información de validez */}
                    <div className="text-xs text-gray-500">
                      Válida hasta: {new Date(prescription.valid_until).toLocaleDateString('es-MX')} • 
                      Código: {prescription.verification_code}
                      {prescription.refills_allowed > 0 && (
                        <> • Resurtidos: {prescription.refills_used}/{prescription.refills_allowed}</>
                      )}
                    </div>
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => router.push(`/hubs/expedix/prescriptions/${prescription.id}`)}
                      className="flex items-center space-x-1 px-3 py-2 text-sm text-primary-teal border border-primary-teal rounded-lg hover:bg-teal-50 transition-colors"
                    >
                      <EyeIcon className="h-4 w-4" />
                      <span>Ver</span>
                    </button>
                    
                    <button
                      onClick={() => downloadPDF(prescription.id, prescription.prescription_number)}
                      className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {pagination.total > pagination.limit && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                  disabled={pagination.offset === 0}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                  disabled={pagination.offset + pagination.limit >= pagination.total}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
              
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{pagination.offset + 1}</span> a{' '}
                    <span className="font-medium">
                      {Math.min(pagination.offset + pagination.limit, pagination.total)}
                    </span>{' '}
                    de <span className="font-medium">{pagination.total}</span> resultados
                  </p>
                </div>
                
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                      disabled={pagination.offset === 0}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Anterior</span>
                      ←
                    </button>
                    
                    <button
                      onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                      disabled={pagination.offset + pagination.limit >= pagination.total}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Siguiente</span>
                      →
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}