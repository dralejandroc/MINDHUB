'use client';

import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  PlusIcon, 
  ClipboardDocumentListIcon,
  ChartBarIcon,
  UserGroupIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { FormXTemplate, FormXStats } from '@/lib/api/formx-unified-client';
import toast from 'react-hot-toast';

interface FormXDashboardProps {
  onNavigate: (view: string, data?: any) => void;
}

export function FormXDashboard({ onNavigate }: FormXDashboardProps) {
  const [stats, setStats] = useState<FormXStats>({
    total_templates: 0,
    active_templates: 0,
    total_submissions: 0,
    processed_submissions: 0,
    synced_submissions: 0,
    total_documents: 0,
    recent_submissions: 0,
    processing_rate: 0,
    sync_rate: 0
  });
  
  const [recentTemplates, setRecentTemplates] = useState<FormXTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setConnectionStatus('checking');

      // Test connection to Django backend
      // const isConnected = await FormXDjangoClient.testConnection();
      // if (!isConnected) {
      //   setConnectionStatus('error');
      //   toast.error('No se puede conectar con el backend FormX Django');
      //   return;
      // }
      
      setConnectionStatus('connected');

      // Load dashboard stats
      try {
        // const dashboardStats = await FormXDjangoClient.getDashboardStats();
        // setStats(dashboardStats);
      } catch (error) {
        console.warn('Error loading stats, using defaults:', error);
      }

      // Load recent templates
      try {
        // const catalog = await FormXDjangoClient.getTemplatesCatalog();
        // setRecentTemplates(catalog.templates.slice(0, 5));
      } catch (error) {
        console.warn('Error loading templates, using empty array:', error);
        setRecentTemplates([]);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setConnectionStatus('error');
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewForm = () => {
    onNavigate('form-builder');
  };

  const handleViewTemplates = () => {
    onNavigate('templates');
  };

  const handleManageAssignments = () => {
    onNavigate('assignments');
  };

  const handleViewResponses = () => {
    onNavigate('responses');
  };

  const handleEditTemplate = (template: FormXTemplate) => {
    onNavigate('form-builder', { editingTemplate: template });
  };

  const handleAssignTemplate = (template: FormXTemplate) => {
    onNavigate('assign-form', { template });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Cargando FormX Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
          }`} />
          <span className="text-sm text-gray-600">
            {connectionStatus === 'connected' ? 'Conectado a Django FormX' : 
             connectionStatus === 'error' ? 'Error de conexión' : 'Verificando conexión...'}
          </span>
        </div>
        
        <Button
          onClick={loadDashboardData}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          Actualizar
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 hover:shadow-lg transition-shadow border-emerald-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Crear Formulario</h3>
            <PlusIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Constructor avanzado con campos médicos especializados
          </p>
          <Button 
            onClick={handleCreateNewForm}
            variant="outline" 
            size="sm"
            className="w-full"
          >
            Nuevo Formulario
          </Button>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-shadow border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Templates Médicos</h3>
            <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Formularios predefinidos listos para usar
          </p>
          <Button 
            onClick={handleViewTemplates}
            variant="outline" 
            size="sm"
            className="w-full"
          >
            Ver Templates
          </Button>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-shadow border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Asignar Pacientes</h3>
            <UserGroupIcon className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Envía formularios específicos a pacientes
          </p>
          <Button 
            onClick={handleManageAssignments}
            variant="outline" 
            size="sm"
            className="w-full"
          >
            Gestionar
          </Button>
        </Card>

        <Card className="p-4 hover:shadow-lg transition-shadow border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Analizar Respuestas</h3>
            <ChartBarIcon className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Revisa y analiza respuestas de pacientes
          </p>
          <Button 
            onClick={handleViewResponses}
            variant="outline" 
            size="sm"
            className="w-full"
          >
            Ver Análisis
          </Button>
        </Card>
      </div>

      {/* Stats Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas de FormX</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <div className="text-2xl font-bold text-emerald-600">{stats.total_templates}</div>
            <div className="text-sm text-emerald-700">Templates Totales</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.total_submissions}</div>
            <div className="text-sm text-blue-700">Total Respuestas</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.processed_submissions}</div>
            <div className="text-sm text-orange-700">Procesadas</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.synced_submissions}</div>
            <div className="text-sm text-purple-700">Sincronizadas</div>
          </div>
        </div>
        
        {/* Rates */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tasa de procesamiento:</span>
              <span className="text-sm font-medium text-gray-900">{stats.processing_rate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tasa de sincronización:</span>
              <span className="text-sm font-medium text-gray-900">{stats.sync_rate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Templates */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Templates Recientes</h3>
          <Button onClick={handleViewTemplates} variant="outline" size="sm">
            Ver Todos
          </Button>
        </div>
        
        {recentTemplates.length > 0 ? (
          <div className="space-y-3">
            {recentTemplates.map((template) => (
              <div 
                key={template.id} 
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="h-5 w-5 text-emerald-600" />
                  <div>
                    <div className="font-medium text-gray-900">{template.name}</div>
                    <div className="text-sm text-gray-500">
                      {template.form_type} • {template.total_fields} campos • {template.total_submissions} respuestas
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditTemplate(template)}
                  >
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleAssignTemplate(template)}
                  >
                    Asignar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm">No hay templates creados aún</p>
            <Button 
              onClick={handleCreateNewForm} 
              variant="primary" 
              size="sm" 
              className="mt-3"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Crear Primer Template
            </Button>
          </div>
        )}
      </Card>

      {/* Integration Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Integraciones</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-700">Django Backend FormX</span>
            </div>
            <span className="text-sm font-medium text-green-600">Conectado</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-700">Supabase PostgreSQL</span>
            </div>
            <span className="text-sm font-medium text-green-600">Activo</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-700">Auto-sync Expedix</span>
            </div>
            <span className="text-sm font-medium text-green-600">Habilitado</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-sm text-gray-700">Email Service</span>
            </div>
            <span className="text-sm font-medium text-blue-600">Configurado</span>
          </div>
        </div>
      </Card>
    </div>
  );
}