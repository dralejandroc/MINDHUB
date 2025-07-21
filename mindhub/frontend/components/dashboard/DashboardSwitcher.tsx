'use client';

import { useEffect, useState } from 'react';
import { useUserMetrics } from '@/contexts/UserMetricsContext';
import { BeginnerDashboard } from './BeginnerDashboard';
import { AdvancedDashboard } from './AdvancedDashboard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  CheckCircleIcon, 
  XMarkIcon,
  LightBulbIcon,
  StarIcon 
} from '@heroicons/react/24/outline';

export function DashboardSwitcher() {
  const { 
    dashboardMode, 
    preferences, 
    updateDashboardConfig, 
    getAdminSettings,
    refreshPreferences 
  } = useUserMetrics();
  
  const [showUpgradeNotification, setShowUpgradeNotification] = useState(false);
  const [hasShownUpgradeNotification, setHasShownUpgradeNotification] = useState(false);

  // Check if user qualifies for auto-upgrade
  useEffect(() => {
    const adminSettings = getAdminSettings();
    const shouldShowUpgrade = 
      !hasShownUpgradeNotification &&
      preferences.dashboardConfig.mode === 'beginner' &&
      preferences.dashboardConfig.autoSwitch &&
      preferences.metrics.loginCount >= adminSettings.autoSwitchThresholds.loginCount &&
      preferences.metrics.patientsAdded >= adminSettings.autoSwitchThresholds.patientsAdded &&
      preferences.metrics.scalesApplied >= adminSettings.autoSwitchThresholds.scalesApplied;

    if (shouldShowUpgrade) {
      setShowUpgradeNotification(true);
      setHasShownUpgradeNotification(true);
    }
  }, [preferences, hasShownUpgradeNotification, getAdminSettings]);

  const handleUpgradeToAdvanced = () => {
    updateDashboardConfig({ mode: 'advanced' });
    setShowUpgradeNotification(false);
    refreshPreferences();
  };

  const handleStayBeginner = () => {
    updateDashboardConfig({ autoSwitch: false });
    setShowUpgradeNotification(false);
  };

  const adminSettings = getAdminSettings();

  // If admin forces beginner mode
  if (adminSettings.forceBeginnerMode) {
    return <BeginnerDashboard />;
  }

  return (
    <div className="space-y-6">
      {/* Upgrade Notification */}
      {showUpgradeNotification && (
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <StarIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                🎉 ¡Felicidades! Has desbloqueado el Dashboard Avanzado
              </h3>
              <p className="text-gray-700 mb-4">
                Has demostrado experiencia con MindHub. El dashboard avanzado te ofrece:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-700">Acceso rápido a herramientas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-700">Escalas favoritas personalizadas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-700">Seguimiento de pacientes prioritarios</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-700">Vista compacta y eficiente</span>
                </div>
              </div>
              <div className="bg-white/60 rounded-lg p-3 mb-4">
                <h4 className="font-semibold text-sm text-gray-800 mb-1">Tu progreso:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>✅ {preferences.metrics.loginCount} sesiones completadas (mínimo: {adminSettings.autoSwitchThresholds.loginCount})</div>
                  <div>✅ {preferences.metrics.patientsAdded} pacientes registrados (mínimo: {adminSettings.autoSwitchThresholds.patientsAdded})</div>
                  <div>✅ {preferences.metrics.scalesApplied} escalas aplicadas (mínimo: {adminSettings.autoSwitchThresholds.scalesApplied})</div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowUpgradeNotification(false)}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center space-x-3 mt-4">
            <Button 
              onClick={handleUpgradeToAdvanced}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Activar Dashboard Avanzado
            </Button>
            <Button 
              onClick={handleStayBeginner}
              variant="outline"
            >
              Mantener Dashboard Actual
            </Button>
          </div>
        </Card>
      )}

      {/* Current Dashboard Mode Indicator */}
      {preferences.dashboardConfig.mode === 'advanced' && !showUpgradeNotification && (
        <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-center space-x-2">
            <LightBulbIcon className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">Dashboard Avanzado Activo</span>
          </div>
          <Button
            onClick={() => updateDashboardConfig({ mode: 'beginner' })}
            variant="outline"
            size="sm"
          >
            Volver a Básico
          </Button>
        </div>
      )}

      {/* Render appropriate dashboard */}
      {dashboardMode === 'advanced' ? (
        <AdvancedDashboard />
      ) : (
        <BeginnerDashboard />
      )}
    </div>
  );
}