'use client';

import { useState, useEffect, useCallback, useRef, use } from 'react';
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
  CogIcon,
  TrashIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';
import { expedixApi, type Patient, type Prescription } from '@/lib/api/expedix-client';
import { useAuthenticatedFetch } from '@/lib/api/supabase-auth';
import { format, set } from 'date-fns';
import { es } from 'date-fns/locale';
import ConsultationPreviewDialog from './ConsultationPreviewDialog';
import { MentalExamFormatter, type MentalExamData } from '@/lib/utils/mental-exam-formatter';
import { PrintConfigManager, type PrintConfig } from '@/lib/utils/print-config';
import PrintConfigDialog from '../PrintConfigDialog';
import { PrescriptionCreator } from '../../prescriptions/PrescriptionCreator';
import { MedicationModal } from '../MedicationModal';
import { PrescriptionDesigner } from '../PrescriptionDesigner';
import DiagnosesSelector from './components/DiagnosesSelector';
import { ChevronDownIcon, Icon } from 'lucide-react';
import { IconButton } from '@/components/design-system/Button';
import Swal from 'sweetalert2';
import RecetasAddForm from './RecetasAddForm';
import { clinimetrixProClient } from '@/lib/api/clinimetrix-pro-client';
import { EvaluationsMultiSelect } from './EvaluationsMultiselect';
import toast from 'react-hot-toast';
import moment from 'moment';
import { ConsultationData, Consultation } from 'types/expedix-models';
import { supabase } from '@/lib/supabase/client';
import { DictationTextarea } from '@/components/inputs/DictationTextarea';

interface CentralizedConsultationInterfaceProps {
  patient: Patient;
  consultationId?: string;
  onClose: () => void;
  onSave?: (data: any) => void;
}

interface ConsultationTemplate {
  id: string;
  name: string;
  description: string;
  template_type: string;
  fields_config: string[];
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  identifier: string;
}

type FieldKey =
  | 'mentalExam'
  | 'medications'
  | 'nextAppointment'
  | 'currentCondition'
  | 'physicalExamination'
  | 'diagnosis'
  | 'additionalInstructions'
  | 'vitalSigns'
  | 'evaluations'
  | 'labOrders'
  | 'labResults';

const resolveTemplateBySelectValue = (
  templatesArr: ConsultationTemplate[],
  selectedValue: string
): ConsultationTemplate | null => {
  if (!Array.isArray(templatesArr) || templatesArr.length === 0) return null;
  if (!selectedValue) return null;

  // Regla:
  // - custom => match por identifier
  // - no custom => match por template_type
  return (
    templatesArr.find(t => t.template_type === 'custom' && t.identifier === selectedValue) ||
    templatesArr.find(t => t.template_type !== 'custom' && t.template_type === selectedValue) ||
    null
  );
};

const defaultConsultationTypes = [
  { value: 'general', label: 'Consulta General' },
  { value: 'initial', label: 'Primera Consulta' },
  { value: 'followup', label: 'Consulta de Seguimiento' },
  { value: 'emergency', label: 'Consulta de Emergencia' },
  { value: 'specialized', label: 'Consulta Especializada' }
]

type UIMode = 'history' | 'detail';

type SidebarView = 'consultations' | 'prescriptions' | 'appointments';

