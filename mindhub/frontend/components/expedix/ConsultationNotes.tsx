'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { expedixApi, Patient } from '@/lib/api/expedix-client';
import MentalExam from './MentalExam';

// Using Patient interface from expedix-client

interface Medication {
  id: number;
  name: string;
  presentation: string;
  substance: string;
  prescription: string;
}

type NoteType = 'primera-vez' | 'subsecuente' | 'soap' | 'psicoterapia' | 'primera-vez-psicologia' | 'primera-vez-psiquiatria' | 'subsecuente-psicologia' | 'alta-psiquiatria' | 'evento-entre-consultas' | 'subsecuente-psiquiatria' | 'seguimiento' | 'urgencias';

interface NoteTemplate {
  id: NoteType;
  name: string;
  description: string;
  fields: string[];
  icon: string;
}

interface ConsultationData {
  noteType: NoteType;
  date: string;
  patientOffice: string;
  currentCondition: string;
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
  labResults: string;
  diagnosis: string;
  temporality: 'acute' | 'chronic' | 'subacute';
  medications: Medication[];
  additionalInstructions: string;
  labOrders: string;
  nextAppointment: { time: string; date: string };
  
  // Alta Psiquiatría fields
  tiempoSeguimiento: string;
  diagnosticosTratados: string;
  medicamentosUtilizados: string;
  modificacionesFarmacologicas: string;
  tipoRemision: string;
  inicioRemision: string;
  criteriosRemision: string[];
  progresoClinico: string;
  requiereMedicacion: string;
  duracionMedicacion: string;
  frecuenciaSeguimiento: string;
  contactoEmergencia: string;
  funcionamientoGlobal: string;
  
  // Evento Entre Consultas fields
  tipoContacto: string;
  fechaEvento: string;
  nivelUrgencia: string;
  riesgoInmediato: string;
  descripcionEvento: string;
  orientacionDada: string;
  requiereSeguimiento: string;
  
  // Subsecuente Psiquiatría fields
  estadoGeneral: string;
  porcentajeMejoria: string;
  sintomasResiduales: string;
  nuevosSintomas: string;
  adherenciaMedicacion: string;
  presentaEfectosSecundarios: string;
  eventosIntercurrentes: string;
  inspeccionSeguimiento: string;
  pesoActual: string;
  fcActual: string;
  taSistolica: string;
  taDiastolica: string;
  aparienciaMental: string;
  actitudMental: string;
  afectoMental: string;
  insightMental: string;
  tipoRespuestaTratamiento: string;
  gafActual: string;
  requiereAjustesMedicacion: string;
  impresionClinicaActual: string;
  tiempoProximaCita: string;
  
  // Psiquiatría - Examen Mental
  pensamientoPrincipal: string;
  pensamientoDetalles: string;
  
  // Examen Mental Completo (reusable)
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
  };
}

interface ConsultationNotesProps {
  patient: Patient;
  onSaveConsultation: (data: ConsultationData) => void;
  onCancel: () => void;
}

const MEDICATIONS_DATABASE = [
  {
    id: 1,
    name: 'Sertralina',
    presentations: [{ form: 'Tableta', concentration: '50mg', substance: 'Sertralina HCl' }],
    prescriptions: [
      'Tomar 1 tableta cada 24 horas en ayunas por la mañana',
      'Tomar 1 tableta cada 12 horas con alimentos',
      'Tomar 1/2 tableta cada 24 horas por 7 días, luego 1 tableta diaria'
    ]
  },
  {
    id: 2,
    name: 'Fluoxetina',
    presentations: [{ form: 'Cápsula', concentration: '20mg', substance: 'Fluoxetina HCl' }],
    prescriptions: [
      'Tomar 1 cápsula cada 24 horas en ayunas',
      'Tomar 1 cápsula cada 24 horas con el desayuno'
    ]
  },
  {
    id: 3,
    name: 'Lorazepam',
    presentations: [{ form: 'Tableta', concentration: '1mg', substance: 'Lorazepam' }],
    prescriptions: [
      'Tomar 1 tableta cada 12 horas en caso de ansiedad',
      'Tomar 1/2 tableta antes de dormir',
      'Tomar 1 tableta 3 veces al día por máximo 15 días'
    ]
  }
];

const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'primera-vez',
    name: 'Nota de Primera Vez',
    description: 'Consulta inicial completa con historia clínica detallada',
    fields: ['vitalSigns', 'currentCondition', 'physicalExamination', 'diagnosis', 'medications'],
    icon: '👤'
  },
  {
    id: 'primera-vez-psicologia',
    name: 'Primera Vez - Psicología',
    description: 'Evaluación inicial completa para primera consulta psicológica con enfoque cognitivo-conductual',
    fields: ['currentCondition', 'diagnosis'],
    icon: '🧠'
  },
  {
    id: 'primera-vez-psiquiatria',
    name: 'Primera Vez - Psiquiatría',
    description: 'Evaluación psiquiátrica inicial completa con examen mental detallado',
    fields: ['currentCondition', 'vitalSigns', 'physicalExamination', 'diagnosis', 'medications'],
    icon: '🧬'
  },
  {
    id: 'subsecuente-psicologia',
    name: 'Subsecuente - Psicología',
    description: 'Seguimiento psicológico enfocado en progreso del plan de tratamiento',
    fields: ['currentCondition', 'diagnosis'],
    icon: '📈'
  },
  {
    id: 'subsecuente',
    name: 'Nota Subsecuente',
    description: 'Consulta de seguimiento y evaluación de progreso',
    fields: ['currentCondition', 'physicalExamination', 'diagnosis', 'medications'],
    icon: '📋'
  },
  {
    id: 'soap',
    name: 'Nota SOAP',
    description: 'Formato estructurado: Subjetivo, Objetivo, Análisis, Plan',
    fields: ['currentCondition', 'physicalExamination', 'diagnosis', 'medications'],
    icon: '📝'
  },
  {
    id: 'psicoterapia',
    name: 'Nota de Psicoterapia',
    description: 'Sesión de psicoterapia y evaluación mental',
    fields: ['currentCondition', 'diagnosis'],
    icon: '🧠'
  },
  {
    id: 'seguimiento',
    name: 'Nota de Seguimiento',
    description: 'Evaluación rápida de seguimiento',
    fields: ['currentCondition', 'medications'],
    icon: '🔄'
  },
  {
    id: 'urgencias',
    name: 'Nota de Urgencias',
    description: 'Atención de urgencia médica',
    fields: ['vitalSigns', 'currentCondition', 'diagnosis', 'medications'],
    icon: '🚨'
  },
  {
    id: 'alta-psiquiatria',
    name: 'Alta Psiquiátrica',
    description: 'Nota de alta psiquiátrica con resumen completo del tratamiento y recomendaciones',
    fields: ['currentCondition', 'diagnosis'],
    icon: '🎯'
  },
  {
    id: 'evento-entre-consultas',
    name: 'Evento Entre Consultas',
    description: 'Registro rápido de incidentes o eventos reportados por el paciente entre consultas programadas',
    fields: ['currentCondition'],
    icon: '⚡'
  },
  {
    id: 'subsecuente-psiquiatria',
    name: 'Consulta Subsecuente - Psiquiatría',
    description: 'Seguimiento psiquiátrico con evaluación de respuesta al tratamiento y examen mental',
    fields: ['vitalSigns', 'currentCondition', 'physicalExamination', 'diagnosis', 'medications'],
    icon: '🔄'
  }
];

const CIE10_CODES = [
  { code: 'F32.0', description: 'Episodio depresivo leve' },
  { code: 'F32.1', description: 'Episodio depresivo moderado' },
  { code: 'F32.2', description: 'Episodio depresivo grave sin síntomas psicóticos' },
  { code: 'F41.0', description: 'Trastorno de pánico' },
  { code: 'F41.1', description: 'Trastorno de ansiedad generalizada' },
  { code: 'F43.1', description: 'Trastorno de estrés postraumático' }
];

