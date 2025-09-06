'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { 
  CogIcon, 
  ArrowLeftIcon,
  CheckIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  CalendarDaysIcon,
  PaintBrushIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function FormXSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Configuration states
  const [config, setConfig] = useState({
    // General
    defaultView: 'cards', // cards, list, grid
    formsPerPage: 12,
    autoSaveForms: true,
    showFormPreview: true,
    enableTemplateCustomization: true,
    
    // Templates
    defaultTemplateCategory: '',
    enableCustomTemplates: true,
    enablePredefinedTemplates: true,
    templateVersioning: true,
    enableTemplateDuplication: true,
    
    // Form Building
    enableFieldValidation: true,
    enableConditionalLogic: false,
    enableAdvancedFields: true,
    enableFieldDependencies: false,
    defaultFieldsRequired: false,
    
    // Styling & UI
    enableCustomStyling: false,
    defaultTheme: 'professional', // professional, modern, minimal
    enableBranding: false,
    enableCustomColors: false,
    
    // Integration
    autoSyncWithExpedix: true,
    syncFormResponses: true,
    enablePatientPortal: true,
    enableEmailNotifications: true,
    
    // Security
    enableFormEncryption: true,
    requireAuthentication: true,
    enableAuditLog: true,
    formRetentionDays: 365,
    
    // Performance
    enableCaching: true,
    enableFormCompression: false,
    enableLazyLoading: true,
    maxFormSize: 50, // MB
    
    // Notifications
    notifyOnFormCompletion: true,
    notifyOnFormExpiry: false,
    emailDigestEnabled: false,
    
    // Advanced
    enableAPIAccess: false,
    enableWebhooks: false,
    enableFormAnalytics: true,
    enableA11yFeatures: true
  });

  // Load configuration from Django API
  useEffect(() => {
    const loadFormXConfig = async () => {
      try {
        const response = await fetch('/api/formx/django/api/settings/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            setConfig(prev => ({ ...prev, ...data.settings }));
          }
        }
      } catch (error) {
        console.error('Error loading FormX configuration:', error);
        // Keep default configuration on error
      }
    };
    
    loadFormXConfig();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/formx/django/api/settings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: config,
          module: 'formx'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save FormX configuration');
      }
      
      const result = await response.json();
      console.log('FormX configuration saved:', result);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast.success('Configuración de FormX guardada exitosamente');
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/hubs/formx');
  };

  const handleResetToDefaults = () => {
    if (window.confirm('¿Está seguro de que desea restaurar la configuración por defecto? Esta acción no se puede deshacer.')) {
      setConfig({
        defaultView: 'cards',
        formsPerPage: 12,
        autoSaveForms: true,
        showFormPreview: true,
        enableTemplateCustomization: true,
        defaultTemplateCategory: '',
        enableCustomTemplates: true,
        enablePredefinedTemplates: true,
        templateVersioning: true,
        enableTemplateDuplication: true,
        enableFieldValidation: true,
        enableConditionalLogic: false,
        enableAdvancedFields: true,
        enableFieldDependencies: false,
        defaultFieldsRequired: false,
        enableCustomStyling: false,
        defaultTheme: 'professional',
        enableBranding: false,
        enableCustomColors: false,
        autoSyncWithExpedix: true,
        syncFormResponses: true,
        enablePatientPortal: true,
        enableEmailNotifications: true,
        enableFormEncryption: true,
        requireAuthentication: true,
        enableAuditLog: true,
        formRetentionDays: 365,
        enableCaching: true,
        enableFormCompression: false,
        enableLazyLoading: true,
        maxFormSize: 50,
        notifyOnFormCompletion: true,
        notifyOnFormExpiry: false,
        emailDigestEnabled: false,
        enableAPIAccess: false,
        enableWebhooks: false,
        enableFormAnalytics: true,
        enableA11yFeatures: true
      });
      toast.success('Configuración restaurada a valores por defecto');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración de FormX"
        description="Personaliza el módulo de generación de formularios médicos"
        icon={CogIcon}
        iconColor="text-gray-600"
        actions={
          <div className="flex space-x-2">
            <Button onClick={handleBack} variant="outline">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Button 
              onClick={handleResetToDefaults} 
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Restaurar Defaults
            </Button>
            <Button 
              onClick={handleSave} 
              variant="primary" 
              disabled={loading || saved}
            >
              {saved ? (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Guardado
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </div>
        }
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <DocumentTextIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-medium text-gray-900">Configuración General</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vista Predeterminada
              </label>
              <select
                value={config.defaultView}
                onChange={(e) => setConfig({ ...config, defaultView: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cards">Tarjetas</option>
                <option value="list">Lista</option>
                <option value="grid">Cuadrícula</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Formularios por Página
              </label>
              <input
                type="number"
                value={config.formsPerPage}
                onChange={(e) => setConfig({ ...config, formsPerPage: parseInt(e.target.value) })}
                min="6"
                max="48"
                step="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.autoSaveForms}
                  onChange={(e) => setConfig({ ...config, autoSaveForms: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Guardar formularios automáticamente</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.showFormPreview}
                  onChange={(e) => setConfig({ ...config, showFormPreview: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Mostrar vista previa de formularios</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enableTemplateCustomization}
                  onChange={(e) => setConfig({ ...config, enableTemplateCustomization: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Permitir personalización de templates</span>
              </label>
            </div>
          </div>
        </div>

        {/* Template Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <ClipboardDocumentListIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-medium text-gray-900">Gestión de Templates</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría de Template por Defecto
              </label>
              <select
                value={config.defaultTemplateCategory}
                onChange={(e) => setConfig({ ...config, defaultTemplateCategory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar automáticamente</option>
                <option value="Admisión">Admisión</option>
                <option value="Seguimiento">Seguimiento</option>
                <option value="Psiquiatría Infantil">Psiquiatría Infantil</option>
                <option value="Screening">Screening</option>
                <option value="General">General</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enableCustomTemplates}
                  onChange={(e) => setConfig({ ...config, enableCustomTemplates: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Permitir templates personalizados</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enablePredefinedTemplates}
                  onChange={(e) => setConfig({ ...config, enablePredefinedTemplates: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Mostrar templates predefinidos</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.templateVersioning}
                  onChange={(e) => setConfig({ ...config, templateVersioning: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Control de versiones de templates</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enableTemplateDuplication}
                  onChange={(e) => setConfig({ ...config, enableTemplateDuplication: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Permitir duplicación de templates</span>
              </label>
            </div>
          </div>
        </div>

        {/* Form Building Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-medium text-gray-900">Constructor de Formularios</h2>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.enableFieldValidation}
                onChange={(e) => setConfig({ ...config, enableFieldValidation: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Validación de campos habilitada</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.enableConditionalLogic}
                onChange={(e) => setConfig({ ...config, enableConditionalLogic: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Lógica condicional (Beta)</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.enableAdvancedFields}
                onChange={(e) => setConfig({ ...config, enableAdvancedFields: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Campos avanzados</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.enableFieldDependencies}
                onChange={(e) => setConfig({ ...config, enableFieldDependencies: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Dependencias entre campos (Beta)</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.defaultFieldsRequired}
                onChange={(e) => setConfig({ ...config, defaultFieldsRequired: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Campos requeridos por defecto</span>
            </label>
          </div>
        </div>

        {/* Integration Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <GlobeAltIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-medium text-gray-900">Integración con Módulos</h2>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.autoSyncWithExpedix}
                onChange={(e) => setConfig({ ...config, autoSyncWithExpedix: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Sincronización automática con Expedix</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.syncFormResponses}
                onChange={(e) => setConfig({ ...config, syncFormResponses: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Sincronizar respuestas de formularios</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.enablePatientPortal}
                onChange={(e) => setConfig({ ...config, enablePatientPortal: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Portal del paciente habilitado</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.enableEmailNotifications}
                onChange={(e) => setConfig({ ...config, enableEmailNotifications: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Notificaciones por email</span>
            </label>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <ShieldCheckIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-medium text-gray-900">Seguridad y Privacidad</h2>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.enableFormEncryption}
                onChange={(e) => setConfig({ ...config, enableFormEncryption: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Encriptación de formularios</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.requireAuthentication}
                onChange={(e) => setConfig({ ...config, requireAuthentication: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Requerir autenticación</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.enableAuditLog}
                onChange={(e) => setConfig({ ...config, enableAuditLog: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Registro de auditoría</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Retención de Formularios (días)
              </label>
              <input
                type="number"
                value={config.formRetentionDays}
                onChange={(e) => setConfig({ ...config, formRetentionDays: parseInt(e.target.value) })}
                min="30"
                max="3650"
                step="30"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Styling & Theming */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <PaintBrushIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-medium text-gray-900">Estilo y Personalización</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tema por Defecto
              </label>
              <select
                value={config.defaultTheme}
                onChange={(e) => setConfig({ ...config, defaultTheme: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="professional">Profesional</option>
                <option value="modern">Moderno</option>
                <option value="minimal">Minimalista</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enableCustomStyling}
                  onChange={(e) => setConfig({ ...config, enableCustomStyling: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Permitir estilos personalizados</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enableBranding}
                  onChange={(e) => setConfig({ ...config, enableBranding: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Branding personalizado</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enableCustomColors}
                  onChange={(e) => setConfig({ ...config, enableCustomColors: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Colores personalizados</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <CheckIcon className="h-5 w-5" />
          <span>Configuración de FormX guardada exitosamente</span>
        </div>
      )}
    </div>
  );
}