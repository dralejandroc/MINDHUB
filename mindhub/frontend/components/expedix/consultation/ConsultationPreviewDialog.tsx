'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';
import type { Patient } from '@/lib/api/expedix-client';

interface ConsultationData {
  noteType: string;
  date: string;
  currentCondition: string;
  diagnosis: string;
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
        <div className="space-y-6 p-4 bg-white text-black print:p-0" id="consultation-preview">
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
                <span className="font-medium">Tipo de consulta:</span> {consultationData.noteType}
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
              {consultationData.vitalSigns.height && (
                <div>
                  <span className="font-medium">Altura:</span> {consultationData.vitalSigns.height} cm
                </div>
              )}
              {consultationData.vitalSigns.weight && (
                <div>
                  <span className="font-medium">Peso:</span> {consultationData.vitalSigns.weight} kg
                </div>
              )}
              {consultationData.vitalSigns.temperature && (
                <div>
                  <span className="font-medium">Temperatura:</span> {consultationData.vitalSigns.temperature}°C
                </div>
              )}
              {(consultationData.vitalSigns.bloodPressure.systolic || consultationData.vitalSigns.bloodPressure.diastolic) && (
                <div>
                  <span className="font-medium">Presión arterial:</span> {consultationData.vitalSigns.bloodPressure.systolic}/{consultationData.vitalSigns.bloodPressure.diastolic} mmHg
                </div>
              )}
              {consultationData.vitalSigns.heartRate && (
                <div>
                  <span className="font-medium">Frecuencia cardíaca:</span> {consultationData.vitalSigns.heartRate} bpm
                </div>
              )}
              {consultationData.vitalSigns.oxygenSaturation && (
                <div>
                  <span className="font-medium">Saturación O2:</span> {consultationData.vitalSigns.oxygenSaturation}%
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
          {(consultationData.nextAppointment.date || consultationData.nextAppointment.time) && (
            <Card className="p-4 bg-blue-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Próxima Cita</h3>
              <div className="text-sm">
                {consultationData.nextAppointment.date && (
                  <div>
                    <span className="font-medium">Fecha:</span> {formatDate(consultationData.nextAppointment.date)}
                  </div>
                )}
                {consultationData.nextAppointment.time && (
                  <div>
                    <span className="font-medium">Hora:</span> {formatTime(consultationData.nextAppointment.time)}
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