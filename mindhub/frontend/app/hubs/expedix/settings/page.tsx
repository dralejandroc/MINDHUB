'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { 
  CogIcon, 
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  CalendarDaysIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ExpedixSettingsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Configuration states
  const [config, setConfig] = useState({
    // General
    defaultView: 'cards', // cards, list, timeline
    patientsPerPage: 20,
    autoSaveConsultations: true,
    requireConsultationReason: true,
    
    // Templates
    useConsultationTemplates: true,
    defaultTemplateId: '',
    showVitalSigns: true,
    showMentalExam: true,
    
    // Notifications
    notifyOnNewPatient: true,
    notifyOnConsultation: true,
    emailNotifications: false,
    
    // Security
    requirePasswordForDelete: true,
    auditLogEnabled: true,
    dataRetentionDays: 365,
    
    // Integration
    syncWithAgenda: true,
    syncWithClinimetrix: true,
    syncWithResources: true,
    
    // Display
    showAge: true,
    showLastVisit: true,
    showPhone: true,
    showEmail: true,
    dateFormat: 'DD/MM/YYYY',
    
    // Printing
    printHeader: true,
    printLogo: true,
    printSignature: true,
  });

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setInitialLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('No hay sesión activa');
        return;
      }

      const response = await fetch('/api/expedix/settings', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      
      if (data.success && data.settings) {
        const settings = data.settings;
        setConfig({
          defaultView: settings.default_view || 'cards',
          patientsPerPage: settings.patients_per_page || 20,
          autoSaveConsultations: settings.auto_save_consultations ?? true,
          requireConsultationReason: settings.require_consultation_reason ?? true,
          useConsultationTemplates: settings.use_consultation_templates ?? true,
          defaultTemplateId: settings.default_template_id || '',
          showVitalSigns: settings.show_vital_signs ?? true,
          showMentalExam: settings.show_mental_exam ?? true,
          notifyOnNewPatient: settings.notify_on_new_patient ?? true,
          notifyOnConsultation: settings.notify_on_consultation ?? true,
          emailNotifications: settings.email_notifications ?? false,
          requirePasswordForDelete: settings.require_password_for_delete ?? true,
          auditLogEnabled: settings.audit_log_enabled ?? true,
          dataRetentionDays: settings.data_retention_days || 365,
          syncWithAgenda: settings.sync_with_agenda ?? true,
          syncWithClinimetrix: settings.sync_with_clinimetrix ?? true,
          syncWithResources: settings.sync_with_resources ?? true,
          showAge: settings.show_age ?? true,
          showLastVisit: settings.show_last_visit ?? true,
          showPhone: settings.show_phone ?? true,
          showEmail: settings.show_email ?? true,
          dateFormat: settings.date_format || 'DD/MM/YYYY',
          printHeader: settings.print_header ?? true,
          printLogo: settings.print_logo ?? true,
          printSignature: settings.print_signature ?? true
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Error al cargar la configuración');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('No hay sesión activa');
        return;
      }

      const response = await fetch('/api/expedix/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        toast.success('Configuración guardada exitosamente');
      } else {
        throw new Error(data.error || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/hubs/expedix');
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500 mt-4">Cargando configuración de Expedix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración de Expedix"
        description="Personaliza el módulo de gestión de expedientes médicos"
        icon={CogIcon}
        iconColor="text-gray-600"
        actions={
          <div className="flex space-x-2">
            <Button onClick={handleBack} variant="outline">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Volver
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
                <option value="timeline">Línea de Tiempo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pacientes por Página
              </label>
              <input
                type="number"
                value={config.patientsPerPage}
                onChange={(e) => setConfig({ ...config, patientsPerPage: parseInt(e.target.value) })}
                min="10"
                max="100"
                step="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.autoSaveConsultations}
                  onChange={(e) => setConfig({ ...config, autoSaveConsultations: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Guardar consultas automáticamente</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.requireConsultationReason}
                  onChange={(e) => setConfig({ ...config, requireConsultationReason: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Requerir motivo de consulta</span>
              </label>
            </div>
          </div>
        </div>

        {/* Template Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <ClipboardDocumentListIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-medium text-gray-900">Plantillas de Consulta</h2>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.useConsultationTemplates}
                onChange={(e) => setConfig({ ...config, useConsultationTemplates: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Usar plantillas de consulta</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.showVitalSigns}
                onChange={(e) => setConfig({ ...config, showVitalSigns: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Mostrar signos vitales</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.showMentalExam}
                onChange={(e) => setConfig({ ...config, showMentalExam: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Incluir examen mental</span>
            </label>

            <div className="pt-3 border-t">
              <Button
                onClick={() => router.push('/hubs/expedix/templates')}
                variant="outline"
                className="w-full"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                Gestionar Plantillas de Consulta
              </Button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BellIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-medium text-gray-900">Notificaciones</h2>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.notifyOnNewPatient}
                onChange={(e) => setConfig({ ...config, notifyOnNewPatient: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Notificar nuevo paciente</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.notifyOnConsultation}
                onChange={(e) => setConfig({ ...config, notifyOnConsultation: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Notificar nueva consulta</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.emailNotifications}
                onChange={(e) => setConfig({ ...config, emailNotifications: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Enviar notificaciones por email</span>
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
                checked={config.requirePasswordForDelete}
                onChange={(e) => setConfig({ ...config, requirePasswordForDelete: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Requerir contraseña para eliminar</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.auditLogEnabled}
                onChange={(e) => setConfig({ ...config, auditLogEnabled: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Registro de auditoría</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Retención de Datos (días)
              </label>
              <input
                type="number"
                value={config.dataRetentionDays}
                onChange={(e) => setConfig({ ...config, dataRetentionDays: parseInt(e.target.value) })}
                min="30"
                max="3650"
                step="30"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                checked={config.syncWithAgenda}
                onChange={(e) => setConfig({ ...config, syncWithAgenda: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Sincronizar con Agenda</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.syncWithClinimetrix}
                onChange={(e) => setConfig({ ...config, syncWithClinimetrix: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Integrar con ClinimetrixPro</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.syncWithResources}
                onChange={(e) => setConfig({ ...config, syncWithResources: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <span className="text-sm text-gray-700">Conectar con Resources</span>
            </label>
          </div>
        </div>

        {/* Display Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <CalendarDaysIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-medium text-gray-900">Visualización</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.showAge}
                  onChange={(e) => setConfig({ ...config, showAge: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Mostrar edad</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.showLastVisit}
                  onChange={(e) => setConfig({ ...config, showLastVisit: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Última visita</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.showPhone}
                  onChange={(e) => setConfig({ ...config, showPhone: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Teléfono</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.showEmail}
                  onChange={(e) => setConfig({ ...config, showEmail: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm text-gray-700">Email</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Formato de Fecha
              </label>
              <select
                value={config.dateFormat}
                onChange={(e) => setConfig({ ...config, dateFormat: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <CheckIcon className="h-5 w-5" />
          <span>Configuración guardada exitosamente</span>
        </div>
      )}
    </div>
  );
}