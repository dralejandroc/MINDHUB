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
      consultationId?: string;
      completionTime?: number;
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
      
      // Use the new Expedix patient assessments endpoint
      const { expedixAssessmentsClient } = await import('@/lib/api/expedix-assessments-client');
      const response = await expedixAssessmentsClient.getPatientAssessments(patientId);
      
      console.log('Patient assessments from Expedix:', response);
      
      if (response.success && response.data) {
        // Transform the data to match our component's expectations
        const assessments = response.data;
        
        // Group assessments by templateId (ClinimetrixPro uses templateId)
        const scaleGroups = assessments.reduce((groups: any, assessment: any) => {
          const scaleId = assessment.templateId;
          if (!groups[scaleId]) {
            groups[scaleId] = {
              scale: {
                id: scaleId,
                name: assessment.scaleName || 'Escala Desconocida',
                abbreviation: assessment.scaleAbbreviation || 'N/A',
                category: assessment.category || 'general'
              },
              assessments: [],
              totalAssessments: 0
            };
          }
          groups[scaleId].assessments.push({
            id: assessment.id,
            date: assessment.completedAt,
            totalScore: assessment.totalScore || 0,
            severity: assessment.severityLevel || 'N/A',
            interpretation: assessment.interpretation || 'Sin interpretación',
            subscaleScores: [] // ClinimetrixPro stores subscales differently
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
          .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
          .slice(0, 5)
          .map((assessment: any) => ({
            id: assessment.id,
            scaleName: assessment.scaleName || 'Escala Desconocida',
            date: assessment.completedAt,
            totalScore: assessment.totalScore || 0,
            severity: assessment.severityLevel || 'N/A',
            consultationId: assessment.consultationId || null,
            completionTime: assessment.completionTime || null
          }));
        
        setAssessmentSummary({
          totalAssessments: assessments.length,
          uniqueScales: scalesSummary.length,
          scalesSummary,
          recentActivity
        });
      } else {
        throw new Error('No se pudieron cargar las evaluaciones');
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
      
      // Use the new Expedix patient assessments endpoint with templateId filter
      const { expedixAssessmentsClient } = await import('@/lib/api/expedix-assessments-client');
      const response = await expedixAssessmentsClient.getPatientAssessments(patientId, { templateId: scaleId });
      
      console.log('Scale history from Expedix:', response);
      
      if (response.success && response.data) {
        const assessments = response.data;
        
        // Transform assessments to history format
        const history = assessments
          .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
          .map((assessment: any) => ({
            id: assessment.id,
            date: assessment.completedAt,
            totalScore: assessment.totalScore || 0,
            severity: assessment.severityLevel || 'N/A',
            interpretation: assessment.interpretation || 'Sin interpretación disponible',
            subscaleScores: [] // ClinimetrixPro subscales handled differently
          }));
        
        setSelectedScaleHistory({
          scaleId,
          scaleName,
          history
        });
        setShowHistoryModal(true);
      } else {
        throw new Error('No se pudo cargar el historial de la escala');
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

      {/* Scales Summary - Mejorado y más estructurado */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900">Resumen Estructurado por Escala</h4>
          <span className="text-xs text-gray-500">
            {assessmentSummary.scalesSummary.length} escala{assessmentSummary.scalesSummary.length !== 1 ? 's' : ''} aplicada{assessmentSummary.scalesSummary.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="grid gap-4">
          {assessmentSummary.scalesSummary.map((scaleSummary) => (
            <div key={scaleSummary.scale.id} className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
              {/* Header con información principal */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                    <ChartBarIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-900 text-lg">
                      {scaleSummary.scale.name}
                    </h5>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-sm font-mono text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                        {scaleSummary.scale.abbreviation}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getCategoryColor(scaleSummary.scale.category)}`}>
                        {scaleSummary.scale.category}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Estadísticas rápidas */}
                <div className="text-right">
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="text-sm text-gray-500">Aplicaciones</div>
                      <div className="text-xl font-bold text-gray-900">{scaleSummary.totalAssessments}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Última aplicación</div>
                      <div className="text-sm font-medium text-gray-700">
                        {formatDate(scaleSummary.latestScore.date)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información del último puntaje */}
              <div className="bg-white rounded-lg p-4 mb-3 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Puntaje actual:</span>
                      <span className="text-2xl font-bold text-gray-900">
                        {scaleSummary.latestScore.score}
                      </span>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full border-2 ${getSeverityColor(scaleSummary.latestScore.severity)}`}>
                        {scaleSummary.latestScore.severity}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Indicador de tendencia si hay más de una evaluación */}
                    {scaleSummary.assessments.length > 1 && (
                      <div className="flex items-center space-x-1 text-xs">
                        {(() => {
                          const latest = scaleSummary.assessments[0]?.totalScore || 0;
                          const previous = scaleSummary.assessments[1]?.totalScore || 0;
                          const change = latest - previous;
                          
                          if (change < 0) {
                            return (
                              <span className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />
                                Mejoría ({Math.abs(change)})
                              </span>
                            );
                          } else if (change > 0) {
                            return (
                              <span className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                                Aumento (+{change})
                              </span>
                            );
                          } else {
                            return (
                              <span className="text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                                Sin cambios
                              </span>
                            );
                          }
                        })()}
                      </div>
                    )}
                    
                    <Button
                      onClick={() => loadScaleHistory(scaleSummary.scale.id, scaleSummary.scale.name)}
                      variant="outline"
                      size="sm"
                      className="text-purple-600 border-purple-200 hover:bg-purple-50"
                      disabled={loadingHistory}
                    >
                      {loadingHistory ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                          <span>Cargando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <ChartBarIcon className="h-4 w-4" />
                          <span>Ver Evolución</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Mini timeline de evaluaciones recientes */}
              {scaleSummary.assessments.length > 1 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-gray-700 mb-2">Historial reciente:</div>
                  <div className="flex items-center space-x-2 overflow-x-auto">
                    {scaleSummary.assessments.slice(0, 5).map((assessment, idx) => (
                      <div key={assessment.id} className="flex-shrink-0 text-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          idx === 0 ? 'bg-purple-600' : 'bg-gray-400'
                        }`}>
                          {assessment.totalScore}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 w-16 truncate">
                          {new Date(assessment.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </div>
                      </div>
                    ))}
                    {scaleSummary.assessments.length > 5 && (
                      <div className="flex-shrink-0 text-center text-gray-400">
                        <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-xs">
                          +{scaleSummary.assessments.length - 5}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity - Mejorado con información de consultas */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
          <span>Actividad Reciente</span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            Últimas {Math.min(assessmentSummary.recentActivity.length, 5)} evaluaciones
          </span>
        </h4>
        <div className="space-y-3">
          {assessmentSummary.recentActivity.slice(0, 5).map((activity) => (
            <div key={activity.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <DocumentChartBarIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {activity.scaleName}
                      </span>
                      {/* Indicador si está ligada a consulta */}
                      {activity.consultationId ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                          📋 Ligada a consulta
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          🔬 Evaluación independiente
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <CalendarIcon className="h-3 w-3" />
                        <span>{formatDate(activity.date)}</span>
                      </span>
                      {activity.completionTime && (
                        <span className="flex items-center space-x-1">
                          <ClockIcon className="h-3 w-3" />
                          <span>{Math.floor(activity.completionTime / 60000)} min</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Resultado */}
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg font-bold text-gray-900">
                      {activity.totalScore}
                    </span>
                    <span className="text-xs text-gray-500">pts</span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(activity.severity)}`}>
                    {activity.severity}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {assessmentSummary.recentActivity.length === 0 && (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <DocumentChartBarIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No hay actividad reciente</p>
            </div>
          )}
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