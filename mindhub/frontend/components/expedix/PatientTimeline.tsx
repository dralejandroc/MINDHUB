'use client';

import { useState, useEffect } from 'react';
import {
  CalendarIcon,
  DocumentTextIcon,
  DocumentChartBarIcon,
  BeakerIcon,
  ChatBubbleLeftEllipsisIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  PlusIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  NoSymbolIcon,
  EyeSlashIcon,
  FireIcon,
  ShieldCheckIcon,
  TruckIcon,
  WifiIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { expedixApi } from '@/lib/api/expedix-client';
import { patientTimelineApi, type TimelineEvent as ApiTimelineEvent } from '@/lib/api/patient-timeline-client';
import { clinimetrixApi } from '@/lib/api/clinimetrix-client';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { generateCategoryTimeline } from './PatientTimelineCategories';

// Enhanced Timeline Event Types
interface TimelineEvent {
  id: string;
  type: 'consultation' | 'prescription' | 'appointment' | 'communication' | 'no_show' | 'reschedule' | 'cancel' | 'prescription_renewal' | 'alert' | 'note' | 'assessment';
  subtype?: 'regular' | 'urgent' | 'followup' | 'emergency' | 'phone_call' | 'whatsapp' | 'email' | 'delay' | 'frequent_changes' | 'in_person' | 'clinical_assessment';
  title: string;
  description?: string;
  date: string;
  time?: string;
  status: 'completed' | 'pending' | 'cancelled' | 'missed' | 'delayed' | 'rescheduled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  professional?: {
    name: string;
    role: string;
  };
  behaviorImpact: 'positive' | 'neutral' | 'negative' | 'concerning';
  data?: any;
}

// Clinical Patient Classification Analysis
interface PatientClinicalAnalysis {
  // Core metrics
  attendancePercentage: number; // 0-100 %
  totalFollowupMonths: number;
  totalScheduledAppointments: number;
  completedAppointments: number;
  missedAppointments: number;
  
  // Service utilization
  servicesUsed: string[]; // ['psychiatry', 'psychology', 'group_therapy', 'psychoeducation']
  psychiatryVisits: number;
  psychologyVisits: number;
  groupTherapySessions: number;
  psychoeducationPrograms: number;
  
  // Clinical indicators
  hasReferredOtherPatients: boolean;
  requiresAdditionalIntervention: boolean;
  resistanceToChange: boolean;
  followsInstructions: boolean;
  completedPrograms: boolean;
  
  // Patient classification (8 clinical categories)
  category: 'potencial' | 'integracion_inicial' | 'inconstante' | 'acompañamiento' | 'integracion_avanzada' | 'integrado' | 'arraigado' | 'alta';
  
  // Additional data
  rescheduledCount: number;
  emergencyVisits: number;
  communicationsBetweenSessions: number;
}

interface PatientTimelineProps {
  patient?: {
    id: string;
    first_name: string;
    paternal_last_name: string;
    age: number;
  };
  userType?: 'clinic' | 'individual'; // Nuevo: tipo de usuario
  onNewConsultation?: () => void;
  onSelectPatient?: (patient: any) => void;
}

// Behavior Analysis Interface (restored)
interface PatientBehaviorAnalysis {
  followupCompliance: number; // 0-100 %
  punctuality: number; // 0-100 %
  communicationFrequency: 'low' | 'normal' | 'high' | 'excessive';
  appointmentReliability: 'reliable' | 'occasional_issues' | 'frequent_changes' | 'unreliable';
  treatmentAdherence: 'excellent' | 'good' | 'fair' | 'poor';
  overallPattern: 'compliant' | 'needs_followup' | 'high_maintenance' | 'at_risk';
  totalConsultations: number;
  missedAppointments: number;
  rescheduledCount: number;
  emergencyVisits: number;
  betweenSessionCommunications: number;
}

