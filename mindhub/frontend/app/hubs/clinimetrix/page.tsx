'use client';

import { useState } from 'react';
import { 
  ClipboardDocumentListIcon, 
  PlusIcon, 
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import UniversalScalesGrid from '@/components/clinimetrix/UniversalScalesGrid';
import { AssessmentSession } from '@/components/clinimetrix/AssessmentSession';
import { AssessmentInterface } from '@/components/clinimetrix/AssessmentInterface';
import { ClinicalScale, AssessmentSession as AssessmentSessionType } from '@/types/clinimetrix';

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

function ClinimetrixPageContent() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'scales' | 'sessions' | 'assessment'>('scales');
  const [selectedScale, setSelectedScale] = useState<ClinicalScale | null>(null);
  const [selectedSession, setSelectedSession] = useState<AssessmentSessionType | null>(null);

  const renderContent = () => {
    switch (currentView) {
      case 'scales':
        return <UniversalScalesGrid />;
      
      case 'sessions':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Sesiones de Evaluación</h2>
                <p className="text-sm text-gray-600 mt-1">Gestiona tus sesiones activas y revisa evaluaciones anteriores</p>
              </div>
              <Button 
                onClick={() => setCurrentView('scales')}
                className="flex items-center space-x-2"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Nueva Sesión</span>
              </Button>
            </div>

            {/* Explanatory Card for Nueva Sesión */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">¿Cuándo crear una Nueva Sesión?</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Para cada paciente nuevo:</strong> Inicia una sesión independiente para mantener evaluaciones organizadas</li>
                    <li>• <strong>Evaluaciones de seguimiento:</strong> Cuando necesites reevaluar un paciente después de un tratamiento</li>
                    <li>• <strong>Diferentes contextos:</strong> Sesiones separadas para evaluación inicial vs. alta médica</li>
                    <li>• <strong>Múltiples escalas:</strong> Cuando planees aplicar varias escalas al mismo paciente en una cita</li>
                  </ul>
                </div>
              </div>
            </Card>
            
            <Card className="p-8 text-center">
              <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay sesiones activas
              </h3>
              <p className="text-gray-600 mb-6">
                Comienza creando una nueva sesión de evaluación para un paciente
              </p>
              <Button onClick={() => setCurrentView('scales')}>
                Crear Nueva Sesión
              </Button>
            </Card>
          </div>
        );
      
      case 'assessment':
        return (
          <AssessmentInterface
            onComplete={() => {
              setCurrentView('sessions');
              console.log('Assessment completed');
            }}
            onExit={() => setCurrentView('sessions')}
            autoSave={true}
            showProgress={true}
            allowNavigation={true}
          />
        );
      
      default:
        return (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Escalas Disponibles</p>
                    <p className="text-2xl font-bold text-gray-900">50+</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Evaluaciones Hoy</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ClockIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Duración Promedio</p>
                    <p className="text-2xl font-bold text-gray-900">--</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setCurrentView('scales')}
                  className="flex items-center justify-center space-x-2 p-4"
                >
                  <ClipboardDocumentListIcon className="h-5 w-5" />
                  <span>Explorar Escalas Clínicas</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => setCurrentView('sessions')}
                  className="flex items-center justify-center space-x-2 p-4"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Iniciar Nueva Evaluación</span>
                </Button>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
              <div className="text-center py-8">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Sin actividad reciente</p>
              </div>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinimetrix"
        description="Sistema de Evaluación Clínica con escalas estandarizadas"
        icon={ClipboardDocumentListIcon}
        iconColor="text-clinimetrix-600"
        actions={
          <div className="flex items-center space-x-2">
            <Button
              variant={currentView === 'dashboard' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('dashboard')}
            >
              Panel
            </Button>
            
            <Button
              variant={currentView === 'scales' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('scales')}
            >
              Escalas
            </Button>
            
            <Button
              variant={currentView === 'sessions' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setCurrentView('sessions')}
            >
              Sesiones
            </Button>
            
            <Button
              variant="primary"
              onClick={() => setCurrentView('scales')}
              className="flex items-center space-x-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Nueva Evaluación</span>
            </Button>
          </div>
        }
      />

      {/* Content */}
      {renderContent()}
    </div>
  );
}

export default function ClinimetrixPage() {
  return <ClinimetrixPageContent />;
}