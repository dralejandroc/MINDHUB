'use client';

import { useState } from 'react';
import { 
  Cog6ToothIcon,
  UserIcon,
  ShieldCheckIcon,
  EyeIcon,
  PencilSquareIcon,
  HomeIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUserMetrics } from '@/contexts/UserMetricsContext';
import { StartPageSettings } from './StartPageSettings';

export function DashboardSettings() {
  const { 
    preferences, 
    isAdmin, 
    updateDashboardConfig, 
    saveAdminSettings, 
    getAdminSettings 
  } = useUserMetrics();
  
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminSettings, setAdminSettings] = useState(getAdminSettings());
  const [activeSection, setActiveSection] = useState<'dashboard' | 'startpage'>('dashboard');
  const [scheduleConfig, setScheduleConfig] = useState({
    startHour: 8,
    endHour: 18,
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
    sessionCost: 1200,
    sessionsPerHour: 2
  });

  const handleModeChange = (mode: 'beginner' | 'advanced') => {
    updateDashboardConfig({ mode });
  };

  const handleAutoSwitchToggle = () => {
    updateDashboardConfig({ autoSwitch: !preferences.dashboardConfig.autoSwitch });
  };

  const handleThemeChange = (theme: 'default' | 'compact' | 'minimal') => {
    updateDashboardConfig({ theme });
  };

  const handleAdminSettingsChange = (key: string, value: any) => {
    const newSettings = { ...adminSettings, [key]: value };
    setAdminSettings(newSettings);
    saveAdminSettings(newSettings);
  };

  const handleThresholdChange = (metric: string, value: number) => {
    const newThresholds = { 
      ...adminSettings.autoSwitchThresholds, 
      [metric]: value 
    };
    const newSettings = { 
      ...adminSettings, 
      autoSwitchThresholds: newThresholds 
    };
    setAdminSettings(newSettings);
    saveAdminSettings(newSettings);
  };

  // Calculate financial projection
  const calculateFinancialProjection = () => {
    const hoursPerDay = scheduleConfig.endHour - scheduleConfig.startHour;
    const workingDaysPerWeek = scheduleConfig.workingDays.length;
    const sessionsPerDay = hoursPerDay * scheduleConfig.sessionsPerHour;
    const occupancyRate = 0.85; // 85% occupancy
    
    const occupiedSessionsPerDay = Math.floor(sessionsPerDay * occupancyRate);
    const dailyRevenue = occupiedSessionsPerDay * scheduleConfig.sessionCost;
    const weeklyRevenue = dailyRevenue * workingDaysPerWeek;
    const monthlyRevenue = weeklyRevenue * 4.33; // Average weeks per month
    const annualRevenue = monthlyRevenue * 12;

    return {
      sessionsPerDay,
      occupiedSessionsPerDay,
      dailyRevenue,
      weeklyRevenue,
      monthlyRevenue,
      annualRevenue,
      workingDaysPerWeek
    };
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <Card className="p-1">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeSection === 'dashboard'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Cog6ToothIcon className="h-4 w-4" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveSection('startpage')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeSection === 'startpage'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <HomeIcon className="h-4 w-4" />
            <span>Página de Inicio</span>
          </button>
        </div>
      </Card>

      {activeSection === 'startpage' ? (
        <StartPageSettings />
      ) : (
        <>
          {/* User Dashboard Settings */}
          <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <UserIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Configuración del Dashboard</h2>
        </div>

        {/* Dashboard Mode */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Modo del Dashboard
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                onClick={() => handleModeChange('beginner')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  preferences.dashboardConfig.mode === 'beginner' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    preferences.dashboardConfig.mode === 'beginner' 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {preferences.dashboardConfig.mode === 'beginner' && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Dashboard Básico</h3>
                    <p className="text-sm text-gray-600">
                      Vista detallada con explicaciones y guías para nuevos usuarios
                    </p>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => handleModeChange('advanced')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  preferences.dashboardConfig.mode === 'advanced' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    preferences.dashboardConfig.mode === 'advanced' 
                      ? 'border-purple-500 bg-purple-500' 
                      : 'border-gray-300'
                  }`}>
                    {preferences.dashboardConfig.mode === 'advanced' && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Dashboard Avanzado</h3>
                    <p className="text-sm text-gray-600">
                      Vista compacta con acceso rápido y widgets personalizables
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Auto Switch */}
          <div className="flex items-center justify-between py-4 border-t">
            <div>
              <h3 className="font-medium text-gray-900">Cambio Automático</h3>
              <p className="text-sm text-gray-600">
                Cambiar automáticamente al dashboard avanzado basado en el uso
              </p>
            </div>
            <button
              onClick={handleAutoSwitchToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.dashboardConfig.autoSwitch ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.dashboardConfig.autoSwitch ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Theme Selection */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tema del Dashboard
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { key: 'default', name: 'Predeterminado', desc: 'Vista estándar con espaciado cómodo' },
                { key: 'compact', name: 'Compacto', desc: 'Más información en menos espacio' },
                { key: 'minimal', name: 'Minimalista', desc: 'Vista limpia y enfocada' }
              ].map((theme) => (
                <div
                  key={theme.key}
                  onClick={() => handleThemeChange(theme.key as any)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    preferences.dashboardConfig.theme === theme.key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h4 className="font-medium text-gray-900">{theme.name}</h4>
                  <p className="text-xs text-gray-600">{theme.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* User Statistics */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <EyeIcon className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">Tu Progreso</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{preferences.metrics.loginCount}</div>
            <div className="text-sm text-gray-600">Sesiones</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{preferences.metrics.patientsAdded}</div>
            <div className="text-sm text-gray-600">Pacientes</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{preferences.metrics.scalesApplied}</div>
            <div className="text-sm text-gray-600">Escalas</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{preferences.metrics.formsCreated}</div>
            <div className="text-sm text-gray-600">Formularios</div>
          </div>
        </div>
      </Card>

      {/* Financial Projection - Only for Individual Users */}
      {!isAdmin && (
        <Card className="p-6 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center space-x-3 mb-6">
            <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Proyección Financiera Automática</h2>
              <p className="text-sm text-green-700 font-medium">
                Esta estimación es solo aproximada suponiendo agenda en un 85%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                (Esta proyección es solo una estimación, no representa ingresos reales)
              </p>
            </div>
          </div>

          {/* Configuration Settings */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-white rounded-lg border">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Hora Inicio</label>
              <input
                type="time"
                value={`${scheduleConfig.startHour.toString().padStart(2, '0')}:00`}
                onChange={(e) => setScheduleConfig(prev => ({
                  ...prev,
                  startHour: parseInt(e.target.value.split(':')[0])
                }))}
                className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Hora Fin</label>
              <input
                type="time"
                value={`${scheduleConfig.endHour.toString().padStart(2, '0')}:00`}
                onChange={(e) => setScheduleConfig(prev => ({
                  ...prev,
                  endHour: parseInt(e.target.value.split(':')[0])
                }))}
                className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sesiones/Hora</label>
              <select
                value={scheduleConfig.sessionsPerHour}
                onChange={(e) => setScheduleConfig(prev => ({
                  ...prev,
                  sessionsPerHour: parseInt(e.target.value)
                }))}
                className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
              >
                <option value={1}>1 (60 min)</option>
                <option value={2}>2 (30 min)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Costo Sesión</label>
              <input
                type="number"
                value={scheduleConfig.sessionCost}
                onChange={(e) => setScheduleConfig(prev => ({
                  ...prev,
                  sessionCost: parseInt(e.target.value)
                }))}
                className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                placeholder="1200"
              />
            </div>
          </div>

          {/* Working Days Selection */}
          <div className="mb-6 p-4 bg-white rounded-lg border">
            <label className="block text-sm font-medium text-gray-700 mb-3">Días Laborales</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 1, name: 'Lun', full: 'Lunes' },
                { id: 2, name: 'Mar', full: 'Martes' },
                { id: 3, name: 'Mié', full: 'Miércoles' },
                { id: 4, name: 'Jue', full: 'Jueves' },
                { id: 5, name: 'Vie', full: 'Viernes' },
                { id: 6, name: 'Sáb', full: 'Sábado' },
                { id: 0, name: 'Dom', full: 'Domingo' }
              ].map(day => (
                <button
                  key={day.id}
                  onClick={() => setScheduleConfig(prev => ({
                    ...prev,
                    workingDays: prev.workingDays.includes(day.id)
                      ? prev.workingDays.filter(d => d !== day.id)
                      : [...prev.workingDays, day.id]
                  }))}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    scheduleConfig.workingDays.includes(day.id)
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-green-50'
                  }`}
                  title={day.full}
                >
                  {day.name}
                </button>
              ))}
            </div>
          </div>

          {/* Financial Projections Display */}
          {(() => {
            const projection = calculateFinancialProjection();
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    <CalendarDaysIcon className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-gray-600">Diario (85%)</span>
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    ${projection.dailyRevenue.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {projection.occupiedSessionsPerDay} de {projection.sessionsPerDay} sesiones
                  </div>
                </div>

                <div className="text-center p-4 bg-white rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    <CalendarDaysIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-gray-600">Semanal</span>
                  </div>
                  <div className="text-lg font-bold text-blue-600">
                    ${projection.weeklyRevenue.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {projection.workingDaysPerWeek} días laborales
                  </div>
                </div>

                <div className="text-center p-4 bg-white rounded-lg border-l-4 border-purple-500">
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    <ClockIcon className="w-4 h-4 text-purple-600" />
                    <span className="text-xs text-gray-600">Mensual</span>
                  </div>
                  <div className="text-lg font-bold text-purple-600">
                    ${Math.round(projection.monthlyRevenue).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">~4.33 semanas/mes</div>
                </div>

                <div className="text-center p-4 bg-white rounded-lg border-l-4 border-orange-500">
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    <CurrencyDollarIcon className="w-4 h-4 text-orange-600" />
                    <span className="text-xs text-gray-600">Anual</span>
                  </div>
                  <div className="text-lg font-bold text-orange-600">
                    ${Math.round(projection.annualRevenue).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Proyección 12 meses</div>
                </div>
              </div>
            );
          })()}

          {/* Disclaimer */}
          <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <div className="flex items-start space-x-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-800">
                <p className="font-medium mb-1">Información Importante:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Esta es una proyección aproximada basada en 85% de ocupación</li>
                  <li>Los ingresos reales pueden variar según múltiples factores</li>
                  <li>Para clínicas, esta proyección debe revisarse en el módulo de Finanzas</li>
                  <li>No incluye gastos operativos, impuestos o deducciones</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Admin Panel */}
      {isAdmin && (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <ShieldCheckIcon className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-semibold text-gray-900">Panel de Administrador</h2>
            </div>
            <Button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              variant="outline"
              size="sm"
            >
              {showAdminPanel ? 'Ocultar' : 'Mostrar'} Panel
            </Button>
          </div>

          {showAdminPanel && (
            <div className="space-y-6 border-t pt-6">
              {/* Force Beginner Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Forzar Modo Básico</h3>
                  <p className="text-sm text-gray-600">
                    Todos los usuarios verán solo el dashboard básico
                  </p>
                </div>
                <button
                  onClick={() => handleAdminSettingsChange('forceBeginnerMode', !adminSettings.forceBeginnerMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    adminSettings.forceBeginnerMode ? 'bg-red-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      adminSettings.forceBeginnerMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Allow User Customization */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Permitir Personalización</h3>
                  <p className="text-sm text-gray-600">
                    Los usuarios pueden personalizar sus dashboards
                  </p>
                </div>
                <button
                  onClick={() => handleAdminSettingsChange('allowUserCustomization', !adminSettings.allowUserCustomization)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    adminSettings.allowUserCustomization ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      adminSettings.allowUserCustomization ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Auto-switch Thresholds */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Umbrales de Cambio Automático</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sesiones Mínimas
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={adminSettings.autoSwitchThresholds.loginCount}
                      onChange={(e) => handleThresholdChange('loginCount', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pacientes Mínimos
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={adminSettings.autoSwitchThresholds.patientsAdded}
                      onChange={(e) => handleThresholdChange('patientsAdded', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Escalas Mínimas
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={adminSettings.autoSwitchThresholds.scalesApplied}
                      onChange={(e) => handleThresholdChange('scalesApplied', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
        )}
      </>
      )}
    </div>
  );
}