const initFormData = {
    consultation_type: 'Consulta General',
    consultation_date: new Date().toISOString().split('T')[0],
    current_condition: '',
    diagnosis: '',
    diagnoses: [],
    evaluations: [],
    vital_signs: {
      height: '',
      weight: '',
      blood_pressure: { systolic: '', diastolic: '' },
      temperature: '',
      heartRate: '',
      respiratoryRate: '',
      oxygenSaturation: ''
    },
    treatment_plan: '',
    physical_examination: '',
    prescriptions: [],
    indications: [],
    additional_instructions: '',
    next_appointment: { date: '', time: '' },
    mental_exam: {
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
      perceptions: '',
      customPerceptions: '',
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
}

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

  const callRef = useRef(true);
  // Authenticated API client
  const authenticatedFetch = useAuthenticatedFetch();
  
  const [loading, setLoading] = useState(true);
  const [currentConsultation, setCurrentConsultation] = useState<Consultation | null>(null);
  const [templates, setTemplates] = useState<ConsultationTemplate[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [IdConsultation, setIdConsultation] = useState<string | null>(consultationId || null);
  const [uiMode, setUiMode] = useState<UIMode>(consultationId ? 'detail' : 'history');
  const [historyTab, setHistoryTab] = useState<SidebarView>('consultations'); // reutiliza tu tipo
  const [expandedConsultationId, setExpandedConsultationId] = useState<string | null>(null);
  const [ consultationsSelectTypes, setConsultationsSelectTypes ] = useState<{ value: string; label: string }[]>(defaultConsultationTypes);
  
  // Navigation states
  const [sidebarView, setSidebarView] = useState<SidebarView>('consultations');
  const [currentConsultationIndex, setCurrentConsultationIndex] = useState(0);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  
  // Print states
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [showPrintConfig, setShowPrintConfig] = useState(false);
  
  // Prescription modal state
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showPrescriptionDesigner, setShowPrescriptionDesigner] = useState(false);
  
  // Form states
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showReceta, setShowReceta] = useState<boolean>(false);
  const [consultationData, setConsultationData] = useState<ConsultationData>(initFormData);

  const [evaluationCatalog, setEvaluationCatalog] = useState<any>(null);
  const [clinicName, setClinicName] = useState<string>('');
  const [professionalName, setProfessionalName] = useState<string>('');

  const [activeTemplate, setActiveTemplate] = useState<ConsultationTemplate | null>(null);
  const [activeFields, setActiveFields] = useState<Set<string> | null>(null);

  type ExpedixConfig = {
    settings?: {
      prescriptionPrintSettings?: any;
    };
  };

  const [expedixConfig, setExpedixConfig] = useState<ExpedixConfig | null>(null);

  // Helper function to get authentication headers
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Authorization': `Bearer ${session?.access_token || ''}`,
      'Content-Type': 'application/json'
    };
  };

  // Load patient data and consultations
  useEffect(() => {

    if (callRef.current) {
      console.log('cargando data', patient.id, consultationId);
      loadPatientData();
      getEvaluationsCatalog();
      getClinicData();
      loadTemplates();
      loadExpedixConfig();
      callRef.current = false;
    }
    
  }, [patient.id, consultationId]);

  // Cada vez que cambie el tipo seleccionado o los templates, recalculamos
  useEffect(() => {
    const t = resolveTemplateBySelectValue(templates, consultationData.consultation_type);

    setActiveTemplate(t);

    // Si no hay template o fields_config vacío => NO filtrar (mostrar todo)
    if (!t || !Array.isArray(t.fields_config) || t.fields_config.length === 0) {
      setActiveFields(null);
      return;
    }

    setActiveFields(new Set(t.fields_config));
  }, [templates, consultationData.consultation_type]);

  const isVisible = (key: FieldKey) => {
    // null => no hay filtro => todo visible
    if (!activeFields) return true;
    return activeFields.has(key);
  };

  const loadExpedixConfig = useCallback(async () => {
    try {
      const res = await authenticatedFetch('/api/expedix/django/configuration/', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        console.warn('No se pudo cargar expedix config', res.status);
        return;
      }
      
      const json = await res.json();
      // según tu backend: { success: true, data: {...} }
      if (json?.results.length > 0) {
        // console.log('results expedix settings:', json.results[0]);
        setExpedixConfig(json.results[0]);
      }
      // const data = json?.data ?? null;
      // setExpedixConfig(data);
    } catch (err) {
      console.error('Error cargando expedix config', err);
    }
  }, [authenticatedFetch]);


  const loadTemplates = async () => {
    try {
      setLoading(true);

      const headers = await getAuthHeaders();
      const response = await fetch('/api/expedix/consultation-templates/', {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const templatesData = data?.data ?? data ?? [];
      const templatesArr = Array.isArray(templatesData) ? templatesData : [];

      setTemplates(templatesArr);

      // =========================================================
      // Construir select types SIN duplicar
      // Regla:
      // - Si template_type !== 'custom' => value = template_type y label = name
      // - Si template_type === 'custom' => value = identifier y label = name
      // - Mantener también los defaultConsultationTypes si no hay plantilla que los reemplace
      // - Ordenar: default primero (si hay), luego el resto
      // =========================================================

      // 1) Partimos de defaults como base
      const base = new Map<string, { value: string; label: string }>();
      defaultConsultationTypes.forEach((t) => base.set(t.value, t));

      // 2) Aplicar templates encima (sobrescriben label si match por template_type)
      let defaultOption: { value: string; label: string } | null = null;

      for (const t of templatesArr) {
        // si no es custom, mapea por template_type (sobrescribe label del default)
        if (t.template_type !== 'custom') {
          const key = t.template_type; // 'initial', 'general', etc.
          if (key) {
            base.set(key, { value: key, label: t.name || base.get(key)?.label || key });
          }
        } else {
          // custom: se agrega por identifier (nuevo option)
          const key = t.identifier;
          if (key) {
            base.set(key, { value: key, label: t.name || key });
          }
        }

        if (t.is_default) {
          // El default debe usar el value que corresponda a su tipo
          const value = t.template_type === 'custom' ? t.identifier : t.template_type;
          if (value) defaultOption = { value, label: t.name || value };
        }
      }

      // 3) Convertir a array
      const options = Array.from(base.values());

      // 4) Ordenar: default primero, luego defaults en su orden original,
      //    luego custom (los que no están en defaultConsultationTypes)
      const defaultOrder = defaultConsultationTypes.map((d) => d.value);

      options.sort((a, b) => {
        // defaultOption hasta arriba
        if (defaultOption) {
          if (a.value === defaultOption.value) return -1;
          if (b.value === defaultOption.value) return 1;
        }

        const ai = defaultOrder.indexOf(a.value);
        const bi = defaultOrder.indexOf(b.value);

        const aIsDefault = ai !== -1;
        const bIsDefault = bi !== -1;

        if (aIsDefault && bIsDefault) return ai - bi; // respeta orden base
        if (aIsDefault) return -1;
        if (bIsDefault) return 1;

        // custom al final por orden alfabético
        return a.label.localeCompare(b.label);
      });

      setConsultationsSelectTypes(options);
    } catch (error) {
      console.error('Error loading consultation templates:', error);
      setTemplates([]);
      setConsultationsSelectTypes(defaultConsultationTypes);
    } finally {
      setLoading(false);
    }
  };


  const getClinicData = async () => {
    try {
      const response = await expedixApi.getClinicData();
      const data = response?.data;

      if (!data) return;

      // 👨‍⚕️ Nombre del doctor (workspace)
      const workspaceName = data.available_contexts?.workspace?.name || '';
      setProfessionalName(workspaceName);

      // 🏥 Clínica (si existe)
      const clinics = data.available_contexts?.clinics || [];

      if (clinics.length > 0) {
        // Si hay clínicas, usamos la primera (o la activa si luego agregas selección)
        setClinicName(clinics[0].name);
      } else {
        // Fallback: consultorio individual
        setClinicName(data.available_contexts?.workspace?.business_name || workspaceName);
      }

    } catch (error) {
      console.log('error getClinicData:', error);
    }
  };

  const getEvaluationsCatalog = async () => {
    try {
      const response = await clinimetrixProClient.getTemplateCatalog();
      
      setEvaluationCatalog(response);
    } catch (error) {
      console.error('Error fetching evaluations catalog:', error);
    }
  };

  const loadPatientData = async () => {
    try {
      setLoading(true);
      
      // Load patient consultations
      const consultationsResponse = await expedixApi.getPatientConsultations(patient.id);
      const patientConsultations = consultationsResponse?.data || [];
      // console.log('consultations:', consultationsResponse);
      
      setConsultations(patientConsultations);
      
      // Load prescriptions
      const prescriptionsResponse = await expedixApi.getPatientPrescriptions(patient.id);
      // console.log('prescriptionsResponse:', prescriptionsResponse);
      setPrescriptions(prescriptionsResponse?.data || []);
      
      // Load next appointment from agenda
      await loadNextAppointment();
      
      // Set current consultation
      if (consultationId) {
        const existing = patientConsultations.find(c => c.id === consultationId);
        // console.log('existing:', existing);
        if (existing) {
          setCurrentConsultation(existing);
          loadConsultationData(existing);
        }
      } else {
        // Create new consultation
        // loadNewConsultation();
          resetFormForNewConsultation();
        // await createNewConsultation();
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
        setNextAppointment(data.next_appointment || data.data);
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
        consultation_date: new Date().toISOString(),
        consultation_type: 'Consulta General',
        status: 'draft',
        current_condition: '',
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

  const loadConsultationData = async (consultation: Consultation) => {
    // setLoading(true);
    toast.loading('Cargando datos de la consulta...');
    try {
      setIdConsultation(consultation.id);
      const consultationsResponse = await expedixApi.getPatientConsultations(patient.id, consultation.id);
      
      if (consultationsResponse?.data && consultationsResponse.data.length > 0) {

        // Load consultation details into form
        const data = consultationsResponse.data[0];
        console.log('Loaded consultation data:', data);
        if (data.prescriptions.length > 0) {
          setShowReceta(true);
        } else {
          setShowReceta(false);
        }
        setConsultationData({
          consultation_type: data.consultation_type || 'Consulta General',
          consultation_date: data.consultation_date ? moment(data.consultation_date).format('YYYY-MM-DD') : new Date().toISOString().split('T')[0],
          current_condition: data.current_condition || '',
          diagnosis: data.diagnosis || '',
          diagnoses: data.diagnoses || [],
          evaluations: data.evaluations || [],
          treatment_plan: data.treatment_plan || '',
          vital_signs: data.vital_signs || {
            height: '',
            weight: '',
            blood_pressure: { systolic: '', diastolic: '' },
            temperature: '',
            heartRate: '',
            respiratoryRate: '',
            oxygenSaturation: ''
          },
          physical_examination: data.physical_examination || '',
          prescriptions: data.prescriptions || [],
          indications: data.indications || [],
          additional_instructions: data.additional_instructions || '',
          next_appointment: data.next_appointment || { date: '', time: '' },
          mental_exam: data.mental_exam || {
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
            pensamientoDetalles: ''
          }
        });
      }
      // setLoading(false);
      toast.dismiss();
    } catch (error) {
      console.error('Error loading consultation data:', error);
      toast.dismiss();
      toast.error('Error al cargar los datos de la consulta.');
      setIdConsultation(null);
      // setLoading(false);
    }
  };

  const openConsultationDetail = (consultation: Consultation, index: number) => {
    setCurrentConsultation(consultation);
    setCurrentConsultationIndex(index);
    setUiMode('detail');
    loadConsultationData(consultation);
  };

  // Auto-save function
  const handleAutoSave = useCallback(async () => {
    if (isAutoSaving) return; // Prevent multiple simultaneous auto-saves
    
    try {
      if(IdConsultation) {
        setIsAutoSaving(true);

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
          subjective: consultationData.current_condition,
          objective: `${consultationData.vital_signs.height ? `Talla: ${consultationData.vital_signs.height}cm` : ''} ${consultationData.vital_signs.weight ? `Peso: ${consultationData.vital_signs.weight}kg` : ''} ${consultationData.vital_signs.blood_pressure?.systolic ? `TA: ${consultationData.vital_signs.blood_pressure?.systolic}/${consultationData.vital_signs.blood_pressure?.diastolic}` : ''} ${consultationData.vital_signs.temperature ? `Temp: ${consultationData.vital_signs.temperature}°C` : ''} ${consultationData.vital_signs.heartRate ? `FC: ${consultationData.vital_signs.heartRate}bpm` : ''}`.trim(),
          assessment: diagnosesText,
          // Agregar los diagnósticos estructurados como campo adicional
          diagnoses_structured: consultationData.diagnoses,
          plan: consultationData.additional_instructions || '',
          status: 'draft', // Auto-saved consultations are drafts
          consultation_type: consultationData.consultation_type
        };

        // await expedixApi.createConsultation(updateData);
        await expedixApi.updateConsultation(IdConsultation, updateData);
        setLastSaved(new Date());
        console.log('✅ Auto-saved consultation data');
      }
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
      const hasContent = consultationData.current_condition.trim() || 
                        consultationData.diagnosis.trim() || 
                        consultationData.diagnoses.length > 0 ||
                        consultationData.additional_instructions?.trim();
      
      if (hasContent && IdConsultation) {
        handleAutoSave();
      }
    }, 5000); // Auto-save after 5 seconds of inactivity

    return () => clearTimeout(autoSaveTimeout);
  }, [consultationData]);

  const handleSaveConsultation = async () => {
    console.log('💾 Saving consultation data...', consultationData);
    console.log('consultationId', IdConsultation);

    if (IdConsultation) {
      // Update existing consultation
       try {
        // Formatear examen mental para almacenamiento
        const formattedMentalExam = MentalExamFormatter.formatForStorage(consultationData.mental_exam as MentalExamData);
        
        const updateData = {
          ...consultationData,
          status: 'completed',
          updated_at: new Date().toISOString()
        };
        
        console.log('💾 Saving consultation with structured mental exam:', updateData);
        
        await expedixApi.updateConsultation(IdConsultation, updateData);
        
        // // Refresh consultations list
        // await loadPatientData();
        
        // if (onSave) {
        //   onSave(updateData);
        // }
        
        // // Show success message
        // console.log('✅ Consultation saved successfully with mental exam data');
        
      } catch (error) {
        console.error('❌ Error saving consultation:', error);
      }
    } else {
      try {
        // create new consultation

        // Preparar diagnósticos para guardado
        const primaryDiagnosis = consultationData.diagnoses.find(d => d.isPrimary) || consultationData.diagnoses[0];
        const diagnosesText = consultationData.diagnoses.length > 0 
          ? consultationData.diagnoses.map(d => {
              let text = d.code ? `${d.code} - ${d.description}` : d.description;
              if (d.isPrimary) text = `[PRINCIPAL] ${text}`;
              if (d.notes) text += ` (${d.notes})`;
              return text;
            }).join('\n')
          : consultationData.diagnosis; 

        const updateData = {
          patient_id: patient.id,
          subjective: consultationData.current_condition,
          objective: `${consultationData.vital_signs.height ? `Talla: ${consultationData.vital_signs.height}cm` : ''} ${consultationData.vital_signs.weight ? `Peso: ${consultationData.vital_signs.weight}kg` : ''} ${consultationData.vital_signs.blood_pressure?.systolic ? `TA: ${consultationData.vital_signs.blood_pressure?.systolic}/${consultationData.vital_signs.blood_pressure?.diastolic}` : ''} ${consultationData.vital_signs.temperature ? `Temp: ${consultationData.vital_signs.temperature}°C` : ''} ${consultationData.vital_signs.heartRate ? `FC: ${consultationData.vital_signs.heartRate}bpm` : ''}`.trim(),
          assessment: diagnosesText,
          // Agregar los diagnósticos estructurados como campo adicional
          diagnoses_structured: consultationData.diagnoses,
          plan: consultationData.additional_instructions || '',
          status: 'draft', // Auto-saved consultations are drafts
          consultation_type: consultationData.consultation_type
        };

        await expedixApi.createConsultation(updateData);
        
      } catch (error) {
        console.log('error creando new consultation', error);
        
      }
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
      formattedMentalExam: MentalExamFormatter.formatForStorage(consultationData.mental_exam as MentalExamData)
    };
    
    // Abrir ventana de impresión
    openPrintWindow(printData);
    setShowPrintMenu(false);
  };

  const handlePrintPrescription = () => {
    if (!consultationData.prescriptions || consultationData.prescriptions.length === 0) {
      alert('No hay medicamentos en esta consulta para imprimir');
      return;
    }
    
    const printData = {
      type: 'prescription',
      consultation: currentConsultation,
      consultationData,
      patient,
      prescriptions: consultationData.prescriptions
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

  const handleSaveMedications = (prescriptions: any[], indications: any[]) => {
    setConsultationData(prev => ({
      ...prev,
      prescriptions: prescriptions,
      medicationIndications: indications
    }));
  };

  const generatePrintHTML = (printData: any): string => {
    const { type, patient, consultationData: formData, formattedMentalExam } = printData;

    // config base (para estilos “generales” si tu PrintConfigManager ya trae cosas de clínica)
    const config = PrintConfigManager.getCurrentConfig();
    const styles = `<style>${PrintConfigManager.generateStyles(config)}</style>`;

    if (type === 'consultation') {
      return generateConsultationHTML(styles, config, patient, formData, formattedMentalExam);
    }

    if (type === 'prescription') {
      // ✅ 1) si hay configuración en BD, úsala
      const htmlFromDb = generatePrescriptionHTMLFromExpedixSettings(styles, patient, formData, expedixConfig);
      if (htmlFromDb) return htmlFromDb;

      // ✅ 2) fallback a lo que ya tenías
      return generatePrescriptionHTML(styles, config, patient, formData);
    }

    if (type === 'medical_record') {
      return generateMedicalRecordHTML(styles, config, printData);
    }

    return '';
};


  const generatePrescriptionHTMLFromExpedixSettings = (
    baseStyles: string,
    patient: Patient,
    formData: any,
    cfg: any
  ): string => {
    console.log(' lo que llega:', cfg);
    
    const s = cfg?.settings?.prescriptionPrintSettings;
    if (!s) {
      // fallback: si no hay config, regresa vacío y usas el método anterior
      return '';
    }

    const currentDate = format(new Date(), 'dd/MM/yyyy', { locale: es });

    const include = s.includeFields || {};
    const margins = s.margins || { top: 20, bottom: 20, left: 20, right: 20 };

    // datos paciente (según tu modelo)
    const fullName = `${patient.first_name} ${patient.paternal_last_name} ${patient.maternal_last_name || ''}`.trim();
    const birthDate = (patient as any)?.date_of_birth || (patient as any)?.birth_date;

    const headerText = s.headerText || 'RECETA MÉDICA';
    const footerText = s.footerText || '';

    // papel/orientación
    const paperSize = s.paperSize || 'Letter';        // "Letter" | "A4"
    const orientation = s.orientation || 'portrait';  // "portrait" | "landscape"

    // tamaños
    const font = s.fontSize || { header: 16, medication: 12, instructions: 10, footer: 8 };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Receta Médica - ${fullName}</title>

        ${baseStyles}

        <style>
          @page {
            size: ${paperSize} ${orientation};
            margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
          }

          body { font-family: Arial, sans-serif; font-size: 12px; }
          .prescription-header { text-align: center; font-size: ${font.header}px; font-weight: bold; margin-bottom: 12px; }
          .patient-info { margin-bottom: 12px; }
          .rx-symbol { font-size: 24px; font-weight: bold; margin: 8px 0; }
          .medication { margin: 8px 0; padding: 6px; border-left: 3px solid #007bff; }
          .medication-name { font-weight: bold; font-size: ${font.medication}px; }
          .medication-details { font-size: ${font.instructions}px; margin-left: 10px; }
          .footer { margin-top: 18px; font-size: ${font.footer}px; color: #555; }
          .signature-area { margin-top: 20px; text-align: center; }
          .signature-line { width: 260px; border-top: 1px solid #000; margin: 0 auto 6px auto; }
        </style>
      </head>

      <body>
        ${headerText ? `<div class="prescription-header">${headerText}</div>` : ''}

        ${(include.patientName || include.patientAge || include.patientBirthDate || include.date) ? `
          <div class="patient-info">
            ${include.patientName ? `<div><strong>${fullName}</strong></div>` : ''}
            ${include.patientAge ? `<div>Edad: ${patient.age} años</div>` : ''}
            ${include.patientBirthDate && birthDate ? `<div>F. Nac: ${safeFormatDate(birthDate, 'dd/MM/yyyy')}</div>` : ''}
            ${include.date ? `<div>Fecha: ${currentDate}</div>` : ''}
          </div>
        ` : ''}

        <div class="rx-symbol">℞</div>

        ${(formData.prescriptions || []).map((med: any, index: number) => `
          <div class="medication">
            <div class="medication-name">${index + 1}. ${med.name || 'Medicamento'}</div>
            <div class="medication-details">
              ${med.dosage ? `Dosis: ${med.dosage}<br>` : ''}
              ${med.frequency ? `Frecuencia: ${med.frequency}<br>` : ''}
              ${med.duration ? `Duración: ${med.duration}<br>` : ''}
              ${med.instructions ? `Indicaciones: ${med.instructions}` : ''}
            </div>
          </div>
        `).join('')}

        ${include.doctorSignature ? `
          <div class="signature-area">
            <div class="signature-line"></div>
            <div>Firma del médico</div>
          </div>
        ` : ''}

        ${footerText ? `<div class="footer">${footerText}</div>` : ''}
      </body>
      </html>
    `;
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
          <div>Tipo: ${formData.consultation_type}</div>
        </div>
        
        ${formData.current_condition ? `
        <div class="section">
          <div class="section-title">Padecimiento Actual</div>
          <div class="section-content">${formData.current_condition}</div>
        </div>
        ` : ''}
        
        ${(formData.vital_signs.height || formData.vital_signs.weight || formData.vital_signs.temperature) ? `
        <div class="section">
          <div class="section-title">Signos Vitales</div>
          <div class="compact-row">
            ${formData.vital_signs.height ? `<div>Altura: ${formData.vital_signs.height} cm</div>` : ''}
            ${formData.vital_signs.weight ? `<div>Peso: ${formData.vital_signs.weight} kg</div>` : ''}
            ${formData.vital_signs.temperature ? `<div>Temp: ${formData.vital_signs.temperature}°C</div>` : ''}
          </div>
          <div class="compact-row">
            ${formData.vital_signs.blood_pressure?.systolic ? `<div>PA: ${formData.vital_signs.blood_pressure?.systolic}/${formData.vital_signs.blood_pressure?.diastolic} mmHg</div>` : ''}
            ${formData.vital_signs.heartRate ? `<div>FC: ${formData.vital_signs.heartRate} lpm</div>` : ''}
            ${formData.vital_signs.oxygenSaturation ? `<div>SpO2: ${formData.vital_signs.oxygenSaturation}%</div>` : ''}
          </div>
        </div>
        ` : ''}
        
        ${formData.physical_examination ? `
        <div class="section">
          <div class="section-title">Exploración Física</div>
          <div class="section-content">${formData.physical_examination}</div>
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
        
        ${formData.additional_instructions ? `
        <div class="section">
          <div class="section-title">Plan de Tratamiento</div>
          <div class="section-content">${formData.additional_instructions}</div>
        </div>
        ` : ''}
        
        ${config.consultation.includeNextAppointment && (formData.next_appointment.date || formData.next_appointment.time) ? `
        <div class="section">
          <div class="section-title">Próxima Cita</div>
          <div class="section-content">
            ${formData.next_appointment.date ? `Fecha: ${format(new Date(formData.next_appointment.date), 'dd/MM/yyyy', { locale: es })}` : ''}
            ${formData.next_appointment.time ? ` - Hora: ${formData.next_appointment.time}` : ''}
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
        
        ${(formData.prescriptions || []).map((med: any, index: number) => `
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
              <div class="consultation-date">${safeFormatDate(consultation.date)} - ${consultation.consultation_type}</div>
              <div class="consultation-summary">
                ${consultation.current_condition ? `Motivo: ${consultation.current_condition.substring(0, 100)}...` : ''}
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

  const loadNewConsultation = () => {
    console.log('Loading new consultation form');
    setCurrentConsultation(null);
    setConsultationData(initFormData);
  }

  const handleDeleteConsultation = async (consultationId: string) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await expedixApi.deleteConsultation(consultationId);
          // Swal.fire('Eliminado', 'La consulta ha sido eliminada.', 'success');
          toast.success('Consulta eliminada correctamente.');
          // Recargar la lista de consultas por paciente
          setConsultations(prev => prev.filter(c => c.id !== consultationId));
          // Si la consulta eliminada es la actual, limpiar el formulario
          if (currentConsultation?.id === consultationId) {
            setCurrentConsultation(null);
            loadNewConsultation();
          }
        } catch (error) {
          console.error('Error deleting consultation:', error);
          Swal.fire('Error', 'No se pudo eliminar la consulta.', 'error');
        }
      }
    });
  };

  const updateConsultationFn = (updatedFields: Partial<ConsultationData>) => {
    setConsultationData(prev => ({
      ...prev,
      ...updatedFields
    }));
  };

  const handleDeletePrescription = async () => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción borrará la receta actual.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setShowReceta(false);

      }
    });
  };

  const resetFormForNewConsultation = () => {
    setShowReceta(false);
    setConsultationData(initFormData);
  };

  const startNewConsultation = async () => {
    setLoading(true);
    resetFormForNewConsultation();
    setCurrentConsultationIndex(0);
    setUiMode('detail');
    setLoading(false);
  };

  const toggleExpanded = (id: string) => {
    setExpandedConsultationId(prev => (prev === id ? null : id));
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

  if (uiMode === 'history') {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex flex-col">
          {/* Header simple (sin navegación de consultas + sin vista previa/imprimir) */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={onClose}>
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Volver
                </Button>

                <div className="ml-2">
                  <div className="font-semibold text-gray-900">
                    {patient.first_name} {patient.paternal_last_name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {patient.age} años • #{patient.id.slice(0, 8)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Crear Consulta desde historial */}
                <Button variant="primary" onClick={() => startNewConsultation()}>
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Crear Consulta
                </Button>
              </div>
            </div>

            {/* Tabs (Consultas / Recetas / Citas) */}
            <div className="mt-4 flex border-b border-gray-200">
              {[
                { id: 'consultations', label: 'Consultas', icon: DocumentTextIcon },
                { id: 'prescriptions', label: 'Recetas', icon: ClockIcon },
                { id: 'appointments', label: 'Citas', icon: CalendarIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setHistoryTab(tab.id as SidebarView)}
                  className={`flex-1 py-3 px-2 text-xs font-medium transition-colors ${
                    historyTab === tab.id
                      ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mx-auto mb-1" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto space-y-4">

              {historyTab === 'consultations' && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Historial de Consultas</h2>
                    <span className="text-sm text-gray-500">{consultations.length}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {consultations.map((c, idx) => {
                      const motivo = (c.current_condition || '').trim();
                      const dx = (c.diagnosis || '').trim();

                      // Si tienes updated_at en el objeto (muchas veces sí)
                      const updatedAt = (c as any).updated_at || (c as any).updatedAt;

                      // Conteos opcionales (depende cómo venga tu API)
                      const prescriptionsCount =
                        Array.isArray((c as any).prescriptions) ? (c as any).prescriptions.length : 0;

                      const evaluationsCount =
                        Array.isArray((c as any).evaluations) ? (c as any).evaluations.length : 0;

                      const hasVitals =
                        !!(c as any).vital_signs &&
                        typeof (c as any).vital_signs === 'object' &&
                        Object.keys((c as any).vital_signs).length > 0;

                      const durationMinutes = (c as any).duration_minutes ?? (c as any).durationMinutes;

                      return (
                        <div
                          key={c.id}
                          onClick={() => toggleExpanded(c.id)}
                          className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm transition cursor-pointer
                            ${expandedConsultationId === c.id ? 'shadow-md' : 'hover:shadow-md'}
                          `}
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="font-semibold text-gray-900 truncate">
                                  {c.consultation_type || 'Consulta'}
                                </div>

                                {/* opcional: ID corto */}
                                <span className="text-[11px] text-gray-500">
                                  #{c.id.slice(0, 8)}
                                </span>
                              </div>

                              <div className="text-xs text-gray-600 mt-1">
                                {safeFormatDate(c.consultation_date, 'dd MMM yyyy')}
                              </div>
                            </div>

                            <span
                              className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${
                                c.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {c.status === 'completed' ? 'Completada' : 'Borrador'}
                            </span>
                            <div className="flex items-center gap-2">
                              <ChevronDownIcon
                                className={`h-4 w-4 text-gray-400 transition-transform ${
                                  expandedConsultationId === c.id ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                          </div>

                          {/* Badges */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {prescriptionsCount > 0 && (
                              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                💊 {prescriptionsCount} receta{prescriptionsCount > 1 ? 's' : ''}
                              </span>
                            )}

                            {evaluationsCount > 0 && (
                              <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                                🧠 {evaluationsCount} eval.
                              </span>
                            )}

                            {hasVitals && (
                              <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded">
                                ❤️ signos vitales
                              </span>
                            )}

                            {typeof durationMinutes === 'number' && durationMinutes > 0 && (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                ⏱ {durationMinutes} min
                              </span>
                            )}
                          </div>

                          {/* Body */}
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Motivo</div>
                              <div className="text-gray-800 line-clamp-2">
                                {motivo || 'Sin descripción'}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs text-gray-500 mb-1">Diagnóstico</div>
                              <div className="text-gray-800 line-clamp-2">
                                {dx || 'No registrado'}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs text-gray-500 mb-1">Meta</div>
                              <div className="text-gray-800">
                                {updatedAt
                                  ? `Actualizada ${safeFormatDate(updatedAt, 'dd MMM yyyy')}`
                                  : '—'}
                              </div>
                            </div>
                          </div>

                          {expandedConsultationId === c.id && (
                            <div className="mt-4 border-t border-gray-200 pt-4 space-y-4 text-sm text-gray-800">

                              {motivo && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Motivo de consulta</div>
                                  <p className="whitespace-pre-line">{motivo}</p>
                                </div>
                              )}

                              {dx && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Diagnóstico</div>
                                  <p className="whitespace-pre-line">{dx}</p>
                                </div>
                              )}

                              {(c as any).physical_examination && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Exploración física</div>
                                  <p className="whitespace-pre-line">
                                    {(c as any).physical_examination}
                                  </p>
                                </div>
                              )}

                              {(c as any).notes && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Notas clínicas</div>
                                  <p className="whitespace-pre-line">
                                    {(c as any).notes}
                                  </p>
                                </div>
                              )}

                            </div>
                          )}


                          {/* Footer */}
                          <div className="mt-5 flex items-center justify-between">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openConsultationDetail(c, idx);
                              }}
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              Ver consulta
                            </Button>

                            <IconButton
                              icon={<TrashIcon className="h-4 w-4 text-red-600" />}
                              size="sm"
                              variant="ghost"
                              ariaLabel="Eliminar consulta"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConsultation(c.id);
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {historyTab === 'prescriptions' && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Recetas</h2>
                    <span className="text-sm text-gray-500">{prescriptions.length}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {prescriptions?.map((p) => (
                      <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                        <div className="font-medium text-gray-900">Receta #{p.id.slice(0, 8)}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {safeFormatDate(p.created_at, 'dd MMM yyyy')}
                        </div>
                        <div className="mt-3 text-sm text-gray-700 line-clamp-3">
                          {/* si luego tienes resumen de meds, aquí */}
                          Receta guardada
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {historyTab === 'appointments' && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Citas</h2>
                  </div>

                  {nextAppointment ? (
                    <div className="bg-white border border-green-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-green-600" />
                        <div className="font-medium text-green-900">Próxima cita</div>
                      </div>
                      <div className="text-sm text-green-800 mt-2">
                        {safeFormatDate(nextAppointment.date, 'dd MMMM yyyy')} • {nextAppointment.time}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <div className="text-sm text-gray-700">No hay citas programadas</div>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
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
                      {consultation.consultation_type}
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
                    {safeFormatDate(consultation.consultation_date, 'dd MMM yyyy')}
                  </p>
                  <p className="text-xs text-gray-700 line-clamp-2">
                    {consultation.diagnosis || consultation.current_condition || 'Sin diagnóstico'}
                  </p>
                  <p className="flex justify-end">
                    <IconButton
                      icon={<TrashIcon className="h-4 w-4 text-red-600" />}
                      size="sm"
                      variant="ghost"
                      className="mt-2"
                      ariaLabel="Eliminar consulta"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConsultation(consultation.id);
                      }}
                    />
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
              {prescriptions?.map((prescription) => (
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
                    {/* {prescription.medications.map((med, index) => (
                      <p key={index} className="text-xs text-gray-700">
                        • {med.name} - {med.dosage}
                      </p>
                    ))} */}
                    {/* {prescription.medication_name} */}
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
              <Button variant="outline" onClick={() => setUiMode('history')}>
                ← Historial
              </Button>

              <Button variant="primary" onClick={startNewConsultation}>
                <PlusIcon className="h-4 w-4 mr-1" />
                Crear Consulta
              </Button>

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
                          disabled={!consultationData.prescriptions || consultationData.prescriptions.length === 0}
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
                    value={consultationData.consultation_type}
                    defaultValue={consultationData.consultation_type}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      consultation_type: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    {
                      consultationsSelectTypes?.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))
                    }
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de consulta
                  </label>
                  <input
                    type="date"
                    value={consultationData.consultation_date}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      consultation_date: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </Card>

            
            {/* Current Condition */}
            {isVisible('currentCondition') && (<Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Padecimiento Actual</h3>
              <DictationTextarea 
                value={consultationData.current_condition}
                onChange={(value) => setConsultationData(prev => ({ 
                  ...prev, 
                  current_condition: value 
                }))}
                placeholder="Describe el padecimiento actual del paciente..."
                rows={4}
              />
            </Card>)}

            {/* Vital Signs */}
            {isVisible('vitalSigns') && (<Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Signos Vitales</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    value={consultationData.vital_signs.height}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      vital_signs: { ...prev.vital_signs, height: e.target.value }
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
                    value={consultationData.vital_signs.weight}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      vital_signs: { ...prev.vital_signs, weight: e.target.value }
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
                    value={consultationData.vital_signs.temperature}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      vital_signs: { ...prev.vital_signs, temperature: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Presión Arterial
                  </label>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Sistólica"
                        value={consultationData.vital_signs.blood_pressure?.systolic}
                        onChange={(e) =>
                          setConsultationData(prev => ({
                            ...prev,
                            vital_signs: {
                              ...prev.vital_signs,
                              blood_pressure: {
                                ...prev.vital_signs.blood_pressure,
                                systolic: e.target.value
                              }
                            }
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Diastólica"
                        value={consultationData.vital_signs.blood_pressure?.diastolic}
                        onChange={(e) =>
                          setConsultationData(prev => ({
                            ...prev,
                            vital_signs: {
                              ...prev.vital_signs,
                              blood_pressure: {
                                ...prev.vital_signs.blood_pressure,
                                diastolic: e.target.value
                              }
                            }
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frecuencia Cardíaca
                  </label>
                  <input
                    type="number"
                    value={consultationData.vital_signs.heartRate}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      vital_signs: { ...prev.vital_signs, heartRate: e.target.value }
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
                    value={consultationData.vital_signs.oxygenSaturation}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      vital_signs: { ...prev.vital_signs, oxygenSaturation: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </Card>)}

            {/* Physical Examination */}
            {isVisible('physicalExamination') && (
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Exploración Física</h3>
              <DictationTextarea
                label="Exploración Física"
                value={consultationData.physical_examination}
                onChange={(next) =>
                  setConsultationData(prev => ({ ...prev, physical_examination: next }))
                }
                placeholder="Describe los hallazgos..."
                rows={5}
              />
            </Card>)}

            {/* Mental Exam - Modern Dropdown Interface */}
            {isVisible('mentalExam') && (
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
                        value={consultationData.mental_exam.appearance}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mental_exam: { ...prev.mental_exam, appearance: e.target.value }
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
                        value={consultationData.mental_exam.attitude}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mental_exam: { ...prev.mental_exam, attitude: e.target.value }
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
                        value={consultationData.mental_exam.consciousness}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mental_exam: { ...prev.mental_exam, consciousness: e.target.value }
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
                        value={consultationData.mental_exam.customAppearance}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mental_exam: { ...prev.mental_exam, customAppearance: e.target.value }
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
                        value={consultationData.mental_exam.speechRate}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mental_exam: { ...prev.mental_exam, speechRate: e.target.value }
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
                        value={consultationData.mental_exam.speechVolume}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mental_exam: { ...prev.mental_exam, speechVolume: e.target.value }
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
                        value={consultationData.mental_exam.speechFluency}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mental_exam: { ...prev.mental_exam, speechFluency: e.target.value }
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
                        value={consultationData.mental_exam.customSpeech}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mental_exam: { ...prev.mental_exam, customSpeech: e.target.value }
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
                        value={consultationData.mental_exam.affectIntensity}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mental_exam: { ...prev.mental_exam, affectIntensity: e.target.value }
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
                        value={consultationData.mental_exam.affectQuality}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mental_exam: { ...prev.mental_exam, affectQuality: e.target.value }
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
                        value={consultationData.mental_exam.moodState}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mental_exam: { ...prev.mental_exam, moodState: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Cómo describe el paciente su estado de ánimo..."
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones Emocionales</label>
                      <textarea
                        value={consultationData.mental_exam.customAffect}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mental_exam: { ...prev.mental_exam, customAffect: e.target.value }
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
                        value={consultationData.mental_exam.thoughtProcess}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mental_exam: { ...prev.mental_exam, thoughtProcess: e.target.value }
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
                        value={consultationData.mental_exam.thoughtContent}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mental_exam: { ...prev.mental_exam, thoughtContent: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Ideas dominantes, preocupaciones, obsesiones..."
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones del Pensamiento</label>
                      <textarea
                        value={consultationData.mental_exam.customThought}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mental_exam: { ...prev.mental_exam, customThought: e.target.value }
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
                        value={consultationData.mental_exam.perceptions}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mental_exam: { ...prev.mental_exam, perceptions: e.target.value }
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
                        value={consultationData.mental_exam.customPerceptions}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mental_exam: { ...prev.mental_exam, customPerceptions: e.target.value }
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
                        value={consultationData.mental_exam.orientation}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mental_exam: { ...prev.mental_exam, orientation: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Tiempo, lugar, persona..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Atención</label>
                      <input
                        type="text"
                        value={consultationData.mental_exam.attention}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mental_exam: { ...prev.mental_exam, attention: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Concentración, distraibilidad..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Memoria</label>
                      <input
                        type="text"
                        value={consultationData.mental_exam.memory}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mental_exam: { ...prev.mental_exam, memory: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Inmediata, reciente, remota..."
                      />
                    </div>
                    
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Evaluación Cognitiva Adicional</label>
                      <textarea
                        value={consultationData.mental_exam.customCognition}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mental_exam: { ...prev.mental_exam, customCognition: e.target.value }
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
                        value={consultationData.mental_exam.insight}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mental_exam: { ...prev.mental_exam, insight: e.target.value }
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
                        value={consultationData.mental_exam.judgment}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mental_exam: { ...prev.mental_exam, judgment: e.target.value }
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
                        value={consultationData.mental_exam.customInsightJudgment}
                        onChange={(e) => setConsultationData(prev => ({ 
                          ...prev, 
                          mental_exam: { ...prev.mental_exam, customInsightJudgment: e.target.value }
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
                      value={consultationData.mental_exam.generalSummary}
                      onChange={(e) => setConsultationData(prev => ({ 
                        ...prev, 
                        mental_exam: { ...prev.mental_exam, generalSummary: e.target.value }
                      }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Resumen integrado del estado mental, impresiones clínicas principales y observaciones relevantes..."
                    />
                  </div>
                </div>
              </div>
            </Card>)}

            {/* Diagnosis - Advanced Selector with CIE-10/DSM-5TR Integration */}
            {isVisible('diagnosis') && (<Card className="p-6">
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
            </Card>)}

            {/* Recetas / Medications Section - Optimized UI */}
            {isVisible('medications') && (
             <>
            {!showReceta ? (
            <Button type='button' onClick={() => setShowReceta(true)}>Agregar Receta</Button> ):(
            <Card className="p-6 border-l-4 border-teal-500">
              <RecetasAddForm
                prescriptions={consultationData.prescriptions || []}  
                treatment_plan={consultationData.treatment_plan || ''}
                handleDeletePrescription={handleDeletePrescription}
                updateConsultationFn={updateConsultationFn}
              />
            </Card>)}
            </>)}

            {/* Evaluations */}
            { isVisible('evaluations') && ( <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Evaluaciones</h3>
              <EvaluationsMultiSelect
                evaluationCatalog={evaluationCatalog}
                selected={consultationData.evaluations ?? []}
                onChange={(next) =>
                  setConsultationData(prev => ({
                    ...prev,
                    evaluations: next,
                  }))
                }
              />
            </Card>)}


            {/* Additional Instructions */}
            { isVisible('additionalInstructions') && ( <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Instrucciones Adicionales</h3>
              <DictationTextarea 
                value={consultationData.additional_instructions}
                onChange={(value) => setConsultationData(prev => ({ 
                  ...prev, 
                  additional_instructions: value 
                }))}
                placeholder="Instrucciones para el paciente..."
                rows={4}
              />
            </Card>)}

            {/* Next Appointment */}
            { isVisible('nextAppointment') && ( <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Próxima Cita</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={consultationData.next_appointment.date}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      next_appointment: { ...prev.next_appointment, date: e.target.value }
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
                    value={consultationData.next_appointment.time}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      next_appointment: { ...prev.next_appointment, time: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </Card>)}
            
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
          mental_exam: {
            descripcionInspeccion: consultationData.mental_exam.customAppearance || consultationData.mental_exam.appearance || '',
            apariencia: consultationData.mental_exam.appearance || consultationData.mental_exam.customAppearance || '',
            actitud: consultationData.mental_exam.attitude || '',
            conciencia: consultationData.mental_exam.consciousness || '',
            orientacion: consultationData.mental_exam.orientation || '',
            atencion: consultationData.mental_exam.attention || '',
            lenguaje: consultationData.mental_exam.customSpeech || `${consultationData.mental_exam.speechRate} ${consultationData.mental_exam.speechVolume} ${consultationData.mental_exam.speechFluency}`.trim() || '',
            afecto: consultationData.mental_exam.customAffect || `${consultationData.mental_exam.affectIntensity} ${consultationData.mental_exam.affectQuality}`.trim() || '',
            sensopercepcion: consultationData.mental_exam.customPerceptions || consultationData.mental_exam.perceptions || '',
            memoria: consultationData.mental_exam.memory || '',
            pensamientoPrincipal: consultationData.mental_exam.thoughtContent || '',
            pensamientoDetalles: consultationData.mental_exam.customThought || consultationData.mental_exam.thoughtProcess || ''
          }
        }}
        professionalName={professionalName}
        // clinicName={`${config.clinicName}`}
        clinicName={clinicName}

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

      {/* Medication Modal */}
      <MedicationModal
        isOpen={showMedicationModal}
        onClose={() => setShowMedicationModal(false)}
        onSave={handleSaveMedications}
        currentMedications={consultationData.prescriptions || []}
        currentIndications={consultationData.indications || []}
      />

      {/* Prescription Designer Modal */}
      <PrescriptionDesigner
        isOpen={showPrescriptionDesigner}
        onClose={() => setShowPrescriptionDesigner(false)}
        onSaveTemplate={(template) => {
          // Guardar plantilla en localStorage o API
          const existingTemplates = JSON.parse(localStorage.getItem('mindhub_prescription_templates') || '[]');
          const updatedTemplates = [...existingTemplates, template];
          localStorage.setItem('mindhub_prescription_templates', JSON.stringify(updatedTemplates));
          setShowPrescriptionDesigner(false);
        }}
        sampleData={{
          doctor: {
            first_name: 'Dr. Alejandro',
            last_name: 'Contreras',
            specialty: 'Psiquiatría',
            license: '12345678'
          },
          patient: patient || {
            first_name: 'Paciente',
            paternal_last_name: 'Ejemplo',
            maternal_last_name: 'Demo',
            age: 35
          },
          medications: consultationData.prescriptions || [],
          clinic: {
            name: 'MindHub Clínica',
            address: 'Av. Revolución 123, Col. Centro, CDMX',
            phone: '+52 55 1234 5678'
          }
        }}
      />
    </div>
  );
}