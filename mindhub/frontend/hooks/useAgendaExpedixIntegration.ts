'use client';

import { useState, useCallback } from 'react';
import { expedixApi } from '@/lib/api/expedix-client';

export interface AppointmentConsultationData {
  appointmentId: string;
  patientId: string;
  scheduledDate: string;
  scheduledTime: string;
  appointmentType: string;
  reason?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface AutoCreatedConsultation {
  id: string;
  appointmentId: string;
  patientId: string;
  date: string;
  noteType: string;
  status: 'draft' | 'completed';
  createdFromAppointment: boolean;
  originalAppointmentData: AppointmentConsultationData;
}

export function useAgendaExpedixIntegration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Auto-creates a consultation in Expedix when an appointment is scheduled
   * This ensures that every appointment has a corresponding consultation ready
   */
  const createConsultationFromAppointment = useCallback(async (
    appointmentData: AppointmentConsultationData
  ): Promise<AutoCreatedConsultation | null> => {
    try {
      setLoading(true);
      setError(null);

      console.log('[Agenda→Expedix] Auto-creating consultation for appointment:', appointmentData.appointmentId);

      // Create consultation data based on appointment
      const consultationData = {
        patientId: appointmentData.patientId,
        appointmentId: appointmentData.appointmentId,
        date: appointmentData.scheduledDate,
        scheduledTime: appointmentData.scheduledTime,
        noteType: mapAppointmentTypeToNoteType(appointmentData.appointmentType),
        currentCondition: appointmentData.reason || '',
        diagnosis: '',
        status: 'draft' as const,
        createdFromAppointment: true,
        originalAppointmentData: appointmentData,
        vitalSigns: {
          height: '',
          weight: '',
          bloodPressure: { systolic: '', diastolic: '' },
          temperature: '',
          heartRate: '',
          respiratoryRate: '',
          oxygenSaturation: ''
        },
        physicalExamination: '',
        medications: [],
        additionalInstructions: '',
        nextAppointment: { date: '', time: '' }
      };

      // Call Expedix consultation-central API to create consultation
      const response = await expedixApi.createConsultationCentral(consultationData);
      
      if (response?.data) {
        console.log('[Agenda→Expedix] Consultation auto-created successfully:', response.data.id);
        return response.data as AutoCreatedConsultation;
      }

      throw new Error('Failed to create consultation from appointment');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('[Agenda→Expedix] Error creating consultation from appointment:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Starts a consultation (called from Agenda "Iniciar Consulta" button)
   * This transitions the consultation from draft to in-progress
   */
  const startConsultationFromAgenda = useCallback(async (
    appointmentId: string,
    patientId: string
  ): Promise<{ consultationId: string; redirectUrl: string } | null> => {
    try {
      setLoading(true);
      setError(null);

      console.log('[Agenda→Expedix] Starting consultation for appointment:', appointmentId);

      // Find existing consultation for this appointment
      let consultationId: string | null = null;
      
      // First, try to find consultation by appointment ID (using consultation-central endpoint)
      const existingConsultation = await expedixApi.getConsultationByAppointmentIdCentral(appointmentId);
      
      if (existingConsultation?.data) {
        consultationId = existingConsultation.data.id;
        console.log('[Agenda→Expedix] Found existing consultation:', consultationId);
      } else {
        // If no consultation exists, create one (fallback)
        console.log('[Agenda→Expedix] No existing consultation found, creating one...');
        
        // Get appointment details to create consultation
        const appointmentResponse = await fetch(`/api/agenda/appointments/${appointmentId}`);
        if (appointmentResponse.ok) {
          const appointmentData = await appointmentResponse.json();
          const createdConsultation = await createConsultationFromAppointment(appointmentData.data);
          consultationId = createdConsultation?.id || null;
        }
      }

      if (!consultationId) {
        throw new Error('Could not create or find consultation for appointment');
      }

      // Update consultation status to in-progress using consultation-central
      await expedixApi.updateConsultationCentral(consultationId, {
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Also update appointment status to in_progress
      await fetch(`/api/agenda/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'in_progress',
          startedAt: new Date().toISOString()
        })
      });

      const redirectUrl = `/hubs/expedix?patient=${patientId}&action=consultation&consultation=${consultationId}`;
      
      console.log('[Agenda→Expedix] Consultation started successfully, redirecting to:', redirectUrl);

      return {
        consultationId,
        redirectUrl
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('[Agenda→Expedix] Error starting consultation:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [createConsultationFromAppointment]);

  /**
   * Completes a consultation and optionally schedules next appointment
   */
  const completeConsultationWithNextAppointment = useCallback(async (
    consultationId: string,
    appointmentId: string,
    consultationData: any,
    nextAppointmentData?: { date: string; time: string; type?: string }
  ): Promise<{ success: boolean; nextAppointmentId?: string }> => {
    try {
      setLoading(true);
      setError(null);

      // Complete the consultation using consultation-central
      await expedixApi.updateConsultationCentral(consultationId, {
        ...consultationData,
        status: 'completed',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Update original appointment status
      await fetch(`/api/agenda/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'completed',
          completedAt: new Date().toISOString()
        })
      });

      let nextAppointmentId: string | undefined;

      // If next appointment is requested, create it in agenda
      if (nextAppointmentData && nextAppointmentData.date && nextAppointmentData.time) {
        const nextAppointmentPayload = {
          patientId: consultationData.patientId,
          date: nextAppointmentData.date,
          time: nextAppointmentData.time,
          type: nextAppointmentData.type || 'follow_up',
          reason: 'Cita de seguimiento',
          status: 'scheduled',
          createdFromConsultation: true,
          originalConsultationId: consultationId
        };

        const nextAppointmentResponse = await fetch('/api/agenda/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nextAppointmentPayload)
        });

        if (nextAppointmentResponse.ok) {
          const nextAppointment = await nextAppointmentResponse.json();
          nextAppointmentId = nextAppointment.data?.id;
          
          // Auto-create consultation for the new appointment
          if (nextAppointmentId) {
            await createConsultationFromAppointment({
              appointmentId: nextAppointmentId,
              patientId: consultationData.patientId,
              scheduledDate: nextAppointmentData.date,
              scheduledTime: nextAppointmentData.time,
              appointmentType: nextAppointmentData.type || 'follow_up',
              reason: 'Cita de seguimiento',
              status: 'scheduled'
            });
          }
        }
      }

      console.log('[Agenda→Expedix] Consultation completed successfully');
      return { success: true, nextAppointmentId };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('[Agenda→Expedix] Error completing consultation:', err);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [createConsultationFromAppointment]);

  /**
   * Cancels an appointment and associated consultation
   */
  const cancelAppointmentAndConsultation = useCallback(async (
    appointmentId: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Find and cancel consultation using consultation-central
      const consultation = await expedixApi.getConsultationByAppointmentIdCentral(appointmentId);
      if (consultation?.data) {
        await expedixApi.deleteConsultationCentral(consultation.data.id);
      }

      // Cancel appointment
      await fetch(`/api/agenda/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'cancelled',
          cancelledAt: new Date().toISOString()
        })
      });

      console.log('[Agenda→Expedix] Appointment and consultation cancelled successfully');
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('[Agenda→Expedix] Error cancelling appointment and consultation:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createConsultationFromAppointment,
    startConsultationFromAgenda,
    completeConsultationWithNextAppointment,
    cancelAppointmentAndConsultation
  };
}

/**
 * Maps appointment types to consultation note types
 */
function mapAppointmentTypeToNoteType(appointmentType: string): string {
  const mapping: Record<string, string> = {
    'first_time': 'Primera Vez',
    'follow_up': 'Seguimiento',
    'control': 'Control',
    'emergency': 'Urgencia',
    'consultation': 'Consulta General',
    'assessment': 'Evaluación',
    'therapy': 'Terapia'
  };

  return mapping[appointmentType] || 'Consulta General';
}

/**
 * Export utility functions for direct use
 */
export const AgendaExpedixUtils = {
  mapAppointmentTypeToNoteType
};