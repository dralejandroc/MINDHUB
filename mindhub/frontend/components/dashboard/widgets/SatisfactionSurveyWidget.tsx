"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, RefreshCw, MessageCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SurveyStatistics {
  overall: {
    average_score: number;
    total_surveys: number;
  };
  by_type: Array<{
    survey_type: string;
    average_score: number;
    count: number;
  }>;
}

interface SatisfactionSurveyWidgetProps {
  title?: string;
  description?: string;
  className?: string;
}

export default function SatisfactionSurveyWidget({
  title = "Satisfacción del Paciente",
  description = "Evaluaciones y retroalimentación de pacientes",
  className
}: SatisfactionSurveyWidgetProps) {
  const [stats, setStats] = useState<SurveyStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSatisfactionStats();
  }, []);

  const fetchSatisfactionStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/analytics/django/satisfaction-surveys/statistics/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar estadísticas de satisfacción');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching satisfaction stats:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const getSurveyTypeDisplay = (type: string) => {
    const types = {
      'medical_attention': 'Atención Médica',
      'global': 'Satisfacción Global',
      'customer_service': 'Atención al Cliente',
    };
    return types[type as keyof typeof types] || type;
  };

  const getSurveyTypeColor = (type: string) => {
    const colors = {
      'medical_attention': 'bg-blue-100 text-blue-800',
      'global': 'bg-green-100 text-green-800',
      'customer_service': 'bg-purple-100 text-purple-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const renderStars = (score: number) => {
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;
    const emptyStars = 10 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && (
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 opacity-50" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
        ))}
        <span className="text-sm text-gray-600 ml-1">
          {score.toFixed(1)}/10
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
            </div>
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
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
            <MessageCircle className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchSatisfactionStats} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.overall.total_surveys === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <Button onClick={fetchSatisfactionStats} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No hay encuestas disponibles</p>
            <p className="text-sm text-gray-400">
              Las encuestas de satisfacción aparecerán aquí cuando los pacientes las completen
            </p>
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
              <MessageCircle className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button onClick={fetchSatisfactionStats} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <span className="text-lg font-semibold">Puntuación General</span>
          </div>
          
          <div className="flex items-center justify-center mb-2">
            {renderStars(stats.overall.average_score)}
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <Badge 
              variant="secondary"
              className={cn("text-sm", getScoreBadgeColor(stats.overall.average_score))}
            >
              {stats.overall.average_score.toFixed(1)} / 10
            </Badge>
            <span className="text-sm text-gray-600">
              ({stats.overall.total_surveys} encuestas)
            </span>
          </div>
        </div>

        {/* By Type */}
        {stats.by_type.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Por Tipo de Encuesta</h4>
            
            {stats.by_type.map((typeStats) => (
              <div key={typeStats.survey_type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary"
                      className={cn("text-xs", getSurveyTypeColor(typeStats.survey_type))}
                    >
                      {getSurveyTypeDisplay(typeStats.survey_type)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      ({typeStats.count} respuestas)
                    </span>
                  </div>
                  <span className={cn("font-medium", getScoreColor(typeStats.average_score))}>
                    {typeStats.average_score.toFixed(1)}/10
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      typeStats.average_score >= 8 ? "bg-green-500" :
                      typeStats.average_score >= 6 ? "bg-yellow-500" : "bg-red-500"
                    )}
                    style={{ width: `${(typeStats.average_score / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Message */}
        <div className="text-xs text-gray-500 p-3 bg-blue-50 rounded-lg">
          <p className="font-medium text-blue-800 mb-1">💡 Resumen</p>
          <p>
            {stats.overall.average_score >= 8 
              ? "Excelente nivel de satisfacción. Los pacientes están muy satisfechos con la atención."
              : stats.overall.average_score >= 6
              ? "Buen nivel de satisfacción, pero hay oportunidades de mejora."
              : "Nivel de satisfacción mejorable. Considere revisar los procesos de atención."
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}