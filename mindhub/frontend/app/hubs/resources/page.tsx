'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { ResourceLibrary } from '@/components/resources/ResourceLibrary';
import { ResourceUploader } from '@/components/resources/ResourceUploader';
import { BrandingSettings } from '@/components/resources/BrandingSettings';
import { PatientResourceSender } from '@/components/resources/PatientResourceSender';
import { 
  BookOpenIcon, 
  PlusIcon, 
  CloudArrowUpIcon,
  PaintBrushIcon,
  DocumentTextIcon,
  PhotoIcon,
  Cog6ToothIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

export default function ResourcesPage() {
  const searchParams = useSearchParams();
  const patientId = searchParams?.get('patient');
  const action = searchParams?.get('action');
  
  const [currentView, setCurrentView] = useState<'library' | 'upload' | 'branding' | 'send'>(() => {
    if (action === 'send' && patientId) return 'send';
    return 'library';
  });

  const handleNewResource = () => {
    setCurrentView('upload');
  };

  const handleBrandingSettings = () => {
    setCurrentView('branding');
  };

  const handleBackToLibrary = () => {
    setCurrentView('library');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resources - Biblioteca de Recursos Psicoeducativos"
        description="Crea, personaliza y comparte recursos educativos con tu marca profesional"
        icon={BookOpenIcon}
        iconColor="text-orange-600"
        actions={[
          <Button
            key="branding"
            onClick={handleBrandingSettings}
            variant="outline"
            size="sm"
            className="border-orange-200 text-orange-600 hover:bg-orange-50"
          >
            <PaintBrushIcon className="h-3 w-3 mr-1" />
            Personalización
          </Button>,
          <Button
            key="upload"
            onClick={handleNewResource}
            variant="orange"
            size="sm"
          >
            <CloudArrowUpIcon className="h-3 w-3 mr-1" />
            Subir Recurso
          </Button>
        ]}
      />
      
      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-orange-100 hover-lift relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-orange">
        <div className="border-b border-orange-100">
          <nav className="flex space-x-4 px-4" aria-label="Tabs">
            <button
              onClick={() => setCurrentView('library')}
              className={`py-2 px-1 border-b-2 font-medium text-xs whitespace-nowrap transition-all duration-200 ${
                currentView === 'library'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-orange-600 hover:border-orange-300'
              }`}
            >
              <BookOpenIcon className="w-4 h-4 inline mr-1" />
              Biblioteca
            </button>
            <button
              onClick={() => setCurrentView('upload')}
              className={`py-2 px-1 border-b-2 font-medium text-xs whitespace-nowrap transition-all duration-200 ${
                currentView === 'upload'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-orange-600 hover:border-orange-300'
              }`}
            >
              <CloudArrowUpIcon className="w-4 h-4 inline mr-1" />
              Subir y Crear
            </button>
            <button
              onClick={() => setCurrentView('branding')}
              className={`py-2 px-1 border-b-2 font-medium text-xs whitespace-nowrap transition-all duration-200 ${
                currentView === 'branding'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-orange-600 hover:border-orange-300'
              }`}
            >
              <PaintBrushIcon className="w-4 h-4 inline mr-1" />
              Personalización
            </button>
          </nav>
        </div>

        <div className="p-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 hover-lift transition-all duration-200">
              <div className="flex items-center">
                <div className="p-1.5 gradient-orange rounded-lg">
                  <DocumentTextIcon className="h-4 w-4 text-white" />
                </div>
                <div className="ml-2">
                  <p className="text-xs font-medium text-dark-green">Recursos Totales</p>
                  <p className="text-lg font-bold text-orange-600">24</p>
                </div>
              </div>
            </div>

            <div className="bg-primary-50 rounded-xl p-3 border border-primary-100 hover-lift transition-all duration-200">
              <div className="flex items-center">
                <div className="p-1.5 gradient-primary rounded-lg">
                  <PhotoIcon className="h-4 w-4 text-white" />
                </div>
                <div className="ml-2">
                  <p className="text-xs font-medium text-dark-green">Plantillas</p>
                  <p className="text-lg font-bold text-primary-600">8</p>
                </div>
              </div>
            </div>

            <div className="bg-secondary-50 rounded-xl p-3 border border-secondary-100 hover-lift transition-all duration-200">
              <div className="flex items-center">
                <div className="p-1.5 gradient-secondary rounded-lg">
                  <BookOpenIcon className="h-4 w-4 text-white" />
                </div>
                <div className="ml-2">
                  <p className="text-xs font-medium text-dark-green">Enviados Hoy</p>
                  <p className="text-lg font-bold text-secondary-600">12</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-xl p-3 border border-purple-100 hover-lift transition-all duration-200">
              <div className="flex items-center">
                <div className="p-1.5 gradient-purple rounded-lg">
                  <Cog6ToothIcon className="h-4 w-4 text-white" />
                </div>
                <div className="ml-2">
                  <p className="text-xs font-medium text-dark-green">Personalizados</p>
                  <p className="text-lg font-bold text-purple-600">5</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content based on current view */}
      {currentView === 'library' && (
        <ResourceLibrary onNewResource={handleNewResource} />
      )}
      
      {currentView === 'upload' && (
        <ResourceUploader onBack={handleBackToLibrary} />
      )}
      
      {currentView === 'branding' && (
        <BrandingSettings onBack={handleBackToLibrary} />
      )}
      
      {currentView === 'send' && patientId && (
        <PatientResourceSender 
          patientId={patientId} 
          onBack={handleBackToLibrary}
        />
      )}
    </div>
  );
}