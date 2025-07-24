'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { UniversalCardBasedAssessment } from '@/components/clinimetrix/UniversalCardBasedAssessment';
import { ScalesCatalog } from '@/components/clinimetrix/ScalesCatalog';
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

  useEffect(() => {
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

  if (currentView === 'assessment' && selectedScale) {
    return (
      <UniversalCardBasedAssessment
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
        actions={[
          <Button
            key="view-catalog"
            onClick={() => setCurrentView('catalog')}
            variant="purple"
            size="sm"
          >
            <RectangleStackIcon className="h-4 w-4 mr-1" />
            Catálogo de Escalas
          </Button>
        ]}
      />

      {/* Quick Stats */}
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-4 hover-lift relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-purple">
        <h3 className="text-sm font-semibold text-dark-green mb-3">Resumen de Actividad</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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

      {/* Scales Catalog */}
      <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-purple">
        <ScalesCatalog onSelectScale={handleSelectScale} />
      </div>
    </div>
  );
}