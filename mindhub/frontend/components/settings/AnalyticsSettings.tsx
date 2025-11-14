"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { 
  ChartBarIcon, 
  RefreshCw, 
  Save, 
  Settings,
  Eye,
  EyeOff,
  Target,
  Bell,
  Palette
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IndicatorDefinition {
  id: string;
  name: string;
  objective: string;
  category: string;
  indicator_type: string;
  frequency: string;
  target_value: number;
  is_active: boolean;
  applies_to: string;
}

interface IndicatorSettings {
  id?: string;
  clinic_id?: boolean;
  user_id?: string;
  enabled_indicators: string[];
  custom_targets: { [key: string]: number };
  notification_preferences: {
    email_alerts: boolean;
    threshold_alerts: boolean;
    weekly_reports: boolean;
    monthly_reports: boolean;
    alert_threshold: number;
  };
  dashboard_layout: {
    show_trends: boolean;
    show_classifications: boolean;
    show_satisfaction: boolean;
    card_size: 'compact' | 'normal' | 'large';
  };
  clinical_guidelines: {
    abandonment_tolerance_days: number;
    minimum_note_completeness: number;
    protocol_deviation_threshold: number;
  };
}

export default function AnalyticsSettings() {
  const [indicators, setIndicators] = useState<IndicatorDefinition[]>([]);
  const [settings, setSettings] = useState<IndicatorSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyticsSettings();
  }, []);

  const loadAnalyticsSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load indicator definitions
      const indicatorsResponse = await fetch('/api/analytics/django/indicator-definitions/', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!indicatorsResponse.ok) {
        throw new Error('Error al cargar definiciones de indicadores');
      }

      const indicatorsData = await indicatorsResponse.json();
      setIndicators(indicatorsData.results || indicatorsData);

      // Load user settings - let backend handle clinic/workspace context via JWT
      const settingsResponse = await fetch('/api/analytics/django/settings/', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        if (settingsData.results && settingsData.results.length > 0) {
          setSettings(settingsData.results[0]);
        } else {
          // Create default settings - backend will provide clinic/workspace context
          setDefaultSettings('');
        }
      } else {
        setDefaultSettings('');
      }

    } catch (err) {
      console.error('Error loading analytics settings:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const setDefaultSettings = (clinicId: string) => {
    setSettings({
      // Backend will provide clinic_id/workspace_id via JWT context
      enabled_indicators: [],
      custom_targets: {},
      notification_preferences: {
        email_alerts: true,
        threshold_alerts: true,
        weekly_reports: false,
        monthly_reports: true,
        alert_threshold: 80
      },
      dashboard_layout: {
        show_trends: true,
        show_classifications: true,
        show_satisfaction: true,
        card_size: 'normal'
      },
      clinical_guidelines: {
        abandonment_tolerance_days: 15,
        minimum_note_completeness: 80,
        protocol_deviation_threshold: 10
      }
    });
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const method = settings.id ? 'PUT' : 'POST';
      const url = settings.id 
        ? `/api/analytics/django/settings/${settings.id}/`
        : '/api/analytics/django/settings/';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Error al guardar configuración');
      }

      const savedSettings = await response.json();
      setSettings(savedSettings);
      toast.success('Configuración guardada exitosamente');

    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const toggleIndicator = (indicatorId: string) => {
    if (!settings) return;

    const enabledIndicators = [...settings.enabled_indicators];
    const index = enabledIndicators.indexOf(indicatorId);

    if (index >= 0) {
      enabledIndicators.splice(index, 1);
    } else {
      enabledIndicators.push(indicatorId);
    }

    setSettings({
      ...settings,
      enabled_indicators: enabledIndicators
    });
  };

  const updateCustomTarget = (indicatorId: string, value: number) => {
    if (!settings) return;

    setSettings({
      ...settings,
      custom_targets: {
        ...settings.custom_targets,
        [indicatorId]: value
      }
    });
  };

  const updateNotificationPreference = (key: string, value: any) => {
    if (!settings) return;

    setSettings({
      ...settings,
      notification_preferences: {
        ...settings.notification_preferences,
        [key]: value
      }
    });
  };

  const updateDashboardLayout = (key: string, value: any) => {
    if (!settings) return;

    setSettings({
      ...settings,
      dashboard_layout: {
        ...settings.dashboard_layout,
        [key]: value
      }
    });
  };

  const updateClinicalGuideline = (key: string, value: number) => {
    if (!settings) return;

    setSettings({
      ...settings,
      clinical_guidelines: {
        ...settings.clinical_guidelines,
        [key]: value
      }
    });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Crecimiento': 'bg-blue-100 text-blue-800',
      'Calidad': 'bg-green-100 text-green-800',
      'Satisfacción': 'bg-purple-100 text-purple-800',
      'Eficiencia': 'bg-orange-100 text-orange-800',
      'Gestión': 'bg-gray-100 text-gray-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <ChartBarIcon className="h-5 w-5" />
            Error en Configuración de Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadAnalyticsSettings} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ChartBarIcon className="h-6 w-6" />
            Configuración de Analytics
          </h2>
          <p className="text-gray-600">
            Personaliza los indicadores de rendimiento y configuraciones del dashboard
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving || !settings}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      {/* Indicator Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Indicadores Disponibles
          </CardTitle>
          <CardDescription>
            Selecciona qué indicadores deseas que aparezcan en tu dashboard y configura sus metas personalizadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {indicators.map((indicator) => {
            const isEnabled = settings?.enabled_indicators.includes(indicator.id);
            const customTarget = settings?.custom_targets[indicator.id] || indicator.target_value;

            return (
              <div key={indicator.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                <div className="flex items-center space-x-3 flex-1">
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => toggleIndicator(indicator.id)}
                    className="flex-shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{indicator.name}</h4>
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs", getCategoryColor(indicator.category))}
                      >
                        {indicator.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{indicator.objective}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Frecuencia: {indicator.frequency}</span>
                      <span>Aplica a: {indicator.applies_to}</span>
                      <span>Meta predeterminada: {indicator.target_value}</span>
                    </div>
                  </div>
                </div>

                {isEnabled && (
                  <div className="flex-shrink-0">
                    <Label htmlFor={`target-${indicator.id}`} className="text-xs text-gray-600">
                      Meta personalizada
                    </Label>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-gray-400" />
                      <Input
                        id={`target-${indicator.id}`}
                        type="number"
                        value={customTarget}
                        onChange={(e) => updateCustomTarget(indicator.id, parseFloat(e.target.value) || 0)}
                        className="w-20 text-sm"
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {indicators.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No se encontraron indicadores disponibles</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dashboard Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Layout del Dashboard
          </CardTitle>
          <CardDescription>
            Configura cómo se muestran los widgets de analytics en tu dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-trends">Mostrar gráficos de tendencias</Label>
              <Switch
                id="show-trends"
                checked={settings?.dashboard_layout.show_trends}
                onCheckedChange={(checked) => updateDashboardLayout('show_trends', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-classifications">Mostrar clasificaciones de pacientes</Label>
              <Switch
                id="show-classifications"
                checked={settings?.dashboard_layout.show_classifications}
                onCheckedChange={(checked) => updateDashboardLayout('show_classifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-satisfaction">Mostrar encuestas de satisfacción</Label>
              <Switch
                id="show-satisfaction"
                checked={settings?.dashboard_layout.show_satisfaction}
                onCheckedChange={(checked) => updateDashboardLayout('show_satisfaction', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="card-size">Tamaño de tarjetas</Label>
              <select
                id="card-size"
                value={settings?.dashboard_layout.card_size}
                onChange={(e) => updateDashboardLayout('card_size', e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="compact">Compacto</option>
                <option value="normal">Normal</option>
                <option value="large">Grande</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Preferencias de Notificaciones
          </CardTitle>
          <CardDescription>
            Configura cuándo y cómo recibir alertas sobre tus indicadores de rendimiento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-alerts">Alertas por email</Label>
              <Switch
                id="email-alerts"
                checked={settings?.notification_preferences.email_alerts}
                onCheckedChange={(checked) => updateNotificationPreference('email_alerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="threshold-alerts">Alertas por umbral</Label>
              <Switch
                id="threshold-alerts"
                checked={settings?.notification_preferences.threshold_alerts}
                onCheckedChange={(checked) => updateNotificationPreference('threshold_alerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="weekly-reports">Reportes semanales</Label>
              <Switch
                id="weekly-reports"
                checked={settings?.notification_preferences.weekly_reports}
                onCheckedChange={(checked) => updateNotificationPreference('weekly_reports', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="monthly-reports">Reportes mensuales</Label>
              <Switch
                id="monthly-reports"
                checked={settings?.notification_preferences.monthly_reports}
                onCheckedChange={(checked) => updateNotificationPreference('monthly_reports', checked)}
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <Label htmlFor="alert-threshold" className="text-sm font-medium">
              Umbral de alerta (% de cumplimiento de meta)
            </Label>
            <div className="mt-1 flex items-center gap-2">
              <Input
                id="alert-threshold"
                type="number"
                value={settings?.notification_preferences.alert_threshold}
                onChange={(e) => updateNotificationPreference('alert_threshold', parseInt(e.target.value) || 80)}
                className="w-20"
                min="0"
                max="100"
              />
              <span className="text-sm text-gray-500">
                Te alertaremos cuando un indicador esté por debajo de este porcentaje
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clinical Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Parámetros Clínicos</CardTitle>
          <CardDescription>
            Ajusta los criterios clínicos utilizados para calcular los indicadores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="abandonment-tolerance">Tolerancia de abandono (días)</Label>
              <Input
                id="abandonment-tolerance"
                type="number"
                value={settings?.clinical_guidelines.abandonment_tolerance_days}
                onChange={(e) => updateClinicalGuideline('abandonment_tolerance_days', parseInt(e.target.value) || 15)}
                className="mt-1"
                min="1"
                max="365"
              />
              <p className="text-xs text-gray-500 mt-1">
                Días sin cita para considerar abandono terapéutico
              </p>
            </div>

            <div>
              <Label htmlFor="note-completeness">Completitud mínima de notas (%)</Label>
              <Input
                id="note-completeness"
                type="number"
                value={settings?.clinical_guidelines.minimum_note_completeness}
                onChange={(e) => updateClinicalGuideline('minimum_note_completeness', parseInt(e.target.value) || 80)}
                className="mt-1"
                min="0"
                max="100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Porcentaje mínimo de campos completados en notas clínicas
              </p>
            </div>

            <div>
              <Label htmlFor="protocol-deviation">Umbral de desviación de protocolo (%)</Label>
              <Input
                id="protocol-deviation"
                type="number"
                value={settings?.clinical_guidelines.protocol_deviation_threshold}
                onChange={(e) => updateClinicalGuideline('protocol_deviation_threshold', parseInt(e.target.value) || 10)}
                className="mt-1"
                min="0"
                max="100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Porcentaje máximo de desviación aceptable de protocolos clínicos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}