export default function PatientTimeline({ patient, userType = 'individual', onNewConsultation, onSelectPatient }: PatientTimelineProps) {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [clinicalAnalysis, setClinicalAnalysis] = useState<PatientClinicalAnalysis | null>(null);
  const [behaviorAnalysis, setBehaviorAnalysis] = useState<PatientBehaviorAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisView, setAnalysisView] = useState<'clinical' | 'behavioral' | 'both'>('both');
  const [filter, setFilter] = useState<'all' | 'appointments' | 'consultations' | 'communications' | 'alerts' | 'assessments'>('all');

  useEffect(() => {
    if (patient?.id) {
      loadPatientTimelineData();
    }
  }, [patient?.id]);

  const loadPatientTimelineData = async () => {
    if (!patient?.id) return;
    
    try {
      setLoading(true);
      
      // Cargar datos reales completos del paciente desde el backend
      const patientResponse = await expedixApi.getPatient(patient.id);
      
      if (!patientResponse?.data) {
        console.error('No patient data found');
        return;
      }

      // Generar análisis y timeline basados únicamente en datos reales
      const analysisResult = await generateRealDataAnalysis(patientResponse.data);
      
      setTimelineEvents(analysisResult.timeline);
      setClinicalAnalysis(analysisResult.clinicalAnalysis);
      setBehaviorAnalysis(analysisResult.behaviorAnalysis);
      
    } catch (error) {
      console.error('Error loading timeline data:', error);
      // No fallback a mock data - mostrar error real
      setTimelineEvents([]);
      setClinicalAnalysis(null);
      setBehaviorAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const generateRealDataAnalysis = async (patientData: any) => {
    const consultations = patientData.consultations || [];
    const prescriptions = patientData.prescriptions || [];
    const medicalHistory = patientData.medicalHistory || [];
    
    // Cargar datos conductuales reales desde FrontDesk
    let behavioralLogs = [];
    let communications = [];
    let appointmentChanges = [];
    let scaleApplications = [];
    
    try {
      // Obtener logs conductuales reales del paciente
      const behavioralResponse = await fetch(`http://localhost:8080/api/v1/frontdesk/patients/${patient.id}/behavioral-history`);
      if (behavioralResponse.ok) {
        const behavioralData = await behavioralResponse.json();
        behavioralLogs = behavioralData.data?.behavioralLogs || [];
        communications = behavioralData.data?.communications || [];
        appointmentChanges = behavioralData.data?.appointmentChanges || [];
      }
    } catch (error) {
      console.log('No behavioral data available yet:', error);
    }
    
    try {
      // Obtener aplicaciones de escalas clínicas desde Clinimetrix
      const scaleAssessments = await clinimetrixApi.getPatientAssessments(patient.id);
      scaleApplications = scaleAssessments?.data || scaleAssessments || [];
      console.log('Scale applications found:', scaleApplications.length);
    } catch (error) {
      console.log('No scale applications available yet:', error);
    }
    
    // Calcular métricas reales
    const completedConsultations = consultations.filter((c: any) => c.status === 'completed');
    const scheduledConsultations = consultations.filter((c: any) => c.status === 'scheduled');
    const totalConsultations = consultations.length;
    
    // Calcular tiempo de seguimiento real
    const firstConsultDate = consultations.length > 0 
      ? new Date(Math.min(...consultations.map((c: any) => new Date(c.consultationDate).getTime())))
      : new Date();
    const followupMonths = Math.max(1, Math.floor((new Date().getTime() - firstConsultDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    
    // Análisis clínico basado en datos reales
    const clinicalAnalysis = calculateRealClinicalAnalysis({
      consultations,
      prescriptions,
      medicalHistory,
      followupMonths,
      completedConsultations: completedConsultations.length,
      totalConsultations,
      patientData
    });
    
    // Análisis conductual basado en datos reales del FrontDesk
    const behaviorAnalysis = calculateRealBehaviorAnalysis({
      consultations,
      followupMonths,
      completedConsultations: completedConsultations.length,
      totalConsultations,
      behavioralLogs,
      communications,
      appointmentChanges
    });
    
    // Timeline basado en datos reales + eventos conductuales + aplicaciones de escalas
    const timeline = generateRealTimeline(consultations, prescriptions, medicalHistory, behavioralLogs, communications, scaleApplications);
    
    return {
      timeline,
      clinicalAnalysis,
      behaviorAnalysis
    };
  };

  const calculateRealClinicalAnalysis = (data: any): PatientClinicalAnalysis | null => {
    const { consultations, prescriptions, medicalHistory, followupMonths, completedConsultations, totalConsultations } = data;
    
    // VALIDACIÓN: Requiere mínimo 3 consultas para análisis clínico confiable
    if (totalConsultations < 3) {
      return null; // No suficientes datos para análisis
    }
    
    // Calcular porcentaje de asistencia real
    const attendancePercentage = totalConsultations > 0 
      ? Math.round((completedConsultations / totalConsultations) * 100) 
      : 0;
    
    // Determinar servicios utilizados basado en datos reales
    const servicesUsed: string[] = [];
    if (consultations.some((c: any) => c.reason?.toLowerCase().includes('psiquiat'))) servicesUsed.push('psychiatry');
    if (consultations.some((c: any) => c.reason?.toLowerCase().includes('psicolog'))) servicesUsed.push('psychology');
    if (consultations.some((c: any) => c.reason?.toLowerCase().includes('grup'))) servicesUsed.push('group_therapy');
    if (consultations.some((c: any) => c.reason?.toLowerCase().includes('psicoeducac'))) servicesUsed.push('psychoeducation');
    
    // Determinar categoría clínica basada en métricas reales (solo con suficientes datos)
    let category: string = 'integracion_inicial'; // Default para pacientes con >= 3 consultas
    
    if (attendancePercentage < 50) {
      category = 'inconstante';
    } else if (attendancePercentage >= 80 && followupMonths >= 6 && servicesUsed.length >= 2) {
      category = userType === 'clinic' ? 'integrado' : 'integracion_avanzada';
    } else if (attendancePercentage >= 80 && followupMonths >= 12) {
      category = 'arraigado';
    } else if (attendancePercentage >= 80 && followupMonths >= 3) {
      category = 'integracion_avanzada';
    } else if (attendancePercentage > 50) {
      category = 'acompañamiento';
    }
    
    // Si hay consultas completadas y el último estado fue "completed", podría ser alta
    const lastCompletedConsult = consultations
      .filter((c: any) => c.status === 'completed')
      .sort((a: any, b: any) => new Date(b.consultationDate).getTime() - new Date(a.consultationDate).getTime())[0];
    
    if (lastCompletedConsult && attendancePercentage >= 80 && 
        (new Date().getTime() - new Date(lastCompletedConsult.consultationDate).getTime()) > (1000 * 60 * 60 * 24 * 90)) {
      category = 'alta';
    }
    
    return {
      attendancePercentage,
      totalFollowupMonths: followupMonths,
      totalScheduledAppointments: totalConsultations,
      completedAppointments: completedConsultations,
      missedAppointments: totalConsultations - completedConsultations,
      
      servicesUsed,
      psychiatryVisits: consultations.filter((c: any) => c.reason?.toLowerCase().includes('psiquiat')).length,
      psychologyVisits: consultations.filter((c: any) => c.reason?.toLowerCase().includes('psicolog')).length,
      groupTherapySessions: consultations.filter((c: any) => c.reason?.toLowerCase().includes('grup')).length,
      psychoeducationPrograms: consultations.filter((c: any) => c.reason?.toLowerCase().includes('psicoeducac')).length,
      
      hasReferredOtherPatients: false, // Este dato requeriría una tabla específica
      requiresAdditionalIntervention: category === 'acompañamiento',
      resistanceToChange: category === 'acompañamiento',
      followsInstructions: attendancePercentage >= 70,
      completedPrograms: category === 'alta',
      
      category: category as any,
      
      rescheduledCount: 0, // Requeriría rastrear cambios de citas
      emergencyVisits: consultations.filter((c: any) => c.reason?.toLowerCase().includes('emergen')).length,
      communicationsBetweenSessions: 0 // Requeriría tabla de comunicaciones
    };
  };

  const calculateRealBehaviorAnalysis = (data: any): PatientBehaviorAnalysis | null => {
    const { 
      consultations, 
      followupMonths, 
      completedConsultations, 
      totalConsultations,
      behavioralLogs = [],
      communications = [],
      appointmentChanges = []
    } = data;
    
    // VALIDACIÓN: Requiere mínimo 3 consultas para análisis conductual confiable
    if (totalConsultations < 3) {
      return null; // No suficientes datos para análisis
    }
    
    // Calcular métricas reales usando datos del FrontDesk
    const lateArrivals = behavioralLogs.filter((log: any) => log.event_type === 'late_arrival');
    const noShows = behavioralLogs.filter((log: any) => log.event_type === 'no_show');
    const earlyArrivals = behavioralLogs.filter((log: any) => log.event_type === 'early_arrival');
    const reschedules = appointmentChanges.filter((change: any) => change.change_type === 'reschedule');
    
    // Calcular puntualidad real basada en retrasos registrados
    const totalAppointments = totalConsultations + noShows.length;
    const punctualityScore = totalAppointments > 0 
      ? Math.round(((totalAppointments - lateArrivals.length - noShows.length) / totalAppointments) * 100)
      : 100;
    
    // Calcular cumplimiento real
    const followupCompliance = totalAppointments > 0 
      ? Math.round((completedConsultations / totalAppointments) * 100) 
      : 0;
    
    // Determinar frecuencia de comunicación basada en datos reales
    const totalCommunications = communications.length;
    const communicationsPerMonth = followupMonths > 0 ? totalCommunications / followupMonths : 0;
    
    let communicationFrequency: 'low' | 'normal' | 'high' | 'excessive' = 'normal';
    if (communicationsPerMonth === 0) communicationFrequency = 'low';
    else if (communicationsPerMonth > 15) communicationFrequency = 'excessive';
    else if (communicationsPerMonth > 8) communicationFrequency = 'high';
    else if (communicationsPerMonth < 2) communicationFrequency = 'low';
    
    // Determinar confiabilidad basada en datos reales
    let appointmentReliability: 'reliable' | 'occasional_issues' | 'frequent_changes' | 'unreliable' = 'reliable';
    const rescheduleRate = totalAppointments > 0 ? reschedules.length / totalAppointments : 0;
    const noShowRate = totalAppointments > 0 ? noShows.length / totalAppointments : 0;
    
    if (noShowRate > 0.3 || rescheduleRate > 0.4) {
      appointmentReliability = 'unreliable';
    } else if (noShowRate > 0.15 || rescheduleRate > 0.25) {
      appointmentReliability = 'frequent_changes';
    } else if (noShowRate > 0.05 || rescheduleRate > 0.1) {
      appointmentReliability = 'occasional_issues';
    }
    
    // Determinar patrón general basado en métricas reales
    let overallPattern: string = 'needs_followup';
    
    if (followupCompliance >= 90 && punctualityScore >= 90 && communicationFrequency === 'normal') {
      overallPattern = 'compliant';
    } else if (followupCompliance < 50 || punctualityScore < 50 || noShowRate > 0.3) {
      overallPattern = 'at_risk';
    } else if (communicationFrequency === 'excessive' || rescheduleRate > 0.3) {
      overallPattern = 'high_maintenance';
    }
    
    const treatmentAdherence = followupCompliance >= 90 && punctualityScore >= 90 ? 'excellent' : 
                              followupCompliance >= 75 && punctualityScore >= 75 ? 'good' : 
                              followupCompliance >= 60 && punctualityScore >= 60 ? 'fair' : 'poor';
    
    return {
      followupCompliance,
      punctuality: punctualityScore,
      communicationFrequency,
      appointmentReliability,
      treatmentAdherence,
      overallPattern: overallPattern as any,
      totalConsultations,
      missedAppointments: noShows.length,
      rescheduledCount: reschedules.length,
      emergencyVisits: consultations.filter((c: any) => c.reason?.toLowerCase().includes('emergen')).length,
      betweenSessionCommunications: totalCommunications
    };
  };

  const generateRealTimeline = (
    consultations: any[], 
    prescriptions: any[], 
    medicalHistory: any[],
    behavioralLogs: any[] = [],
    communications: any[] = [],
    scaleApplications: any[] = []
  ): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    
    // Convertir consultas reales a eventos de timeline
    consultations.forEach((consultation, index) => {
      events.push({
        id: consultation.id || `consult-${index}`,
        type: 'consultation',
        subtype: consultation.reason?.toLowerCase().includes('emergen') ? 'urgent' : 'regular',
        title: consultation.reason || 'Consulta médica',
        description: consultation.notes || consultation.diagnosis || 'Consulta de seguimiento',
        date: consultation.consultationDate,
        time: new Date(consultation.consultationDate).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        status: consultation.status === 'completed' ? 'completed' : 
                consultation.status === 'scheduled' ? 'pending' : 'cancelled',
        priority: consultation.reason?.toLowerCase().includes('emergen') ? 'urgent' : 'medium',
        professional: { 
          name: 'Dr. Alejandro Contreras', 
          role: userType === 'clinic' ? 'Psiquiatra' : 'Médico' 
        },
        behaviorImpact: consultation.status === 'completed' ? 'positive' : 'neutral'
      });
    });
    
    // Convertir eventos conductuales reales del FrontDesk
    behavioralLogs.forEach((log) => {
      let eventType: TimelineEvent['type'] = 'alert';
      let title = '';
      let behaviorImpact: TimelineEvent['behaviorImpact'] = 'neutral';
      
      switch (log.event_type) {
        case 'late_arrival':
          eventType = 'appointment';
          title = `Llegada tarde (${log.delay_minutes || 0} min)`;
          behaviorImpact = 'negative';
          break;
        case 'no_show':
          eventType = 'no_show';
          title = 'Falta sin justificación';
          behaviorImpact = 'concerning';
          break;
        case 'early_arrival':
          eventType = 'appointment';
          title = 'Llegada temprana';
          behaviorImpact = 'positive';
          break;
        case 'cancelled_last_minute':
          eventType = 'cancel';
          title = 'Cancelación de último momento';
          behaviorImpact = 'negative';
          break;
        case 'communication_issue':
          eventType = 'communication';
          title = 'Problema de comunicación';
          behaviorImpact = 'concerning';
          break;
        case 'payment_delay':
          eventType = 'alert';
          title = 'Retraso en pago';
          behaviorImpact = 'concerning';
          break;
      }
      
      events.push({
        id: log.id,
        type: eventType,
        subtype: log.event_type === 'late_arrival' ? 'delay' : undefined,
        title,
        description: log.description || 'Evento registrado por recepción',
        date: log.recorded_at,
        time: new Date(log.recorded_at).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        status: 'completed',
        priority: behaviorImpact === 'concerning' ? 'high' : 'medium',
        behaviorImpact
      });
    });
    
    // Convertir comunicaciones reales del FrontDesk
    communications.forEach((comm) => {
      events.push({
        id: comm.id,
        type: 'communication',
        subtype: comm.communication_type,
        title: `${comm.direction === 'incoming' ? 'Comunicación recibida' : 'Comunicación enviada'} (${comm.communication_type})`,
        description: comm.content || `Comunicación vía ${comm.communication_type}${comm.duration ? ` - ${Math.round(comm.duration/60)} min` : ''}`,
        date: comm.communication_date,
        time: new Date(comm.communication_date).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        status: 'completed',
        priority: 'low',
        behaviorImpact: comm.direction === 'incoming' ? 'neutral' : 'positive'
      });
    });
    
    // Convertir aplicaciones de escalas clínicas desde Clinimetrix
    scaleApplications.forEach((assessment) => {
      events.push({
        id: assessment.id,
        type: 'assessment',
        subtype: assessment.administrationType || 'clinical_assessment',
        title: `Aplicación de Escala: ${assessment.scale?.name || assessment.scale?.abbreviation || 'Escala Clínica'}`,
        description: `Puntuación total: ${assessment.totalScore || 'N/A'}${assessment.interpretation ? ` - ${assessment.interpretation}` : ''}${assessment.severity ? ` (${assessment.severity})` : ''}`,
        date: assessment.administrationDate || assessment.createdAt,
        time: new Date(assessment.administrationDate || assessment.createdAt).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        status: assessment.status === 'completed' ? 'completed' : 'pending',
        priority: assessment.severity === 'severe' || assessment.severity === 'very_severe' ? 'high' : 'medium',
        professional: assessment.administrator ? {
          name: assessment.administrator.name || 'Profesional clínico',
          role: 'Evaluador clínico'
        } : undefined,
        behaviorImpact: assessment.status === 'completed' ? 'positive' : 'neutral',
        data: {
          scaleId: assessment.scaleId,
          scaleName: assessment.scale?.name,
          scaleAbbreviation: assessment.scale?.abbreviation,
          category: assessment.scale?.category,
          totalScore: assessment.totalScore,
          severity: assessment.severity,
          interpretation: assessment.interpretation
        }
      });
    });
    
    // Convertir prescripciones reales a eventos
    prescriptions.forEach((prescription, index) => {
      events.push({
        id: prescription.id || `prescription-${index}`,
        type: 'prescription_renewal',
        title: `Prescripción: ${prescription.medication?.name || 'Medicamento'}`,
        description: `Dosis: ${prescription.dosage}, Frecuencia: ${prescription.frequency}`,
        date: prescription.startDate,
        status: prescription.status === 'active' ? 'completed' : 'cancelled',
        priority: 'medium',
        behaviorImpact: 'positive'
      });
    });
    
    // Convertir historial médico a eventos
    medicalHistory.forEach((history, index) => {
      events.push({
        id: history.id || `history-${index}`,
        type: 'note',
        title: `Historial: ${history.condition}`,
        description: history.notes || 'Registro en historial médico',
        date: history.diagnosedAt || history.createdAt,
        status: 'completed',
        priority: 'low',
        behaviorImpact: 'neutral'
      });
    });
    
    // Ordenar por fecha (más reciente primero)
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };


  const getEventIcon = (event: TimelineEvent) => {
    switch (event.type) {
      case 'consultation':
        return event.subtype === 'urgent' ? FireIcon : CalendarIcon;
      case 'prescription_renewal':
        return BeakerIcon;
      case 'communication':
        return event.subtype === 'whatsapp' ? ChatBubbleLeftEllipsisIcon : PhoneIcon;
      case 'no_show':
        return NoSymbolIcon;
      case 'reschedule':
        return ArrowPathIcon;
      case 'appointment':
        return event.subtype === 'delay' ? ClockIcon : CalendarIcon;
      case 'alert':
        return ExclamationTriangleIcon;
      case 'assessment':
        return DocumentChartBarIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const getEventColorClass = (event: TimelineEvent) => {
    if (event.behaviorImpact === 'positive') {
      return 'text-green-600 bg-green-50 border-green-200';
    } else if (event.behaviorImpact === 'concerning') {
      return 'text-red-600 bg-red-50 border-red-200';
    } else if (event.behaviorImpact === 'negative') {
      return 'text-orange-600 bg-orange-50 border-orange-200';
    }
    
    switch (event.type) {
      case 'consultation':
        return event.subtype === 'urgent' ? 'text-red-600 bg-red-50 border-red-200' : 'text-blue-600 bg-blue-50 border-blue-200';
      case 'prescription_renewal':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'communication':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'no_show':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'reschedule':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'alert':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'assessment':
        return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getClinicalBadgeColor = (category: string) => {
    switch (category) {
      case 'integrado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'arraigado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'integracion_avanzada':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'acompañamiento':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'integracion_inicial':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'inconstante':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'alta':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'potencial':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryDescription = (category: string, userType: string) => {
    const isClinic = userType === 'clinic';
    
    switch (category) {
      case 'integrado':
        return isClinic 
          ? '80% asistencia, 6+ meses, múltiples servicios, refiere pacientes'
          : 'Paciente fiel con seguimiento constante y puntual';
      case 'arraigado':
        return isClinic
          ? 'Largo seguimiento, condición crónica, múltiples servicios'
          : 'Paciente de largo seguimiento con condición estable';
      case 'integracion_avanzada':
        return isClinic
          ? '80% asistencia, 3 meses, 2 servicios, participa en programas'
          : 'Seguimiento estable con buen progreso terapéutico';
      case 'acompañamiento':
        return '>50% asistencia, requiere intervención adicional, resistencia al cambio';
      case 'integracion_inicial':
        return '100% asistencia primeras 2 citas, iniciando seguimiento';
      case 'inconstante':
        return '<50% asistencia, faltas constantes, no sigue programa';
      case 'alta':
        return 'Completó seguimiento exitosamente, dado de alta';
      case 'potencial':
        return 'Interesado en servicios, no ha acudido a primera cita';
      default:
        return 'Categoría en evaluación';
    }
  };

  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case 'integrado': return 'INTEGRADO';
      case 'arraigado': return 'ARRAIGADO';
      case 'integracion_avanzada': return 'INTEGRACIÓN AVANZADA';
      case 'acompañamiento': return 'ACOMPAÑAMIENTO';
      case 'integracion_inicial': return 'INTEGRACIÓN INICIAL';
      case 'inconstante': return 'INCONSTANTE';
      case 'alta': return 'DE ALTA';
      case 'potencial': return 'POTENCIAL';
      default: return 'SIN CATEGORÍA';
    }
  };

  const getBehaviorBadgeColor = (pattern: string) => {
    switch (pattern) {
      case 'compliant':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'needs_followup':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high_maintenance':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'at_risk':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBehaviorDisplayName = (pattern: string) => {
    switch (pattern) {
      case 'compliant': return 'COMPLIANT';
      case 'needs_followup': return 'NEEDS FOLLOWUP';
      case 'high_maintenance': return 'HIGH MAINTENANCE';
      case 'at_risk': return 'AT RISK';
      default: return 'UNKNOWN';
    }
  };

  const getBehaviorDescription = (pattern: string) => {
    switch (pattern) {
      case 'compliant': return 'Comportamiento ejemplar: puntual, comunicación apropiada, sigue instrucciones';
      case 'needs_followup': return 'Requiere seguimiento: comunicación esporádica, espacios largos entre contactos';
      case 'high_maintenance': return 'Demandante: comunicación frecuente, cambios constantes, requiere atención especial';
      case 'at_risk': return 'En riesgo: patrones preocupantes, retrasos, faltas, comportamiento inconsistente';
      default: return 'Patrón conductual en evaluación';
    }
  };

  const filteredEvents = timelineEvents.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'appointments') return ['consultation', 'appointment', 'no_show', 'reschedule'].includes(event.type);
    if (filter === 'consultations') return event.type === 'consultation';
    if (filter === 'communications') return event.type === 'communication';
    if (filter === 'alerts') return event.type === 'alert';
    if (filter === 'assessments') return event.type === 'assessment';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Analizando patrón de comportamiento...</span>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <UserIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Selecciona un paciente
        </h3>
        <p className="text-gray-600">
          Elige un paciente para ver su timeline de comportamiento médico
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Patient Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {patient.first_name} {patient.paternal_last_name}
          </h2>
          <p className="text-sm text-gray-500">{userType === 'clinic' ? 'Clínica' : 'Individual'} · {patient.age} años</p>
        </div>
        
        {/* Compact Analysis Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {[
            { key: 'both', label: 'Dual', icon: '🔍' },
            { key: 'clinical', label: 'Clínico', icon: '🏥' },
            { key: 'behavioral', label: 'Conductual', icon: '🧠' }
          ].map(option => (
            <button
              key={option.key}
              onClick={() => setAnalysisView(option.key as any)}
              className={`px-2 py-1 text-xs rounded-md transition-all ${
                analysisView === option.key
                  ? 'bg-white text-blue-700 shadow-sm font-medium'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="mr-1">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compact Analysis Cards */}
      {(clinicalAnalysis || behaviorAnalysis) ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Clinical Analysis Card */}
          {clinicalAnalysis && (analysisView === 'clinical' || analysisView === 'both') && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-800">🏥 Análisis Clínico</h3>
                <div className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getClinicalBadgeColor(clinicalAnalysis.category)}`}>
                  {getCategoryDisplayName(clinicalAnalysis.category)}
                </div>
              </div>
              
              {/* Compact Clinical Metrics */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-indigo-600">{clinicalAnalysis.attendancePercentage}%</div>
                  <div className="text-xs text-gray-500">Asistencia</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{clinicalAnalysis.completedAppointments}</div>
                  <div className="text-xs text-gray-500">Completadas</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{clinicalAnalysis.totalFollowupMonths}m</div>
                  <div className="text-xs text-gray-500">Seguimiento</div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex justify-between text-xs text-gray-600 mb-2">
                <span>Faltas: <span className="text-red-600 font-medium">{clinicalAnalysis.missedAppointments}</span></span>
                <span>Cambios: <span className="text-orange-600 font-medium">{clinicalAnalysis.rescheduledCount}</span></span>
                <span>Comunicaciones: <span className="text-purple-600 font-medium">{clinicalAnalysis.communicationsBetweenSessions}</span></span>
              </div>

              {/* Services Icons */}
              {clinicalAnalysis.servicesUsed.length > 0 && (
                <div className="flex space-x-1">
                  {clinicalAnalysis.servicesUsed.map(service => (
                    <span key={service} className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-xs" title={service}>
                      {service === 'psychiatry' ? '🧠' :
                       service === 'psychology' ? '💭' :
                       service === 'group_therapy' ? '👥' :
                       service === 'psychoeducation' ? '📚' : '🏥'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Behavioral Analysis Card */}
          {behaviorAnalysis && (analysisView === 'behavioral' || analysisView === 'both') && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-800">🧠 Análisis Conductual</h3>
                <div className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getBehaviorBadgeColor(behaviorAnalysis.overallPattern)}`}>
                  {getBehaviorDisplayName(behaviorAnalysis.overallPattern)}
                </div>
              </div>
              
              {/* Compact Behavioral Metrics */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{behaviorAnalysis.followupCompliance}%</div>
                  <div className="text-xs text-gray-500">Cumplimiento</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{behaviorAnalysis.punctuality}%</div>
                  <div className="text-xs text-gray-500">Puntualidad</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{behaviorAnalysis.totalConsultations}</div>
                  <div className="text-xs text-gray-500">Consultas</div>
                </div>
              </div>

              {/* Behavioral Indicators Compact */}
              <div className="flex justify-between text-xs mb-2">
                <span className={`px-1.5 py-0.5 rounded ${
                  behaviorAnalysis.treatmentAdherence === 'excellent' ? 'bg-green-100 text-green-700' :
                  behaviorAnalysis.treatmentAdherence === 'good' ? 'bg-blue-100 text-blue-700' :
                  behaviorAnalysis.treatmentAdherence === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  📋 {behaviorAnalysis.treatmentAdherence}
                </span>
                <span className={`px-1.5 py-0.5 rounded ${
                  behaviorAnalysis.communicationFrequency === 'normal' ? 'bg-green-100 text-green-700' :
                  behaviorAnalysis.communicationFrequency === 'low' ? 'bg-blue-100 text-blue-700' :
                  behaviorAnalysis.communicationFrequency === 'high' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  💬 {behaviorAnalysis.communicationFrequency}
                </span>
              </div>

              {/* Pattern Description - Collapsed */}
              <p className="text-xs text-gray-600 line-clamp-2">{getBehaviorDescription(behaviorAnalysis.overallPattern)}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
            <h3 className="text-sm font-medium text-amber-800">Datos Insuficientes para Análisis</h3>
          </div>
          <p className="text-sm text-amber-700 mb-2">
            Se requieren al menos <span className="font-semibold">3 consultas</span> para generar un análisis clínico y conductual confiable.
          </p>
          <p className="text-xs text-amber-600">
            📊 <strong>Consultas actuales:</strong> {timelineEvents.filter(e => e.type === 'consultation').length} de 3 mínimas
          </p>
          <p className="text-xs text-amber-600 mt-1">
            ⏱️ A mayor seguimiento en el tiempo y mayor número de citas, el análisis mejorará en precisión.
          </p>
        </div>
      )}

      {/* Compact Event Filters */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1">
          {[
            { key: 'all', label: 'Todo', icon: '📋' },
            { key: 'appointments', label: 'Citas', icon: '📅' },
            { key: 'consultations', label: 'Consultas', icon: '🩺' },
            { key: 'communications', label: 'Comunicación', icon: '💬' },
            { key: 'assessments', label: 'Escalas', icon: '📊' },
            { key: 'alerts', label: 'Alertas', icon: '⚠️' }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as any)}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                filter === filterOption.key
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-1">{filterOption.icon}</span>
              {filterOption.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400">{filteredEvents.length} eventos</span>
      </div>

      {/* Timeline Events */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sin eventos</h3>
            <p className="text-gray-600">No hay eventos para el filtro seleccionado</p>
          </div>
        ) : (
          filteredEvents.map((event, index) => {
            const Icon = getEventIcon(event);
            const colorClasses = getEventColorClass(event);
            
            return (
              <div key={event.id} className="relative">
                {/* Timeline connector */}
                {index < filteredEvents.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200" />
                )}
                
                <div className="flex items-start space-x-4">
                  {/* Event icon with behavior indicator */}
                  <div className="relative">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${colorClasses}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {/* Behavior impact dot */}
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                      event.behaviorImpact === 'positive' ? 'bg-green-500' :
                      event.behaviorImpact === 'concerning' ? 'bg-red-500' :
                      event.behaviorImpact === 'negative' ? 'bg-orange-500' : 'bg-gray-400'
                    }`} />
                  </div>

                  {/* Event content */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-900 mb-1">
                            {event.title}
                          </h3>
                          {event.description && (
                            <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                          )}
                          <div className="flex items-center text-xs text-gray-500 space-x-3">
                            <span className="flex items-center">
                              <CalendarIcon className="w-3 h-3 mr-1" />
                              {new Date(event.date).toLocaleDateString('es-ES', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            {event.time && (
                              <span className="flex items-center">
                                <ClockIcon className="w-3 h-3 mr-1" />
                                {event.time}
                              </span>
                            )}
                            {event.professional && (
                              <span className="flex items-center">
                                <UserIcon className="w-3 h-3 mr-1" />
                                {event.professional.name}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Status indicator */}
                        <div className="ml-4">
                          {event.status === 'completed' && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
                          {event.status === 'missed' && <XCircleIcon className="w-5 h-5 text-red-500" />}
                          {event.status === 'pending' && <ClockIcon className="w-5 h-5 text-yellow-500" />}
                          {event.status === 'rescheduled' && <ArrowPathIcon className="w-5 h-5 text-orange-500" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Action buttons */}
      <div className="flex justify-center space-x-4 pt-6 border-t border-gray-200">
        <Button
          onClick={onNewConsultation}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Nueva Consulta
        </Button>
        <Button
          variant="outline"
          className="text-purple-600 border-purple-300 hover:bg-purple-50"
        >
          <ChatBubbleLeftEllipsisIcon className="w-4 h-4 mr-2" />
          Agregar Nota
        </Button>
      </div>
    </div>
  );
}