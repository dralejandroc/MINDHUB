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
  PencilIcon
} from '@heroicons/react/24/outline';
import { expedixApi, type Patient, type Prescription } from '@/lib/api/expedix-client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ConsultationPreviewDialog from './ConsultationPreviewDialog';

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
  const [loading, setLoading] = useState(true);
  const [currentConsultation, setCurrentConsultation] = useState<Consultation | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  
  // Navigation states
  const [sidebarView, setSidebarView] = useState<SidebarView>('consultations');
  const [currentConsultationIndex, setCurrentConsultationIndex] = useState(0);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  
  // Form states
  const [consultationData, setConsultationData] = useState({
    noteType: 'Consulta General',
    date: new Date().toISOString().split('T')[0],
    currentCondition: '',
    diagnosis: '',
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
      const response = await fetch(`/api/agenda/appointments/next?patientId=${patient.id}`);
      if (response.ok) {
        const data = await response.json();
        setNextAppointment(data.data);
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
  };

  const handleSaveConsultation = async () => {
    if (!currentConsultation) return;
    
    try {
      const updateData = {
        ...consultationData,
        status: 'completed',
        updatedAt: new Date().toISOString()
      };
      
      await expedixApi.updateConsultation(currentConsultation.id, updateData);
      
      // Refresh consultations list
      await loadPatientData();
      
      if (onSave) {
        onSave(updateData);
      }
      
    } catch (error) {
      console.error('Error saving consultation:', error);
    }
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
              <h2 className="font-semibold text-gray-900">
                {patient.first_name} {patient.paternal_last_name}
              </h2>
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
                <span className="text-sm text-gray-500">{prescriptions.length}</span>
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
              <Button variant="primary" onClick={handleSaveConsultation}>
                Guardar consulta
              </Button>
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

            {/* Diagnosis */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Diagnóstico</h3>
              <textarea
                value={consultationData.diagnosis}
                onChange={(e) => setConsultationData(prev => ({ 
                  ...prev, 
                  diagnosis: e.target.value 
                }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ingresa el diagnóstico..."
              />
            </Card>

            {/* Mental Exam */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">🧠 Examen Mental</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción General/Inspección
                  </label>
                  <textarea
                    value={consultationData.mentalExam.descripcionInspeccion}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      mentalExam: { ...prev.mentalExam, descripcionInspeccion: e.target.value }
                    }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Descripción general del estado mental..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apariencia
                  </label>
                  <textarea
                    value={consultationData.mentalExam.apariencia}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      mentalExam: { ...prev.mentalExam, apariencia: e.target.value }
                    }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Apariencia física y presentación..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actitud
                  </label>
                  <textarea
                    value={consultationData.mentalExam.actitud}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      mentalExam: { ...prev.mentalExam, actitud: e.target.value }
                    }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Actitud durante la entrevista..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conciencia
                  </label>
                  <textarea
                    value={consultationData.mentalExam.conciencia}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      mentalExam: { ...prev.mentalExam, conciencia: e.target.value }
                    }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Estado de conciencia..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orientación
                  </label>
                  <textarea
                    value={consultationData.mentalExam.orientacion}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      mentalExam: { ...prev.mentalExam, orientacion: e.target.value }
                    }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Orientación temporal, espacial y personal..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Atención
                  </label>
                  <textarea
                    value={consultationData.mentalExam.atencion}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      mentalExam: { ...prev.mentalExam, atencion: e.target.value }
                    }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Capacidad de atención y concentración..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lenguaje
                  </label>
                  <textarea
                    value={consultationData.mentalExam.lenguaje}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      mentalExam: { ...prev.mentalExam, lenguaje: e.target.value }
                    }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Características del lenguaje..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Afecto
                  </label>
                  <textarea
                    value={consultationData.mentalExam.afecto}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      mentalExam: { ...prev.mentalExam, afecto: e.target.value }
                    }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Estado emocional y afectivo..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sensopercepción
                  </label>
                  <textarea
                    value={consultationData.mentalExam.sensopercepcion}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      mentalExam: { ...prev.mentalExam, sensopercepcion: e.target.value }
                    }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Alucinaciones, ilusiones..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Memoria
                  </label>
                  <textarea
                    value={consultationData.mentalExam.memoria}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      mentalExam: { ...prev.mentalExam, memoria: e.target.value }
                    }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Memoria reciente, remota, de trabajo..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pensamiento (Contenido Principal)
                  </label>
                  <textarea
                    value={consultationData.mentalExam.pensamientoPrincipal}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      mentalExam: { ...prev.mentalExam, pensamientoPrincipal: e.target.value }
                    }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ideas principales, temas dominantes..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pensamiento (Detalles y Observaciones)
                  </label>
                  <textarea
                    value={consultationData.mentalExam.pensamientoDetalles}
                    onChange={(e) => setConsultationData(prev => ({ 
                      ...prev, 
                      mentalExam: { ...prev.mentalExam, pensamientoDetalles: e.target.value }
                    }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Curso del pensamiento, asociaciones, coherencia..."
                  />
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
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <ConsultationPreviewDialog
        isOpen={showPreviewDialog}
        onClose={() => setShowPreviewDialog(false)}
        patient={patient}
        consultationData={consultationData}
        professionalName="Dr. Alejandro"
        clinicName="MindHub Clínica"
      />
    </div>
  );
}