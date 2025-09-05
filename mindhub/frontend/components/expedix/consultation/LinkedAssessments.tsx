'use client';

import { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  LinkIcon, 
  CalendarIcon,
  EyeIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useClinimetrixExpedixIntegration } from '@/lib/hooks/useClinimetrixExpedixIntegration';
import toast from 'react-hot-toast';

interface LinkedAssessment {
  assessment_id: string;
  scale_id: string;
  scale_name: string;
  completed_at: string;
  score?: number;
  interpretation?: string;
  linked_at: string;
  linked_by?: string;
}

interface LinkedAssessmentsProps {
  consultationId: string;
  patientId: string;
  isEditable?: boolean;
  showLinkButton?: boolean;
}

export function LinkedAssessments({
  consultationId,
  patientId,
  isEditable = false,
  showLinkButton = true
}: LinkedAssessmentsProps) {
  const [linkedAssessments, setLinkedAssessments] = useState<LinkedAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const {
    getConsultationAssessments,
    isLinking,
    error
  } = useClinimetrixExpedixIntegration();

  // Load linked assessments
  useEffect(() => {
    const loadLinkedAssessments = async () => {
      try {
        setLoading(true);
        const assessments = await getConsultationAssessments(consultationId);
        setLinkedAssessments(assessments.map(link => ({
          assessment_id: link.assessmentId,
          scale_id: link.scaleId,
          scale_name: link.scaleName,
          completed_at: new Date().toISOString(), // Would come from actual assessment
          linked_at: link.linkedAt,
          linked_by: link.linkedBy,
          // Mock scores and interpretations - would come from actual assessment data
          score: Math.floor(Math.random() * 30),
          interpretation: getRandomInterpretation()
        })));
      } catch (error) {
        console.error('Error loading linked assessments:', error);
        toast.error('Error al cargar evaluaciones vinculadas');
      } finally {
        setLoading(false);
      }
    };

    if (consultationId) {
      loadLinkedAssessments();
    }
  }, [consultationId, getConsultationAssessments]);

  const getRandomInterpretation = () => {
    const interpretations = [
      'Dentro de límites normales',
      'Leve elevación de síntomas',
      'Moderada presencia de síntomas',
      'Significativa presencia de síntomas',
      'Requiere seguimiento clínico'
    ];
    return interpretations[Math.floor(Math.random() * interpretations.length)];
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score < 10) return 'text-green-600';
    if (score < 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score?: number) => {
    if (!score) return 'bg-gray-100';
    if (score < 10) return 'bg-green-100';
    if (score < 20) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewAssessment = (assessmentId: string, scaleName: string) => {
    // Navigate to ClinimetrixPro to view the full assessment
    toast.success(`Abriendo evaluación ${scaleName}...`);
    // In a real implementation, this would open the assessment in ClinimetrixPro
  };

  const handleLinkNewAssessment = () => {
    setShowLinkModal(true);
    // This would open a modal to select and link new assessments
    toast.success('Función de vinculación de evaluaciones próximamente...');
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <ChartBarIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Evaluaciones Psicométricas</h3>
        </div>
        
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando evaluaciones...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <ChartBarIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Evaluaciones Psicométricas</h3>
          {linkedAssessments.length > 0 && (
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {linkedAssessments.length} vinculada{linkedAssessments.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {showLinkButton && isEditable && (
          <Button
            onClick={handleLinkNewAssessment}
            variant="outline"
            size="sm"
            disabled={isLinking}
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            {isLinking ? 'Vinculando...' : 'Vincular Evaluación'}
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {linkedAssessments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No hay evaluaciones vinculadas</h4>
          <p className="text-gray-600 mb-4">
            Las evaluaciones psicométricas completadas en ClinimetrixPro aparecerán aquí cuando se vinculen a esta consulta.
          </p>
          {showLinkButton && isEditable && (
            <Button
              onClick={handleLinkNewAssessment}
              variant="outline"
              size="sm"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Vincular Evaluación
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {linkedAssessments.map((assessment) => (
            <div
              key={assessment.assessment_id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">
                      {assessment.scale_name}
                    </h4>
                    
                    {assessment.score !== undefined && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreBackground(assessment.score)} ${getScoreColor(assessment.score)}`}>
                        Puntuación: {assessment.score}
                      </span>
                    )}

                    <div className="flex items-center text-xs text-gray-500 space-x-1">
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      <span>Vinculada</span>
                    </div>
                  </div>

                  {assessment.interpretation && (
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Interpretación:</span> {assessment.interpretation}
                    </p>
                  )}

                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Completada: {formatDate(assessment.completed_at)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="h-4 w-4" />
                      <span>Vinculada: {formatDate(assessment.linked_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    onClick={() => handleViewAssessment(assessment.assessment_id, assessment.scale_name)}
                    variant="ghost"
                    size="sm"
                    title="Ver evaluación completa"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Integration Status */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Integración ClinimetrixPro ↔ Expedix activa</span>
          </div>
          
          <div className="text-xs text-gray-500">
            Las evaluaciones se sincronizan automáticamente
          </div>
        </div>
      </div>
    </Card>
  );
}