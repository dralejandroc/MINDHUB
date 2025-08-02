'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts';
import { CalendarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

interface ScaleHistoryChartProps {
  history: Array<{
    id: string;
    date: string;
    totalScore: number;
    severity: string;
    interpretation: string;
    subscaleScores: Array<{
      name: string;
      score: number;
      severity: string;
    }>;
  }>;
  scaleName: string;
}

// Paleta de colores profesional para las subescalas
const SUBSCALE_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ef4444', // red-500
  '#06b6d4', // cyan-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
  '#84cc16', // lime-500
  '#a855f7', // purple-500
];

// Función para obtener color de severidad
const getSeverityColor = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case 'minimal':
    case 'normal':
      return '#10b981'; // green
    case 'leve':
    case 'mild':
      return '#f59e0b'; // yellow
    case 'moderado':
    case 'moderate':
      return '#f97316'; // orange
    case 'severo':
    case 'severe':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
};

export default function ScaleHistoryChart({ history, scaleName }: ScaleHistoryChartProps) {
  // Preparar datos para la gráfica (ordenados de más antiguo a más reciente)
  const chartData = [...history]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((assessment, index) => {
      const data: any = {
        date: new Date(assessment.date).toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: 'short',
          year: '2-digit'
        }),
        fullDate: new Date(assessment.date).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        totalScore: assessment.totalScore,
        severity: assessment.severity,
        severityColor: getSeverityColor(assessment.severity),
        index: index + 1
      };

      // Agregar puntajes de subescalas
      assessment.subscaleScores?.forEach((subscale, idx) => {
        data[`subscale_${idx}`] = subscale.score;
        data[`subscale_${idx}_name`] = subscale.name;
      });

      return data;
    });

  // Obtener todas las subescalas únicas
  const uniqueSubscales = Array.from(
    new Set(
      history.flatMap(h => h.subscaleScores?.map(s => s.name) || [])
    )
  );

  // Calcular estadísticas
  const scores = history.map(h => h.totalScore);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const latestScore = history[0]?.totalScore || 0;
  const firstScore = history[history.length - 1]?.totalScore || 0;
  const change = latestScore - firstScore;
  const changePercent = firstScore > 0 ? ((change / firstScore) * 100).toFixed(1) : '0';
  
  // Para la mayoría de escalas psicológicas, menor puntaje = mejor estado (menos ansiedad, depresión, etc.)
  // Por tanto, cambio negativo es mejoría (positivo) y cambio positivo es empeoramiento (negativo)
  const isImprovement = change < 0; // Cambio negativo = mejoría
  const isDeterioration = change > 0; // Cambio positivo = empeoramiento

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{data.fullDate}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between space-x-4">
              <span className="text-sm text-gray-600">Puntaje Total:</span>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-gray-900">{data.totalScore}</span>
                <span 
                  className="px-2 py-0.5 text-xs rounded-full text-white"
                  style={{ backgroundColor: data.severityColor }}
                >
                  {data.severity}
                </span>
              </div>
            </div>
            {payload.filter((p: any) => p.dataKey.startsWith('subscale_')).map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between space-x-4">
                <span className="text-sm text-gray-600">{data[`${entry.dataKey}_name`]}:</span>
                <span className="font-medium" style={{ color: entry.color }}>{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-700">Último</span>
            <CalendarIcon className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-900">{latestScore}</div>
          <div className="text-xs text-blue-600 mt-1">
            {history[0]?.severity || 'N/A'}
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-purple-700">Promedio</span>
            <div className="h-4 w-4 bg-purple-500 rounded-full" />
          </div>
          <div className="text-2xl font-bold text-purple-900">{avgScore.toFixed(1)}</div>
          <div className="text-xs text-purple-600 mt-1">
            En {history.length} evaluaciones
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700">Rango</span>
            <div className="h-4 w-4 bg-gray-500 rounded" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{minScore} - {maxScore}</div>
          <div className="text-xs text-gray-600 mt-1">
            Min - Max
          </div>
        </div>

        <div className={`${isImprovement ? 'bg-green-50' : isDeterioration ? 'bg-red-50' : 'bg-gray-50'} rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${isImprovement ? 'text-green-700' : isDeterioration ? 'text-red-700' : 'text-gray-700'}`}>
              Cambio
            </span>
            {isImprovement ? (
              <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" />
            ) : isDeterioration ? (
              <ArrowTrendingUpIcon className="h-4 w-4 text-red-500" />
            ) : (
              <div className="h-4 w-4 bg-gray-400 rounded-full" />
            )}
          </div>
          <div className={`text-2xl font-bold ${isImprovement ? 'text-green-900' : isDeterioration ? 'text-red-900' : 'text-gray-900'}`}>
            {change > 0 ? '+' : ''}{change}
          </div>
          <div className={`text-xs ${isImprovement ? 'text-green-600' : isDeterioration ? 'text-red-600' : 'text-gray-600'} mt-1`}>
            {Math.abs(parseFloat(changePercent))}% {isImprovement ? 'mejoría' : isDeterioration ? 'empeoramiento' : 'sin cambio'} desde inicio
          </div>
        </div>
      </div>

      {/* Gráfica principal */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Evolución Temporal - {scaleName}
        </h4>
        
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fontSize: 12 }}
              label={{ 
                value: 'Puntaje', 
                angle: -90, 
                position: 'insideLeft',
                style: { fontSize: 14, fill: '#374151' }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            
            {/* Línea de promedio */}
            <ReferenceLine 
              y={avgScore} 
              stroke="#9333ea" 
              strokeDasharray="5 5" 
              label={{ value: "Promedio", position: "right", fill: "#9333ea", fontSize: 12 }}
            />
            
            {/* Línea principal del puntaje total */}
            <Line
              type="monotone"
              dataKey="totalScore"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8 }}
              name="Puntaje Total"
            />
            
            {/* Líneas para cada subescala */}
            {uniqueSubscales.map((subscaleName, idx) => {
              const dataKey = `subscale_${history[0]?.subscaleScores?.findIndex(s => s.name === subscaleName) || idx}`;
              return (
                <Line
                  key={subscaleName}
                  type="monotone"
                  dataKey={dataKey}
                  stroke={SUBSCALE_COLORS[idx % SUBSCALE_COLORS.length]}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4 }}
                  name={subscaleName}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda de severidades */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h5 className="text-sm font-semibold text-gray-700 mb-3">Interpretación de Severidad</h5>
        <div className="flex flex-wrap gap-3">
          {['Normal', 'Leve', 'Moderado', 'Severo'].map((severity) => (
            <div key={severity} className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: getSeverityColor(severity) }}
              />
              <span className="text-sm text-gray-600">{severity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Información adicional */}
      <div className="text-sm text-gray-500 space-y-1">
        <p>• <span className="text-blue-600">Línea azul sólida:</span> Puntaje total de la escala</p>
        {uniqueSubscales.length > 0 && (
          <p>• <span className="text-gray-700">Líneas punteadas de colores:</span> Subescalas individuales ({uniqueSubscales.length} subescalas)</p>
        )}
        <p>• <span className="text-purple-600">Línea púrpura punteada:</span> Promedio histórico ({avgScore.toFixed(1)} pts)</p>
        <p>• <span className="text-gray-700">Periodo:</span> {chartData[0]?.date} - {chartData[chartData.length - 1]?.date}</p>
      </div>
    </div>
  );
}