'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { UniversalCardBasedAssessment } from '@/components/clinimetrix/UniversalCardBasedAssessment';
import { DocumentChartBarIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

export default function ClinimetrixPage() {
  const [showAssessment, setShowAssessment] = useState(false);

  const handleStartAssessment = () => {
    setShowAssessment(true);
  };

  const handleBackToHome = () => {
    setShowAssessment(false);
  };

  const handleCompleteAssessment = (results: any) => {
    console.log('Assessment completed:', results);
    setShowAssessment(false);
  };

  if (showAssessment) {
    return (
      <UniversalCardBasedAssessment
        onBack={handleBackToHome}
        onComplete={handleCompleteAssessment}
        fullscreen={true}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinimetrix - Evaluaciones Clínicas"
        description="Escalas psicológicas y evaluaciones clínicas estandarizadas"
        icon={DocumentChartBarIcon}
        iconColor="text-purple-600"
        actions={[
          <Button
            key="start-assessment"
            onClick={handleStartAssessment}
            variant="purple"
            size="sm"
          >
            <BeakerIcon className="h-3 w-3 mr-1" />
            Nueva Evaluación
          </Button>
        ]}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-4 hover-lift transition-all duration-300 relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-purple">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-dark-green">Escalas Disponibles</h3>
            <BeakerIcon className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-gray-600 text-xs mb-3">
            PHQ-9, GAD-7, GDS-30, BDI-21, MADRS, HAM-A, STAI, RADS-2, y más escalas clínicas estandarizadas.
          </p>
          <Button 
            onClick={handleStartAssessment}
            variant="outline" 
            size="sm"
            className="w-full border-purple-200 text-purple-600 hover:bg-purple-50"
          >
            Ver Escalas
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-4 hover-lift transition-all duration-300 relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-purple">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-dark-green">Evaluaciones Activas</h3>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1.5"></div>
              <span className="text-xs text-gray-500">En línea</span>
            </div>
          </div>
          <p className="text-gray-600 text-xs mb-3">
            Administra evaluaciones en curso y revisa el progreso de los pacientes en tiempo real.
          </p>
          <Button 
            variant="outline" 
            size="sm"
            className="w-full border-emerald-200 text-emerald-600 hover:bg-emerald-50"
          >
            Ver Evaluaciones
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-4 hover-lift transition-all duration-300 relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-purple">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-dark-green">Reportes y Resultados</h3>
            <DocumentChartBarIcon className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-gray-600 text-xs mb-3">
            Genera reportes automáticos con interpretaciones clínicas y recomendaciones basadas en evidencia.
          </p>
          <Button 
            variant="outline" 
            size="sm"
            className="w-full border-primary-200 text-primary-600 hover:bg-primary-50"
          >
            Ver Reportes
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-4 hover-lift relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-purple">
        <h3 className="text-sm font-semibold text-dark-green mb-3">Resumen de Actividad</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">12</div>
            <div className="text-xs text-gray-500">Escalas Disponibles</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-600">0</div>
            <div className="text-xs text-gray-500">Evaluaciones Hoy</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-primary-600">0</div>
            <div className="text-xs text-gray-500">Reportes Generados</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-secondary-600">0</div>
            <div className="text-xs text-gray-500">Pacientes Evaluados</div>
          </div>
        </div>
      </div>
    </div>
  );
}