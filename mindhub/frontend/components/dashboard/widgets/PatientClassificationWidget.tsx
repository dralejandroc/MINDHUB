"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, RefreshCw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PatientClassification {
  id: string;
  patient_id: string;
  classification: string;
  classification_display: string;
  attendance_rate: number;
  professionals_seen: number;
  treatment_adherence: number;
  time_in_treatment: number;
  additional_programs: number;
  last_evaluation: string;
}

interface ClassificationStats {
  classification: string;
  count: number;
  percentage: number;
}

interface PatientClassificationWidgetProps {
  title?: string;
  description?: string;
  className?: string;
}

export default function PatientClassificationWidget({
  title = "Clasificación de Pacientes",
  description = "Distribución de pacientes por nivel de integración",
  className
}: PatientClassificationWidgetProps) {
  const [classifications, setClassifications] = useState<PatientClassification[]>([]);
  const [stats, setStats] = useState<ClassificationStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPatientClassifications();
  }, []);

  const fetchPatientClassifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/analytics/django/patient-classifications/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar clasificaciones');
      }

      const data = await response.json();
      setClassifications(data.results || data);
      
      // Calculate statistics
      const classificationCounts: { [key: string]: number } = {};
      data.forEach((item: PatientClassification) => {
        const display = item.classification_display || item.classification;
        classificationCounts[display] = (classificationCounts[display] || 0) + 1;
      });

      const total = data.length;
      const calculatedStats = Object.entries(classificationCounts).map(([classification, count]) => ({
        classification,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }));

      setStats(calculatedStats.sort((a, b) => b.count - a.count));
    } catch (err) {
      console.error('Error fetching patient classifications:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const getClassificationColor = (classification: string) => {
    const colors = {
      'P. Inconstante': 'bg-red-100 text-red-800',
      'P. en Acompañamiento': 'bg-yellow-100 text-yellow-800',
      'Integración Inicial': 'bg-blue-100 text-blue-800',
      'P. Integración Avanzada': 'bg-green-100 text-green-800',
      'P. Integrado': 'bg-green-100 text-green-800',
      'Arraigado': 'bg-emerald-100 text-emerald-800',
      'P. de Alta': 'bg-purple-100 text-purple-800',
    };
    return colors[classification as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getClassificationIcon = (classification: string) => {
    if (classification.includes('Alta')) return '🎓';
    if (classification.includes('Arraigado')) return '🌳';
    if (classification.includes('Integrado')) return '💚';
    if (classification.includes('Avanzada')) return '📈';
    if (classification.includes('Inicial')) return '🌱';
    if (classification.includes('Acompañamiento')) return '🤝';
    if (classification.includes('Inconstante')) return '⚠️';
    return '👤';
  };

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex justify-between items-center mb-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-200 rounded w-12"></div>
                </div>
                <div className="h-2 bg-gray-200 rounded"></div>
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
            <Users className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchPatientClassifications} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPatients = stats.reduce((sum, stat) => sum + stat.count, 0);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button onClick={fetchPatientClassifications} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay clasificaciones disponibles</p>
            <p className="text-sm text-gray-400 mt-2">
              Las clasificaciones se actualizarán automáticamente
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Total de pacientes clasificados: <span className="font-medium">{totalPatients}</span>
            </div>
            
            {stats.map((stat) => (
              <div key={stat.classification} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getClassificationIcon(stat.classification)}</span>
                    <span className="text-sm font-medium">{stat.classification}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className={cn("text-xs", getClassificationColor(stat.classification))}
                    >
                      {stat.count}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {stat.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stat.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
            
            {classifications.length > 0 && (
              <div className="pt-4 border-t">
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Última evaluación: {' '}
                  {new Date(
                    Math.max(...classifications.map(c => new Date(c.last_evaluation).getTime()))
                  ).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}