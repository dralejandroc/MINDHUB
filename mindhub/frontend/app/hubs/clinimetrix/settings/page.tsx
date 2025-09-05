'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FavoriteScalesManager } from '@/components/clinimetrix/FavoriteScalesManager';
import { 
  CogIcon, 
  ArrowLeftIcon,
  CheckIcon,
  ChartBarIcon,
  DocumentTextIcon,
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  CalculatorIcon,
  PrinterIcon,
  StarIcon,
  Bars3BottomLeftIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ClinimetrixProSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'favorites' | 'advanced'>('general');
  const [initialLoad, setInitialLoad] = useState(true);

  // Configuration states
  const [config, setConfig] = useState({
    // General
    defaultView: 'grid', // grid, list, categories
    scalesPerPage: 15,
    autoSaveResults: true,
    showScalePreview: true,
    enableFavoriteScales: true,
    
    // Scale Management
    enableAllScales: true,
    defaultScaleCategory: '',
    showScaleDescription: true,
    enableScaleSearch: true,
    enableScaleFiltering: true,
    showEstimatedTime: true,
    
    // Scoring and Results
    autoCalculateScores: true,
    showScoreInterpretation: true,
    enableScoreHistory: true,
    showPercentiles: false,
    enableCustomCutoffs: false,
    showConfidenceIntervals: false,
    
    // Reports and Analytics
    enableReportGeneration: true,
    includeScaleDescription: true,
    includeScoreHistory: true,
    includeClinicalRecommendations: true,
    defaultReportFormat: 'pdf', // pdf, html, docx
    enableBatchReports: false,
    
    // Integration
    autoSyncWithExpedix: true,
    syncResultsToConsultation: true,
    enablePatientPortalAccess: false,
    linkToTreatmentPlan: true,
    
    // Notifications
    notifyOnScaleCompletion: true,
    notifyOnHighScores: true,
    enableEmailReports: false,
    alertOnCriticalScores: true,
    
    // Security and Privacy
    enableResultEncryption: true,
    requireAuthentication: true,
    enableAuditLog: true,
    resultsRetentionDays: 365,
    anonymizeResults: false,
    
    // Display and UI
    showAge: true,
    showGender: true,
    showCompletionDate: true,
    showPreviousScores: true,
    dateFormat: 'DD/MM/YYYY',
    scoreDisplayFormat: 'numerical', // numerical, categorical, both
    
    // Advanced Features
    enableStatisticalAnalysis: false,
    enableTrendAnalysis: true,
    enableMultipleComparisons: false,
    enableNormativeComparisons: false,
    
    // Printing and Export
    printScaleInstructions: true,
    printScoreInterpretation: true,
    includeHeaderLogo: true,
    includeProviderSignature: true,
    
    // Favorite scales (will be loaded from API)
    favoriteScales: [] as any[]
  });

  // Load initial configuration from API
  useEffect(() => {
    const loadConfiguration = async () => {
      if (!initialLoad) return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/clinimetrix/settings');
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            console.log('Loaded configuration:', result.data);
            setConfig(prevConfig => ({
              ...prevConfig,
              ...result.data
            }));
          }
        } else {
          console.log('No existing configuration found, using defaults');
        }
      } catch (error) {
        console.error('Error loading configuration:', error);
        toast.error('Error al cargar la configuración');
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    loadConfiguration();
  }, [initialLoad]);

  const handleSave = async () => {
    setLoading(true);
    try {
      console.log('Saving ClinimetrixPro config:', config);
      
      // Call the API to save configuration
      const response = await fetch('/api/clinimetrix/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error saving configuration');
      }

      const result = await response.json();
      console.log('Configuration saved successfully:', result);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast.success('Configuración de ClinimetrixPro guardada exitosamente');
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error(error instanceof Error ? error.message : 'Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/hubs/clinimetrix');
  };

  const handleFavoriteScalesSave = async (favoriteScales: any[]) => {
    try {
      console.log('Saving favorite scales:', favoriteScales);
      
      // Call the API to save favorite scales configuration
      const response = await fetch('/api/clinimetrix/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...config,
          favoriteScales
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error saving favorite scales');
      }

      const result = await response.json();
      console.log('Favorite scales saved successfully:', result);
      
      // Update local config
      setConfig(prev => ({ ...prev, favoriteScales }));
      
      toast.success('Escalas favoritas guardadas exitosamente');
    } catch (error) {
      console.error('Error saving favorite scales:', error);
      toast.error(error instanceof Error ? error.message : 'Error al guardar escalas favoritas');
      throw error;
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('¿Está seguro de que desea restaurar la configuración por defecto? Esta acción no se puede deshacer.')) {
      // Reset to default values
      setConfig({
        defaultView: 'grid',
        scalesPerPage: 15,
        autoSaveResults: true,
        showScalePreview: true,
        enableFavoriteScales: true,
        enableAllScales: true,
        defaultScaleCategory: '',
        showScaleDescription: true,
        enableScaleSearch: true,
        enableScaleFiltering: true,
        showEstimatedTime: true,
        autoCalculateScores: true,
        showScoreInterpretation: true,
        enableScoreHistory: true,
        showPercentiles: false,
        enableCustomCutoffs: false,
        showConfidenceIntervals: false,
        enableReportGeneration: true,
        includeScaleDescription: true,
        includeScoreHistory: true,
        includeClinicalRecommendations: true,
        defaultReportFormat: 'pdf',
        enableBatchReports: false,
        autoSyncWithExpedix: true,
        syncResultsToConsultation: true,
        enablePatientPortalAccess: false,
        linkToTreatmentPlan: true,
        notifyOnScaleCompletion: true,
        notifyOnHighScores: true,
        enableEmailReports: false,
        alertOnCriticalScores: true,
        enableResultEncryption: true,
        requireAuthentication: true,
        enableAuditLog: true,
        resultsRetentionDays: 365,
        anonymizeResults: false,
        showAge: true,
        showGender: true,
        showCompletionDate: true,
        showPreviousScores: true,
        dateFormat: 'DD/MM/YYYY',
        scoreDisplayFormat: 'numerical',
        enableStatisticalAnalysis: false,
        enableTrendAnalysis: true,
        enableMultipleComparisons: false,
        enableNormativeComparisons: false,
        printScaleInstructions: true,
        printScoreInterpretation: true,
        includeHeaderLogo: true,
        includeProviderSignature: true,
        favoriteScales: []
      });
      toast.success('Configuración restaurada a valores por defecto');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración de ClinimetrixPro"
        description="Personaliza el módulo de evaluaciones psicométricas y escalas clínicas"
        icon={CogIcon}
        iconColor="text-gray-600"
        actions={
          <div className="flex space-x-2">
            <Button onClick={handleBack} variant="outline">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Volver
            </Button>
            {activeTab === 'general' && (
              <>
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
              </>
            )}
          </div>
        }
      />

      {/* Tab Navigation */}
      <Card className="p-0">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'general'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <CogIcon className="h-4 w-4" />
                <span>Configuración General</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('favorites')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'favorites'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <StarIcon className="h-4 w-4" />
                <span>Escalas Favoritas</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('advanced')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'advanced'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Bars3BottomLeftIcon className="h-4 w-4" />
                <span>Avanzado</span>
              </div>
            </button>
          </nav>
        </div>
      </Card>

      {/* Tab Content */}
      {activeTab === 'favorites' ? (
        <FavoriteScalesManager 
          onSave={handleFavoriteScalesSave} 
          initialScales={config.favoriteScales || []}
        />
      ) : activeTab === 'advanced' ? (
        <Card className="p-6">
          <div className="text-center py-8 text-gray-500">
            <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Configuraciones Avanzadas</h3>
            <p className="text-gray-600 mb-4">Métricas avanzadas, reportes personalizables y análisis temporal próximamente.</p>
            <Button variant="outline" disabled>
              Próximamente Disponible
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <ChartBarIcon className="h-5 w-5 text-gray-500" />
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
                <option value="grid">Cuadrícula</option>
                <option value="list">Lista</option>
                <option value="categories">Por Categorías</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Escalas por Página
              </label>
              <input
                type="number"
                value={config.scalesPerPage}
                onChange={(e) => setConfig({ ...config, scalesPerPage: parseInt(e.target.value) })}
                min="6"
                max="30"
                step="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.autoSaveResults}
                  onChange={(e) => setConfig({ ...config, autoSaveResults: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Guardar resultados automáticamente</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.showScalePreview}
                  onChange={(e) => setConfig({ ...config, showScalePreview: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Mostrar vista previa de escalas</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enableFavoriteScales}
                  onChange={(e) => setConfig({ ...config, enableFavoriteScales: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Permitir escalas favoritas</span>
              </label>
            </div>
          </div>
        </div>

        {/* Scale Management */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <ClipboardDocumentCheckIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-medium text-gray-900">Gestión de Escalas</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría por Defecto
              </label>
              <select
                value={config.defaultScaleCategory}
                onChange={(e) => setConfig({ ...config, defaultScaleCategory: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las categorías</option>
                <option value="depression">Depresión</option>
                <option value="anxiety">Ansiedad</option>
                <option value="cognition">Cognición</option>
                <option value="autism">Autismo/TEA</option>
                <option value="psychosis">Psicosis</option>
                <option value="personality">Personalidad</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enableAllScales}
                  onChange={(e) => setConfig({ ...config, enableAllScales: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Habilitar todas las escalas (29 disponibles)</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.showScaleDescription}
                  onChange={(e) => setConfig({ ...config, showScaleDescription: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Mostrar descripción de escalas</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enableScaleSearch}
                  onChange={(e) => setConfig({ ...config, enableScaleSearch: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Búsqueda de escalas habilitada</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.showEstimatedTime}
                  onChange={(e) => setConfig({ ...config, showEstimatedTime: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Mostrar tiempo estimado</span>
              </label>
            </div>
          </div>
        </div>

        {/* Scoring Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <CalculatorIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-medium text-gray-900">Puntuación y Resultados</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Formato de Puntuación
              </label>
              <select
                value={config.scoreDisplayFormat}
                onChange={(e) => setConfig({ ...config, scoreDisplayFormat: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="numerical">Solo Numérico</option>
                <option value="categorical">Solo Categórico</option>
                <option value="both">Ambos</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.autoCalculateScores}
                  onChange={(e) => setConfig({ ...config, autoCalculateScores: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Cálculo automático de puntuaciones</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.showScoreInterpretation}
                  onChange={(e) => setConfig({ ...config, showScoreInterpretation: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Mostrar interpretación de puntuaciones</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enableScoreHistory}
                  onChange={(e) => setConfig({ ...config, enableScoreHistory: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Historial de puntuaciones</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enableTrendAnalysis}
                  onChange={(e) => setConfig({ ...config, enableTrendAnalysis: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Análisis de tendencias</span>
              </label>
            </div>
          </div>
        </div>

        {/* Reports Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <DocumentTextIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-medium text-gray-900">Reportes y Análisis</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Formato de Reporte por Defecto
              </label>
              <select
                value={config.defaultReportFormat}
                onChange={(e) => setConfig({ ...config, defaultReportFormat: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pdf">PDF</option>
                <option value="html">HTML</option>
                <option value="docx">Word (DOCX)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enableReportGeneration}
                  onChange={(e) => setConfig({ ...config, enableReportGeneration: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Generación de reportes habilitada</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.includeScaleDescription}
                  onChange={(e) => setConfig({ ...config, includeScaleDescription: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Incluir descripción de escalas</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.includeClinicalRecommendations}
                  onChange={(e) => setConfig({ ...config, includeClinicalRecommendations: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Incluir recomendaciones clínicas</span>
              </label>
            </div>
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
                checked={config.syncResultsToConsultation}
                onChange={(e) => setConfig({ ...config, syncResultsToConsultation: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Sincronizar resultados a consulta</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.linkToTreatmentPlan}
                onChange={(e) => setConfig({ ...config, linkToTreatmentPlan: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Vincular a plan de tratamiento</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.enablePatientPortalAccess}
                onChange={(e) => setConfig({ ...config, enablePatientPortalAccess: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Portal del paciente (Beta)</span>
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
                checked={config.enableResultEncryption}
                onChange={(e) => setConfig({ ...config, enableResultEncryption: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Encriptación de resultados</span>
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
                Retención de Resultados (días)
              </label>
              <input
                type="number"
                value={config.resultsRetentionDays}
                onChange={(e) => setConfig({ ...config, resultsRetentionDays: parseInt(e.target.value) })}
                min="30"
                max="3650"
                step="30"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Success Message */}
      {saved && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <CheckIcon className="h-5 w-5" />
          <span>Configuración de ClinimetrixPro guardada exitosamente</span>
        </div>
      )}
    </div>
  );
}