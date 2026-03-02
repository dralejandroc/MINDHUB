'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  DocumentTextIcon,
  CalendarIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { expedixApi, type Patient } from '@/lib/api/expedix-client';

interface ExpedientsGridProps {
  onSelectPatient: (patient: Patient) => void;
  searchText?: string;
  refreshPatients?: boolean;
}

export default function ExpedientsGrid({ onSelectPatient, searchText, refreshPatients }: ExpedientsGridProps) {
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Evita doble fetch en dev (StrictMode) y/o re-mounts
  const didLoadRef = useRef(false);

  useEffect(() => {
    // console.log('refreshPatients 1', refreshPatients);
    
    if (didLoadRef.current && !refreshPatients) return;
    // console.log('refreshPatients 2', refreshPatients);
    didLoadRef.current = true;
    loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshPatients]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await expedixApi.getPatients();
      const list: Patient[] = ((response.data as any)?.patients ?? response.data) || [];

      const arr = Array.isArray(list) ? list : [];

      const ids = arr.map(p => (p as any)?.id).filter(Boolean);
      const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
      console.log('dup ids:', [...new Set(dup)]);


      // ✅ Deduplicar por id (esto elimina el warning y las “duplicaciones” visuales)
      const map = new Map<string, Patient>();
      for (const p of arr) {
        const id = (p as any)?.id;
        if (id) map.set(id.toString(), p);
      }
      const unique = Array.from(map.values());

      // Debug opcional (para confirmar duplicados)
      // console.log('raw:', arr.length, 'unique:', unique.length);

      setAllPatients(unique);
    } catch (e) {
      console.error('Error loading patients:', e);
      setError('Error al cargar los expedientes');
      setAllPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = useMemo(() => {
    const q = (searchText ?? '').trim().toLowerCase();
    if (!q) return allPatients;

    return allPatients.filter((patient) => {
      const fullName = `${patient.first_name ?? ''} ${patient.paternal_last_name ?? ''} ${patient.maternal_last_name ?? ''}`
        .toLowerCase()
        .trim();

      const idMatch = patient.id != null && patient.id.toString().includes(q);
      return fullName.includes(q) || idMatch;
    });
  }, [allPatients, searchText]);

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
        year: 'numeric',
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

  if (filteredPatients.length === 0) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay expedientes</h3>
        <p className="text-gray-500">No hay resultados para tu búsqueda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-3 border-t border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
            <span>{filteredPatients.length} expedientes</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>{filteredPatients.filter(p => !(p as any).status || (p as any).status === 'active').length} activos</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>{filteredPatients.filter(p => (p.consultations_count || 0) > 0).length} con consultas</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((patient, index) => (
          <div
            // Si dedupe ya quedó bien, con patient.id basta. Dejo -index como seguro extra.
            key={`${patient.id}-${index}`}
            onClick={() => onSelectPatient(patient)}
            className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300 group"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-105 transition-transform"
                    style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))' }}
                  >
                    {(patient.first_name?.charAt(0) || 'P').toUpperCase()}
                    {(patient.paternal_last_name?.charAt(0) || '').toUpperCase()}
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

            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <span>{patient.age || 'N/A'}</span>
                <span>•</span>
                <span>{patient.gender === 'male' ? 'M' : patient.gender === 'female' ? 'F' : '-'}</span>
                <span>•</span>
                <span className="truncate">{patient.cell_phone || 'Sin teléfono'}</span>
              </div>

              <div className="text-xs text-gray-500">Última visita: {formatLastVisit(patient.updated_at)}</div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <TagIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Diagnósticos:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(patient as any).medical_history ? (
                    <span className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded-full">Con historial médico</span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-gray-50 text-gray-500 rounded-full">Sin diagnósticos registrados</span>
                  )}
                  {patient.allergies && (
                    <span className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded-full">Alergias registradas</span>
                  )}
                  {(patient as any).current_medications && (
                    <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full">Medicación actual</span>
                  )}
                </div>
              </div>

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
                <div className="text-xs text-blue-600 group-hover:text-blue-700 font-medium">Ver expediente →</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
