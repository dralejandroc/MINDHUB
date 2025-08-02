'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CalendarIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import ScaleHistoryChart from '../charts/ScaleHistoryChart';

interface Assessment {
  id: string;
  date: string;
  totalScore: number;
  severity: string;
  interpretation: string;
  subscaleScores: Array<{
    name: string;
    score: number;
    severity: string;
  }>;
}

interface ScaleSummary {
  scale: {
    id: string;
    name: string;
    abbreviation: string;
    category: string;
  };
  assessments: Assessment[];
  latestScore: {
    score: number;
    severity: string;
    date: string;
  };
  totalAssessments: number;
}

interface PatientAssessmentsProps {
  patientId: string;
  patientName: string;
  onNewAssessment: () => void;
}

export default function PatientAssessments({ 
  patientId, 
  patientName, 
  onNewAssessment 
}: PatientAssessmentsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessmentSummary, setAssessmentSummary] = useState<{
    totalAssessments: number;
    uniqueScales: number;
    scalesSummary: ScaleSummary[];
    recentActivity: Array<{
      id: string;
      scaleName: string;
      date: string;
      totalScore: number;
      severity: string;
    }>;
  } | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedScaleHistory, setSelectedScaleHistory] = useState<{
    scaleId: string;
    scaleName: string;
    history: Array<{
      id: string;
      date: string;
      totalScore: number;
      severity: string;
      interpretation: string;
      subscaleScores: Array<{
        name: string;
        score: number;
        severity: string;
      }>;
    }>;
  } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadAssessments();
  }, [patientId]);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the patient assessments endpoint
      const response = await fetch(`http://localhost:8080/api/v1/clinimetrix/patient-assessments/${patientId}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Patient assessments raw data:', data);
      
      if (data.success && data.data) {
        // Transform the data to match our component's expectations
        const assessments = data.data;
        
        // Group assessments by scale
        const scaleGroups = assessments.reduce((groups: any, assessment: any) => {
          const scaleId = assessment.scaleId;
          if (!groups[scaleId]) {
            groups[scaleId] = {
              scale: {
                id: scaleId,
                name: assessment.scale?.name || 'Escala Desconocida',
                abbreviation: assessment.scale?.abbreviation || 'N/A',
                category: assessment.scale?.category || 'general'
              },
              assessments: [],
              totalAssessments: 0
            };
          }
          groups[scaleId].assessments.push({
            id: assessment.id,
            date: assessment.administrationDate || assessment.createdAt,
            totalScore: assessment.totalScore || 0,
            severity: assessment.severity || 'N/A',
            interpretation: assessment.interpretation || 'Sin interpretación',
            subscaleScores: (assessment.subscaleScores || []).map((sub: any) => ({
              name: sub.subscaleName || sub.name || 'Subescala',
              score: sub.score || 0,
              severity: sub.severity || 'N/A'
            }))
          });
          groups[scaleId].totalAssessments++;
          return groups;
        }, {});
        
        // Convert to array and calculate latest scores
        const scalesSummary = Object.values(scaleGroups).map((group: any) => {
          const sortedAssessments = group.assessments.sort((a: any, b: any) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          const latest = sortedAssessments[0];
          
          return {
            ...group,
            assessments: sortedAssessments,
            latestScore: latest ? {
              score: latest.totalScore,
              severity: latest.severity,
              date: latest.date
            } : null
          };
        });
        
        // Create recent activity
        const recentActivity = assessments
          .sort((a: any, b: any) => new Date(b.administrationDate || b.createdAt).getTime() - new Date(a.administrationDate || a.createdAt).getTime())
          .slice(0, 5)
          .map((assessment: any) => ({
            id: assessment.id,
            scaleName: assessment.scale?.name || 'Escala Desconocida',
            date: assessment.administrationDate || assessment.createdAt,
            totalScore: assessment.totalScore || 0,
            severity: assessment.severity || 'N/A'
          }));
        
        setAssessmentSummary({
          totalAssessments: assessments.length,
          uniqueScales: scalesSummary.length,
          scalesSummary,
          recentActivity
        });
      } else {
        throw new Error(data.error || 'Error al cargar evaluaciones');
      }
      
    } catch (err) {
      console.error('Error loading assessments:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setAssessmentSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'minimal':
      case 'normal':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'leve':
      case 'mild':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'moderado':
      case 'moderate':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'severo':
      case 'severe':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'ansiedad':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'depresion':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'personalidad':
        return 'text-purple-700 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const loadScaleHistory = async (scaleId: string, scaleName: string) => {
    try {
      setLoadingHistory(true);
      
      // Use the patient assessments endpoint and filter by scale ID  
      const response = await fetch(`http://localhost:8080/api/v1/clinimetrix/patient-assessments/${patientId}?scaleId=${scaleId}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Scale history raw data:', data);
      
      if (data.success && data.data) {
        const assessments = data.data;
        
        // Transform assessments to history format
        const history = assessments
          .sort((a: any, b: any) => new Date(b.administrationDate || b.createdAt).getTime() - new Date(a.administrationDate || a.createdAt).getTime())
          .map((assessment: any) => ({
            id: assessment.id,
            date: assessment.administrationDate || assessment.createdAt,
            totalScore: assessment.totalScore || 0,
            severity: assessment.severity || 'N/A',
            interpretation: assessment.interpretation || 'Sin interpretación disponible',
            subscaleScores: (assessment.subscaleScores || []).map((sub: any) => ({
              name: sub.subscaleName || sub.name || 'Subescala',
              score: sub.score || 0,
              severity: sub.severity || 'N/A'
            }))
          }));
        
        setSelectedScaleHistory({
          scaleId,
          scaleName,
          history
        });
        setShowHistoryModal(true);
      } else {
        throw new Error(data.error || 'Error al cargar historial');
      }
      
    } catch (err) {
      console.error('Error loading scale history:', err);
      alert('Error al cargar el historial: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setLoadingHistory(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border shadow">
        <h3 className="text-lg font-bold mb-4 text-gray-900">Evaluaciones Clínicas</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Cargando evaluaciones...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 border shadow">
        <h3 className="text-lg font-bold mb-4 text-gray-900">Evaluaciones Clínicas</h3>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={loadAssessments}
                className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!assessmentSummary || assessmentSummary.totalAssessments === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border shadow">
        <h3 className="text-lg font-bold mb-4 text-gray-900">Evaluaciones Clínicas</h3>
        <div className="text-center py-8">
          <DocumentChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 mb-2">No hay evaluaciones registradas</p>
          <p className="text-gray-400 text-sm mb-4">
            Las evaluaciones clínicas aparecerán aquí una vez que se completen.
          </p>
          <Button
            onClick={onNewAssessment}
            variant="purple"
            className="inline-flex items-center"
          >
            <BeakerIcon className="h-4 w-4 mr-2" />
            Nueva Evaluación
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border shadow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Evaluaciones Clínicas</h3>
        <Button
          onClick={onNewAssessment}
          variant="purple"
          size="sm"
          className="inline-flex items-center"
        >
          <BeakerIcon className="h-4 w-4 mr-2" />
          Nueva Evaluación
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {assessmentSummary.totalAssessments}
          </div>
          <div className="text-sm text-purple-700">Evaluaciones</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {assessmentSummary.uniqueScales}
          </div>
          <div className="text-sm text-blue-700">Escalas Diferentes</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {assessmentSummary.recentActivity.length}
          </div>
          <div className="text-sm text-green-700">Recientes</div>
        </div>
      </div>

      {/* Scales Summary */}
      <div className="space-y-4 mb-6">
        <h4 className="font-semibold text-gray-900">Resumen por Escala</h4>
        {assessmentSummary.scalesSummary.map((scaleSummary) => (
          <div key={scaleSummary.scale.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <ChartBarIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">
                    {scaleSummary.scale.name}
                  </h5>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-gray-500">
                      {scaleSummary.scale.abbreviation}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${getCategoryColor(scaleSummary.scale.category)}`}>
                      {scaleSummary.scale.category}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {scaleSummary.totalAssessments} aplicaciones
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(scaleSummary.latestScore.date)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Último puntaje:</span>
                <span className="font-semibold text-gray-900">
                  {scaleSummary.latestScore.score}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full border ${getSeverityColor(scaleSummary.latestScore.severity)}`}>
                  {scaleSummary.latestScore.severity}
                </span>
              </div>
              <Button
                onClick={() => loadScaleHistory(scaleSummary.scale.id, scaleSummary.scale.name)}
                variant="ghost"
                size="sm"
                className="text-xs"
                disabled={loadingHistory}
              >
                {loadingHistory ? 'Cargando...' : 'Ver historial →'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Actividad Reciente</h4>
        <div className="space-y-2">
          {assessmentSummary.recentActivity.slice(0, 5).map((activity) => (
            <div key={activity.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CalendarIcon className="h-4 w-4 text-gray-400" />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {activity.scaleName}
                  </span>
                  <div className="text-xs text-gray-500">
                    {formatDate(activity.date)}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-900">
                  {activity.totalScore}
                </span>
                <span className={`px-2 py-0.5 text-xs rounded-full border ${getSeverityColor(activity.severity)}`}>
                  {activity.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && selectedScaleHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Historial de Evaluaciones
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedScaleHistory.scaleName} - {patientName}
                  </p>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {selectedScaleHistory.history.length === 0 ? (
                <div className="text-center py-8">
                  <DocumentChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No hay evaluaciones registradas para esta escala</p>
                </div>
              ) : selectedScaleHistory.history.length === 1 ? (
                <div className="space-y-4">
                  {/* Una sola evaluación - mostrar solo datos */}
                  <div className="bg-blue-50 rounded-lg p-6 text-center">
                    <h4 className="font-semibold text-blue-900 mb-4">Primera Evaluación</h4>
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {selectedScaleHistory.history[0]?.totalScore || 0} pts
                    </div>
                    <span className={`px-3 py-1 text-sm rounded-full border ${getSeverityColor(selectedScaleHistory.history[0]?.severity)}`}>
                      {selectedScaleHistory.history[0]?.severity}
                    </span>
                    <p className="text-sm text-blue-700 mt-4">
                      {formatDate(selectedScaleHistory.history[0]?.date)}
                    </p>
                    <p className="text-xs text-gray-600 mt-4">
                      Se requieren al menos 2 evaluaciones para mostrar la gráfica de evolución
                    </p>
                  </div>

                  {/* Detalles de la evaluación */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">Detalles de la Evaluación</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Fecha:</span>
                        <span className="font-medium">{formatDate(selectedScaleHistory.history[0]?.date)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Puntaje Total:</span>
                        <span className="font-medium">{selectedScaleHistory.history[0]?.totalScore} pts</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Severidad:</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full border ${getSeverityColor(selectedScaleHistory.history[0]?.severity)}`}>
                          {selectedScaleHistory.history[0]?.severity}
                        </span>
                      </div>
                      {selectedScaleHistory.history[0]?.interpretation && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-gray-600">Interpretación:</p>
                          <p className="text-sm mt-1">{selectedScaleHistory.history[0]?.interpretation}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Subscale Scores si existen */}
                    {selectedScaleHistory.history[0]?.subscaleScores && selectedScaleHistory.history[0].subscaleScores.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h6 className="text-sm font-medium text-gray-700 mb-2">Puntajes por Subescala:</h6>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedScaleHistory.history[0].subscaleScores.map((subscale, subIndex) => (
                            <div key={subIndex} className="flex items-center justify-between text-sm bg-gray-50 rounded px-2 py-1">
                              <span className="text-gray-600">{subscale.name}</span>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{subscale.score}</span>
                                <span className={`px-1 py-0.5 text-xs rounded ${getSeverityColor(subscale.severity)}`}>
                                  {subscale.severity}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Gráfica de evolución temporal */}
                  <ScaleHistoryChart 
                    history={selectedScaleHistory.history}
                    scaleName={selectedScaleHistory.scaleName}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}