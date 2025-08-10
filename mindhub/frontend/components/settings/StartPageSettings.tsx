'use client';

import { useState, useEffect } from 'react';
import { 
  HomeIcon,
  ChartBarIcon,
  UserGroupIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

interface StartPageOption {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  route: string;
}

const startPageOptions: StartPageOption[] = [
  {
    id: 'dashboard',
    name: 'Dashboard Principal',
    description: 'Vista general con estadísticas y accesos rápidos',
    icon: HomeIcon,
    color: 'text-blue-600 bg-blue-50',
    route: '/'
  },
  {
    id: 'reports',
    name: 'Reportes y Análisis',
    description: 'Estadísticas completas de todos los módulos',
    icon: ChartBarIcon,
    color: 'text-purple-600 bg-purple-50',
    route: '/reports'
  },
  {
    id: 'expedix',
    name: 'Expedix - Pacientes',
    description: 'Gestión de expedientes médicos y pacientes',
    icon: UserGroupIcon,
    color: 'text-green-600 bg-green-50',
    route: '/hubs/expedix'
  },
  {
    id: 'finance',
    name: 'Finance - Finanzas',
    description: 'Control de ingresos y gestión financiera',
    icon: BanknotesIcon,
    color: 'text-emerald-600 bg-emerald-50',
    route: '/hubs/finance'
  },
  {
    id: 'agenda',
    name: 'Agenda - Citas',
    description: 'Programación y gestión de citas médicas',
    icon: CalendarDaysIcon,
    color: 'text-indigo-600 bg-indigo-50',
    route: '/hubs/agenda'
  },
  {
    id: 'clinimetrix',
    name: 'Clinimetrix - Evaluaciones',
    description: 'Escalas clínicas y evaluaciones psicológicas',
    icon: ClipboardDocumentListIcon,
    color: 'text-cyan-600 bg-cyan-50',
    route: '/hubs/clinimetrix'
  },
  {
    id: 'formx',
    name: 'FormX - Formularios',
    description: 'Creación y gestión de formularios',
    icon: DocumentTextIcon,
    color: 'text-orange-600 bg-orange-50',
    route: '/hubs/formx'
  },
  {
    id: 'resources',
    name: 'Resources - Recursos',
    description: 'Biblioteca de recursos y documentos',
    icon: FolderIcon,
    color: 'text-pink-600 bg-pink-50',
    route: '/hubs/resources'
  }
];

interface StartPagePreferences {
  selectedStartPage: string;
  showWelcomeMessage: boolean;
  quickAccessEnabled: boolean;
  rememberLastVisited: boolean;
  autoRedirectEnabled: boolean;
  autoRedirectDelay: number; // seconds
}

const DEFAULT_PREFERENCES: StartPagePreferences = {
  selectedStartPage: 'dashboard',
  showWelcomeMessage: true,
  quickAccessEnabled: true,
  rememberLastVisited: false,
  autoRedirectEnabled: false,
  autoRedirectDelay: 3
};

export function StartPageSettings() {
  const [preferences, setPreferences] = useState<StartPagePreferences>(DEFAULT_PREFERENCES);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      // Load from localStorage first (client-side preferences)
      const saved = localStorage.getItem('startPagePreferences');
      if (saved) {
        const parsedPreferences = JSON.parse(saved);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsedPreferences });
      }
    } catch (error) {
      console.error('Error loading start page preferences:', error);
      toast.error('Error al cargar preferencias');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences: StartPagePreferences) => {
    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('startPagePreferences', JSON.stringify(newPreferences));
      
      // In a real implementation, you might also save to a backend API
      // const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      // await fetch(`${API_BASE_URL}/api/user/preferences/start-page`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newPreferences)
      // });

      setPreferences(newPreferences);
      toast.success('Preferencias guardadas correctamente');
    } catch (error) {
      console.error('Error saving start page preferences:', error);
      toast.error('Error al guardar preferencias');
    } finally {
      setSaving(false);
    }
  };

  const handleStartPageChange = (startPageId: string) => {
    const newPreferences = { ...preferences, selectedStartPage: startPageId };
    savePreferences(newPreferences);
  };

  const handleToggleSetting = (setting: keyof StartPagePreferences) => {
    const newPreferences = { 
      ...preferences, 
      [setting]: !preferences[setting as keyof StartPagePreferences] 
    };
    savePreferences(newPreferences);
  };

  const handleDelayChange = (delay: number) => {
    const newPreferences = { ...preferences, autoRedirectDelay: delay };
    savePreferences(newPreferences);
  };

  const testStartPage = () => {
    const selectedOption = startPageOptions.find(opt => opt.id === preferences.selectedStartPage);
    if (selectedOption) {
      window.open(selectedOption.route, '_blank');
      toast.success(`Abriendo ${selectedOption.name} en una nueva pestaña`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg">Cargando configuración...</div>
      </div>
    );
  }

  const selectedOption = startPageOptions.find(opt => opt.id === preferences.selectedStartPage);

  return (
    <div className="space-y-6">
      {/* Start Page Selection */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <HomeIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Página de Inicio Personalizada</h2>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Elige qué página ver al iniciar sesión en MindHub. Esta configuración se aplicará cada vez que entres a la plataforma.
          </p>
          
          {selectedOption && (
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${selectedOption.color}`}>
                  <selectedOption.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Página actual: {selectedOption.name}</div>
                  <div className="text-sm text-gray-600">{selectedOption.description}</div>
                </div>
              </div>
              <Button
                onClick={testStartPage}
                variant="outline"
                size="sm"
              >
                Probar
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {startPageOptions.map((option) => (
            <div
              key={option.id}
              onClick={() => handleStartPageChange(option.id)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                preferences.selectedStartPage === option.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${option.color}`}>
                  <option.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 mb-1">{option.name}</h3>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
                {preferences.selectedStartPage === option.id && (
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Advanced Settings */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <HomeIcon className="h-6 w-6 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">Configuración Avanzada</h2>
        </div>

        <div className="space-y-4">
          {/* Welcome Message */}
          <div className="flex items-center justify-between py-3">
            <div>
              <h3 className="font-medium text-gray-900">Mensaje de Bienvenida</h3>
              <p className="text-sm text-gray-600">
                Mostrar mensaje de bienvenida al iniciar sesión
              </p>
            </div>
            <button
              onClick={() => handleToggleSetting('showWelcomeMessage')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.showWelcomeMessage ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.showWelcomeMessage ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Quick Access */}
          <div className="flex items-center justify-between py-3 border-t">
            <div>
              <h3 className="font-medium text-gray-900">Acceso Rápido</h3>
              <p className="text-sm text-gray-600">
                Mostrar botones de acceso rápido a otros módulos
              </p>
            </div>
            <button
              onClick={() => handleToggleSetting('quickAccessEnabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.quickAccessEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.quickAccessEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Remember Last Visited */}
          <div className="flex items-center justify-between py-3 border-t">
            <div>
              <h3 className="font-medium text-gray-900">Recordar Última Página</h3>
              <p className="text-sm text-gray-600">
                Al iniciar sesión, ir a la última página visitada
              </p>
            </div>
            <button
              onClick={() => handleToggleSetting('rememberLastVisited')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.rememberLastVisited ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.rememberLastVisited ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Auto Redirect */}
          <div className="py-3 border-t">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-medium text-gray-900">Redirección Automática</h3>
                <p className="text-sm text-gray-600">
                  Redirigir automáticamente después del tiempo especificado
                </p>
              </div>
              <button
                onClick={() => handleToggleSetting('autoRedirectEnabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.autoRedirectEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.autoRedirectEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {preferences.autoRedirectEnabled && (
              <div className="ml-4 p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiempo de espera (segundos)
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={preferences.autoRedirectDelay}
                    onChange={(e) => handleDelayChange(parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-12 text-sm font-medium text-gray-900">
                    {preferences.autoRedirectDelay}s
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Preview */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Vista Previa de Configuración
          </h3>
          <p className="text-gray-600 mb-4">
            Al iniciar sesión, {preferences.rememberLastVisited ? 'irás a la última página visitada' : 
            `serás dirigido a ${selectedOption?.name}`}
            {preferences.autoRedirectEnabled && ` automáticamente después de ${preferences.autoRedirectDelay} segundos`}.
          </p>
          <div className="flex justify-center space-x-3">
            <Button
              onClick={testStartPage}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Probar Configuración
            </Button>
            <Button
              onClick={() => savePreferences(DEFAULT_PREFERENCES)}
              variant="outline"
            >
              Restaurar por Defecto
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}