/**
 * COMPONENTE - Revisión Manual de Formularios FormX
 * Sistema de confirmación para casos dudosos de matching
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  UserIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
  ClockIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase/client';
import { expedixApi, Patient } from '@/lib/api/expedix-client';
import { formXIntegration, type FormXSubmission, type PatientMatch } from '@/lib/services/FormXExpedixIntegration';

interface FormXSubmissionReviewProps {
  onSubmissionProcessed?: (submissionId: string) => void;
}

interface PendingSubmission extends FormXSubmission {
  possibleMatches: PatientMatch[];
}

export default function FormXSubmissionReview({ onSubmissionProcessed }: FormXSubmissionReviewProps) {
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<PendingSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadPendingSubmissions();
  }, []);

  const loadPendingSubmissions = async () => {
    try {
      setLoading(true);
      
      // Cargar submissions pendientes de matching
      const { data, error } = await supabase
        .from('formx_submissions')
        .select('*')
        .in('status', ['pending_match', 'matched'])
        .order('submission_date', { ascending: false });

      if (error) throw error;

      // Para cada submission, obtener posibles matches
      const submissionsWithMatches = await Promise.all(
        data.map(async (submission) => {
          const matches = await formXIntegration.findPatientMatches({
            fullName: submission.patient_name,
            birthDate: submission.birth_date,
            email: submission.email,
            phone: submission.phone
          });

          return {
            ...submission,
            possibleMatches: matches
          } as PendingSubmission;
        })
      );

      setPendingSubmissions(submissionsWithMatches);
    } catch (error) {
      console.error('Error loading pending submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMatch = async (submissionId: string, patientId: string) => {
    try {
      setProcessing(submissionId);

      // Actualizar submission como confirmada
      const { error: updateError } = await supabase
        .from('formx_submissions')
        .update({
          status: 'confirmed',
          matched_patient_id: patientId,
          confidence: 100 // Confirmación manual = 100% confianza
        })
        .eq('id', submissionId);

      if (updateError) throw updateError;

      // Procesar la submission confirmada
      const submission = pendingSubmissions.find(s => s.id === submissionId);
      if (submission) {
        const patient = submission.possibleMatches.find(m => m.patient.id === patientId)?.patient;
        if (patient) {
          await formXIntegration.processAutomaticMatch(submission, patient);
        }
      }

      // Actualizar lista
      await loadPendingSubmissions();
      
      if (onSubmissionProcessed) {
        onSubmissionProcessed(submissionId);
      }

    } catch (error) {
      console.error('Error confirming match:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectMatch = async (submissionId: string) => {
    try {
      setProcessing(submissionId);

      // Marcar como archivada (no procesable automáticamente)
      const { error } = await supabase
        .from('formx_submissions')
        .update({
          status: 'archived'
        })
        .eq('id', submissionId);

      if (error) throw error;

      await loadPendingSubmissions();

    } catch (error) {
      console.error('Error rejecting submission:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleCreateNewPatient = async (submissionId: string) => {
    try {
      setProcessing(submissionId);

      const submission = pendingSubmissions.find(s => s.id === submissionId);
      if (!submission) return;

      // Crear nuevo paciente basado en información del formulario
      const newPatient = {
        first_name: submission.patientName?.split(' ')[0] || '',
        paternal_last_name: submission.patientName?.split(' ')[1] || '',
        maternal_last_name: submission.patientName?.split(' ').slice(2).join(' ') || '',
        birth_date: submission.birthDate || '',
        email: submission.email || '',
        cell_phone: submission.phone || '',
        gender: 'male' as const, // Default value, should be collected from form
        created_from_formx: true,
        formx_submission_id: submissionId
      };

      const createResult = await expedixApi.createPatient(newPatient);
      
      if (createResult?.data) {
        // Confirmar match con el nuevo paciente
        await handleConfirmMatch(submissionId, createResult.data.id);
      }

    } catch (error) {
      console.error('Error creating new patient:', error);
    } finally {
      setProcessing(null);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600 bg-green-100';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Cargando formularios pendientes...</span>
      </div>
    );
  }

  if (pendingSubmissions.length === 0) {
    return (
      <Card className="p-6 text-center">
        <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay formularios pendientes</h3>
        <p className="text-gray-600">
          Todos los formularios de FormX han sido procesados automáticamente
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Formularios FormX Pendientes</h2>
          <p className="text-sm text-gray-600 mt-1">
            {pendingSubmissions.length} formulario(s) requieren revisión manual
          </p>
        </div>
        <Button onClick={loadPendingSubmissions} variant="outline">
          <ArrowRightIcon className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Lista de submissions pendientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pendingSubmissions.map((submission) => (
          <Card key={submission.id} className="overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <DocumentTextIcon className="w-5 h-5" />
                    {submission.formTitle}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    <ClockIcon className="w-4 h-4 inline mr-1" />
                    {new Date(submission.submissionDate).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  submission.status === 'pending_match' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {submission.status === 'pending_match' ? 'Pendiente' : 'Para revisar'}
                </span>
              </div>
            </div>

            <div className="p-4">
              {/* Información del paciente del formulario */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  Información del Formulario
                </h4>
                <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                  <p><strong>Nombre:</strong> {submission.patientName || 'No especificado'}</p>
                  <p><strong>Fecha de nacimiento:</strong> {submission.birthDate || 'No especificada'}</p>
                  {submission.email && <p><strong>Email:</strong> {submission.email}</p>}
                  {submission.phone && <p><strong>Teléfono:</strong> {submission.phone}</p>}
                </div>
              </div>

              {/* Posibles coincidencias */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <MagnifyingGlassIcon className="w-4 h-4" />
                  Posibles Coincidencias ({submission.possibleMatches.length})
                </h4>
                
                {submission.possibleMatches.length === 0 ? (
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="text-yellow-800 text-sm">
                      <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" />
                      No se encontraron coincidencias automáticas
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {submission.possibleMatches.slice(0, 3).map((match) => (
                      <div key={match.patient.id} className="border rounded-lg p-3 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {match.patient.first_name} {match.patient.paternal_last_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              Nacido: {match.patient.birth_date}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {match.matchReasons.join(' • ')}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(match.confidence)}`}>
                              {Math.round(match.confidence)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => handleConfirmMatch(submission.id, match.patient.id)}
                            disabled={processing === submission.id}
                            className="flex items-center gap-1"
                          >
                            <CheckCircleIcon className="w-3 h-3" />
                            Confirmar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="flex flex-wrap gap-2 pt-3 border-t">
                {submission.possibleMatches.length === 0 && (
                  <Button
                    onClick={() => handleCreateNewPatient(submission.id)}
                    disabled={processing === submission.id}
                    className="flex items-center gap-2"
                  >
                    <IdentificationIcon className="w-4 h-4" />
                    Crear Nuevo Paciente
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => handleRejectMatch(submission.id)}
                  disabled={processing === submission.id}
                  className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
                >
                  <XCircleIcon className="w-4 h-4" />
                  Archivar
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => setSelectedSubmission(submission)}
                  className="flex items-center gap-2"
                >
                  <DocumentTextIcon className="w-4 h-4" />
                  Ver Respuestas
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal para ver respuestas del formulario */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{selectedSubmission.formTitle}</h3>
                  <p className="text-sm text-gray-600">
                    Respuestas del formulario • {selectedSubmission.patientName}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedSubmission(null)}
                  className="p-2"
                >
                  <XCircleIcon className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {Object.entries(selectedSubmission.responses).map(([question, answer]) => (
                <div key={question} className="border-b pb-3">
                  <p className="font-medium text-gray-900 mb-1">{question}</p>
                  <p className="text-sm text-gray-700">{String(answer)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}