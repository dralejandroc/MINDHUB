'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ClinimetrixPatientInterface } from '@/components/ClinimetrixPro/ClinimetrixPatientInterface';
import { Button } from '@/components/ui/Button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface AssessmentResults {
  templateId: string;
  responses: any[];
  totalScore?: number;
  subscaleScores?: { [key: string]: number };
  completionTime: number;
  startTime: Date;
  endTime: Date;
}

export default function AssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params?.templateId as string;
  const [showResults, setShowResults] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResults | null>(null);

  const handleComplete = (results: AssessmentResults) => {
    console.log('Assessment completed:', results);
    setAssessmentResults(results);
    setShowResults(true);
  };

  const handleExit = () => {
    router.push('/hubs/clinimetrix');
  };

  const handleViewResults = () => {
    // TODO: Navigate to results view or show results modal
    console.log('Viewing results:', assessmentResults);
    alert('Funcionalidad de resultados será implementada próximamente.\n\nLa evaluación se ha completado exitosamente.');
    router.push('/hubs/clinimetrix');
  };

  const handleReturnToCatalog = () => {
    router.push('/hubs/clinimetrix');
  };

  if (showResults && assessmentResults) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Results View */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-green-600 mb-6">
            <svg className="w-20 h-20 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ¡Evaluación Completada!
          </h1>
          
          <p className="text-gray-600 mb-6 text-lg">
            La escala clínica se ha aplicado exitosamente.
          </p>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-teal-600">
                  {assessmentResults.responses.length}
                </div>
                <div className="text-sm text-gray-600">Respuestas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.floor(assessmentResults.completionTime / 60000)}min
                </div>
                <div className="text-sm text-gray-600">Duración</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {assessmentResults.totalScore || '--'}
                </div>
                <div className="text-sm text-gray-600">Puntuación</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleViewResults}
                size="lg"
                className="px-8"
              >
                Ver Resultados Detallados
              </Button>
              
              <Button
                onClick={handleReturnToCatalog}
                variant="outline"
                size="lg"
                className="px-8"
              >
                Volver al Catálogo
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 mt-4">
              Los resultados han sido guardados automáticamente en el sistema
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ClinimetrixPatientInterface
      templateId={templateId}
      onComplete={handleComplete}
      onExit={handleExit}
      autoAdvanceDelay={1500}
    />
  );
}