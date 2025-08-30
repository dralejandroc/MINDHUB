"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { 
  UsersIcon,
  RefreshCw,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface PatientClassification {
  id: string;
  patient_id: string;
  classification: string;
  classification_display: string;
  attendance_rate: number;
  professionals_seen: number;
  treatment_adherence: number;
  time_in_treatment: number;
  additional_programs: number;
  last_evaluation: string;
  created_at: string;
  updated_at: string;
}

interface PatientInfo {
  id: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  email?: string;
  cell_phone?: string;
}

interface PatientClassificationManagerProps {
  className?: string;
}

export default function PatientClassificationManager({ className }: PatientClassificationManagerProps) {
  const [classifications, setClassifications] = useState<PatientClassification[]>([]);
  const [patients, setPatients] = useState<{ [key: string]: PatientInfo }>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClassification, setFilterClassification] = useState<string>('all');

  const classificationOptions = [
    { value: 'all', label: 'Todas las clasificaciones' },
    { value: 'P_INCONSTANTE', label: 'P. Inconstante', color: 'bg-red-100 text-red-800', emoji: '⚠️' },
    { value: 'P_EN_ACOMPAÑAMIENTO', label: 'P. en Acompañamiento', color: 'bg-yellow-100 text-yellow-800', emoji: '🤝' },
    { value: 'INTEGRACION_INICIAL', label: 'Integración Inicial', color: 'bg-blue-100 text-blue-800', emoji: '🌱' },
    { value: 'P_INTEGRACION_AVANZADA', label: 'P. Integración Avanzada', color: 'bg-green-100 text-green-800', emoji: '📈' },
    { value: 'P_INTEGRADO', label: 'P. Integrado', color: 'bg-green-100 text-green-800', emoji: '💚' },
    { value: 'ARRAIGADO', label: 'Arraigado', color: 'bg-emerald-100 text-emerald-800', emoji: '🌳' },
    { value: 'P_DE_ALTA', label: 'P. de Alta', color: 'bg-purple-100 text-purple-800', emoji: '🎓' },
  ];

  useEffect(() => {
    loadClassifications();
  }, []);

  const loadClassifications = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/analytics/django/patient-classifications/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar clasificaciones');
      }

      const data = await response.json();
      const classificationsData = data.results || data;
      setClassifications(classificationsData);

      // Load patient info for all classifications
      await loadPatientsInfo(classificationsData.map((c: PatientClassification) => c.patient_id));
      
    } catch (error) {
      console.error('Error loading classifications:', error);
      toast.error('Error al cargar las clasificaciones de pacientes');
    } finally {
      setLoading(false);
    }
  };

  const loadPatientsInfo = async (patientIds: string[]) => {
    try {
      // Load patient information in batches
      const patientPromises = patientIds.map(async (patientId) => {
        try {
          const response = await fetch(`/api/expedix/django/patients/${patientId}/`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const patient = await response.json();
            return { [patientId]: patient };
          }
        } catch (error) {
          console.error(`Error loading patient ${patientId}:`, error);
        }
        return { [patientId]: null };
      });

      const patientResults = await Promise.all(patientPromises);
      const patientsData = patientResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setPatients(patientsData);

    } catch (error) {
      console.error('Error loading patients info:', error);
    }
  };

  const updateClassifications = async (patientIds?: string[]) => {
    try {
      setUpdating('bulk');
      
      const requestBody = patientIds ? { patient_ids: patientIds } : { force_recalculate: true };
      
      const response = await fetch('/api/analytics/django/patient-classifications/update_classifications/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar clasificaciones');
      }

      const result = await response.json();
      
      if (result.results) {
        const successCount = result.results.filter((r: any) => r.status === 'success').length;
        const errorCount = result.results.filter((r: any) => r.status === 'error').length;
        
        if (successCount > 0) {
          toast.success(`${successCount} clasificaciones actualizadas exitosamente`);
        }
        if (errorCount > 0) {
          toast.error(`${errorCount} clasificaciones tuvieron errores`);
        }
      } else {
        toast.success('Proceso de actualización iniciado');
      }

      // Reload classifications
      await loadClassifications();
      
    } catch (error) {
      console.error('Error updating classifications:', error);
      toast.error('Error al actualizar las clasificaciones');
    } finally {
      setUpdating(null);
    }
  };

  const getClassificationOption = (classification: string) => {
    return classificationOptions.find(opt => opt.value === classification) || {
      value: classification,
      label: classification,
      color: 'bg-gray-100 text-gray-800',
      emoji: '👤'
    };
  };

  const getProgressColor = (value: number, max: number = 100) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const filteredClassifications = classifications.filter((classification) => {
    const matchesFilter = filterClassification === 'all' || classification.classification === filterClassification;
    
    if (!searchTerm) return matchesFilter;
    
    const patient = patients[classification.patient_id];
    const patientName = patient ? 
      `${patient.first_name} ${patient.paternal_last_name} ${patient.maternal_last_name}`.toLowerCase() : '';
    
    const matchesSearch = patientName.includes(searchTerm.toLowerCase()) ||
                         classification.classification_display.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDays = (days: number) => {
    if (days < 30) return `${days} días`;
    if (days < 365) return `${Math.floor(days / 30)} meses`;
    return `${Math.floor(days / 365)} años`;
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-6 w-6" />
              Gestión de Clasificación de Pacientes
            </CardTitle>
            <CardDescription>
              Administra y actualiza las clasificaciones automáticas de pacientes basadas en su nivel de integración
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => updateClassifications()}
              disabled={updating === 'bulk'}
              variant="outline"
              size="sm"
            >
              {updating === 'bulk' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Actualizando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recalcular Todo
                </>
              )}
            </Button>
            
            <Button onClick={loadClassifications} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre de paciente o clasificación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-gray-500" />
            <select
              value={filterClassification}
              onChange={(e) => setFilterClassification(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {classificationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.emoji ? `${option.emoji} ${option.label}` : option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{classifications.length}</div>
            <div className="text-sm text-gray-600">Total Pacientes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {classifications.filter(c => ['P_INTEGRADO', 'ARRAIGADO', 'P_DE_ALTA'].includes(c.classification)).length}
            </div>
            <div className="text-sm text-gray-600">Bien Integrados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {classifications.filter(c => ['P_EN_ACOMPAÑAMIENTO', 'INTEGRACION_INICIAL'].includes(c.classification)).length}
            </div>
            <div className="text-sm text-gray-600">En Proceso</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {classifications.filter(c => c.classification === 'P_INCONSTANTE').length}
            </div>
            <div className="text-sm text-gray-600">Necesitan Atención</div>
          </div>
        </div>

        {/* Classifications List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredClassifications.length === 0 ? (
          <div className="text-center py-12">
            <UserCircleIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron clasificaciones</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterClassification !== 'all' 
                ? 'Intenta ajustar tus filtros o términos de búsqueda'
                : 'No hay clasificaciones de pacientes registradas'}
            </p>
            {classifications.length === 0 && (
              <Button onClick={() => updateClassifications()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Generar Clasificaciones
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClassifications.map((classification) => {
              const patient = patients[classification.patient_id];
              const classOption = getClassificationOption(classification.classification);
              
              return (
                <div key={classification.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">{classOption.emoji}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {patient ? 
                            `${patient.first_name} ${patient.paternal_last_name} ${patient.maternal_last_name}` :
                            `Paciente ${classification.patient_id.slice(0, 8)}...`
                          }
                        </h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={cn("text-xs", classOption.color)}>
                            {classOption.label}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Actualizado: {formatDate(classification.updated_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => updateClassifications([classification.patient_id])}
                      disabled={updating === classification.patient_id}
                      variant="ghost"
                      size="sm"
                    >
                      {updating === classification.patient_id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Asistencia:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={cn("h-2 rounded-full transition-all", getProgressColor(classification.attendance_rate))}
                            style={{ width: `${Math.min(classification.attendance_rate, 100)}%` }}
                          ></div>
                        </div>
                        <span className="font-medium">{classification.attendance_rate.toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Adherencia:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={cn("h-2 rounded-full transition-all", getProgressColor(classification.treatment_adherence))}
                            style={{ width: `${Math.min(classification.treatment_adherence, 100)}%` }}
                          ></div>
                        </div>
                        <span className="font-medium">{classification.treatment_adherence.toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Profesionales:</span>
                      <div className="font-medium text-blue-600 mt-1">
                        {classification.professionals_seen} profesionales
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Tiempo en tratamiento:</span>
                      <div className="font-medium text-green-600 mt-1 flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {formatDays(classification.time_in_treatment)}
                      </div>
                    </div>
                  </div>
                  
                  {classification.additional_programs > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-600">Programas adicionales: </span>
                      <Badge variant="outline" className="text-xs">
                        {classification.additional_programs} programas
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}