'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeftIcon,
  ClockIcon,
  DocumentTextIcon,
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  PrinterIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { expedixApi, type Patient, type Prescription } from '@/lib/api/expedix-client';
import { useAuthenticatedFetch } from '@/lib/api/supabase-auth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ConsultationPreviewDialog from './ConsultationPreviewDialog';
import { MentalExamFormatter, type MentalExamData } from '@/lib/utils/mental-exam-formatter';
import { PrintConfigManager, type PrintConfig } from '@/lib/utils/print-config';
import PrintConfigDialog from '../PrintConfigDialog';
import { PrescriptionCreator } from '../../prescriptions/PrescriptionCreator';
import DiagnosesSelector from './components/DiagnosesSelector';

interface Diagnosis {
  id: string;
  code?: string;
  description: string;
  category?: string;
  system?: 'CIE-10' | 'DSM-5TR' | 'CIE-11' | 'custom';
  isPrimary?: boolean;
  notes?: string;
}

interface ConsultationData {
  noteType: string;
  date: string;
  currentCondition: string;
  diagnosis: string;
  diagnoses: Diagnosis[];
  vitalSigns: {
    height: string;
    weight: string;
    bloodPressure: { systolic: string; diastolic: string };
    temperature: string;
    heartRate: string;
    respiratoryRate: string;
    oxygenSaturation: string;
  };
  physicalExamination: string;
  medications: any[];
  additionalInstructions: string;
  nextAppointment: { date: string; time: string };
  mentalExam: {
    descripcionInspeccion: string;
    apariencia: string;
    actitud: string;
    conciencia: string;
    orientacion: string;
    atencion: string;
    lenguaje: string;
    afecto: string;
    sensopercepcion: string;
    memoria: string;
    pensamientoPrincipal: string;
    pensamientoDetalles: string;
    // Campos adicionales compatibles
    appearance?: string;
    attitude?: string;
    consciousness?: string;
    customAppearance?: string;
    speechRate?: string;
    speechVolume?: string;
    speechFluency?: string;
    customSpeech?: string;
    affectIntensity?: string;
    affectQuality?: string;
    customAffect?: string;
    customPerceptions?: string;
    perceptions?: string;
    memory?: string;
    thoughtContent?: string;
    customThought?: string;
    thoughtProcess?: string;
    customInsightJudgment?: string;
    generalSummary?: string;
    moodState?: string;
    customCognition?: string;
    orientation?: string;
    attention?: string;
    insight?: string;
    judgment?: string;
  };
}

interface Consultation {
  id: string;
  date: string;
  noteType: string;
  diagnosis: string;
  currentCondition: string;
  nextAppointment?: {
    date: string;
    time: string;
  };
  status: 'draft' | 'completed';
  created_at: string;
}


interface CentralizedConsultationInterfaceProps {
  patient: Patient;
  consultationId?: string;
  onClose: () => void;
  onSave?: (data: any) => void;
}

type SidebarView = 'consultations' | 'prescriptions' | 'appointments';

// Safe date formatting function to avoid Invalid time value errors
const safeFormatDate = (dateString: string | null | undefined, formatStr: string = 'dd MMM yyyy'): string => {
  if (!dateString) return 'Fecha no disponible';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    return format(date, formatStr, { locale: es });
  } catch (error) {
    console.warn('Date formatting error:', error, 'for date:', dateString);
    return 'Fecha no válida';
  }
};

