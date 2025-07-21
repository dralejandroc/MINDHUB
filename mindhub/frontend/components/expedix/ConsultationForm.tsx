'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { expedixApi } from '@/lib/api/expedix-client';

interface Patient {
  id: string;
  firstName: string;
  paternalLastName: string;
  maternalLastName: string;
  birthDate: string;
  age: number;
  gender: 'masculine' | 'feminine';
  email: string;
  cellPhone: string;
}

interface Medication {
  id: number;
  name: string;
  presentation: string;
  substance: string;
  prescription: string;
}

interface ConsultationData {
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
}

interface ConsultationFormProps {
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

const CIE10_CODES = [
  { code: 'F32.0', description: 'Episodio depresivo leve' },
  { code: 'F32.1', description: 'Episodio depresivo moderado' },
  { code: 'F32.2', description: 'Episodio depresivo grave sin síntomas psicóticos' },
  { code: 'F41.0', description: 'Trastorno de pánico' },
  { code: 'F41.1', description: 'Trastorno de ansiedad generalizada' },
  { code: 'F43.1', description: 'Trastorno de estrés postraumático' }
];

export default function ConsultationForm({ patient, onSaveConsultation, onCancel }: ConsultationFormProps) {
  const [consultationData, setConsultationData] = useState<ConsultationData>({
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
    nextAppointment: { time: '', date: '' }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Load last prescription on component mount
  useEffect(() => {
    const loadLastPrescription = async () => {
      try {
        const lastPrescription = await expedixApi.getLastPrescription(patient.id);
        if (lastPrescription.data) {
          // Pre-fill medications from last prescription for editing
          setConsultationData(prev => ({
            ...prev,
            medications: lastPrescription.data.medications.map((med: any, index: number) => ({
              ...med,
              id: Date.now() + index
            })),
            diagnosis: lastPrescription.data.diagnosis || '',
            additionalInstructions: lastPrescription.data.notes || ''
          }));
        }
      } catch (error) {
        console.log('No previous prescription found or error loading:', error);
      }
    };

    loadLastPrescription();
  }, [patient.id]);

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
        link.download = `receta_${patient.firstName}_${patient.paternalLastName}_${new Date().toISOString().split('T')[0]}.pdf`;
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
              {patient.firstName.charAt(0)}{patient.paternalLastName.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {patient.firstName} {patient.paternalLastName} {patient.maternalLastName}
              </h2>
              <p className="text-sm text-gray-600">
                🗓️ {patient.birthDate} | Edad: {patient.age} años | Género: {patient.gender === 'masculine' ? 'Masculino' : 'Femenino'}
              </p>
              <p className="text-sm text-gray-600">
                Email: {patient.email} | Tel: {patient.cellPhone}
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📅 Fecha de la consulta *
              </label>
              <input
                type="date"
                value={consultationData.date}
                onChange={(e) => setConsultationData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Consultorio del paciente *
              </label>
              <select
                value={consultationData.patientOffice}
                onChange={(e) => setConsultationData(prev => ({ ...prev, patientOffice: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar consultorio</option>
                <option value="office1">Consultorio 1</option>
                <option value="office2">Consultorio 2</option>
                <option value="office3">Consultorio 3</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Padecimiento Actual:
            </label>
            <textarea
              value={consultationData.currentCondition}
              onChange={(e) => setConsultationData(prev => ({ ...prev, currentCondition: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Descripción del padecimiento actual..."
            />
          </div>
        </Card>

        {/* Vital Signs */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Signos Vitales</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Altura (m)</label>
              <input
                type="number"
                step="0.01"
                value={consultationData.vitalSigns.height}
                onChange={(e) => setConsultationData(prev => ({
                  ...prev,
                  vitalSigns: { ...prev.vitalSigns, height: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                value={consultationData.vitalSigns.weight}
                onChange={(e) => setConsultationData(prev => ({
                  ...prev,
                  vitalSigns: { ...prev.vitalSigns, weight: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">T.A.</label>
              <div className="flex space-x-1">
                <input
                  type="number"
                  placeholder="Sist"
                  value={consultationData.vitalSigns.bloodPressure.systolic}
                  onChange={(e) => setConsultationData(prev => ({
                    ...prev,
                    vitalSigns: { 
                      ...prev.vitalSigns, 
                      bloodPressure: { ...prev.vitalSigns.bloodPressure, systolic: e.target.value }
                    }
                  }))}
                  className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <span className="self-center">/</span>
                <input
                  type="number"
                  placeholder="Diast"
                  value={consultationData.vitalSigns.bloodPressure.diastolic}
                  onChange={(e) => setConsultationData(prev => ({
                    ...prev,
                    vitalSigns: { 
                      ...prev.vitalSigns, 
                      bloodPressure: { ...prev.vitalSigns.bloodPressure, diastolic: e.target.value }
                    }
                  }))}
                  className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                value={consultationData.vitalSigns.temperature}
                onChange={(e) => setConsultationData(prev => ({
                  ...prev,
                  vitalSigns: { ...prev.vitalSigns, temperature: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">F.C.</label>
              <input
                type="number"
                value={consultationData.vitalSigns.heartRate}
                onChange={(e) => setConsultationData(prev => ({
                  ...prev,
                  vitalSigns: { ...prev.vitalSigns, heartRate: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">F.R.</label>
              <input
                type="number"
                value={consultationData.vitalSigns.respiratoryRate}
                onChange={(e) => setConsultationData(prev => ({
                  ...prev,
                  vitalSigns: { ...prev.vitalSigns, respiratoryRate: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">O2 (%)</label>
              <input
                type="number"
                value={consultationData.vitalSigns.oxygenSaturation}
                onChange={(e) => setConsultationData(prev => ({
                  ...prev,
                  vitalSigns: { ...prev.vitalSigns, oxygenSaturation: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Physical Examination */}
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

        {/* Diagnosis */}
        <Card className="p-6">
          <div className="bg-purple-50 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-purple-800 mb-2">Diagnóstico Principal</h3>
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <label className="block text-sm text-purple-700 mb-1">1. Diagnóstico CIE-10</label>
                <div className="relative">
                  <input
                    type="text"
                    value={diagnosisSearch || consultationData.diagnosis}
                    onChange={(e) => handleDiagnosisSearch(e.target.value)}
                    className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    placeholder="Buscar diagnóstico CIE-10..."
                  />
                  {filteredDiagnoses.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {filteredDiagnoses.map((diagnosis) => (
                        <button
                          key={diagnosis.code}
                          type="button"
                          onClick={() => selectDiagnosis(diagnosis)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                        >
                          <div className="font-medium text-sm">{diagnosis.code}</div>
                          <div className="text-xs text-gray-600">{diagnosis.description}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm text-purple-700 mb-1">Temporalidad</label>
                <select
                  value={consultationData.temporality}
                  onChange={(e) => setConsultationData(prev => ({ ...prev, temporality: e.target.value as 'acute' | 'chronic' | 'subacute' }))}
                  className="px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="acute">Agudo</option>
                  <option value="chronic">Crónico</option>
                  <option value="subacute">Subagudo</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Prescription */}
        <Card className="p-6 border-l-4 border-l-green-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Receta Digital 💊
            </h3>
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
            className="bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? '⏳ Guardando...' : '💾 Guardar Consulta'}
          </Button>
        </div>
      </form>
    </div>
  );
}