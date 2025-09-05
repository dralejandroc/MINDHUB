'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { FormXDashboard } from '@/components/formx/FormXDashboard';
import { FormXFormBuilder } from '@/components/formx/FormXFormBuilder';
import { FormXTemplateManager } from '@/components/formx/FormXTemplateManager';
import { FormXResponsesManager } from '@/components/formx/FormXResponsesManager';
import { FormXFormViewer } from '@/components/formx/FormXFormViewer';
import { TEMPLATE_MAP } from '@/components/formx/templates';
import toast from 'react-hot-toast';

type FormXView = 'dashboard' | 'templates' | 'builder' | 'responses' | 'form-viewer';

interface NavigationData {
  templateId?: string;
  formData?: any;
  patientId?: string;
}

export default function FormXPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentView, setCurrentView] = useState<FormXView>('dashboard');
  const [navigationData, setNavigationData] = useState<NavigationData>({});

  // Handle URL parameters to restore FormX view state
  useEffect(() => {
    const view = searchParams?.get('view') as FormXView;
    const templateId = searchParams?.get('templateId');
    const patientId = searchParams?.get('patientId');
    
    if (view && ['dashboard', 'templates', 'builder', 'responses', 'form-viewer'].includes(view)) {
      setCurrentView(view);
      setNavigationData({ templateId: templateId || undefined, patientId: patientId || undefined });
    }
  }, [searchParams]);

  const handleNavigate = (view: FormXView, data?: NavigationData) => {
    setCurrentView(view);
    setNavigationData(data || {});
    
    // Update URL to reflect current view and data
    const params = new URLSearchParams();
    
    if (view !== 'dashboard') {
      params.set('view', view);
    }
    
    if (data?.templateId) {
      params.set('templateId', data.templateId);
    }
    
    if (data?.patientId) {
      params.set('patientId', data.patientId);
    }
    
    const queryString = params.toString();
    const newUrl = queryString ? `/hubs/formx?${queryString}` : '/hubs/formx';
    router.push(newUrl);
  };

  const handleBackToDashboard = () => {
    handleNavigate('dashboard');
  };

  const renderBreadcrumb = () => {
    const paths = [];
    
    switch (currentView) {
      case 'templates':
        paths.push({ name: 'FormX', href: '#', onClick: handleBackToDashboard });
        paths.push({ name: 'Gestión de Templates', href: '#' });
        break;
      case 'builder':
        paths.push({ name: 'FormX', href: '#', onClick: handleBackToDashboard });
        paths.push({ name: 'Constructor de Formularios', href: '#' });
        break;
      case 'responses':
        paths.push({ name: 'FormX', href: '#', onClick: handleBackToDashboard });
        paths.push({ name: 'Respuestas de Pacientes', href: '#' });
        break;
      case 'form-viewer':
        paths.push({ name: 'FormX', href: '#', onClick: handleBackToDashboard });
        paths.push({ name: 'Llenar Formulario', href: '#' });
        break;
      default:
        paths.push({ name: 'FormX - Generador de Formularios Médicos', href: '#' });
    }

    return (
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm">
          {paths.map((path, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && <span className="mx-2 text-gray-400">/</span>}
              <button
                onClick={path.onClick}
                className={`${
                  path.onClick 
                    ? 'text-blue-600 hover:text-blue-800 font-medium' 
                    : 'text-gray-900 font-semibold'
                }`}
              >
                {path.name}
              </button>
            </li>
          ))}
        </ol>
      </nav>
    );
  };

  const renderBackButton = () => {
    if (currentView === 'dashboard') return null;
    
    return (
      <div className="mb-4">
        <Button
          onClick={handleBackToDashboard}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver al Panel Principal
        </Button>
      </div>
    );
  };

  const handleFormSubmit = async (responses: { [key: string]: any }) => {
    try {
      const response = await fetch('/api/formx/django/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: navigationData.templateId,
          patient_id: navigationData.patientId,
          responses: responses,
          submitted_at: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Error enviando formulario');
      }

      toast.success('Formulario enviado exitosamente');
      handleBackToDashboard();
    } catch (error) {
      console.error('Error submitting form:', error);
      throw error; // Re-throw para que FormXFormViewer lo maneje
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'templates':
        return <FormXTemplateManager onNavigate={handleNavigate} />;
      
      case 'builder':
        return (
          <FormXFormBuilder 
            templateId={navigationData.templateId}
            onNavigate={(view, data) => handleNavigate(view as FormXView, data)}
            onSave={handleBackToDashboard}
          />
        );
      
      case 'responses':
        return <FormXResponsesManager onNavigate={(view, data) => handleNavigate(view as FormXView, data)} />;
      
      case 'form-viewer':
        const templateId = navigationData.templateId;
        const template = templateId ? TEMPLATE_MAP[templateId as keyof typeof TEMPLATE_MAP] : null;
        
        if (!template) {
          toast.error('Template no encontrado');
          handleBackToDashboard();
          return null;
        }
        
        return (
          <FormXFormViewer
            template={template}
            patientId={navigationData.patientId}
            onBack={handleBackToDashboard}
            onSubmit={handleFormSubmit}
          />
        );
      
      default:
        return <FormXDashboard onNavigate={(view, data) => handleNavigate(view as FormXView, data)} />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="w-full max-w-none p-2 sm:p-4 lg:p-6">
        {renderBreadcrumb()}
        {renderBackButton()}
        {renderContent()}
      </div>
    </div>
  );
}