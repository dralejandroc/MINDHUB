/**
 * COMPONENTE - Antecedentes Médicos del Paciente
 * Vista estructurada de información recopilada desde FormX
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  HeartIcon,
  ShieldExclamationIcon,
  BeakerIcon,
  DocumentTextIcon,
  UserGroupIcon,
  LifebuoyIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase/client';

interface MedicalBackground {
  patient_id: string;
  allergies: string[];
  medications: string[];
  medical_history: string[];
  family_history: string[];
  symptoms: string[];
  surgeries: string[];
  immunizations: string[];
  social_history: {
    smoking: boolean;
    alcohol: boolean;
    drugs: boolean;
    exercise: string;
    diet: string;
  };
  vital_signs?: {
    height?: string;
    weight?: string;
    bloodPressure?: string;
  };
  source_form_id?: string;
  source_submission_id?: string;
  last_updated: string;
}

interface PatientMedicalBackgroundProps {
  patientId: string;
  onEdit?: (section: string) => void;
}

export default function PatientMedicalBackground({ patientId, onEdit }: PatientMedicalBackgroundProps) {
  const [background, setBackground] = useState<MedicalBackground | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['allergies', 'medications']));

  useEffect(() => {
    loadMedicalBackground();
  }, [patientId]);

  const loadMedicalBackground = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('patient_medical_background')
        .select('*')
        .eq('patient_id', patientId)
        .single();

      if (supabaseError && supabaseError.code !== 'PGRST116') { // Not found error
        throw supabaseError;
      }

      setBackground(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar antecedentes');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const backgroundSections = [
    {
      id: 'allergies',
      title: 'Alergias',
      icon: ShieldExclamationIcon,
      data: background?.allergies || [],
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      critical: true
    },
    {
      id: 'medications',
      title: 'Medicamentos Actuales',
      icon: BeakerIcon,
      data: background?.medications || [],
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      critical: true
    },
    {
      id: 'symptoms',
      title: 'Síntomas Reportados',
      icon: ExclamationTriangleIcon,
      data: background?.symptoms || [],
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      critical: false
    },
    {
      id: 'medical_history',
      title: 'Historial Médico',
      icon: DocumentTextIcon,
      data: background?.medical_history || [],
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      critical: false
    },
    {
      id: 'family_history',
      title: 'Antecedentes Familiares',
      icon: UserGroupIcon,
      data: background?.family_history || [],
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      critical: false
    },
    {
      id: 'surgeries',
      title: 'Cirugías Previas',
      icon: LifebuoyIcon,
      data: background?.surgeries || [],
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      critical: false
    },
    {
      id: 'immunizations',
      title: 'Vacunación',
      icon: CheckCircleIcon,
      data: background?.immunizations || [],
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      critical: false
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando antecedentes médicos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <ExclamationTriangleIcon className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadMedicalBackground} variant="outline">
          Reintentar
        </Button>
      </Card>
    );
  }

  if (!background) {
    return (
      <Card className="p-6 text-center">
        <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay antecedentes registrados</h3>
        <p className="text-gray-600 mb-4">
          Los antecedentes médicos aparecerán aquí cuando el paciente complete formularios de FormX
        </p>
        <Button onClick={onEdit ? () => onEdit('manual') : undefined} className="flex items-center gap-2 mx-auto">
          <PlusIcon className="w-4 h-4" />
          Agregar Manualmente
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con información de origen */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Antecedentes Médicos</h3>
            <p className="text-sm text-blue-700 mt-1">
              {background.source_form_id 
                ? `Información recopilada desde FormX • Actualizado: ${formatLastUpdated(background.last_updated)}`
                : `Última actualización: ${formatLastUpdated(background.last_updated)}`
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={loadMedicalBackground} size="sm" variant="outline" className="border-blue-300">
              <ArrowPathIcon className="w-4 h-4" />
            </Button>
            {onEdit && (
              <Button onClick={() => onEdit('background')} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <PencilIcon className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Información crítica destacada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {backgroundSections.filter(section => section.critical).map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSections.has(section.id);
          const hasData = section.data.length > 0;

          return (
            <Card 
              key={section.id} 
              className={`border-2 ${section.borderColor} ${hasData ? section.bgColor : 'bg-gray-50'}`}
            >
              <div 
                className="p-4 cursor-pointer"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${hasData ? section.color : 'text-gray-400'}`} />
                    <div>
                      <h4 className={`font-semibold ${hasData ? section.color : 'text-gray-500'}`}>
                        {section.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {hasData ? `${section.data.length} registrado(s)` : 'No registrado'}
                      </p>
                    </div>
                  </div>
                  {hasData && (
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${section.bgColor} ${section.color} border ${section.borderColor}`}>
                      ¡Importante!
                    </span>
                  )}
                </div>

                {isExpanded && hasData && (
                  <div className="mt-4 space-y-2">
                    {section.data.map((item, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-800">{item}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Hábitos sociales */}
      {background.social_history && (
        <Card className="p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <HeartIcon className="w-5 h-5 text-pink-600" />
            Hábitos Sociales
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className={`p-3 rounded-lg border ${
              background.social_history.smoking 
                ? 'bg-red-50 border-red-200 text-red-800' 
                : 'bg-green-50 border-green-200 text-green-800'
            }`}>
              <strong>Tabaquismo:</strong> {background.social_history.smoking ? 'Sí' : 'No'}
            </div>
            <div className={`p-3 rounded-lg border ${
              background.social_history.alcohol 
                ? 'bg-yellow-50 border-yellow-200 text-yellow-800' 
                : 'bg-green-50 border-green-200 text-green-800'
            }`}>
              <strong>Alcohol:</strong> {background.social_history.alcohol ? 'Sí' : 'No'}
            </div>
            <div className={`p-3 rounded-lg border ${
              background.social_history.drugs 
                ? 'bg-red-50 border-red-200 text-red-800' 
                : 'bg-green-50 border-green-200 text-green-800'
            }`}>
              <strong>Drogas:</strong> {background.social_history.drugs ? 'Sí' : 'No'}
            </div>
            {background.social_history.exercise && (
              <div className="p-3 rounded-lg border bg-blue-50 border-blue-200 text-blue-800">
                <strong>Ejercicio:</strong> {background.social_history.exercise}
              </div>
            )}
            {background.social_history.diet && (
              <div className="p-3 rounded-lg border bg-green-50 border-green-200 text-green-800">
                <strong>Dieta:</strong> {background.social_history.diet}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Signos vitales si están disponibles */}
      {background.vital_signs && Object.keys(background.vital_signs).length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Signos Vitales Reportados</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {background.vital_signs.height && (
              <div className="p-3 rounded-lg bg-gray-50 border">
                <strong>Altura:</strong> {background.vital_signs.height}
              </div>
            )}
            {background.vital_signs.weight && (
              <div className="p-3 rounded-lg bg-gray-50 border">
                <strong>Peso:</strong> {background.vital_signs.weight}
              </div>
            )}
            {background.vital_signs.bloodPressure && (
              <div className="p-3 rounded-lg bg-gray-50 border">
                <strong>Presión arterial:</strong> {background.vital_signs.bloodPressure}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Otras secciones no críticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {backgroundSections.filter(section => !section.critical).map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSections.has(section.id);
          const hasData = section.data.length > 0;

          if (!hasData) return null; // Solo mostrar secciones con datos

          return (
            <Card key={section.id} className="border">
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${section.color}`} />
                    <div>
                      <h4 className="font-medium text-gray-900">{section.title}</h4>
                      <p className="text-sm text-gray-600">{section.data.length} registrado(s)</p>
                    </div>
                  </div>
                  <span className="text-gray-400">
                    {isExpanded ? '−' : '+'}
                  </span>
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-2">
                    {section.data.map((item, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded border text-sm text-gray-700">
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Footer con información de origen */}
      {background.source_form_id && (
        <div className="text-center text-xs text-gray-500 py-4">
          <ClockIcon className="w-4 h-4 inline mr-1" />
          Información recopilada automáticamente desde FormX (ID: {background.source_form_id})
        </div>
      )}
    </div>
  );
}