export default function CentralizedConsultationInterface({
  patient,
  consultationId,
  onClose,
  onSave
}: CentralizedConsultationInterfaceProps) {
  // Authenticated API client
  const authenticatedFetch = useAuthenticatedFetch();
  
  const [loading, setLoading] = useState(true);
  const [currentConsultation, setCurrentConsultation] = useState<Consultation | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  
  // Navigation states
  const [sidebarView, setSidebarView] = useState<SidebarView>('consultations');
  const [currentConsultationIndex, setCurrentConsultationIndex] = useState(0);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  
  // Print states
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [showPrintConfig, setShowPrintConfig] = useState(false);
  
  // Prescription modal state
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  
  // Form states
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [consultationData, setConsultationData] = useState<ConsultationData>({
    noteType: 'Consulta General',
    date: new Date().toISOString().split('T')[0],
    currentCondition: '',
    diagnosis: '',
    diagnoses: [],
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
    nextAppointment: { date: '', time: '' },
    mentalExam: {
      // Campos en español (principales)
      descripcionInspeccion: '',
      apariencia: '',
      actitud: '',
      conciencia: '',
      orientacion: '',
      atencion: '',
      lenguaje: '',
      afecto: '',
      sensopercepcion: '',
      memoria: '',
      pensamientoPrincipal: '',
      pensamientoDetalles: '',
      // Campos adicionales compatibles
      appearance: '',
      attitude: '',
      consciousness: '',
      customAppearance: '',
      speechRate: '',
      speechVolume: '',
      speechFluency: '',
      customSpeech: '',
      affectIntensity: '',
      affectQuality: '',
      customAffect: '',
      customPerceptions: '',
      perceptions: '',
      memory: '',
      thoughtContent: '',
      customThought: '',
      thoughtProcess: '',
      customInsightJudgment: '',
      generalSummary: '',
      moodState: '',
      customCognition: '',
      orientation: '',
      attention: '',
      insight: '',
      judgment: ''
    }
  });

  // Load patient data and consultations
  useEffect(() => {
    loadPatientData();
  }, [patient.id, consultationId]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      
      // Load patient consultations
      const consultationsResponse = await expedixApi.getPatientConsultations(patient.id);
      const patientConsultations = consultationsResponse?.data || [];
      setConsultations(patientConsultations);
      
      // Load prescriptions
      const prescriptionsResponse = await expedixApi.getPatientPrescriptions(patient.id);
      setPrescriptions(prescriptionsResponse?.data || []);
      
      // Load next appointment from agenda
      await loadNextAppointment();
      
      // Set current consultation
      if (consultationId) {
        const existing = patientConsultations.find(c => c.id === consultationId);
        if (existing) {
          setCurrentConsultation(existing);
          loadConsultationData(existing);
        }
      } else {
        // Create new consultation
        await createNewConsultation();
      }
      
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNextAppointment = async () => {
    try {
      // This would call the agenda API to get the next appointment for this patient
      const response = await authenticatedFetch(`/api/agenda/appointments/next?patientId=${patient.id}`);
      if (response.ok) {
        const data = await response.json();
        setNextAppointment(data.nextAppointment || data.data);
      }
    } catch (error) {
      console.error('Error loading next appointment:', error);
    }
  };

  const createNewConsultation = async () => {
    try {
      // Auto-create consultation when opened
      const newConsultation = {
        patient_id: patient.id, // Changed from patientId to patient_id to match backend
        date: new Date().toISOString(),
        noteType: 'Consulta General',
        status: 'draft',
        currentCondition: '',
        diagnosis: ''
      };
      
      const response = await expedixApi.createConsultation(newConsultation);
      if (response?.data) {
        setCurrentConsultation(response.data);
        setConsultations(prev => [response.data, ...prev]);
      }
    } catch (error) {
      console.error('Error creating consultation:', error);
    }
  };

  const loadConsultationData = (consultation: Consultation) => {
    // Load consultation details into form
    setConsultationData({
      noteType: consultation.noteType || 'Consulta General',
      date: consultation.date?.split('T')[0] || new Date().toISOString().split('T')[0],
      currentCondition: consultation.currentCondition || '',
      diagnosis: consultation.diagnosis || '',
      diagnoses: [], // Initialize empty diagnoses array for backward compatibility
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
      nextAppointment: consultation.nextAppointment || { date: '', time: '' },
      mentalExam: {
        // Campos en español (principales)
        descripcionInspeccion: '',
        apariencia: '',
        actitud: '',
        conciencia: '',
        orientacion: '',
        atencion: '',
        lenguaje: '',
        afecto: '',
        sensopercepcion: '',
        memoria: '',
        pensamientoPrincipal: '',
        pensamientoDetalles: '',
        // Campos adicionales compatibles
        appearance: '',
        attitude: '',
        consciousness: '',
        customAppearance: '',
        speechRate: '',
        speechVolume: '',
        speechFluency: '',
        customSpeech: '',
        // Afecto y Estado de Ánimo
        affectIntensity: '',
        affectQuality: '',
        moodState: '',
        customAffect: '',
        // Pensamiento
        thoughtProcess: '',
        thoughtContent: '',
        customThought: '',
        // Percepción
        perceptions: '',
        customPerceptions: '',
        // Cognición
        orientation: '',
        attention: '',
        memory: '',
        customCognition: '',
        // Insight y Juicio
        insight: '',
        judgment: '',
        customInsightJudgment: '',
        // Resumen general (campo libre)
        generalSummary: ''
      }
    });
  };

  // Auto-save function
  const handleAutoSave = useCallback(async () => {
    if (isAutoSaving) return; // Prevent multiple simultaneous auto-saves
    
    try {
      setIsAutoSaving(true);
      
      const mentalExamData: MentalExamData = {
        appearance: consultationData.mentalExam.appearance || '',
        attitude: consultationData.mentalExam.attitude || '',
        consciousness: consultationData.mentalExam.consciousness || '',
        customAppearance: consultationData.mentalExam.customAppearance || '',
        speechRate: consultationData.mentalExam.speechRate || '',
        speechVolume: consultationData.mentalExam.speechVolume || '',
        speechFluency: consultationData.mentalExam.speechFluency || '',
        customSpeech: consultationData.mentalExam.customSpeech || '',
        affectIntensity: consultationData.mentalExam.affectIntensity || '',
        affectQuality: consultationData.mentalExam.affectQuality || '',
        moodState: consultationData.mentalExam.moodState || '',
        customAffect: consultationData.mentalExam.customAffect || '',
        thoughtProcess: consultationData.mentalExam.thoughtProcess || '',
        thoughtContent: consultationData.mentalExam.thoughtContent || '',
        customThought: consultationData.mentalExam.customThought || '',
        perceptions: consultationData.mentalExam.perceptions || '',
        customPerceptions: consultationData.mentalExam.customPerceptions || '',
        orientation: consultationData.mentalExam.orientation || '',
        attention: consultationData.mentalExam.attention || '',
        memory: consultationData.mentalExam.memory || '',
        customCognition: consultationData.mentalExam.customCognition || '',
        insight: consultationData.mentalExam.insight || '',
        judgment: consultationData.mentalExam.judgment || '',
        customInsightJudgment: consultationData.mentalExam.customInsightJudgment || '',
        generalSummary: consultationData.mentalExam.generalSummary || ''
      };

      // Preparar diagnósticos para guardado
      const primaryDiagnosis = consultationData.diagnoses.find(d => d.isPrimary) || consultationData.diagnoses[0];
      const diagnosesText = consultationData.diagnoses.length > 0 
        ? consultationData.diagnoses.map(d => {
            let text = d.code ? `${d.code} - ${d.description}` : d.description;
            if (d.isPrimary) text = `[PRINCIPAL] ${text}`;
            if (d.notes) text += ` (${d.notes})`;
            return text;
          }).join('\n')
        : consultationData.diagnosis; // Fallback para compatibilidad

      const updateData = {
        patient_id: patient.id,
        subjective: consultationData.currentCondition,
        objective: `${consultationData.vitalSigns.height ? `Talla: ${consultationData.vitalSigns.height}cm` : ''} ${consultationData.vitalSigns.weight ? `Peso: ${consultationData.vitalSigns.weight}kg` : ''} ${consultationData.vitalSigns.bloodPressure.systolic ? `TA: ${consultationData.vitalSigns.bloodPressure.systolic}/${consultationData.vitalSigns.bloodPressure.diastolic}` : ''} ${consultationData.vitalSigns.temperature ? `Temp: ${consultationData.vitalSigns.temperature}°C` : ''} ${consultationData.vitalSigns.heartRate ? `FC: ${consultationData.vitalSigns.heartRate}bpm` : ''}`.trim(),
        assessment: diagnosesText,
        // Agregar los diagnósticos estructurados como campo adicional
        diagnoses_structured: consultationData.diagnoses,
        plan: consultationData.additionalInstructions || '',
        mental_exam: {
          ...mentalExamData,
          summary: MentalExamFormatter.formatForStorage(mentalExamData).readableSummary
        },
        status: 'draft', // Auto-saved consultations are drafts
        consultation_type: consultationData.noteType
      };

      await expedixApi.createConsultation(updateData);
      setLastSaved(new Date());
      console.log('✅ Auto-saved consultation data');
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [consultationData, patient.id, isAutoSaving]);

  // Auto-save effect with debounce
  useEffect(() => {
    const autoSaveTimeout = setTimeout(() => {
      // Only auto-save if there's content in key fields
      const hasContent = consultationData.currentCondition.trim() || 
                        consultationData.diagnosis.trim() || 
                        consultationData.diagnoses.length > 0 ||
                        consultationData.additionalInstructions?.trim();
      
      if (hasContent) {
        handleAutoSave();
      }
    }, 5000); // Auto-save after 5 seconds of inactivity

    return () => clearTimeout(autoSaveTimeout);
  }, [consultationData, handleAutoSave]);

  const handleSaveConsultation = async () => {
    if (!currentConsultation) return;
    
    try {
      // Formatear examen mental para almacenamiento
      const formattedMentalExam = MentalExamFormatter.formatForStorage(consultationData.mentalExam as MentalExamData);
      
      const updateData = {
        ...consultationData,
        // Guardar tanto la estructura como el resumen en el campo mental_exam
        mental_exam: {
          structured: formattedMentalExam.structuredData,
          readable: formattedMentalExam.readableSummary,
          compact: formattedMentalExam.compactSummary,
          hasContent: MentalExamFormatter.hasSignificantContent(consultationData.mentalExam as MentalExamData),
          lastUpdated: new Date().toISOString()
        },
        status: 'completed',
        updatedAt: new Date().toISOString()
      };
      
      console.log('💾 Saving consultation with structured mental exam:', updateData.mental_exam);
      
      await expedixApi.updateConsultation(currentConsultation.id, updateData);
      
      // Refresh consultations list
      await loadPatientData();
      
      if (onSave) {
        onSave(updateData);
      }
      
      // Show success message
      console.log('✅ Consultation saved successfully with mental exam data');
      
    } catch (error) {
      console.error('❌ Error saving consultation:', error);
    }
  };

  // Print handlers
  const handlePrintConsultation = () => {
    if (!currentConsultation) {
      console.warn('No consultation available for printing');
      return;
    }
    
    const printData = {
      type: 'consultation',
      consultation: currentConsultation,
      consultationData,
      patient,
      formattedMentalExam: MentalExamFormatter.formatForStorage(consultationData.mentalExam as MentalExamData)
    };
    
    // Abrir ventana de impresión
    openPrintWindow(printData);
    setShowPrintMenu(false);
  };

  const handlePrintPrescription = () => {
    if (!consultationData.medications || consultationData.medications.length === 0) {
      alert('No hay medicamentos en esta consulta para imprimir');
      return;
    }
    
    const printData = {
      type: 'prescription',
      consultation: currentConsultation,
      consultationData,
      patient,
      medications: consultationData.medications
    };
    
    openPrintWindow(printData);
    setShowPrintMenu(false);
  };

  const handlePrintMedicalRecord = () => {
    const printData = {
      type: 'medical_record',
      patient,
      consultations,
      prescriptions,
      currentConsultation
    };
    
    openPrintWindow(printData);
    setShowPrintMenu(false);
  };

  const openPrintWindow = (printData: any) => {
    // Crear una nueva ventana para impresión
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Por favor permite ventanas emergentes para imprimir');
      return;
    }
    
    // Generar HTML para impresión
    const html = generatePrintHTML(printData);
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Esperar a que se cargue completamente antes de imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // No cerrar automáticamente para que el usuario pueda revisar
      }, 500);
    };
  };

  const generatePrintHTML = (printData: any): string => {
    const { type, patient, consultation, consultationData: formData, formattedMentalExam } = printData;
    
    // Obtener configuración de impresión
    const config = PrintConfigManager.getCurrentConfig();
    const styles = `<style>${PrintConfigManager.generateStyles(config)}</style>`;
    
    if (type === 'consultation') {
      return generateConsultationHTML(styles, config, patient, formData, formattedMentalExam);
    } else if (type === 'prescription') {
      return generatePrescriptionHTML(styles, config, patient, formData);
    } else if (type === 'medical_record') {
      return generateMedicalRecordHTML(styles, config, printData);
    }
    
    return '';
  };

  const generateConsultationHTML = (styles: string, config: PrintConfig, patient: Patient, formData: any, formattedMentalExam: any): string => {
    const currentDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Nota de Consulta - ${patient.first_name} ${patient.paternal_last_name}</title>
        ${styles}
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">${config.clinicName}</div>
          <div class="clinic-info">${config.doctorName} • Cédula Prof: ${config.professionalId}</div>
          <div class="clinic-info">Tel: ${config.phone} • Email: ${config.email}</div>
        </div>
        
        <div class="patient-info">
          <div><strong>${patient.first_name} ${patient.paternal_last_name} ${patient.maternal_last_name || ''}</strong></div>
          <div>Edad: ${patient.age} años</div>
          <div>Fecha: ${currentDate}</div>
          <div>Tipo: ${formData.noteType}</div>
        </div>
        
        ${formData.currentCondition ? `
        <div class="section">
          <div class="section-title">Padecimiento Actual</div>
          <div class="section-content">${formData.currentCondition}</div>
        </div>
        ` : ''}
        
        ${(formData.vitalSigns.height || formData.vitalSigns.weight || formData.vitalSigns.temperature) ? `
        <div class="section">
          <div class="section-title">Signos Vitales</div>
          <div class="compact-row">
            ${formData.vitalSigns.height ? `<div>Altura: ${formData.vitalSigns.height} cm</div>` : ''}
            ${formData.vitalSigns.weight ? `<div>Peso: ${formData.vitalSigns.weight} kg</div>` : ''}
            ${formData.vitalSigns.temperature ? `<div>Temp: ${formData.vitalSigns.temperature}°C</div>` : ''}
          </div>
          <div class="compact-row">
            ${formData.vitalSigns.bloodPressure.systolic ? `<div>PA: ${formData.vitalSigns.bloodPressure.systolic}/${formData.vitalSigns.bloodPressure.diastolic} mmHg</div>` : ''}
            ${formData.vitalSigns.heartRate ? `<div>FC: ${formData.vitalSigns.heartRate} lpm</div>` : ''}
            ${formData.vitalSigns.oxygenSaturation ? `<div>SpO2: ${formData.vitalSigns.oxygenSaturation}%</div>` : ''}
          </div>
        </div>
        ` : ''}
        
        ${formData.physicalExamination ? `
        <div class="section">
          <div class="section-title">Exploración Física</div>
          <div class="section-content">${formData.physicalExamination}</div>
        </div>
        ` : ''}
        
        ${formattedMentalExam && formattedMentalExam.compactSummary && formattedMentalExam.compactSummary !== 'Examen mental dentro de parámetros normales' ? `
        <div class="section">
          <div class="section-title">Examen Mental</div>
          <div class="section-content">${config.consultation.includeFullMentalExam ? formattedMentalExam.readableSummary : formattedMentalExam.compactSummary}</div>
        </div>
        ` : ''}
        
        ${formData.diagnosis ? `
        <div class="section">
          <div class="section-title">Diagnóstico</div>
          <div class="section-content">${formData.diagnosis}</div>
        </div>
        ` : ''}
        
        ${formData.additionalInstructions ? `
        <div class="section">
          <div class="section-title">Plan de Tratamiento</div>
          <div class="section-content">${formData.additionalInstructions}</div>
        </div>
        ` : ''}
        
        ${config.consultation.includeNextAppointment && (formData.nextAppointment.date || formData.nextAppointment.time) ? `
        <div class="section">
          <div class="section-title">Próxima Cita</div>
          <div class="section-content">
            ${formData.nextAppointment.date ? `Fecha: ${format(new Date(formData.nextAppointment.date), 'dd/MM/yyyy', { locale: es })}` : ''}
            ${formData.nextAppointment.time ? ` - Hora: ${formData.nextAppointment.time}` : ''}
          </div>
        </div>
        ` : ''}
        
        <div class="signature-area">
          <div class="signature-line"></div>
          <div>${config.doctorName}</div>
          <div>Cédula Profesional: ${config.professionalId}</div>
        </div>
        
        <div class="footer">
          Documento generado por MindHub • ${currentDate}
        </div>
      </body>
      </html>
    `;
  };

  const generatePrescriptionHTML = (styles: string, config: PrintConfig, patient: Patient, formData: any): string => {
    const currentDate = format(new Date(), 'dd/MM/yyyy', { locale: es });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Receta Médica - ${patient.first_name} ${patient.paternal_last_name}</title>
        ${styles}
        <style>
          .prescription-header { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 15px; }
          .rx-symbol { font-size: 24px; font-weight: bold; margin: 10px 0; }
          .medication { margin: 8px 0; padding: 6px; border-left: 3px solid #007bff; }
          .medication-name { font-weight: bold; font-size: 12px; }
          .medication-details { font-size: 10px; margin-left: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">${config.clinicName}</div>
          <div class="clinic-info">${config.doctorName} • Cédula Prof: 12345678</div>
          <div class="clinic-info">Tel: (555) 123-4567</div>
        </div>
        
        ${config.prescription.includeHeader ? `<div class="prescription-header">RECETA MÉDICA</div>` : ''}
        
        ${config.prescription.includePatientInfo ? `
        <div class="patient-info">
          <div><strong>${patient.first_name} ${patient.paternal_last_name}</strong></div>
          ${config.prescription.includeAge ? `<div>Edad: ${patient.age} años</div>` : ''}
          ${config.prescription.includeDate ? `<div>Fecha: ${currentDate}</div>` : ''}
        </div>
        ` : ''}
        
        ${config.prescription.rxSymbol ? `<div class="rx-symbol">℞</div>` : ''}
        
        ${(formData.medications || []).map((med: any, index: number) => `
          <div class="medication">
            <div class="medication-name">${config.prescription.numberedMedications ? `${index + 1}. ` : ''}${med.name || 'Medicamento'}</div>
            <div class="medication-details">
              ${med.dosage ? `Dosis: ${med.dosage}` : ''}<br>
              ${med.frequency ? `Frecuencia: ${med.frequency}` : ''}<br>
              ${med.duration ? `Duración: ${med.duration}` : ''}<br>
              ${med.instructions ? `Instrucciones: ${med.instructions}` : ''}
            </div>
          </div>
        `).join('')}
        
        <div class="signature-area">
          <div class="signature-line"></div>
          <div>${config.doctorName}</div>
          <div>Cédula Profesional: ${config.professionalId}</div>
        </div>
      </body>
      </html>
    `;
  };

  const generateMedicalRecordHTML = (styles: string, config: PrintConfig, printData: any): string => {
    const { patient, consultations } = printData;
    const currentDate = format(new Date(), 'dd/MM/yyyy', { locale: es });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Expediente Médico - ${patient.first_name} ${patient.paternal_last_name}</title>
        ${styles}
        <style>
          .record-header { font-size: 14px; font-weight: bold; text-align: center; margin-bottom: 10px; }
          .consultation-item { margin: 6px 0; padding: 4px; border-bottom: 1px solid #eee; }
          .consultation-date { font-weight: bold; font-size: 10px; }
          .consultation-summary { font-size: 9px; margin-left: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-name">${config.clinicName}</div>
          <div class="clinic-info">${config.doctorName}</div>
        </div>
        
        <div class="record-header">EXPEDIENTE MÉDICO</div>
        
        <div class="patient-info">
          <div><strong>${patient.first_name} ${patient.paternal_last_name}</strong></div>
          <div>Fecha de nacimiento: ${safeFormatDate(patient.birth_date)}</div>
          <div>Edad: ${patient.age} años</div>
          <div>Teléfono: ${patient.cell_phone || 'No registrado'}</div>
          <div>Email: ${patient.email || 'No registrado'}</div>
        </div>
        
        <div class="section">
          <div class="section-title">Historial de Consultas</div>
          ${(consultations || []).map((consultation: any) => `
            <div class="consultation-item">
              <div class="consultation-date">${safeFormatDate(consultation.date)} - ${consultation.noteType}</div>
              <div class="consultation-summary">
                ${consultation.currentCondition ? `Motivo: ${consultation.currentCondition.substring(0, 100)}...` : ''}
                ${consultation.diagnosis ? `Diagnóstico: ${consultation.diagnosis}` : ''}
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="footer">
          Expediente impreso el ${currentDate} • MindHub
        </div>
      </body>
      </html>
    `;
  };

  const handleNavigateConsultation = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentConsultationIndex > 0) {
      const newIndex = currentConsultationIndex - 1;
      setCurrentConsultationIndex(newIndex);
      const consultation = consultations[newIndex];
      setCurrentConsultation(consultation);
      loadConsultationData(consultation);
    } else if (direction === 'next' && currentConsultationIndex < consultations.length - 1) {
      const newIndex = currentConsultationIndex + 1;
      setCurrentConsultationIndex(newIndex);
      const consultation = consultations[newIndex];
      setCurrentConsultation(consultation);
      loadConsultationData(consultation);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando consulta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Patient History Navigation */}
      <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        {/* Patient Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
          <div className="flex items-center justify-between mb-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Volver
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary-200 rounded-full flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-primary-700" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-semibold text-gray-900">
                  {patient.first_name} {patient.paternal_last_name}
                </h2>
                {/* Autosave indicator */}
                {isAutoSaving && (
                  <div className="flex items-center space-x-1 text-xs text-blue-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>Guardando...</span>
                  </div>
                )}
                {lastSaved && !isAutoSaving && (
                  <div className="text-xs text-green-600 flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Guardado {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {patient.age} años • #{patient.id.slice(0, 8)}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'consultations', label: 'Consultas', icon: DocumentTextIcon },
            { id: 'prescriptions', label: 'Recetas', icon: ClockIcon },
            { id: 'appointments', label: 'Citas', icon: CalendarIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSidebarView(tab.id as SidebarView)}
              className={`flex-1 py-3 px-2 text-xs font-medium transition-colors ${
                sidebarView === tab.id
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4 mx-auto mb-1" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {sidebarView === 'consultations' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Consultas Anteriores</h3>
                <span className="text-sm text-gray-500">{consultations.length}</span>
              </div>
              {consultations.map((consultation, index) => (
                <div
                  key={consultation.id}
                  onClick={() => {
                    setCurrentConsultation(consultation);
                    setCurrentConsultationIndex(index);
                    loadConsultationData(consultation);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    currentConsultation?.id === consultation.id
                      ? 'border-primary-200 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {consultation.noteType}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      consultation.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {consultation.status === 'completed' ? 'Completada' : 'Borrador'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    {safeFormatDate(consultation.date, 'dd MMM yyyy')}
                  </p>
                  <p className="text-xs text-gray-700 line-clamp-2">
                    {consultation.diagnosis || consultation.currentCondition || 'Sin diagnóstico'}
                  </p>
                </div>
              ))}
            </div>
          )}

          {sidebarView === 'prescriptions' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Recetas</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{prescriptions.length}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowPrescriptionModal(true)}
                    className="text-xs"
                  >
                    <PlusIcon className="h-3 w-3 mr-1" />
                    Nueva
                  </Button>
                </div>
              </div>
              {prescriptions.map((prescription) => (
                <div key={prescription.id} className="p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      Receta #{prescription.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {safeFormatDate(prescription.created_at, 'dd MMM')}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {prescription.medications.map((med, index) => (
                      <p key={index} className="text-xs text-gray-700">
                        • {med.name} - {med.dosage}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {sidebarView === 'appointments' && (
            <div className="p-4 space-y-3">
              <h3 className="font-medium text-gray-900">Próximas Citas</h3>
              {nextAppointment ? (
                <div className="p-3 rounded-lg border border-green-200 bg-green-50">
                  <div className="flex items-center space-x-2 mb-2">
                    <CalendarIcon className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Próxima cita</span>
                  </div>
                  <p className="text-sm text-green-800">
                    {safeFormatDate(nextAppointment.date, 'dd MMMM yyyy')}
                  </p>
                  <p className="text-sm text-green-700">{nextAppointment.time}</p>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                  <p className="text-sm text-gray-600">No hay citas programadas</p>
                  <Button size="sm" className="mt-2" variant="outline">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Programar cita
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area - Current Consultation */}
      <div className="flex-1 flex flex-col">
        {/* Header with Navigation */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {currentConsultation ? 'Editar Consulta' : 'Nueva Consulta'}
              </h1>
              {consultations.length > 1 && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigateConsultation('prev')}
                    disabled={currentConsultationIndex === 0}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    {currentConsultationIndex + 1} de {consultations.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigateConsultation('next')}
                    disabled={currentConsultationIndex === consultations.length - 1}
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => setShowPreviewDialog(true)}>
                <EyeIcon className="h-4 w-4 mr-1" />
                Vista previa
              </Button>
              
              {/* Print Menu */}
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowPrintMenu(!showPrintMenu)}
                  disabled={!currentConsultation}
                >
                  <PrinterIcon className="h-4 w-4 mr-1" />
                  Imprimir
                </Button>
                
                {showPrintMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowPrintMenu(false)}
                    ></div>
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                      <div className="py-1">
                        <button
                          onClick={handlePrintConsultation}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <DocumentTextIcon className="h-4 w-4 mr-2" />
                          Nota de Consulta
                        </button>
                        <button
                          onClick={handlePrintPrescription}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          disabled={!consultationData.medications || consultationData.medications.length === 0}
                        >
                          📋 Receta Médica
                        </button>
                        <button
                          onClick={handlePrintMedicalRecord}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          📁 Expediente Completo
                        </button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={() => {
                            setShowPrintConfig(true);
                            setShowPrintMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <CogIcon className="h-4 w-4 mr-2" />
                          Configurar Impresión
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
            </div>
          </div>
        </div>

        {/* Consultation Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Basic Information */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información General</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de consulta
                  </label>
                  <select
                    value={consultationData.noteType}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      noteType: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="Consulta General">Consulta General</option>
                    <option value="Primera Vez">Primera Vez</option>
                    <option value="Seguimiento">Seguimiento</option>
                    <option value="Control">Control</option>
                    <option value="Urgencia">Urgencia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de consulta
                  </label>
                  <input
                    type="date"
                    value={consultationData.date}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      date: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </Card>

            {/* Current Condition */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Padecimiento Actual</h3>
              <textarea
                value={consultationData.currentCondition}
                onChange={(e) => setConsultationData(prev => ({ 
                  ...prev, 
                  currentCondition: e.target.value 
                }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe el padecimiento actual del paciente..."
              />
            </Card>

            {/* Vital Signs */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Signos Vitales</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    value={consultationData.vitalSigns.height}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      vitalSigns: { ...prev.vitalSigns, height: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    value={consultationData.vitalSigns.weight}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      vitalSigns: { ...prev.vitalSigns, weight: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperatura (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={consultationData.vitalSigns.temperature}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      vitalSigns: { ...prev.vitalSigns, temperature: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Presión Arterial
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Sistólica"
                      value={consultationData.vitalSigns.bloodPressure.systolic}
                      onChange={(e) => setConsultationData(prev => ({ 
                        ...prev, 
                        vitalSigns: { 
                          ...prev.vitalSigns, 
                          bloodPressure: { ...prev.vitalSigns.bloodPressure, systolic: e.target.value }
                        }
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                    <input
                      type="number"
                      placeholder="Diastólica"
                      value={consultationData.vitalSigns.bloodPressure.diastolic}
                      onChange={(e) => setConsultationData(prev => ({ 
                        ...prev, 
                        vitalSigns: { 
                          ...prev.vitalSigns, 
                          bloodPressure: { ...prev.vitalSigns.bloodPressure, diastolic: e.target.value }
                        }
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frecuencia Cardíaca
                  </label>
                  <input
                    type="number"
                    value={consultationData.vitalSigns.heartRate}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      vitalSigns: { ...prev.vitalSigns, heartRate: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Saturación O2 (%)
                  </label>
                  <input
                    type="number"
                    value={consultationData.vitalSigns.oxygenSaturation}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      vitalSigns: { ...prev.vitalSigns, oxygenSaturation: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </Card>

            {/* Physical Examination */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Exploración Física</h3>
              <textarea
                value={consultationData.physicalExamination}
                onChange={(e) => setConsultationData(prev => ({ 
                  ...prev, 
                  physicalExamination: e.target.value 
                }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe los hallazgos de la exploración física..."
              />
            </Card>

            {/* Diagnosis - Advanced Selector with CIE-10/DSM-5TR Integration */}
            <Card className="p-6">
              <DiagnosesSelector
                selectedDiagnoses={consultationData.diagnoses}
                onChange={(diagnoses) => {
                  setConsultationData(prev => ({ 
                    ...prev, 
                    diagnoses,
                    // Mantener compatibilidad con el campo diagnosis antiguo
                    diagnosis: diagnoses.length > 0 
                      ? diagnoses.find(d => d.isPrimary)?.description || diagnoses[0].description
                      : ''
                  }));
                }}
                maxDiagnoses={8}
                allowCustom={true}
                className=""
              />
            </Card>

            {/* Mental Exam - Modern Dropdown Interface */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                🧠 Examen Mental 
                <span className="text-sm font-normal text-gray-500 ml-2">Selección estructurada con opciones personalizables</span>
              </h3>
              
              <div className="space-y-6">
                {/* Apariencia y Comportamiento */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-gray-900 mb-4">1. Apariencia y Comportamiento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Apariencia General</label>
                      <select
                        value={consultationData.mentalExam.appearance}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mentalExam: { ...prev.mentalExam, appearance: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="bien cuidado">Bien cuidado</option>
                        <option value="descuidado">Descuidado</option>
                        <option value="excesivamente arreglado">Excesivamente arreglado</option>
                        <option value="inapropiado para la ocasión">Inapropiado para la ocasión</option>
                        <option value="normal para la edad">Normal para la edad</option>
                        <option value="personalizado">Personalizado (especificar abajo)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Actitud hacia el Examinador</label>
                      <select
                        value={consultationData.mentalExam.attitude}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mentalExam: { ...prev.mentalExam, attitude: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="cooperativo">Cooperativo</option>
                        <option value="hostil">Hostil</option>
                        <option value="defensivo">Defensivo</option>
                        <option value="suspicaz">Suspicaz</option>
                        <option value="evasivo">Evasivo</option>
                        <option value="apático">Apático</option>
                        <option value="fácilmente distraído">Fácilmente distraído</option>
                        <option value="enfocado">Enfocado</option>
                        <option value="personalizado">Personalizado (especificar abajo)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nivel de Conciencia</label>
                      <select
                        value={consultationData.mentalExam.consciousness}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mentalExam: { ...prev.mentalExam, consciousness: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="alerta">Alerta</option>
                        <option value="vigilante">Vigilante</option>
                        <option value="somnoliento">Somnoliento</option>
                        <option value="letárgico">Letárgico</option>
                        <option value="estuporoso">Estuporoso</option>
                        <option value="confuso">Confuso</option>
                        <option value="fluctuante">Fluctuante</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones Adicionales</label>
                      <textarea
                        value={consultationData.mentalExam.customAppearance}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mentalExam: { ...prev.mentalExam, customAppearance: e.target.value }
                        }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Detalles específicos sobre apariencia y comportamiento..."
                      />
                    </div>
                  </div>
                </div>

                {/* Habla y Lenguaje */}
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-gray-900 mb-4">2. Habla y Lenguaje</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Velocidad del Habla</label>
                      <select
                        value={consultationData.mentalExam.speechRate}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mentalExam: { ...prev.mentalExam, speechRate: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="normal">Normal</option>
                        <option value="rápido">Rápido</option>
                        <option value="lento">Lento</option>
                        <option value="presionado">Presionado</option>
                        <option value="tartamudeante">Tartamudeante</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Volumen</label>
                      <select
                        value={consultationData.mentalExam.speechVolume}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mentalExam: { ...prev.mentalExam, speechVolume: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="normal">Normal</option>
                        <option value="alto">Alto</option>
                        <option value="bajo">Bajo</option>
                        <option value="monótono">Monótono</option>
                        <option value="débil">Débil</option>
                        <option value="fuerte">Fuerte</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fluidez</label>
                      <select
                        value={consultationData.mentalExam.speechFluency}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mentalExam: { ...prev.mentalExam, speechFluency: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="clara">Clara</option>
                        <option value="arrastrada">Arrastrada</option>
                        <option value="vacilante">Vacilante</option>
                        <option value="buena articulación">Buena articulación</option>
                        <option value="afásico">Afásico</option>
                      </select>
                    </div>
                    
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones sobre Habla</label>
                      <textarea
                        value={consultationData.mentalExam.customSpeech}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mentalExam: { ...prev.mentalExam, customSpeech: e.target.value }
                        }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Detalles específicos sobre el habla y lenguaje..."
                      />
                    </div>
                  </div>
                </div>

                {/* Afecto y Estado de Ánimo */}
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-medium text-gray-900 mb-4">3. Afecto y Estado de Ánimo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Intensidad del Afecto</label>
                      <select
                        value={consultationData.mentalExam.affectIntensity}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mentalExam: { ...prev.mentalExam, affectIntensity: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="normal">Normal</option>
                        <option value="embotado">Embotado</option>
                        <option value="plano">Plano</option>
                        <option value="hiper-energizado">Hiper-energizado</option>
                        <option value="restringido">Restringido</option>
                        <option value="lábil">Lábil</option>
                        <option value="expansivo">Expansivo</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cualidad del Afecto</label>
                      <select
                        value={consultationData.mentalExam.affectQuality}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mentalExam: { ...prev.mentalExam, affectQuality: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="eutímico">Eutímico</option>
                        <option value="triste">Triste</option>
                        <option value="ansioso">Ansioso</option>
                        <option value="irritable">Irritable</option>
                        <option value="eufórico">Eufórico</option>
                        <option value="hostil">Hostil</option>
                        <option value="indiferente">Indiferente</option>
                        <option value="animado">Animado</option>
                        <option value="disfórico">Disfórico</option>
                      </select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Estado de Ánimo Reportado</label>
                      <input
                        type="text"
                        value={consultationData.mentalExam.moodState}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mentalExam: { ...prev.mentalExam, moodState: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Cómo describe el paciente su estado de ánimo..."
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones Emocionales</label>
                      <textarea
                        value={consultationData.mentalExam.customAffect}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mentalExam: { ...prev.mentalExam, customAffect: e.target.value }
                        }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Detalles sobre el estado emocional y afectivo..."
                      />
                    </div>
                  </div>
                </div>

                {/* Pensamiento */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-medium text-gray-900 mb-4">4. Pensamiento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Proceso del Pensamiento</label>
                      <select
                        value={consultationData.mentalExam.thoughtProcess}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mentalExam: { ...prev.mentalExam, thoughtProcess: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="lineal y dirigido al objetivo">Lineal y dirigido al objetivo</option>
                        <option value="circunstancial">Circunstancial</option>
                        <option value="tangencial">Tangencial</option>
                        <option value="incoherente">Incoherente</option>
                        <option value="fuga de ideas">Fuga de ideas</option>
                        <option value="bloqueo del pensamiento">Bloqueo del pensamiento</option>
                        <option value="perseveración">Perseveración</option>
                        <option value="asociaciones libres">Asociaciones libres</option>
                        <option value="ensalada de palabras">Ensalada de palabras</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contenido del Pensamiento</label>
                      <input
                        type="text"
                        value={consultationData.mentalExam.thoughtContent}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mentalExam: { ...prev.mentalExam, thoughtContent: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Ideas dominantes, preocupaciones, obsesiones..."
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones del Pensamiento</label>
                      <textarea
                        value={consultationData.mentalExam.customThought}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mentalExam: { ...prev.mentalExam, customThought: e.target.value }
                        }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Detalles sobre el curso y contenido del pensamiento..."
                      />
                    </div>
                  </div>
                </div>

                {/* Percepción */}
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-medium text-gray-900 mb-4">5. Percepción</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Alteraciones Perceptuales</label>
                      <select
                        value={consultationData.mentalExam.perceptions}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mentalExam: { ...prev.mentalExam, perceptions: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Sin alteraciones reportadas</option>
                        <option value="alucinaciones auditivas">Alucinaciones auditivas</option>
                        <option value="alucinaciones visuales">Alucinaciones visuales</option>
                        <option value="alucinaciones táctiles">Alucinaciones táctiles</option>
                        <option value="ilusiones">Ilusiones</option>
                        <option value="despersonalización">Despersonalización</option>
                        <option value="desrealización">Desrealización</option>
                        <option value="personalizado">Personalizado (especificar abajo)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Detalles sobre Percepción</label>
                      <textarea
                        value={consultationData.mentalExam.customPerceptions}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mentalExam: { ...prev.mentalExam, customPerceptions: e.target.value }
                        }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Descripción detallada de alteraciones perceptuales..."
                      />
                    </div>
                  </div>
                </div>

                {/* Cognición */}
                <div className="border-l-4 border-indigo-500 pl-4">
                  <h4 className="font-medium text-gray-900 mb-4">6. Cognición</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Orientación</label>
                      <input
                        type="text"
                        value={consultationData.mentalExam.orientation}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mentalExam: { ...prev.mentalExam, orientation: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Tiempo, lugar, persona..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Atención</label>
                      <input
                        type="text"
                        value={consultationData.mentalExam.attention}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mentalExam: { ...prev.mentalExam, attention: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Concentración, distraibilidad..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Memoria</label>
                      <input
                        type="text"
                        value={consultationData.mentalExam.memory}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mentalExam: { ...prev.mentalExam, memory: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Inmediata, reciente, remota..."
                      />
                    </div>
                    
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Evaluación Cognitiva Adicional</label>
                      <textarea
                        value={consultationData.mentalExam.customCognition}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mentalExam: { ...prev.mentalExam, customCognition: e.target.value }
                        }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Cálculo, abstracción, función ejecutiva..."
                      />
                    </div>
                  </div>
                </div>

                {/* Insight y Juicio */}
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-medium text-gray-900 mb-4">7. Insight y Juicio</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Insight (Conciencia de Enfermedad)</label>
                      <select
                        value={consultationData.mentalExam.insight}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mentalExam: { ...prev.mentalExam, insight: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="pobre">Pobre</option>
                        <option value="regular">Regular</option>
                        <option value="bueno">Bueno</option>
                        <option value="excelente">Excelente</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Juicio</label>
                      <select
                        value={consultationData.mentalExam.judgment}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mentalExam: { ...prev.mentalExam, judgment: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="alterado">Alterado</option>
                        <option value="pobre">Pobre</option>
                        <option value="bueno">Bueno</option>
                      </select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones sobre Insight y Juicio</label>
                      <textarea
                        value={consultationData.mentalExam.customInsightJudgment}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mentalExam: { ...prev.mentalExam, customInsightJudgment: e.target.value }
                        }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Detalles sobre la conciencia de enfermedad y capacidad de juicio..."
                      />
                    </div>
                  </div>
                </div>

                {/* Resumen General */}
                <div className="border-l-4 border-gray-500 pl-4">
                  <h4 className="font-medium text-gray-900 mb-4">8. Resumen General del Examen Mental</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Impresión General</label>
                    <textarea
                      value={consultationData.mentalExam.generalSummary}
                      onChange={(e) => setConsultationData(prev => ({ 
                        ...prev, 
                        mentalExam: { ...prev.mentalExam, generalSummary: e.target.value }
                      }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Resumen integrado del estado mental, impresiones clínicas principales y observaciones relevantes..."
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Additional Instructions */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Instrucciones Adicionales</h3>
              <textarea
                value={consultationData.additionalInstructions}
                onChange={(e) => setConsultationData(prev => ({ 
                  ...prev, 
                  additionalInstructions: e.target.value 
                }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Instrucciones para el paciente..."
              />
            </Card>

            {/* Next Appointment */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Próxima Cita</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={consultationData.nextAppointment.date}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      nextAppointment: { ...prev.nextAppointment, date: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora
                  </label>
                  <input
                    type="time"
                    value={consultationData.nextAppointment.time}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      nextAppointment: { ...prev.nextAppointment, time: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </Card>
            
            {/* Save Button - Moved to bottom */}
            <div className="mt-8 flex justify-center sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-200">
              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => setShowPreviewDialog(true)}>
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Vista previa
                </Button>
                <Button variant="primary" onClick={handleSaveConsultation} className="px-8">
                  Guardar y terminar consulta
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <ConsultationPreviewDialog
        isOpen={showPreviewDialog}
        onClose={() => setShowPreviewDialog(false)}
        patient={patient}
        consultationData={{
          ...consultationData,
          mentalExam: {
            descripcionInspeccion: consultationData.mentalExam.customAppearance || consultationData.mentalExam.appearance || '',
            apariencia: consultationData.mentalExam.appearance || consultationData.mentalExam.customAppearance || '',
            actitud: consultationData.mentalExam.attitude || '',
            conciencia: consultationData.mentalExam.consciousness || '',
            orientacion: consultationData.mentalExam.orientation || '',
            atencion: consultationData.mentalExam.attention || '',
            lenguaje: consultationData.mentalExam.customSpeech || `${consultationData.mentalExam.speechRate} ${consultationData.mentalExam.speechVolume} ${consultationData.mentalExam.speechFluency}`.trim() || '',
            afecto: consultationData.mentalExam.customAffect || `${consultationData.mentalExam.affectIntensity} ${consultationData.mentalExam.affectQuality}`.trim() || '',
            sensopercepcion: consultationData.mentalExam.customPerceptions || consultationData.mentalExam.perceptions || '',
            memoria: consultationData.mentalExam.memory || '',
            pensamientoPrincipal: consultationData.mentalExam.thoughtContent || '',
            pensamientoDetalles: consultationData.mentalExam.customThought || consultationData.mentalExam.thoughtProcess || ''
          }
        }}
        professionalName="Dr. Alejandro"
        clinicName="${config.clinicName}"
      />

      {/* Print Configuration Dialog */}
      {showPrintConfig && (
        <PrintConfigDialog
          onClose={() => setShowPrintConfig(false)}
          onSave={(config) => {
            console.log('✅ Print configuration saved:', config);
            // La configuración ya se guarda automáticamente en PrintConfigDialog
          }}
        />
      )}
      
      {/* Prescription Creator Modal */}
      {showPrescriptionModal && (
        <PrescriptionCreator
          patient={{
            ...patient,
            last_name: patient.paternal_last_name,
            date_of_birth: patient.birth_date,
            allergies: patient.allergies ? patient.allergies.split(',').map(a => a.trim()) : undefined,
            chronic_conditions: patient.medical_history ? patient.medical_history.split(',').map(c => c.trim()) : undefined
          }}
          onCancel={() => setShowPrescriptionModal(false)}
          onSuccess={async (prescriptionData) => {
            try {
              console.log('💊 Creating prescription:', prescriptionData);
              // Refresh prescriptions after creation
              const prescriptionsResponse = await expedixApi.getPatientPrescriptions(patient.id);
              setPrescriptions(prescriptionsResponse?.data || []);
              setShowPrescriptionModal(false);
            } catch (error) {
              console.error('❌ Error creating prescription:', error);
            }
          }}
        />
      )}
    </div>
  );
}