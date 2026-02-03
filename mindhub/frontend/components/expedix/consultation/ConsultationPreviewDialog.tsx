'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';
import type { Patient } from '@/lib/api/expedix-client';

interface ConsultationData {
  consultation_type: string;
  date: string;
  currentCondition: string;
  diagnosis: string;
  vital_signs: {
    height: string;
    weight: string;
    blood_pressure: { systolic: string; diastolic: string };
    temperature: string;
    heartRate: string;
    respiratoryRate: string;
    oxygenSaturation: string;
  };
  physicalExamination: string;
  medications: any[];
  additionalInstructions: string;
  next_appointment: { date: string; time: string };
  mental_exam: {
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

interface ConsultationPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  consultationData: ConsultationData;
  professionalName?: string;
  clinicName?: string;
}

export default function ConsultationPreviewDialog({
  isOpen,
  onClose,
  patient,
  consultationData,
  professionalName = "Dr. Alejandro",
  clinicName = "MindHub Clínica"
}: ConsultationPreviewDialogProps) {
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No especificada';
    try {
      return format(new Date(dateString), 'PPP', { locale: es });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-white border border-gray-200 shadow-xl rounded-xl flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Vista Previa - Consulta Médica</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex items-center space-x-2"
              >
                <PrinterIcon className="h-4 w-4" />
                <span>Imprimir</span>
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Medical Document Preview */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-6 text-black" id="consultation-preview">
            {/* Header */}
            <div className="text-center border-b border-gray-300 pb-4 mb-6">
              <h1 className="text-2xl font-bold text-gray-800">{clinicName}</h1>
              <h2 className="text-xl font-semibold text-gray-700 mt-2">Consulta Médica</h2>
              <p className="text-gray-600 mt-1">{professionalName}</p>
            </div>

            {/* Patient Information */}
            <Card className="p-4 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Datos del Paciente</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Nombre:</span> {patient.first_name} {patient.paternal_last_name} {patient.maternal_last_name}
                </div>
                <div>
                  <span className="font-medium">Fecha de consulta:</span> {formatDate(consultationData.date)}
                </div>
                <div>
                  <span className="font-medium">Edad:</span> {patient.age} años
                </div>
                <div>
                  <span className="font-medium">Tipo de consulta:</span> {consultationData.consultation_type}
                </div>
                <div>
                  <span className="font-medium">Género:</span> {patient.gender === 'male' ? 'Masculino' : 'Femenino'}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {patient.email}
                </div>
              </div>
            </Card>

            {/* Current Condition */}
            {consultationData.currentCondition && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Padecimiento Actual</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{consultationData.currentCondition}</p>
              </Card>
            )}

            {/* Vital Signs */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Signos Vitales</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {consultationData.vital_signs.height && (
                  <div>
                    <span className="font-medium">Altura:</span> {consultationData.vital_signs.height} cm
                  </div>
                )}
                {consultationData.vital_signs.weight && (
                  <div>
                    <span className="font-medium">Peso:</span> {consultationData.vital_signs.weight} kg
                  </div>
                )}
                {consultationData.vital_signs.temperature && (
                  <div>
                    <span className="font-medium">Temperatura:</span> {consultationData.vital_signs.temperature}°C
                  </div>
                )}
                {(consultationData.vital_signs.blood_pressure?.systolic || consultationData.vital_signs.blood_pressure?.diastolic) && (
                  <div>
                    <span className="font-medium">Presión arterial:</span> {consultationData.vital_signs.blood_pressure?.systolic}/{consultationData.vital_signs.blood_pressure?.diastolic} mmHg
                  </div>
                )}
                {consultationData.vital_signs.heartRate && (
                  <div>
                    <span className="font-medium">Frecuencia cardíaca:</span> {consultationData.vital_signs.heartRate} bpm
                  </div>
                )}
                {consultationData.vital_signs.oxygenSaturation && (
                  <div>
                    <span className="font-medium">Saturación O2:</span> {consultationData.vital_signs.oxygenSaturation}%
                  </div>
                )}
              </div>
            </Card>

            {/* Physical Examination */}
            {consultationData.physicalExamination && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Exploración Física</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{consultationData.physicalExamination}</p>
              </Card>
            )}

            {/* Diagnosis */}
            {consultationData.diagnosis && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Diagnóstico</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{consultationData.diagnosis}</p>
              </Card>
            )}

