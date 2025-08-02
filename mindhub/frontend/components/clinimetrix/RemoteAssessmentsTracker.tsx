'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Clock, CheckCircle2, XCircle, AlertCircle, Copy, MessageSquare, RotateCcw, Calendar, Smartphone, Monitor, Tablet } from 'lucide-react';
import RemoteAssessmentsClient, { AdministratorAssessments } from '@/lib/api/remote-assessments-client';

interface RemoteAssessmentsTrackerProps {
  administratorId: string;
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Pendiente',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200'
  },
  accessed: {
    icon: Eye,
    label: 'Accedida',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200'
  },
  in_progress: {
    icon: AlertCircle,
    label: 'En Progreso',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200'
  },
  completed: {
    icon: CheckCircle2,
    label: 'Completada',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200'
  },
  expired: {
    icon: XCircle,
    label: 'Expirada',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200'
  }
};

const deviceIcons = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
  unknown: Monitor
};

export default function RemoteAssessmentsTracker({ administratorId }: RemoteAssessmentsTrackerProps) {
  const [assessments, setAssessments] = useState<AdministratorAssessments | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [error, setError] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<string>('');

  useEffect(() => {
    loadAssessments();
  }, [administratorId, selectedStatus]);

  const loadAssessments = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const options: any = { limit: 50 };
      if (selectedStatus !== 'all') {
        options.status = selectedStatus;
      }
      
      const data = await RemoteAssessmentsClient.getAdministratorAssessments(administratorId, options);
      setAssessments(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(id);
      setTimeout(() => setCopiedLink(''), 2000);
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
    }
  };

  const generateWhatsAppMessage = (assessment: any) => {
    const message = `Hola ${assessment.patient.name},

${assessment.customMessage || 'Le envío esta evaluación clínica para completar.'}

Por favor accede al siguiente enlace para completar la evaluación:
${assessment.assessmentUrl}

Esta evaluación expira el: ${new Date(assessment.expiresAt).toLocaleDateString('es-ES')}

Saludos`;

    return encodeURIComponent(message);
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiration = new Date(expiresAt);
    const diffMs = expiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expirado';
    if (diffDays === 0) return 'Expira hoy';
    if (diffDays === 1) return 'Expira mañana';
    return `${diffDays} días restantes`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadAssessments}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4 inline mr-2" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Evaluaciones Remotas Enviadas
          </h2>
          <button
            onClick={loadAssessments}
            className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            title="Actualizar"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Resumen */}
        {assessments?.data.summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            {Object.entries(assessments.data.summary).map(([status, count]) => {
              const config = statusConfig[status as keyof typeof statusConfig];
              const StatusIcon = config.icon;
              
              return (
                <div 
                  key={status}
                  className={`p-3 rounded-lg ${config.bg} ${config.border} border cursor-pointer transition-all ${
                    selectedStatus === status ? 'ring-2 ring-offset-1 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedStatus(selectedStatus === status ? 'all' : status)}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <StatusIcon className={`w-4 h-4 ${config.color}`} />
                    <span className={`text-sm font-medium ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Filtros */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas ({assessments?.data.pagination.total || 0})
          </button>
          {Object.entries(statusConfig).map(([status, config]) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(selectedStatus === status ? 'all' : status)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {config.label} ({assessments?.data.summary[status as keyof typeof assessments.data.summary] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Lista de evaluaciones */}
      <div className="divide-y">
        {assessments?.data.assessments.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay evaluaciones
            </h3>
            <p className="text-gray-600">
              {selectedStatus === 'all' 
                ? 'Aún no has enviado evaluaciones remotas'
                : `No hay evaluaciones con estado "${statusConfig[selectedStatus as keyof typeof statusConfig]?.label}"`
              }
            </p>
          </div>
        ) : (
          assessments?.data.assessments.map((assessment: any) => {
            const config = statusConfig[assessment.status as keyof typeof statusConfig];
            const StatusIcon = config.icon;
            const DeviceIcon = assessment.lastAccess 
              ? deviceIcons[assessment.lastAccess.deviceType as keyof typeof deviceIcons] || deviceIcons.unknown
              : deviceIcons.unknown;

            return (
              <div key={assessment.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {assessment.patient.name}
                      </h3>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {config.label}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>Escala:</strong> {assessment.scale.name} ({assessment.scale.abbreviation})
                      </p>
                      <p>
                        <strong>Enviado:</strong> {formatDate(assessment.createdAt)}
                      </p>
                      <p className={`${
                        assessment.status === 'expired' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        <strong>Expira:</strong> {getTimeRemaining(assessment.expiresAt)}
                      </p>
                      
                      {assessment.accessedAt && (
                        <p>
                          <strong>Último acceso:</strong> {formatDate(assessment.accessedAt)}
                          {assessment.lastAccess && (
                            <span className="ml-2">
                              <DeviceIcon className="w-4 h-4 inline" />
                            </span>
                          )}
                        </p>
                      )}
                      
                      {assessment.completedAt && (
                        <p className="text-green-600">
                          <strong>Completado:</strong> {formatDate(assessment.completedAt)}
                        </p>
                      )}
                    </div>

                    {assessment.customMessage && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Mensaje:</strong> {assessment.customMessage}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="ml-4 flex flex-col space-y-2">
                    <button
                      onClick={() => copyToClipboard(assessment.assessmentUrl, assessment.id)}
                      className={`px-3 py-2 rounded-md text-sm transition-colors ${
                        copiedLink === assessment.id
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title="Copiar enlace"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    
                    {assessment.patient.phone && (
                      <a
                        href={`https://wa.me/${assessment.patient.phone.replace(/\D/g, '')}?text=${generateWhatsAppMessage(assessment)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                        title="Enviar por WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Progreso visual para evaluaciones en progreso */}
                {assessment.status === 'in_progress' && assessment.lastAccess && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700">Progreso estimado</span>
                      <span className="text-blue-600 font-medium">
                        En curso...
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: '40%' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Paginación (si hay más resultados) */}
      {assessments?.data.pagination.hasMore && (
        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={() => {
              // TODO: Implementar carga de más resultados
              console.log('Cargar más resultados');
            }}
            className="w-full px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Cargar más evaluaciones
          </button>
        </div>
      )}
    </div>
  );
}