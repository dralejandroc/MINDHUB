/**
 * COMPONENTE - Panel de Integración ClinimetrixPro en Consultas Expedix
 * Conecta evaluaciones psicométricas directamente con el flujo de consulta médica
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  BeakerIcon, 
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { clinimetrixProClient } from '@/lib/api/clinimetrix-pro-client';
import type { ClinimetrixRegistry } from '@/lib/api/clinimetrix-pro-client';
import { ClinimetrixProAssessmentModal } from '@/components/ClinimetrixPro/ClinimetrixProAssessmentModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ClinimetrixIntegrationPanelProps {
  patient: {
    id: string;
    first_name: string;
    last_name?: string;
    paternal_last_name?: string;
    maternal_last_name?: string;
    date_of_birth?: string;
    age?: number;
  };
  consultationId?: string;
  onAssessmentCompleted?: (results: any) => void;
  mode?: 'compact' | 'full'; // compact para sidebar, full para modal
}

interface RecommendedScale {
  scale: ClinimetrixRegistry;
  reason: string;
  urgency: 'low' | 'medium' | 'high';
  estimatedTime: string;
}

export default function ClinimetrixIntegrationPanel({
  patient,
  consultationId,
  onAssessmentCompleted,
  mode = 'compact'
}: ClinimetrixIntegrationPanelProps) {
  const [scales, setScales] = useState<ClinimetrixRegistry[]>([]);
  const [recommendedScales, setRecommendedScales] = useState<RecommendedScale[]>([]);
  const [recentAssessments, setRecentAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScale, setSelectedScale] = useState<string | null>(null);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Cargar datos al montar el componente
  useEffect(() => {
    loadClinimetrixData();
  }, [patient.id]);

  const loadClinimetrixData = async () => {
    try {
      setLoading(true);

      // Cargar catálogo de escalas disponibles
      const scalesResponse = await clinimetrixProClient.getTemplateCatalog();
      setScales(scalesResponse || []);

      // Cargar evaluaciones recientes del paciente
      try {
        const assessments = await clinimetrixProClient.getPatientAssessments(patient.id);
        setRecentAssessments(assessments.slice(0, 5)); // Últimas 5
      } catch (assessmentError) {
        console.warn('No recent assessments found:', assessmentError);
        setRecentAssessments([]);
      }

      // Generar recomendaciones basadas en perfil del paciente
      const recommendations = generateRecommendations(scalesResponse, patient);
      setRecommendedScales(recommendations);

    } catch (error) {
      console.error('Error loading ClinimetrixPro data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = (
    availableScales: ClinimetrixRegistry[],
    patientData: any
  ): RecommendedScale[] => {
    const recommendations: RecommendedScale[] = [];

    // Recomendaciones basadas en edad
    const age = patientData.age || (
      patientData.date_of_birth ? 
      new Date().getFullYear() - new Date(patientData.date_of_birth).getFullYear() : 
      null
    );

    if (age) {
      // Escalas comunes para adultos
      if (age >= 18) {
        const phq9 = availableScales.find(s => s.abbreviation === 'PHQ-9');
        const gadi = availableScales.find(s => s.abbreviation === 'GADI');
        const moca = availableScales.find(s => s.abbreviation === 'MOCA');

        if (phq9) {
          recommendations.push({
            scale: phq9,
            reason: 'Screening estándar para depresión en consulta primaria',
            urgency: 'medium',
            estimatedTime: '2-3 min'
          });
        }

        if (gadi) {
          recommendations.push({
            scale: gadi,
            reason: 'Evaluación integral de ansiedad generalizada',
            urgency: 'medium',
            estimatedTime: '5-7 min'
          });
        }

        if (moca && age >= 65) {
          recommendations.push({
            scale: moca,
            reason: 'Screening cognitivo recomendado para adultos mayores',
            urgency: 'high',
            estimatedTime: '10-15 min'
          });
        }
      }

      // Escalas para adolescentes
      if (age >= 12 && age < 18) {
        const aq = availableScales.find(s => s.abbreviation?.includes('AQ'));
        if (aq) {
          recommendations.push({
            scale: aq,
            reason: 'Evaluación de espectro autista en adolescentes',
            urgency: 'low',
            estimatedTime: '10-15 min'
          });
        }
      }
    }

    return recommendations.slice(0, 3); // Top 3 recomendaciones
  };

  const handleStartAssessment = (scaleId: string, scaleName: string, scaleAbbreviation: string) => {
    setSelectedScale(scaleId);
    setShowAssessmentModal(true);
  };

  const handleAssessmentComplete = async (results: any) => {
    console.log('✅ Assessment completed:', results);
    
    // Recargar evaluaciones recientes
    await loadClinimetrixData();
    
    // Notificar al componente padre
    if (onAssessmentCompleted) {
      onAssessmentCompleted({
        ...results,
        consultationId,
        patientId: patient.id,
        timestamp: new Date().toISOString()
      });
    }
    
    setShowAssessmentModal(false);
    setSelectedScale(null);
  };

  const filteredScales = scales.filter(scale =>
    scale.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scale.abbreviation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scale.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Cargando evaluaciones...</span>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ChartBarIcon className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Evaluaciones ClinimetrixPro</h3>
          </div>
          <span className="text-sm text-gray-500">
            {filteredScales.length} escalas disponibles
          </span>
        </div>

        {/* Búsqueda rápida */}
        {mode === 'full' && (
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar escalas por nombre o tipo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        )}

        {/* Evaluaciones Recientes */}
        {recentAssessments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <DocumentTextIcon className="w-4 h-4 mr-1" />
              Evaluaciones Recientes
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {recentAssessments.map((assessment, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {assessment.template?.templateData?.metadata?.name || 'Evaluación'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(assessment.completedAt || assessment.createdAt).toLocaleDateString('es-ES')}
                      {assessment.totalScore && (
                        <span className="ml-2">• Puntaje: {assessment.totalScore}</span>
                      )}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      // TODO: Implementar vista de resultados
                      console.log('View assessment:', assessment.id);
                    }}
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recomendaciones */}
        {recommendedScales.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <BeakerIcon className="w-4 h-4 mr-1" />
              Recomendadas para esta Consulta
            </h4>
            <div className="space-y-2">
              {recommendedScales.map((recommendation, index) => (
                <div
                  key={recommendation.scale.id}
                  className="p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          {recommendation.scale.name}
                        </p>
                        <span className="text-xs font-mono text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                          {recommendation.scale.abbreviation}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          recommendation.urgency === 'high' ? 'bg-red-100 text-red-700' :
                          recommendation.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {recommendation.urgency === 'high' ? 'Importante' :
                           recommendation.urgency === 'medium' ? 'Recomendada' : 'Opcional'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{recommendation.reason}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {recommendation.estimatedTime}
                        </span>
                        <span>{recommendation.scale.totalItems} elementos</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleStartAssessment(
                        recommendation.scale.id,
                        recommendation.scale.name,
                        recommendation.scale.abbreviation
                      )}
                      className="ml-2"
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Búsqueda de escalas (modo compacto) */}
        {mode === 'compact' && filteredScales.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Escalas Disponibles</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {filteredScales.slice(0, 10).map((scale) => (
                <button
                  key={scale.id}
                  onClick={() => handleStartAssessment(scale.id, scale.name, scale.abbreviation)}
                  className="w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{scale.abbreviation}</span>
                      <span className="text-xs text-gray-600 truncate">{scale.name}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {scale.category} • {scale.totalItems || 0} elementos
                    </p>
                  </div>
                  <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lista completa de escalas (modo full) */}
        {mode === 'full' && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">
              Catálogo Completo ({filteredScales.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
              {filteredScales.map((scale) => (
                <Card key={scale.id} className="p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-gray-900">{scale.abbreviation}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {scale.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{scale.name}</p>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {scale.description}
                      </p>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span>{scale.totalItems || 0} elementos</span>
                        <span>{scale.estimatedDurationMinutes || 5} min</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      onClick={() => handleStartAssessment(scale.id, scale.name, scale.abbreviation)}
                      className="w-full"
                    >
                      Iniciar Evaluación
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Estado vacío */}
        {!loading && scales.length === 0 && (
          <div className="text-center py-8">
            <ChartBarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No hay escalas disponibles</p>
          </div>
        )}
      </Card>

      {/* Modal de Evaluación */}
      {showAssessmentModal && selectedScale && (
        <ClinimetrixProAssessmentModal
          templateId={selectedScale}
          scaleName={scales.find(s => s.id === selectedScale)?.name}
          scaleAbbreviation={scales.find(s => s.id === selectedScale)?.abbreviation}
          preSelectedPatient={{
            id: patient.id,
            name: `${patient.first_name} ${patient.last_name || patient.paternal_last_name || ''}`.trim(),
            age: patient.age
          }}
          onComplete={handleAssessmentComplete}
          onExit={() => {
            setShowAssessmentModal(false);
            setSelectedScale(null);
          }}
          fullscreen={true}
        />
      )}
    </>
  );
}