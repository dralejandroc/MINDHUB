'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, Clock, FileText, User, Shield, ArrowLeft, ArrowRight, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { PublicRemoteAssessmentsClient, RemoteAssessmentDetails } from '@/lib/api/remote-assessments-client';

interface AssessmentResponse {
  itemId: string;
  value: string;
  responseText?: string;
}

export default function RemoteAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [assessment, setAssessment] = useState<RemoteAssessmentDetails | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string>('');
  const [showIntro, setShowIntro] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionResult, setCompletionResult] = useState<any>(null);

  // Cargar assessment al montar el componente
  useEffect(() => {
    if (token) {
      loadAssessment();
    }
  }, [token]);

  // Auto-guardado del progreso cada 30 segundos
  useEffect(() => {
    if (!showIntro && !isCompleted && responses.length > 0) {
      const interval = setInterval(() => {
        saveProgress();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [responses, showIntro, isCompleted]);

  const loadAssessment = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const data = await PublicRemoteAssessmentsClient.getAssessmentByToken(token);
      setAssessment(data);
      
      // Si hay progreso previo, cargarlo
      if (data.data.progress) {
        setResponses(data.data.progress.responses);
        setCurrentItemIndex(data.data.progress.currentItemIndex);
        setShowIntro(false); // Ya había empezado
      }
      
      // Si ya está completada
      if (data.data.status === 'completed') {
        setIsCompleted(true);
        setShowIntro(false);
      }
      
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProgress = async () => {
    if (!assessment || responses.length === 0) return;
    
    try {
      setIsSaving(true);
      const percentageComplete = ((currentItemIndex + 1) / assessment.data.scale.totalItems) * 100;
      
      await PublicRemoteAssessmentsClient.saveProgress(token, {
        responses,
        currentItemIndex,
        percentageComplete
      });
    } catch (error) {
      console.error('Error guardando progreso:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResponse = (itemId: string, value: string, responseText?: string) => {
    setResponses(prev => {
      const existing = prev.findIndex(r => r.itemId === itemId);
      const newResponse = { itemId, value, responseText };
      
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newResponse;
        return updated;
      } else {
        return [...prev, newResponse];
      }
    });
  };

  const getCurrentResponse = (itemId: string) => {
    return responses.find(r => r.itemId === itemId);
  };

  const canGoNext = () => {
    if (!assessment) return false;
    const currentItem = assessment.data.scale.items[currentItemIndex];
    return getCurrentResponse(currentItem.id) !== undefined;
  };

  const goNext = () => {
    if (!canGoNext()) return;
    
    if (currentItemIndex < assessment!.data.scale.totalItems - 1) {
      setCurrentItemIndex(prev => prev + 1);
      saveProgress(); // Guardar al avanzar
    }
  };

  const goBack = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(prev => prev - 1);
    }
  };

  const completeAssessment = async () => {
    if (!assessment) return;
    
    try {
      setIsCompleting(true);
      setError('');
      
      const result = await PublicRemoteAssessmentsClient.completeAssessment(token, {
        responses
      });
      
      setCompletionResult(result.data);
      setIsCompleted(true);
      
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsCompleting(false);
    }
  };

  const startAssessment = () => {
    setShowIntro(false);
    setCurrentItemIndex(0);
  };

  // Estados de carga y error
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Cargando Evaluación</h2>
          <p className="text-gray-600">Validando enlace y preparando la evaluación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Ir al Inicio
          </button>
        </div>
      </div>
    );
  }

  if (!assessment) return null;

  // Pantalla de finalización
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-lg w-full">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            ¡Evaluación Completada!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Gracias por completar la evaluación <strong>{assessment.data.scale.name}</strong>. 
            Sus respuestas han sido enviadas exitosamente al profesional.
          </p>

          {completionResult && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Resumen de Resultados</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Respuestas válidas:</strong> {completionResult.summary.validResponses} de {completionResult.scale.totalItems}</p>
                <p><strong>Puntaje total:</strong> {completionResult.totalScore.raw} / {completionResult.totalScore.max}</p>
                {completionResult.totalScore.interpretation && (
                  <p><strong>Interpretación:</strong> {completionResult.totalScore.interpretation.severity}</p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3 text-sm text-gray-500">
            <div className="flex items-center justify-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Sus datos están protegidos y solo serán visibles para su profesional de salud</span>
            </div>
            <p>
              Completado el {new Date().toLocaleDateString('es-ES')} a las {new Date().toLocaleTimeString('es-ES')}
            </p>
          </div>

          <button
            onClick={() => router.push('/')}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Finalizar
          </button>
        </div>
      </div>
    );
  }

  // Pantalla de introducción
  if (showIntro) {
    const expirationDate = new Date(assessment.data.expiresAt);
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Evaluación Clínica
              </h1>
              <p className="text-gray-600">
                {assessment.data.scale.name} ({assessment.data.scale.abbreviation})
              </p>
            </div>

            {/* Información del paciente y profesional */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-900">Paciente</span>
                </div>
                <p className="text-sm text-gray-600">
                  {assessment.data.patient.firstName} {assessment.data.patient.lastName}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-900">Profesional</span>
                </div>
                <p className="text-sm text-gray-600">
                  {assessment.data.administrator.name}
                </p>
              </div>
            </div>

            {/* Mensaje del profesional */}
            {assessment.data.customMessage && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-blue-900 mb-2">Mensaje del Profesional</h3>
                <p className="text-blue-800 text-sm leading-relaxed">
                  {assessment.data.customMessage}
                </p>
              </div>
            )}

            {/* Información de la evaluación */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                  <p className="text-sm font-medium text-gray-900">{assessment.data.scale.totalItems}</p>
                  <p className="text-xs text-gray-600">Preguntas</p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                  <p className="text-sm font-medium text-gray-900">
                    {assessment.data.scale.estimatedDurationMinutes || 15} min
                  </p>
                  <p className="text-xs text-gray-600">Duración aprox.</p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                  <p className="text-sm font-medium text-gray-900">{daysUntilExpiration}</p>
                  <p className="text-xs text-gray-600">Días para completar</p>
                </div>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="bg-yellow-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-yellow-900 mb-2">Instrucciones Importantes</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Responda todas las preguntas de manera honesta y reflexiva</li>
                <li>• No hay respuestas correctas o incorrectas</li>
                <li>• Su progreso se guarda automáticamente</li>
                <li>• Puede pausar y continuar más tarde usando el mismo enlace</li>
                <li>• La evaluación expira el {expirationDate.toLocaleDateString('es-ES')}</li>
              </ul>
            </div>

            {/* Aviso de privacidad */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex items-start space-x-2">
                <Shield className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Protección de Datos</h4>
                  <p className="text-sm text-gray-600">
                    Sus respuestas están protegidas y solo serán accesibles para el profesional de salud 
                    que envió esta evaluación. Los datos se manejan conforme a las normas de privacidad 
                    médica establecidas por su profesional de salud.
                  </p>
                </div>
              </div>
            </div>

            {/* Botón para iniciar */}
            <button
              onClick={startAssessment}
              className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-lg"
            >
              Iniciar Evaluación
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de evaluación
  const currentItem = assessment.data.scale.items[currentItemIndex];
  const progress = ((currentItemIndex + 1) / assessment.data.scale.totalItems) * 100;
  const currentResponse = getCurrentResponse(currentItem.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header con progreso */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {assessment.data.scale.abbreviation}
              </h1>
              <p className="text-sm text-gray-600">
                Pregunta {currentItemIndex + 1} de {assessment.data.scale.totalItems}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {isSaving && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-xs text-blue-600">Guardando...</span>
                </>
              )}
            </div>
          </div>
          
          {/* Barra de progreso */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}% completado</p>
        </div>

        {/* Pregunta actual */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-medium text-gray-900 mb-4 leading-relaxed">
              {currentItem.number}. {currentItem.text}
            </h2>
            
            {currentItem.helpText && (
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {currentItem.helpText}
              </p>
            )}
          </div>

          {/* Opciones de respuesta */}
          <div className="space-y-3">
            {/* Opciones específicas del ítem */}
            {currentItem.specificOptions ? (
              currentItem.specificOptions.map((option: any) => (
                <button
                  key={option.id}
                  onClick={() => handleResponse(currentItem.id, option.value, option.text)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    currentResponse?.value === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start">
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 mt-1 ${
                      currentResponse?.value === option.value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {currentResponse?.value === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium mb-1">({option.value}) {option.text}</p>
                      {option.description && (
                        <p className="text-sm text-gray-600">{option.description}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              /* Opciones globales de la escala */
              assessment.data.scale.responseOptions.map((option: any) => (
                <button
                  key={option.id}
                  onClick={() => handleResponse(currentItem.id, option.value, option.text)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    currentResponse?.value === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      currentResponse?.value === option.value
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {currentResponse?.value === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                      )}
                    </div>
                    <span className="font-medium">({option.value}) {option.text}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Botones de navegación */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex justify-between items-center">
            <button
              onClick={goBack}
              disabled={currentItemIndex === 0}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            <div className="text-sm text-gray-500">
              {responses.length} de {assessment.data.scale.totalItems} respondidas
            </div>

            {currentItemIndex === assessment.data.scale.totalItems - 1 ? (
              <button
                onClick={completeAssessment}
                disabled={!canGoNext() || isCompleting}
                className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCompleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{isCompleting ? 'Finalizando...' : 'Finalizar'}</span>
              </button>
            ) : (
              <button
                onClick={goNext}
                disabled={!canGoNext()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Siguiente</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Error en la parte inferior */}
        {error && (
          <div className="mt-4 bg-red-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}