            {/* Mental Exam */}
            {(consultationData.mental_exam && Object.values(consultationData.mental_exam).some(v => v && v.trim())) && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">🧠 Examen Mental</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {consultationData.mental_exam.descripcionInspeccion && (
                    <div className="col-span-2">
                      <span className="font-medium">Descripción General:</span> {consultationData.mental_exam.descripcionInspeccion}
                    </div>
                  )}
                  {consultationData.mental_exam.apariencia && (
                    <div>
                      <span className="font-medium">Apariencia:</span> {consultationData.mental_exam.apariencia}
                    </div>
                  )}
                  {consultationData.mental_exam.actitud && (
                    <div>
                      <span className="font-medium">Actitud:</span> {consultationData.mental_exam.actitud}
                    </div>
                  )}
                  {consultationData.mental_exam.conciencia && (
                    <div>
                      <span className="font-medium">Conciencia:</span> {consultationData.mental_exam.conciencia}
                    </div>
                  )}
                  {consultationData.mental_exam.orientacion && (
                    <div>
                      <span className="font-medium">Orientación:</span> {consultationData.mental_exam.orientacion}
                    </div>
                  )}
                  {consultationData.mental_exam.atencion && (
                    <div>
                      <span className="font-medium">Atención:</span> {consultationData.mental_exam.atencion}
                    </div>
                  )}
                  {consultationData.mental_exam.lenguaje && (
                    <div>
                      <span className="font-medium">Lenguaje:</span> {consultationData.mental_exam.lenguaje}
                    </div>
                  )}
                  {consultationData.mental_exam.afecto && (
                    <div>
                      <span className="font-medium">Afecto:</span> {consultationData.mental_exam.afecto}
                    </div>
                  )}
                  {consultationData.mental_exam.sensopercepcion && (
                    <div>
                      <span className="font-medium">Sensopercepción:</span> {consultationData.mental_exam.sensopercepcion}
                    </div>
                  )}
                  {consultationData.mental_exam.memoria && (
                    <div>
                      <span className="font-medium">Memoria:</span> {consultationData.mental_exam.memoria}
                    </div>
                  )}
                  {consultationData.mental_exam.pensamientoPrincipal && (
                    <div className="col-span-2">
                      <span className="font-medium">Pensamiento:</span> {consultationData.mental_exam.pensamientoPrincipal}
                    </div>
                  )}
                  {consultationData.mental_exam.pensamientoDetalles && (
                    <div className="col-span-2">
                      <span className="font-medium">Detalles del Pensamiento:</span> {consultationData.mental_exam.pensamientoDetalles}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Medications */}
            {consultationData.medications && consultationData.medications.length > 0 && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Medicamentos Recetados</h3>
                <div className="space-y-2">
                  {consultationData.medications.map((medication: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-3">
                      <p className="font-medium">{medication.name}</p>
                      <p className="text-sm text-gray-600">
                        Dosis: {medication.dosage} | Frecuencia: {medication.frequency} | Duración: {medication.duration}
                      </p>
                      {medication.instructions && (
                        <p className="text-sm text-gray-600">Instrucciones: {medication.instructions}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Additional Instructions */}
            {consultationData.additionalInstructions && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Instrucciones Adicionales</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{consultationData.additionalInstructions}</p>
              </Card>
            )}

            {/* Next Appointment */}
            {(consultationData.next_appointment.date || consultationData.next_appointment.time) && (
              <Card className="p-4 bg-blue-50">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Próxima Cita</h3>
                <div className="text-sm">
                  {consultationData.next_appointment.date && (
                    <div>
                      <span className="font-medium">Fecha:</span> {formatDate(consultationData.next_appointment.date)}
                    </div>
                  )}
                  {consultationData.next_appointment.time && (
                    <div>
                      <span className="font-medium">Hora:</span> {formatTime(consultationData.next_appointment.time)}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 border-t border-gray-300 pt-4 mt-8">
              <p>Documento generado el {format(new Date(), 'PPPp', { locale: es })}</p>
              <p className="mt-2">
                <span className="font-medium">{professionalName}</span> | {clinicName}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handlePrint}>
              <PrinterIcon className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}