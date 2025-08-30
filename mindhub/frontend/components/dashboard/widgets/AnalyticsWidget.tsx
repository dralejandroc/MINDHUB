"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { TrendingUp, TrendingDown, Minus, RefreshCw, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IndicatorData {
  id: string;
  name: string;
  category: string;
  current_value: number;
  target_value: number;
  achievement_percentage: number;
  trend: 'up' | 'down' | 'stable';
  period_start: string;
  period_end: string;
  status: string;
}

interface AnalyticsWidgetProps {
  title?: string;
  description?: string;
  className?: string;
}

export default function AnalyticsWidget({
  title = "Indicadores de Rendimiento",
  description = "KPIs y métricas clave de la clínica",
  className
}: AnalyticsWidgetProps) {
  const [indicators, setIndicators] = useState<IndicatorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardIndicators();
  }, []);

  const fetchDashboardIndicators = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get clinic/workspace ID from user context or storage
      const clinicId = localStorage.getItem('currentClinicId') || 
                     sessionStorage.getItem('userWorkspaceId');
      
      if (!clinicId) {
        setError('No se encontró identificador de clínica o workspace');
        return;
      }

      const response = await fetch(`/api/analytics/django/indicator-values/dashboard/?clinic_id=${clinicId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar indicadores');
      }

      const data = await response.json();
      setIndicators(data);
    } catch (err) {
      console.error('Error fetching indicators:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAchievementColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      maximumFractionDigits: 1
    }).format(value);
  };

  const getCategoryBadgeColor = (category: string) => {
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
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-2 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchDashboardIndicators} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button onClick={fetchDashboardIndicators} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {indicators.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay indicadores disponibles</p>
            <p className="text-sm text-gray-400 mt-2">
              Los indicadores se calcularán automáticamente conforme se use la plataforma
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {indicators.map((indicator) => (
              <div key={indicator.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium">{indicator.name}</h4>
                    <Badge 
                      variant="secondary" 
                      className={cn("text-xs", getCategoryBadgeColor(indicator.category))}
                    >
                      {indicator.category}
                    </Badge>
                  </div>
                  {getTrendIcon(indicator.trend)}
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {formatValue(indicator.current_value)} / {formatValue(indicator.target_value)}
                  </span>
                  <span className={cn("font-medium", getAchievementColor(indicator.achievement_percentage))}>
                    {formatValue(indicator.achievement_percentage)}%
                  </span>
                </div>
                
                <Progress 
                  value={Math.min(indicator.achievement_percentage, 100)} 
                  className="h-2"
                />
                
                <div className="text-xs text-gray-500">
                  Período: {new Date(indicator.period_start).toLocaleDateString()} - {' '}
                  {new Date(indicator.period_end).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}