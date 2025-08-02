'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ScaleAssessmentModal } from '@/components/clinimetrix/ScaleAssessmentModal';
import ScalesCatalog from '@/components/clinimetrix/ScalesCatalog';
import { DocumentChartBarIcon, BeakerIcon, RectangleStackIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { clinimetrixApi, Scale } from '@/lib/api/clinimetrix-client';

export default function ClinimetrixPage() {
  const [currentView, setCurrentView] = useState<'catalog' | 'assessment'>('catalog');
  const [selectedScale, setSelectedScale] = useState<Scale | null>(null);
  const [stats, setStats] = useState<{
    totalScales: number;
    todayAssessments: number;
    totalReports: number;
    totalPatients: number;
  }>({
    totalScales: 0,
    todayAssessments: 0,
    totalReports: 0,
    totalPatients: 0
  });
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [scales, scaleStats] = await Promise.all([
        clinimetrixApi.getScales(),
        clinimetrixApi.getScaleStats().catch(() => ({
          total_scales: 0,
          total_assessments: 0,
          total_reports: 0,
          most_used_scales: []
        }))
      ]);

      setStats({
        totalScales: scales.length,
        todayAssessments: 0, // TODO: Implementar estadísticas de hoy
        totalReports: scaleStats.total_reports || 0,
        totalPatients: 0 // TODO: Implementar conteo de pacientes evaluados
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectScale = (scale: Scale) => {
    setSelectedScale(scale);
    setCurrentView('assessment');
  };

  const handleBackToCatalog = () => {
    setCurrentView('catalog');
    setSelectedScale(null);
  };

  const handleCompleteAssessment = (results: any) => {
    console.log('Assessment completed:', results);
    setCurrentView('catalog');
    setSelectedScale(null);
    // Reload stats
    loadStats();
  };

  // Prevenir hydration issues
  if (!isMounted) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (currentView === 'assessment' && selectedScale) {
    return (
      <ScaleAssessmentModal
        selectedScale={selectedScale}
        onBack={handleBackToCatalog}
        onComplete={handleCompleteAssessment}
        fullscreen={true}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinimetrix - Evaluaciones Clínicas"
        description="Catálogo de escalas psicológicas y evaluaciones clínicas estandarizadas"
        icon={DocumentChartBarIcon}
        iconColor="text-purple-600"
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-purple-100 p-4 hover-lift relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-purple">
          <h3 className="text-sm font-semibold text-dark-green mb-3">Resumen de Actividad</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {loading ? '...' : stats.totalScales}
              </div>
              <div className="text-xs text-gray-500">Escalas Disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-600">
                {loading ? '...' : stats.todayAssessments}
              </div>
              <div className="text-xs text-gray-500">Evaluaciones Hoy</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary-600">
                {loading ? '...' : stats.totalReports}
              </div>
              <div className="text-xs text-gray-500">Reportes Generados</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-secondary-600">
                {loading ? '...' : stats.totalPatients}
              </div>
              <div className="text-xs text-gray-500">Pacientes Evaluados</div>
            </div>
          </div>
        </div>

        {/* Remote Assessments Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white hover-lift cursor-pointer"
             onClick={() => window.location.href = '/hubs/clinimetrix/remote-assessments'}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">Nuevo</div>
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Evaluaciones Remotas</h3>
          <p className="text-blue-100 text-sm mb-4">
            Envía escalas a pacientes vía enlaces seguros. Monitorea el progreso en tiempo real.
          </p>
          <div className="flex items-center text-sm text-blue-100">
            <span>Probar ahora</span>
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>

      {/* Scales Catalog */}
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-purple">
        <ScalesCatalog onSelectScale={handleSelectScale} />
      </div>
    </div>
  );
}