export default function ConsultationNotes({ patient, onSaveConsultation, onCancel }: ConsultationNotesProps) {
  const [consultationData, setConsultationData] = useState<ConsultationData>({
    noteType: 'subsecuente',
    date: new Date().toISOString().split('T')[0],
    patientOffice: '',
    currentCondition: '',
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
    labResults: '',
    diagnosis: '',
    temporality: 'chronic',
    medications: [],
    additionalInstructions: '',
    labOrders: '',
    nextAppointment: { time: '', date: '' },
    
    // Alta Psiquiatría fields
    tiempoSeguimiento: '',
    diagnosticosTratados: '',
    medicamentosUtilizados: '',
    modificacionesFarmacologicas: '',
    tipoRemision: '',
    inicioRemision: '',
    criteriosRemision: [],
    progresoClinico: '',
    requiereMedicacion: '',
    duracionMedicacion: '',
    frecuenciaSeguimiento: '',
    contactoEmergencia: '',
    funcionamientoGlobal: '',
    
    // Evento Entre Consultas fields
    tipoContacto: '',
    fechaEvento: '',
    nivelUrgencia: '',
    riesgoInmediato: '',
    descripcionEvento: '',
    orientacionDada: '',
    requiereSeguimiento: '',
    
    // Subsecuente Psiquiatría fields
    estadoGeneral: '',
    porcentajeMejoria: '',
    sintomasResiduales: '',
    nuevosSintomas: '',
    adherenciaMedicacion: '',
    presentaEfectosSecundarios: '',
    eventosIntercurrentes: '',
    inspeccionSeguimiento: '',
    pesoActual: '',
    fcActual: '',
    taSistolica: '',
    taDiastolica: '',
    aparienciaMental: '',
    actitudMental: '',
    afectoMental: '',
    insightMental: '',
    tipoRespuestaTratamiento: '',
    gafActual: '',
    requiereAjustesMedicacion: '',
    impresionClinicaActual: '',
    tiempoProximaCita: '',
    
    // Psiquiatría - Examen Mental (pensamiento dropdown)
    pensamientoPrincipal: '',
    pensamientoDetalles: '',
    
    // Examen Mental Completo (reusable)
    mentalExam: {
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noteTypeReason, setNoteTypeReason] = useState<string>('');
  const [previousPrescription, setPreviousPrescription] = useState<any>(null);

  const [currentMedication, setCurrentMedication] = useState({
    name: '',
    presentation: '',
    substance: '',
    prescription: ''
  });

  const [medicationSearch, setMedicationSearch] = useState('');
  const [prescriptionSearch, setPrescriptionSearch] = useState('');
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  const [filteredMedications, setFilteredMedications] = useState<typeof MEDICATIONS_DATABASE>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<string[]>([]);
  const [filteredDiagnoses, setFilteredDiagnoses] = useState<typeof CIE10_CODES>([]);

  // Auto-determine note type on component mount
  useEffect(() => {
    const initializeNoteType = async () => {
      const { type, reason } = await determineDefaultNoteType();
      setConsultationData(prev => ({ ...prev, noteType: type }));
      setNoteTypeReason(reason);
    };
    
    initializeNoteType();
  }, [patient.id]);

  // Load previous prescription for subsequent notes
  useEffect(() => {
    const loadPreviousPrescription = async () => {
      if (consultationData.noteType === 'subsecuente' || consultationData.noteType === 'seguimiento') {
        try {
          const prescriptions = await expedixApi.getPatientPrescriptions(patient.id);
          if (prescriptions.data && prescriptions.data.length > 0) {
            const latestPrescription = prescriptions.data[0]; // Assuming sorted by date
            setPreviousPrescription(latestPrescription);
            
            // Pre-populate medications from previous prescription
            if (latestPrescription.medications) {
              setConsultationData(prev => ({
                ...prev,
                medications: latestPrescription.medications.map((med: any, index: number) => ({
                  id: Date.now() + index,
                  name: med.name,
                  presentation: med.dosage,
                  substance: med.name, // Could be improved with actual substance data
                  prescription: med.instructions || med.frequency
                }))
              }));
            }
          }
        } catch (error) {
          console.error('Error loading previous prescription:', error);
        }
      }
    };

    loadPreviousPrescription();
  }, [consultationData.noteType, patient.id]);

  const handleMedicationSearch = (value: string) => {
    setMedicationSearch(value);
    setCurrentMedication(prev => ({ ...prev, name: value }));
    
    if (value.length > 2) {
      const filtered = MEDICATIONS_DATABASE.filter(med => 
        med.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredMedications(filtered);
    } else {
      setFilteredMedications([]);
    }
  };

  const handlePrescriptionSearch = (value: string) => {
    setPrescriptionSearch(value);
    setCurrentMedication(prev => ({ ...prev, prescription: value }));
    
    if (value.length > 2) {
      const allPrescriptions = MEDICATIONS_DATABASE.flatMap(med => med.prescriptions);
      const filtered = allPrescriptions.filter(prescription => 
        prescription.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredPrescriptions(Array.from(new Set(filtered)));
    } else {
      setFilteredPrescriptions([]);
    }
  };

  const handleDiagnosisSearch = (value: string) => {
    setDiagnosisSearch(value);
    setConsultationData(prev => ({ ...prev, diagnosis: value }));
    
    if (value.length > 2) {
      const filtered = CIE10_CODES.filter(code => 
        code.description.toLowerCase().includes(value.toLowerCase()) ||
        code.code.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredDiagnoses(filtered);
    } else {
      setFilteredDiagnoses([]);
    }
  };

  const selectMedication = (medication: typeof MEDICATIONS_DATABASE[0]) => {
    const presentation = medication.presentations[0];
    setCurrentMedication({
      name: medication.name,
      presentation: `${presentation.form} ${presentation.concentration}`,
      substance: presentation.substance,
      prescription: ''
    });
    setMedicationSearch('');
    setFilteredMedications([]);
  };

  const selectPrescription = (prescription: string) => {
    setCurrentMedication(prev => ({ ...prev, prescription }));
    setPrescriptionSearch('');
    setFilteredPrescriptions([]);
  };

  const selectDiagnosis = (diagnosis: typeof CIE10_CODES[0]) => {
    setConsultationData(prev => ({ 
      ...prev, 
      diagnosis: `${diagnosis.code}: ${diagnosis.description}` 
    }));
    setDiagnosisSearch('');
    setFilteredDiagnoses([]);
  };

  // Helper function to check if field should be shown for current note type
  const shouldShowField = (fieldName: string) => {
    const currentTemplate = NOTE_TEMPLATES.find(t => t.id === consultationData.noteType);
    return currentTemplate?.fields.includes(fieldName) ?? true;
  };

  // Smart auto-selection of note type based on patient history
  const determineDefaultNoteType = async (): Promise<{type: NoteType, reason: string}> => {
    try {
      // TODO: Get patient's consultation history from API
      // const consultations = await expedixApi.getPatientConsultations(patient.id);
      
      // For now, simulate logic based on common scenarios:
      // 1. If patient has no previous notes -> "primera-vez"
      // 2. If patient has previous notes -> "subsecuente"  
      // 3. If last consultation was very recent (same day/urgent) -> "urgencias"
      // 4. If doctor specializes in psychology -> "psicoterapia"
      
      // Mock logic - replace with real API calls
      const hasConsultations = false; // await checkPatientConsultations()
      const isEmergency = false; // await checkIfEmergency()
      const isPsychologist = false; // await checkDoctorSpecialty()
      
      if (!hasConsultations) {
        return { type: 'primera-vez', reason: 'Paciente sin consultas previas' };
      }
      if (isEmergency) {
        return { type: 'urgencias', reason: 'Consulta no programada' };
      }
      if (isPsychologist) {
        return { type: 'psicoterapia', reason: 'Especialidad en psicología' };
      }
      
      return { type: 'subsecuente', reason: 'Paciente con historial previo' };
    } catch (error) {
      console.error('Error determining note type:', error);
      return { type: 'subsecuente', reason: 'Selección automática' };
    }
  };

  const addMedication = () => {
    if (currentMedication.name && currentMedication.prescription) {
      setConsultationData(prev => ({
        ...prev,
        medications: [...prev.medications, { ...currentMedication, id: Date.now() }]
      }));
      setCurrentMedication({ name: '', presentation: '', substance: '', prescription: '' });
    }
  };

  const removeMedication = (id: number) => {
    setConsultationData(prev => ({
      ...prev,
      medications: prev.medications.filter(med => med.id !== id)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Save prescription to backend if there are medications
      if (consultationData.medications.length > 0) {
        const prescriptionData = {
          patient_id: patient.id,
          practitioner_name: 'Dr. Usuario', // This should come from auth context
          practitioner_license: 'LIC-12345', // This should come from user profile
          medications: consultationData.medications.map(med => ({
            name: med.name,
            dosage: med.presentation,
            frequency: med.prescription,
            duration: 'Según indicación médica',
            instructions: med.prescription
          })),
          diagnosis: consultationData.diagnosis,
          notes: consultationData.additionalInstructions,
          print_config: {
            marginLeft: 2,
            marginTop: 4.2,
            marginRight: 2,
            marginBottom: 2
          }
        };

        await expedixApi.createPrescription(prescriptionData);
      }

      // Save consultation (this would typically go to another endpoint)
      onSaveConsultation(consultationData);
    } catch (error) {
      console.error('Error saving consultation:', error);
      setError(error instanceof Error ? error.message : 'Error al guardar la consulta');
    } finally {
      setLoading(false);
    }
  };


  const handlePrintPrescription = async () => {
    try {
      setLoading(true);
      
      // First save the prescription if not already saved
      if (consultationData.medications.length > 0) {
        const prescriptionData = {
          patient_id: patient.id,
          practitioner_name: 'Dr. Usuario',
          practitioner_license: 'LIC-12345',
          medications: consultationData.medications.map(med => ({
            name: med.name,
            dosage: med.presentation,
            frequency: med.prescription,
            duration: 'Según indicación médica',
            instructions: med.prescription
          })),
          diagnosis: consultationData.diagnosis,
          notes: consultationData.additionalInstructions,
          print_config: {
            marginLeft: 2,
            marginTop: 4.2,
            marginRight: 2,
            marginBottom: 2
          }
        };

        const result = await expedixApi.createPrescription(prescriptionData);
        
        // Generate and download PDF
        const pdfBlob = await expedixApi.generatePrescriptionPDF(result.data.id);
        
        // Create download link
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receta_${patient.first_name}_${patient.paternal_last_name}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error generating prescription PDF:', error);
      setError('Error al generar el PDF de la receta');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="text-red-600 text-sm">
              ❌ {error}
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700">Procesando...</p>
          </div>
        </div>
      )}

      {/* Patient Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {patient.first_name.charAt(0)}{patient.paternal_last_name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {patient.first_name} {patient.paternal_last_name} {patient.maternal_last_name || ''}
              </h2>
              <p className="text-sm text-gray-600">
                🗓️ {patient.birth_date} | Edad: {patient.age} años | Género: {patient.gender === 'masculine' ? 'Masculino' : 'Femenino'}
              </p>
              <p className="text-sm text-gray-600">
                Email: {patient.email} | Tel: {patient.cell_phone}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
              📹 Video consulta
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" size="sm">
              📋 Evaluación PHQ-9
            </Button>
          </div>
        </div>
      </Card>

      {/* Note Type Selector & Date - Compact */}
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Tipo:</label>
              <select
                value={consultationData.noteType}
                onChange={(e) => {
                  setConsultationData(prev => ({ ...prev, noteType: e.target.value as typeof consultationData.noteType }));
                  setNoteTypeReason('Selección manual');
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              >
                {NOTE_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.icon} {template.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">📅 Fecha:</label>
              <input
                type="date"
                value={consultationData.date}
                onChange={(e) => setConsultationData(prev => ({ ...prev, date: e.target.value }))}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {noteTypeReason && (
              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">
                💡 {noteTypeReason}
              </span>
            )}
          </div>
        </div>
      </Card>

      <form 
        onSubmit={handleSubmit} 
        onKeyDown={(e) => {
          // Prevenir submit con Enter excepto en textareas y en el botón de submit
          if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA' && !(e.target as HTMLElement).classList.contains('submit-button')) {
            e.preventDefault();
          }
        }}
        className="space-y-6"
      >

        {/* Psychology Specific Fields - Only show for primera-vez-psicologia */}
        {consultationData.noteType === 'primera-vez-psicologia' && (
          <>
            {/* Motivo de Consulta Section */}
            <Card className="p-4 border-l-4 border-l-purple-500">
              <h3 className="text-base font-medium text-gray-900 mb-3">🧠 Motivo de Consulta</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Problema Principal *
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    rows={2}
                    placeholder="Motivo principal de consulta..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Inicio</label>
                    <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500">
                      <option value="">Seleccionar...</option>
                      <option value="menos_1_mes">&lt; 1 mes</option>
                      <option value="1_3_meses">1-3 meses</option>
                      <option value="3_6_meses">3-6 meses</option>
                      <option value="6_meses_1_año">6m - 1 año</option>
                      <option value="mas_2_años">&gt; 2 años</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Evolución</label>
                    <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500">
                      <option value="">Seleccionar...</option>
                      <option value="progresivo">Progresivo</option>
                      <option value="estable">Estable</option>
                      <option value="fluctuante">Fluctuante</option>
                      <option value="episodico">Episódico</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Intensidad</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>1</span><span>5</span><span>10</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Factores Precipitantes</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                    {['Duelo', 'Trabajo', 'Familia', 'Pareja', 'Económicos', 'Salud'].map((factor) => (
                      <label key={factor} className="flex items-center space-x-1">
                        <input type="checkbox" className="rounded w-3 h-3" />
                        <span className="text-xs">{factor}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Historia Vital Section */}
            <Card className="p-4 border-l-4 border-l-blue-500">
              <h3 className="text-base font-medium text-gray-900 mb-3">📚 Historia Vital</h3>
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Desarrollo Temprano</label>
                    <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500">
                      <option value="normal">Normal</option>
                      <option value="retrasos_menores">Retrasos menores</option>
                      <option value="retrasos_significativos">Retrasos significativos</option>
                      <option value="informacion_insuficiente">Información insuficiente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Estructura Familiar</label>
                    <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500">
                      <option value="nuclear">Nuclear</option>
                      <option value="monoparental">Monoparental</option>
                      <option value="extensa">Extensa</option>
                      <option value="reconstituida">Reconstituida</option>
                      <option value="adoptiva">Adoptiva</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas sobre Historia Familiar</label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={2}
                    placeholder="Dinámicas familiares, antecedentes de salud mental..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Historia Educativa/Laboral</label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={2}
                    placeholder="Rendimiento académico, situación laboral actual..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Eventos Traumáticos/Significativos</label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={2}
                    placeholder="Eventos traumáticos, pérdidas significativas, cambios importantes..."
                  />
                </div>
              </div>
            </Card>

            {/* Evaluación por Esferas */}
            <Card className="p-4 border-l-4 border-l-green-500">
              <h3 className="text-base font-medium text-gray-900 mb-3">🎯 Evaluación por Esferas</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Esfera Cognitiva</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mb-2">
                    {['Catastrofización', 'Dicotómico', 'Personalización', 'Filtro mental', 'Descalificación', 'Lectura mental'].map((pensamiento) => (
                      <label key={pensamiento} className="flex items-center space-x-1">
                        <input type="checkbox" className="rounded w-3 h-3" />
                        <span className="text-xs">{pensamiento}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Atención/Concentración</label>
                    <input type="range" min="0" max="10" className="w-full" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0 - Normal</span><span>5 - Alterada</span><span>10 - Muy alterada</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Esfera Emocional</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: 'Ansiedad', id: 'ansiedad' },
                      { label: 'Depresión', id: 'depresion' },
                      { label: 'Irritabilidad', id: 'irritabilidad' },
                      { label: 'Regulación emocional', id: 'regulacion' }
                    ].map((emocion) => (
                      <div key={emocion.id}>
                        <label className="block text-xs text-gray-600 mb-1">{emocion.label}</label>
                        <input type="range" min="0" max="10" className="w-full" />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0</span><span>5</span><span>10</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Esfera Conductual</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mb-2">
                    {['Evitación', 'Aislamiento', 'Agresividad', 'Autolesión', 'Impulsividad', 'Compulsiones'].map((conducta) => (
                      <label key={conducta} className="flex items-center space-x-1">
                        <input type="checkbox" className="rounded w-3 h-3" />
                        <span className="text-xs">{conducta}</span>
                      </label>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Calidad del sueño</label>
                      <input type="range" min="0" max="10" className="w-full" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0 - Muy mala</span><span>5 - Regular</span><span>10 - Excelente</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nivel de actividad</label>
                      <input type="range" min="0" max="10" className="w-full" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0 - Muy bajo</span><span>5 - Normal</span><span>10 - Muy alto</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Esfera Social/Familiar</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Funcionamiento social</label>
                      <input type="range" min="0" max="10" className="w-full" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0 - Muy alterado</span><span>5 - Regular</span><span>10 - Excelente</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Red de apoyo</label>
                      <input type="range" min="0" max="10" className="w-full" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0 - Ausente</span><span>5 - Moderada</span><span>10 - Fuerte</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Impresión Diagnóstica */}
            <Card className="p-4 border-l-4 border-l-amber-500">
              <h3 className="text-base font-medium text-gray-900 mb-3">🎯 Impresión Diagnóstica</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico Principal (DSM-5)</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    placeholder="Ej: F32.1 Trastorno Depresivo Mayor, Episodio Moderado"
                    list="dsm5-suggestions"
                  />
                  <datalist id="dsm5-suggestions">
                    <option value="F32.0 Trastorno Depresivo Mayor, Episodio Leve" />
                    <option value="F32.1 Trastorno Depresivo Mayor, Episodio Moderado" />
                    <option value="F32.2 Trastorno Depresivo Mayor, Episodio Grave" />
                    <option value="F41.1 Trastorno de Ansiedad Generalizada" />
                    <option value="F41.0 Trastorno de Pánico" />
                    <option value="F43.10 Trastorno de Estrés Postraumático" />
                    <option value="F60.3 Trastorno Límite de la Personalidad" />
                    <option value="F90.2 Trastorno por Déficit de Atención con Hiperactividad" />
                    <option value="F50.0 Anorexia Nerviosa" />
                    <option value="F50.2 Bulimia Nerviosa" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Factores de Mantenimiento</label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                    rows={2}
                    placeholder="Factores cognitivos, conductuales y ambientales que mantienen el problema..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fortalezas del Paciente</label>
                    <div className="grid grid-cols-1 gap-1">
                      {['Motivación al cambio', 'Red de apoyo', 'Insight', 'Recursos económicos'].map((fortaleza) => (
                        <label key={fortaleza} className="flex items-center space-x-1">
                          <input type="checkbox" className="rounded w-3 h-3" />
                          <span className="text-xs">{fortaleza}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Factores de Riesgo</label>
                    <div className="grid grid-cols-1 gap-1">
                      {['Ideación suicida', 'Aislamiento social', 'Abuso de sustancias', 'Impulsividad'].map((riesgo) => (
                        <label key={riesgo} className="flex items-center space-x-1">
                          <input type="checkbox" className="rounded w-3 h-3" />
                          <span className="text-xs">{riesgo}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Plan de Tratamiento */}
            <Card className="p-4 border-l-4 border-l-indigo-500">
              <h3 className="text-base font-medium text-gray-900 mb-3">📋 Plan de Tratamiento</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Objetivos Terapéuticos *</label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    rows={2}
                    placeholder="3-5 objetivos específicos y medibles..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estrategias de Intervención</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                    {['TCC', 'Exposición', 'Relajación', 'Mindfulness', 'Act. conductual', 'Psicoeducación'].map((estrategia) => (
                      <label key={estrategia} className="flex items-center space-x-1">
                        <input type="checkbox" className="rounded w-3 h-3" />
                        <span className="text-xs">{estrategia}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Frecuencia *</label>
                    <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500" required>
                      <option value="semanal">Semanal</option>
                      <option value="quincenal">Quincenal</option>
                      <option value="mensual">Mensual</option>
                      <option value="intensiva">Intensiva</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Duración Estimada *</label>
                    <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-indigo-500" required>
                      <option value="1_3_meses">1-3 meses</option>
                      <option value="3_6_meses">3-6 meses</option>
                      <option value="6_12_meses">6-12 meses</option>
                      <option value="1_2_años">1-2 años</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Psychiatry Specific Fields - Only show for primera-vez-psiquiatria */}
        {consultationData.noteType === 'primera-vez-psiquiatria' && (
          <>
            {/* SUBJETIVO Section */}
            <Card className="p-4 border-l-4 border-l-blue-500">
              <h3 className="text-base font-medium text-gray-900 mb-3">📝 SUBJETIVO</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo de Consulta *
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={3}
                    placeholder="Descripción detallada del motivo de consulta según el paciente y/o familiares..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personalidad Premórbida/Antecedentes de Relevancia *
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={3}
                    placeholder="Personalidad previa, antecedentes familiares, personales, desarrollo psicomotor, historia médica relevante..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subjetivo *
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={3}
                    placeholder="Información subjetiva adicional, evolución del cuadro, factores precipitantes y desencadenantes..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Síntomas *
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={3}
                    placeholder="Descripción detallada de la sintomatología actual..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo de Evolución *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {['1-7 días', '8-30 días', '1-3 meses', '4-6 meses', '7-12 meses', 'Más de 1 año'].map((tiempo) => (
                      <label key={tiempo} className="flex items-center space-x-1">
                        <input type="radio" name="tiempo_evolucion" className="w-3 h-3" />
                        <span className="text-xs">{tiempo}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* OBJETIVO Section - Mental Status Exam (Reusable Component) */}
            <MentalExam 
              data={consultationData.mentalExam}
              onChange={(mentalExamData) => 
                setConsultationData(prev => ({ 
                  ...prev, 
                  mentalExam: { ...prev.mentalExam, ...mentalExamData }
                }))
              }
              title="🧬 OBJETIVO - Examen Mental"
              borderColor="border-l-green-500"
              required={true}
            />

            {/* Tratamiento Previo, Fortalezas y Factores de Riesgo Section */}
            <Card className="p-4 border-l-4 border-l-orange-500">
              <h3 className="text-base font-medium text-gray-900 mb-3">🛡️ Antecedentes y Factores de Riesgo</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tratamientos Previos
                    </label>
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      rows={2}
                      placeholder="Tratamientos psiquiátricos, psicológicos, farmacológicos previos..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fortalezas *
                    </label>
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      rows={2}
                      placeholder="Recursos personales, familiares, sociales y factores protectores..."
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Factores de Riesgo *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['Ideación suicida', 'Ideación homicida', 'Autolesión', 'Heteroagresión', 'Impulsividad', 'Abuso sustancias', 'Falta insight', 'Aislamiento social', 'Incumplimiento terapéutico'].map((factor) => (
                      <label key={factor} className="flex items-center space-x-1">
                        <input type="checkbox" className="w-3 h-3 rounded" />
                        <span className="text-xs">{factor}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción Detallada de Factores de Riesgo *
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    rows={2}
                    placeholder="Descripción detallada de factores de riesgo identificados..."
                    required
                  />
                </div>
              </div>
            </Card>

            {/* PLAN Section */}
            <Card className="p-4 border-l-4 border-l-purple-500">
              <h3 className="text-base font-medium text-gray-900 mb-3">📋 PLAN</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conclusiones *
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    rows={3}
                    placeholder="Síntesis diagnóstica, impresión clínica y plan de tratamiento..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {['Primera vez', 'Seguimiento', 'Urgencia', 'Crisis', 'Estable', 'Mejoría', 'Recaída'].map((tag) => (
                      <label key={tag} className="flex items-center space-x-1">
                        <input type="checkbox" className="w-3 h-3 rounded" />
                        <span className="text-xs">{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Clasificación Diagnóstica *</label>
                    <div className="space-y-1">
                      <label className="flex items-center space-x-2">
                        <input type="radio" name="clasificacion" value="cie10" className="w-3 h-3" />
                        <span className="text-xs">CIE-10</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="radio" name="clasificacion" value="dsm5" className="w-3 h-3" />
                        <span className="text-xs">DSM-5</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="radio" name="clasificacion" value="manual" className="w-3 h-3" />
                        <span className="text-xs">Ingreso manual</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Diagnóstico Principal *</label>
                    <input
                      type="text"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500"
                      placeholder="Diagnóstico principal..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tiempo Seguimiento *</label>
                    <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500" required>
                      <option value="">Seleccionar...</option>
                      <option value="1_semana">1 semana</option>
                      <option value="2_semanas">2 semanas</option>
                      <option value="4_semanas">4 semanas</option>
                      <option value="6_semanas">6 semanas</option>
                      <option value="3_meses">3 meses</option>
                      <option value="6_meses">6 meses</option>
                      <option value="12_meses">12 meses</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diagnósticos Secundarios
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    rows={2}
                    placeholder="Diagnósticos secundarios (máximo 5)..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas para la Próxima Cita
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="Notas adicionales para la próxima cita..."
                  />
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Psychology Follow-up Specific Fields - Only show for subsecuente-psicologia */}
        {consultationData.noteType === 'subsecuente-psicologia' && (
          <>
            {/* Resumen de Consulta Anterior */}
            <Card className="p-4 border-l-4 border-l-blue-500">
              <h3 className="text-base font-medium text-gray-900 mb-3">📋 Resumen de Consulta Anterior</h3>
              
              <div className="space-y-3">
                <div className="bg-blue-50 p-3 rounded-md">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Última Consulta (Auto-cargado)
                  </label>
                  <div className="text-sm text-gray-600 italic">
                    Se cargará automáticamente del expediente del paciente...
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-md">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Objetivos del Plan de Tratamiento (Auto-cargado)
                  </label>
                  <div className="text-sm text-gray-600 italic">
                    Se cargarán automáticamente del plan de tratamiento activo...
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-md">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tareas Asignadas Anteriormente (Auto-cargado)
                  </label>
                  <div className="text-sm text-gray-600 italic">
                    Se cargarán automáticamente de la consulta previa...
                  </div>
                </div>
              </div>
            </Card>

            {/* Estado Actual */}
            <Card className="p-4 border-l-4 border-l-green-500">
              <h3 className="text-base font-medium text-gray-900 mb-3">📊 Estado Actual</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Estado de Ánimo vs Sesión Anterior *</label>
                    <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500" required>
                      <option value="">Seleccionar...</option>
                      <option value="mejor">Mejor</option>
                      <option value="igual">Igual</option>
                      <option value="peor">Peor</option>
                      <option value="fluctuante">Fluctuante</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nivel de Funcionamiento *</label>
                    <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500" required>
                      <option value="">Seleccionar...</option>
                      <option value="mejorado">Mejorado</option>
                      <option value="estable">Estable</option>
                      <option value="deteriorado">Deteriorado</option>
                      <option value="variable">Variable</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Motivación hacia Terapia *</label>
                    <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500" required>
                      <option value="">Seleccionar...</option>
                      <option value="alta">Alta</option>
                      <option value="moderada">Moderada</option>
                      <option value="baja">Baja</option>
                      <option value="ambivalente">Ambivalente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Frecuencia de Síntomas *</label>
                    <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500" required>
                      <option value="">Seleccionar...</option>
                      <option value="diaria">Diaria</option>
                      <option value="varias_veces_semana">Varias veces por semana</option>
                      <option value="semanal">Semanal</option>
                      <option value="ocasional">Ocasional</option>
                      <option value="rara_vez">Rara vez</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Autoevaluación de Progreso (1-10) *</label>
                    <div className="space-y-1">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        defaultValue="5"
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>1 - Ningún progreso</span>
                        <span>5</span>
                        <span>10 - Progreso excelente</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Intensidad de Síntomas (0-10) *</label>
                    <div className="space-y-1">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        defaultValue="5"
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0 - Sin síntomas</span>
                        <span>5</span>
                        <span>10 - Síntomas severos</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cambios en los Síntomas *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['Disminución de intensidad', 'Aumento de intensidad', 'Nuevos síntomas', 'Desaparición de síntomas', 'Sin cambios', 'Más manejables'].map((cambio) => (
                      <label key={cambio} className="flex items-center space-x-1">
                        <input type="checkbox" className="w-3 h-3 rounded" />
                        <span className="text-xs">{cambio}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción de Cambios en Sintomatología
                    </label>
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      rows={2}
                      placeholder="Describir cambios específicos desde la última sesión..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Eventos Significativos
                    </label>
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      rows={2}
                      placeholder="Eventos importantes que puedan afectar el proceso terapéutico..."
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Adherencia al Tratamiento */}
            <Card className="p-4 border-l-4 border-l-yellow-500">
              <h3 className="text-base font-medium text-gray-900 mb-3">✅ Adherencia al Tratamiento</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cumplimiento de Tareas *</label>
                    <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-yellow-500" required>
                      <option value="">Seleccionar...</option>
                      <option value="completo">Completo</option>
                      <option value="parcial">Parcial</option>
                      <option value="minimo">Mínimo</option>
                      <option value="no_realizo">No realizó</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Práctica de Técnicas *</label>
                    <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-yellow-500" required>
                      <option value="">Seleccionar...</option>
                      <option value="diariamente">Diariamente</option>
                      <option value="varias_veces_semana">Varias veces por semana</option>
                      <option value="ocasionalmente">Ocasionalmente</option>
                      <option value="no_practico">No practicó</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dificultades para la Adherencia</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['Falta tiempo', 'Olvido', 'Falta motivación', 'Dificultad técnica', 'Resistencia', 'Eventos externos', 'Ninguna dificultad'].map((dificultad) => (
                      <label key={dificultad} className="flex items-center space-x-1">
                        <input type="checkbox" className="w-3 h-3 rounded" />
                        <span className="text-xs">{dificultad}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Progreso en Objetivos */}
            <Card className="p-4 border-l-4 border-l-purple-500">
              <h3 className="text-base font-medium text-gray-900 mb-3">🎯 Progreso en Objetivos Terapéuticos</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Revisión de Objetivos del Plan de Tratamiento *
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    rows={3}
                    placeholder="Evaluar el progreso de cada objetivo, especificar logros y áreas que necesitan más trabajo..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje de Avance General *</label>
                  <div className="space-y-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      defaultValue="50"
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0% - Sin progreso</span>
                      <span>50%</span>
                      <span>100% - Objetivos logrados</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Logros de la Sesión *
                    </label>
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      rows={2}
                      placeholder="Principales logros, insights o avances conseguidos durante la sesión..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción de Dificultades
                    </label>
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      rows={2}
                      placeholder="Dificultades específicas y estrategias para abordarlas..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dificultades Encontradas</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['Resistencia al cambio', 'Dificultades cognitivas', 'Problemas externos', 'Falta recursos', 'Comorbilidad', 'Dinámicas familiares', 'Laborales/académicas'].map((dificultad) => (
                      <label key={dificultad} className="flex items-center space-x-1">
                        <input type="checkbox" className="w-3 h-3 rounded" />
                        <span className="text-xs">{dificultad}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Intervención de la Sesión */}
            <Card className="p-4 border-l-4 border-l-indigo-500">
              <h3 className="text-base font-medium text-gray-900 mb-3">🔧 Intervención de la Sesión</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Técnicas Utilizadas en la Sesión *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {['Reestructuración cognitiva', 'Técnicas de exposición', 'Relajación/Respiración', 'Mindfulness', 'Activación conductual', 'Psicoeducación', 'Role playing', 'Técnicas narrativas', 'Trabajo con emociones', 'Resolución de problemas', 'Técnicas de aceptación', 'Entrenamiento en habilidades'].map((tecnica) => (
                      <label key={tecnica} className="flex items-center space-x-1">
                        <input type="checkbox" className="w-3 h-3 rounded" />
                        <span className="text-xs">{tecnica}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contenido Principal de la Sesión *
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    rows={4}
                    placeholder="Descripción del contenido principal trabajado durante la sesión..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Insights del Paciente
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    rows={2}
                    placeholder="Principales insights, conexiones o comprensiones del paciente durante la sesión..."
                  />
                </div>
              </div>
            </Card>

            {/* Plan de Seguimiento */}
            <Card className="p-4 border-l-4 border-l-teal-500">
              <h3 className="text-base font-medium text-gray-900 mb-3">📅 Plan de Seguimiento</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tareas para Casa *
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    rows={3}
                    placeholder="Especificar tareas asignadas, frecuencia y objetivos de cada una..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Objetivos para Próxima Sesión *
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    rows={2}
                    placeholder="Objetivos específicos a trabajar en la siguiente sesión..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">¿Requiere Ajustes al Plan? *</label>
                    <div className="space-y-1">
                      <label className="flex items-center space-x-2">
                        <input type="radio" name="ajustes_plan" value="si" className="w-3 h-3" />
                        <span className="text-xs">Sí</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="radio" name="ajustes_plan" value="no" className="w-3 h-3" />
                        <span className="text-xs">No</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tiempo Próxima Cita *</label>
                    <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-teal-500" required>
                      <option value="">Seleccionar...</option>
                      <option value="1_semana">1 semana</option>
                      <option value="2_semanas">2 semanas</option>
                      <option value="3_semanas">3 semanas</option>
                      <option value="4_semanas">4 semanas</option>
                      <option value="segun_necesidad">Según necesidad</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Ajustes Necesarios</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['Cambio de técnicas', 'Nuevos objetivos', 'Modificar frecuencia', 'Incluir otros profesionales', 'Cambio de enfoque'].map((ajuste) => (
                      <label key={ajuste} className="flex items-center space-x-1">
                        <input type="checkbox" className="w-3 h-3 rounded" />
                        <span className="text-xs">{ajuste}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción de Ajustes al Plan
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    rows={2}
                    placeholder="Describir los ajustes necesarios al plan de tratamiento..."
                  />
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Vital Signs - Hide for psychology and psychiatry notes (have custom fields) */}
        {shouldShowField('vitalSigns') && consultationData.noteType !== 'primera-vez-psicologia' && consultationData.noteType !== 'subsecuente-psicologia' && consultationData.noteType !== 'primera-vez-psiquiatria' && (
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">🩺 Signos Vitales</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Altura (m)</label>
              <input
                type="number"
                step="0.01"
                value={consultationData.vitalSigns.height}
                onChange={(e) => setConsultationData(prev => ({
                  ...prev,
                  vitalSigns: { ...prev.vitalSigns, height: e.target.value }
                }))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="1.70"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                value={consultationData.vitalSigns.weight}
                onChange={(e) => setConsultationData(prev => ({
                  ...prev,
                  vitalSigns: { ...prev.vitalSigns, weight: e.target.value }
                }))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="70"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">T.A. (mmHg)</label>
              <div className="flex space-x-1">
                <input
                  type="number"
                  placeholder="120"
                  value={consultationData.vitalSigns.bloodPressure.systolic}
                  onChange={(e) => setConsultationData(prev => ({
                    ...prev,
                    vitalSigns: { 
                      ...prev.vitalSigns, 
                      bloodPressure: { ...prev.vitalSigns.bloodPressure, systolic: e.target.value }
                    }
                  }))}
                  className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="self-center text-xs">/</span>
                <input
                  type="number"
                  placeholder="80"
                  value={consultationData.vitalSigns.bloodPressure.diastolic}
                  onChange={(e) => setConsultationData(prev => ({
                    ...prev,
                    vitalSigns: { 
                      ...prev.vitalSigns, 
                      bloodPressure: { ...prev.vitalSigns.bloodPressure, diastolic: e.target.value }
                    }
                  }))}
                  className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                value={consultationData.vitalSigns.temperature}
                onChange={(e) => setConsultationData(prev => ({
                  ...prev,
                  vitalSigns: { ...prev.vitalSigns, temperature: e.target.value }
                }))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="36.5"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">F.C. (lpm)</label>
              <input
                type="number"
                value={consultationData.vitalSigns.heartRate}
                onChange={(e) => setConsultationData(prev => ({
                  ...prev,
                  vitalSigns: { ...prev.vitalSigns, heartRate: e.target.value }
                }))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="72"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">F.R. (rpm)</label>
              <input
                type="number"
                value={consultationData.vitalSigns.respiratoryRate}
                onChange={(e) => setConsultationData(prev => ({
                  ...prev,
                  vitalSigns: { ...prev.vitalSigns, respiratoryRate: e.target.value }
                }))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="16"
              />
            </div>
          </div>
        </Card>
        )}

        {/* Physical Examination - Hide for psychology and psychiatry notes (have custom sections) */}
        {shouldShowField('physicalExamination') && consultationData.noteType !== 'primera-vez-psicologia' && consultationData.noteType !== 'subsecuente-psicologia' && consultationData.noteType !== 'primera-vez-psiquiatria' && (
        <Card className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exploración Física:
          </label>
          <textarea
            value={consultationData.physicalExamination}
            onChange={(e) => setConsultationData(prev => ({ ...prev, physicalExamination: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Descripción de la exploración física..."
          />
        </Card>
        )}

        {/* Alta Psiquiátrica Specific Fields */}
        {consultationData.noteType === 'alta-psiquiatria' && (
        <div className="space-y-4">
          <Card className="p-4 border-l-4 border-l-green-500">
            <h3 className="text-base font-medium text-gray-900 mb-3">🎯 Resumen del Tratamiento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tiempo Total de Seguimiento</label>
                <textarea
                  value={consultationData.tiempoSeguimiento}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, tiempoSeguimiento: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  rows={2}
                  placeholder="Resumen del tiempo total de seguimiento, fechas relevantes..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Diagnósticos Tratados</label>
                <textarea
                  value={consultationData.diagnosticosTratados}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, diagnosticosTratados: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  rows={2}
                  placeholder="Diagnóstico inicial, evolución diagnóstica y diagnóstico final"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Medicamentos Utilizados</label>
                <textarea
                  value={consultationData.medicamentosUtilizados}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, medicamentosUtilizados: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                  placeholder="Medicamentos actuales y previos, dosis máximas alcanzadas..."
                />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-blue-500">
            <h3 className="text-base font-medium text-gray-900 mb-3">📈 Evolución Clínica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Remisión</label>
                <select 
                  value={consultationData.tipoRemision}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, tipoRemision: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Seleccionar...</option>
                  <option value="completa">Remisión completa</option>
                  <option value="parcial">Remisión parcial</option>
                  <option value="respuesta">Respuesta clínica</option>
                  <option value="estabilizacion">Estabilización</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Inicio de Remisión</label>
                <input
                  type="date"
                  value={consultationData.inicioRemision}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, inicioRemision: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Progreso Clínico Observado</label>
                <textarea
                  value={consultationData.progresoClinico}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, progresoClinico: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                  placeholder="Resumen del progreso clínico, mejorías observadas..."
                />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-purple-500">
            <h3 className="text-base font-medium text-gray-900 mb-3">🎯 Plan de Mantenimiento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requiere Medicación de Mantenimiento</label>
                <select 
                  value={consultationData.requiereMedicacion}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, requiereMedicacion: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Seleccionar...</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frecuencia de Seguimiento</label>
                <select 
                  value={consultationData.frecuenciaSeguimiento}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, frecuenciaSeguimiento: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Seleccionar...</option>
                  <option value="1mes">1 mes</option>
                  <option value="2meses">2 meses</option>
                  <option value="3meses">3 meses</option>
                  <option value="6meses">6 meses</option>
                  <option value="sos">SOS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contacto de Emergencia</label>
                <input
                  type="text"
                  value={consultationData.contactoEmergencia}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, contactoEmergencia: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Teléfono y nombre del contacto de emergencia"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Funcionamiento Global (GAF 1-100)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={consultationData.funcionamientoGlobal}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, funcionamientoGlobal: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  placeholder="1-100"
                />
              </div>
            </div>
          </Card>
        </div>
        )}

        {/* Evento Entre Consultas Specific Fields */}
        {consultationData.noteType === 'evento-entre-consultas' && (
        <div className="space-y-4">
          <Card className="p-4 border-l-4 border-l-red-500">
            <h3 className="text-base font-medium text-gray-900 mb-3">⚡ Información del Evento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Contacto</label>
                <select 
                  value={consultationData.tipoContacto}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, tipoContacto: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Seleccionar...</option>
                  <option value="llamada">Llamada telefónica</option>
                  <option value="mensaje">Mensaje/WhatsApp</option>
                  <option value="correo">Correo electrónico</option>
                  <option value="presencial">Visita presencial urgente</option>
                  <option value="familiar">Familiar/Acompañante reporta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha del Evento</label>
                <input
                  type="date"
                  value={consultationData.fechaEvento}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, fechaEvento: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nivel de Urgencia</label>
                <select 
                  value={consultationData.nivelUrgencia}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, nivelUrgencia: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Seleccionar...</option>
                  <option value="baja">Baja</option>
                  <option value="moderada">Moderada</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Presenta Riesgo Inmediato</label>
                <select 
                  value={consultationData.riesgoInmediato}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, riesgoInmediato: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Seleccionar...</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción del Evento/Incidente</label>
                <textarea
                  value={consultationData.descripcionEvento}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, descripcionEvento: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  rows={4}
                  placeholder="Descripción detallada del evento, síntomas, situación..."
                />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-yellow-500">
            <h3 className="text-base font-medium text-gray-900 mb-3">🚨 Respuesta Inmediata</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Orientación/Instrucciones Dadas</label>
                <textarea
                  value={consultationData.orientacionDada}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, orientacionDada: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                  placeholder="Orientaciones específicas, técnicas enseñadas, instrucciones..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requiere Seguimiento</label>
                <select 
                  value={consultationData.requiereSeguimiento}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, requiereSeguimiento: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Seleccionar...</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
          </Card>
        </div>
        )}

        {/* Subsecuente Psiquiatría Specific Fields */}
        {consultationData.noteType === 'subsecuente-psiquiatria' && (
        <div className="space-y-4">
          <Card className="p-4 border-l-4 border-l-indigo-500">
            <h3 className="text-base font-medium text-gray-900 mb-3">🔄 Evolución Subjetiva</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado General vs. Consulta Anterior</label>
                <select 
                  value={consultationData.estadoGeneral}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, estadoGeneral: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Seleccionar...</option>
                  <option value="mucho-mejor">Mucho mejor</option>
                  <option value="mejor">Mejor</option>
                  <option value="igual">Igual</option>
                  <option value="peor">Peor</option>
                  <option value="mucho-peor">Mucho peor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Porcentaje de Mejoría Global (0-100%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={consultationData.porcentajeMejoria}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, porcentajeMejoria: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  placeholder="0-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adherencia a la Medicación</label>
                <select 
                  value={consultationData.adherenciaMedicacion}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, adherenciaMedicacion: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Seleccionar...</option>
                  <option value="100">100% (todas las dosis)</option>
                  <option value="75-99">75-99% (mayoría de dosis)</option>
                  <option value="50-74">50-74% (la mitad)</option>
                  <option value="25-49">25-49% (menos de la mitad)</option>
                  <option value="0-24">0-24% (muy pocas dosis)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Presenta Efectos Secundarios</label>
                <select 
                  value={consultationData.presentaEfectosSecundarios}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, presentaEfectosSecundarios: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Seleccionar...</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Eventos Intercurrentes</label>
                <textarea
                  value={consultationData.eventosIntercurrentes}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, eventosIntercurrentes: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  rows={2}
                  placeholder="Eventos médicos, psicológicos o sociales relevantes..."
                />
              </div>
            </div>
          </Card>

          {/* Examen Mental de Seguimiento (Reusable Component) */}
          <MentalExam 
            data={consultationData.mentalExam}
            onChange={(mentalExamData) => 
              setConsultationData(prev => ({ 
                ...prev, 
                mentalExam: { ...prev.mentalExam, ...mentalExamData }
              }))
            }
            title="🧠 Examen Mental de Seguimiento"
            borderColor="border-l-teal-500"
            required={false}
          />

          <Card className="p-4 border-l-4 border-l-green-500">
            <h3 className="text-base font-medium text-gray-900 mb-3">📊 Respuesta al Tratamiento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Respuesta</label>
                <select 
                  value={consultationData.tipoRespuestaTratamiento}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, tipoRespuestaTratamiento: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Seleccionar...</option>
                  <option value="remision-completa">Remisión completa</option>
                  <option value="respuesta-parcial">Respuesta parcial</option>
                  <option value="respuesta-minima">Respuesta mínima</option>
                  <option value="sin-respuesta">Sin respuesta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GAF Actual (1-100)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={consultationData.gafActual}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, gafActual: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  placeholder="1-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requiere Ajustes a Medicación</label>
                <select 
                  value={consultationData.requiereAjustesMedicacion}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, requiereAjustesMedicacion: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Seleccionar...</option>
                  <option value="si">Sí</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tiempo para Próxima Cita</label>
                <select 
                  value={consultationData.tiempoProximaCita}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, tiempoProximaCita: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Seleccionar...</option>
                  <option value="1semana">1 semana</option>
                  <option value="2semanas">2 semanas</option>
                  <option value="4semanas">4 semanas</option>
                  <option value="6semanas">6 semanas</option>
                  <option value="8semanas">8 semanas</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Impresión Clínica Actual</label>
                <textarea
                  value={consultationData.impresionClinicaActual}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, impresionClinicaActual: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                  placeholder="Evaluación del estado actual, respuesta al tratamiento y pronóstico..."
                />
              </div>
            </div>
          </Card>
        </div>
        )}

        {/* Universal Clinimetrix Section - Always show */}
        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-medium text-gray-900">🧪 Clinimetrix - Evaluaciones</h3>
            <Button className="bg-purple-600 hover:bg-purple-700 text-xs px-2 py-1" size="sm">
              + Nueva Evaluación
            </Button>
          </div>
          
          <div className="space-y-3">
            {/* Previous Assessments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Evaluaciones Previas</label>
              <div className="space-y-2">
                {/* Mock previous assessments - Replace with real data */}
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">PHQ-9</span>
                      <span className="text-xs text-gray-500">Última: 15 Nov 2024</span>
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Puntuación: 12</span>
                    </div>
                    <div className="text-xs text-gray-600">Depresión moderada</div>
                  </div>
                  <div className="flex space-x-1">
                    <Button className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs px-2 py-1" size="sm">
                      Repetir
                    </Button>
                    <Button className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs px-2 py-1" size="sm">
                      📊 Historial
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">GAD-7</span>
                      <span className="text-xs text-gray-500">Última: 8 Nov 2024</span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Puntuación: 8</span>
                    </div>
                    <div className="text-xs text-gray-600">Ansiedad leve</div>
                  </div>
                  <div className="flex space-x-1">
                    <Button className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs px-2 py-1" size="sm">
                      Repetir
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* New Assessment Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aplicar Nueva Evaluación</label>
              <div className="flex space-x-2">
                <select className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-purple-500">
                  <option value="">Seleccionar escala...</option>
                  <option value="phq9">PHQ-9 (Depresión)</option>
                  <option value="gad7">GAD-7 (Ansiedad)</option>
                  <option value="beck">Beck Depression Inventory</option>
                  <option value="hamilton">Hamilton Anxiety Scale</option>
                  <option value="stai">STAI (Ansiedad Estado-Rasgo)</option>
                </select>
                <Button className="bg-purple-600 hover:bg-purple-700 text-xs px-3 py-1" size="sm">
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Universal Resources Section - Always show */}
        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-medium text-gray-900">📖 Resources - Recursos Psicoeducativos</h3>
            <Button className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1" size="sm">
              + Enviar Recurso
            </Button>
          </div>
          
          <div className="space-y-3">
            {/* Previously Sent Resources */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recursos Enviados</label>
              <div className="space-y-1">
                {/* Mock sent resources - Replace with real data */}
                <div className="flex items-center justify-between p-2 bg-green-50 rounded border">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Técnicas de Respiración</span>
                      <span className="text-xs text-green-600">✓ Enviado</span>
                      <span className="text-xs text-gray-500">12 Nov 2024</span>
                    </div>
                    <div className="text-xs text-gray-600">PDF - Ejercicios de relajación</div>
                  </div>
                  <Button className="bg-green-100 text-green-700 hover:bg-green-200 text-xs px-2 py-1" size="sm">
                    Reenviar
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded border">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Registro de Pensamientos</span>
                      <span className="text-xs text-blue-600">🖨 Impreso</span>
                      <span className="text-xs text-gray-500">10 Nov 2024</span>
                    </div>
                    <div className="text-xs text-gray-600">Hoja de trabajo TCC</div>
                  </div>
                  <Button className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs px-2 py-1" size="sm">
                    Imprimir
                  </Button>
                </div>
              </div>
            </div>

            {/* Send New Resource */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enviar Nuevo Recurso</label>
              <div className="flex space-x-2">
                <select className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500">
                  <option value="">Seleccionar recurso...</option>
                  <option value="breathing">Técnicas de Respiración</option>
                  <option value="thought-record">Registro de Pensamientos</option>
                  <option value="mindfulness">Ejercicios Mindfulness</option>
                  <option value="sleep-hygiene">Higiene del Sueño</option>
                  <option value="anxiety-tips">Tips para Manejo de Ansiedad</option>
                </select>
                <select className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500">
                  <option value="email">Email</option>
                  <option value="print">Imprimir</option>
                  <option value="both">Ambos</option>
                </select>
                <Button className="bg-green-600 hover:bg-green-700 text-xs px-3 py-1" size="sm">
                  Enviar
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Diagnosis */}
        {shouldShowField('diagnosis') && (
        <Card className="p-4 border-l-4 border-l-purple-500">
          <h3 className="text-sm font-medium text-gray-900 mb-3">🎯 Diagnóstico Principal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Diagnóstico CIE-10</label>
              <div className="relative">
                <input
                  type="text"
                  value={diagnosisSearch || consultationData.diagnosis}
                  onChange={(e) => handleDiagnosisSearch(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="Buscar diagnóstico CIE-10..."
                />
                {filteredDiagnoses.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-40 overflow-y-auto">
                    {filteredDiagnoses.map((diagnosis) => (
                      <button
                        key={diagnosis.code}
                        type="button"
                        onClick={() => selectDiagnosis(diagnosis)}
                        className="w-full px-2 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                      >
                        <div className="font-medium text-xs">{diagnosis.code}</div>
                        <div className="text-xs text-gray-600">{diagnosis.description}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Temporalidad</label>
              <select
                value={consultationData.temporality}
                onChange={(e) => setConsultationData(prev => ({ ...prev, temporality: e.target.value as 'acute' | 'chronic' | 'subacute' }))}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 w-full"
              >
                <option value="acute">Agudo</option>
                <option value="chronic">Crónico</option>
                <option value="subacute">Subagudo</option>
              </select>
            </div>
          </div>
        </Card>
        )}

        {/* Prescription */}
        {shouldShowField('medications') && (
        <Card className="p-6 border-l-4 border-l-green-500">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Receta Digital 💊
              </h3>
              {previousPrescription && (consultationData.noteType === 'subsecuente' || consultationData.noteType === 'seguimiento') && (
                <p className="text-sm text-green-600 mt-1">
                  ℹ️ Medicamentos cargados de la receta anterior ({new Date(previousPrescription.created_at).toLocaleDateString()})
                </p>
              )}
            </div>
            <Button 
              type="button"
              onClick={handlePrintPrescription}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
              disabled={consultationData.medications.length === 0 || loading}
            >
              🖨️ Imprimir Receta
            </Button>
          </div>

          {/* Current medications list */}
          {consultationData.medications.length > 0 && (
            <div className="mb-6">
              {consultationData.medications.map((medication, index) => (
                <div key={medication.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{index + 1}.</span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {medication.name} {medication.presentation}
                        </div>
                        <div className="text-sm text-gray-600">({medication.substance})</div>
                        <div className="text-sm text-gray-800">{medication.prescription}</div>
                      </div>
                    </div>
                  </div>
                  <Button 
                    type="button"
                    onClick={() => removeMedication(medication.id)}
                    className="text-red-600 hover:text-red-800 p-2"
                    variant="ghost"
                  >
                    🗑️
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add new medication */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {consultationData.medications.length + 1}. Medicamento
              </label>
              <input
                type="text"
                value={medicationSearch || currentMedication.name}
                onChange={(e) => handleMedicationSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Buscar medicamento..."
              />
              {filteredMedications.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {filteredMedications.map((medication) => (
                    <button
                      key={medication.id}
                      type="button"
                      onClick={() => selectMedication(medication)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                    >
                      <div className="font-medium text-sm">{medication.name}</div>
                      <div className="text-xs text-gray-600">
                        {medication.presentations[0].form} {medication.presentations[0].concentration}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Prescripción</label>
              <input
                type="text"
                value={prescriptionSearch || currentMedication.prescription}
                onChange={(e) => handlePrescriptionSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Buscar prescripción..."
              />
              {filteredPrescriptions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {filteredPrescriptions.map((prescription, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectPrescription(prescription)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100 text-sm"
                    >
                      {prescription}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <Button
              type="button"
              onClick={addMedication}
              disabled={!currentMedication.name || !currentMedication.prescription}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300"
            >
              ➕ Agregar Medicamento
            </Button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Indicaciones Adicionales de la Receta:
            </label>
            <textarea
              value={consultationData.additionalInstructions}
              onChange={(e) => setConsultationData(prev => ({ ...prev, additionalInstructions: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Indicaciones especiales..."
            />
          </div>
        </Card>
        )}

        {/* Next Appointment */}
        <Card className="p-6 border-l-4 border-l-blue-500">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Próxima consulta</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <select
                value={consultationData.nextAppointment.time}
                onChange={(e) => setConsultationData(prev => ({
                  ...prev,
                  nextAppointment: { ...prev.nextAppointment, time: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar tiempo</option>
                <option value="1week">1 semana</option>
                <option value="2weeks">2 semanas</option>
                <option value="1month">1 mes</option>
                <option value="3months">3 meses</option>
                <option value="6months">6 meses</option>
              </select>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-gray-500">ó</span>
            </div>
            <div>
              <input
                type="date"
                value={consultationData.nextAppointment.date}
                onChange={(e) => setConsultationData(prev => ({
                  ...prev,
                  nextAppointment: { ...prev.nextAppointment, date: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6">
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 submit-button"
            disabled={loading}
          >
            {loading ? '⏳ Guardando...' : '💾 Guardar Consulta'}
          </Button>
        </div>
      </form>
    </div>
  );
}