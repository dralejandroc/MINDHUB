'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PrinterIcon } from '@heroicons/react/24/outline';
import type { Patient } from '@/lib/api/expedix-client';
import { ConsultationData } from '../../../types/expedix-models';
import { cleanStructuredData, generateNarrativeReact, MentalExamNarrative } from '@/lib/utils/narrative-engine';

interface ConsultationPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  consultationData: ConsultationData;
  sectionModes?: Record<string, 'text' | 'canvas' | null>;
  sectionFreeText?: Record<string, string>;
  sectionCanvasData?: Record<string, string>;
  professionalName?: string;
  clinicName?: string;
}

// Map from section keys to object keys in consultationData
const SECTION_MAP: Record<string, { title: string; dataKey: keyof ConsultationData; isMentalExam?: boolean }> = {
  currentCondition:            { title: 'Padecimiento Actual',          dataKey: 'current_condition' as any },
  physicalExamination:         { title: 'Exploración Física',           dataKey: 'physical_examination' as any },
  diagnosis:                   { title: 'Diagnóstico',                  dataKey: 'diagnosis' as any },
  sintomatologiaActual:        { title: 'Sintomatología Actual',        dataKey: 'sintomatologia_actual' },
  antecedentesMedicos:         { title: 'Antecedentes Médicos',         dataKey: 'antecedentes_medicos' },
  antecedentesPsiquiatricos:   { title: 'Antecedentes Psiquiátricos',   dataKey: 'antecedentes_psiquiatricos' },
  usoSustancias:               { title: 'Uso de Sustancias',            dataKey: 'uso_sustancias' },
  historiaRiesgo:              { title: 'Historia de Riesgo',           dataKey: 'historia_riesgo' },
  historiaPersonal:            { title: 'Historia Personal',            dataKey: 'historia_personal' },
  historiaPersonalSocial:      { title: 'Historia Personal y Social',   dataKey: 'historia_personal_social' },
  antecedentesHeredofamiliares:{ title: 'Antecedentes Heredofamiliares',dataKey: 'antecedentes_heredofamiliares' },
  estadoInicio:                { title: 'Estado al Inicio',             dataKey: 'estado_inicio' },
  contenidoSesion:             { title: 'Contenido de la Sesión',       dataKey: 'contenido_sesion' },
  planManejo:                  { title: 'Plan de Manejo',               dataKey: 'plan_manejo' },
  analisisConclusiones:        { title: 'Análisis y Conclusiones',      dataKey: 'analisis_conclusiones' },
  formulacionCaso:             { title: 'Formulación de Caso',          dataKey: 'formulacion_caso' },
  redApoyo:                    { title: 'Red de Apoyo',                 dataKey: 'red_apoyo' },
  intervencionCrisis:          { title: 'Intervención en Crisis',       dataKey: 'intervencion_crisis' },
  mentalExam:                  { title: 'Examen Mental',                dataKey: 'mental_exam', isMentalExam: true },
};

const formatDate = (dateString: string) => {
  if (!dateString) return null;
  try {
    return format(new Date(dateString), 'PPP', { locale: es });
  } catch {
    return dateString;
  }
};

export default function ConsultationPreviewDialog({
  isOpen,
  onClose,
  patient,
  consultationData,
  sectionModes = {},
  sectionFreeText = {},
  sectionCanvasData = {},
  professionalName = 'Dr. Alejandro',
  clinicName = 'MindHub Clínica',
}: ConsultationPreviewDialogProps) {

  const handlePrint = () => {
    document.body.classList.add('consultation-printing');
    window.print();
    const cleanup = () => {
      document.body.classList.remove('consultation-printing');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
  };

  const renderSection = (
    sectionKey: string,
    config: { title: string; dataKey: Extract<keyof ConsultationData, string>; isMentalExam?: boolean }
  ) => {
    const mode = sectionModes[sectionKey] ?? null;
    const freeText = sectionFreeText[sectionKey];
    const canvasData = sectionCanvasData[sectionKey];
    const rawData = consultationData[config.dataKey];
    const cleanedData = cleanStructuredData(rawData);

    // Nothing to render
    if (mode === 'text' && !freeText?.trim()) return null;
    if (mode === 'canvas' && !canvasData) return null;
    if (mode === null && !cleanedData) return null;

    return (
      <Card key={sectionKey} className="p-4 bg-white border border-gray-200">
        <h3 className="text-base font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
          {config.title}
        </h3>

        {mode === 'text' && (
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{freeText}</p>
        )}

        {mode === 'canvas' && (
          <div className="border border-gray-200 rounded p-2 bg-gray-50 flex justify-center">
            <img src={canvasData} alt={`Dibujo – ${config.title}`} className="max-w-full h-auto" />
          </div>
        )}

        {mode === null && config.isMentalExam && (
          <MentalExamNarrative data={cleanedData} />
        )}

        {mode === null && !config.isMentalExam && (
          <div className="text-sm text-gray-700">
            {generateNarrativeReact(cleanedData)}
          </div>
        )}
      </Card>
    );
  };

  const consultationDate = formatDate(consultationData.consultation_date);
  const patientName = [patient.first_name, patient.paternal_last_name, patient.maternal_last_name]
    .filter(Boolean)
    .join(' ');

  const hasVitalSigns = consultationData.vital_signs &&
    Object.values(consultationData.vital_signs).some(v =>
      v && typeof v !== 'object' ? true : (typeof v === 'object' && v !== null && Object.values(v as any).some(Boolean))
    );

  const hasPrescriptions = consultationData.prescriptions?.length > 0;
  const hasAdditionalInstructions = !!consultationData.additional_instructions?.trim();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-white border border-gray-200 shadow-xl rounded-xl flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span>Vista Previa — Consulta Médica</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-2 print:hidden"
            >
              <PrinterIcon className="h-4 w-4" />
              <span>Imprimir</span>
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* ── Scrollable preview area ── */}
        <div className="flex-1 overflow-y-auto px-1 py-2" id="consultation-print-wrapper">
          <div className="space-y-4 text-black" id="consultation-preview">

            {/* Header */}
            <div className="text-center border-b border-gray-300 pb-4">
              <h1 className="text-xl font-bold text-gray-800">{clinicName}</h1>
              <h2 className="text-lg font-semibold text-gray-700 mt-1">Nota de Consulta Médica</h2>
              {professionalName && <p className="text-gray-600 text-sm mt-1">{professionalName}</p>}
            </div>

            {/* Patient data */}
            <Card className="p-4 bg-gray-50 border border-gray-200">
              <h3 className="text-base font-semibold text-gray-800 mb-3">Datos del Paciente</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
                <div className="flex gap-2">
                  <span className="font-medium text-gray-500 min-w-[100px]">Nombre:</span>
                  <span className="text-gray-800">{patientName}</span>
                </div>
                {consultationDate && (
                  <div className="flex gap-2">
                    <span className="font-medium text-gray-500 min-w-[120px]">Fecha de consulta:</span>
                    <span className="text-gray-800">{consultationDate}</span>
                  </div>
                )}
                {patient.age && (
                  <div className="flex gap-2">
                    <span className="font-medium text-gray-500 min-w-[100px]">Edad:</span>
                    <span className="text-gray-800">{patient.age} años</span>
                  </div>
                )}
                {consultationData.consultation_type && (
                  <div className="flex gap-2">
                    <span className="font-medium text-gray-500 min-w-[120px]">Tipo de consulta:</span>
                    <span className="text-gray-800">{consultationData.consultation_type}</span>
                  </div>
                )}
                {patient.gender && (
                  <div className="flex gap-2">
                    <span className="font-medium text-gray-500 min-w-[100px]">Género:</span>
                    <span className="text-gray-800">
                      {patient.gender === 'male' ? 'Masculino' : patient.gender === 'female' ? 'Femenino' : patient.gender}
                    </span>
                  </div>
                )}
                {patient.email && (
                  <div className="flex gap-2">
                    <span className="font-medium text-gray-500 min-w-[120px]">Email:</span>
                    <span className="text-gray-800">{patient.email}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Vital signs */}
            {hasVitalSigns && (
              <Card className="p-4 border border-gray-200">
                <h3 className="text-base font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                  Signos Vitales
                </h3>
                <div className="grid grid-cols-3 gap-x-6 gap-y-1.5 text-sm">
                  {consultationData.vital_signs.height && (
                    <div className="flex gap-2">
                      <span className="font-medium text-gray-500">Talla:</span>
                      <span>{consultationData.vital_signs.height} cm</span>
                    </div>
                  )}
                  {consultationData.vital_signs.weight && (
                    <div className="flex gap-2">
                      <span className="font-medium text-gray-500">Peso:</span>
                      <span>{consultationData.vital_signs.weight} kg</span>
                    </div>
                  )}
                  {consultationData.vital_signs.temperature && (
                    <div className="flex gap-2">
                      <span className="font-medium text-gray-500">Temperatura:</span>
                      <span>{consultationData.vital_signs.temperature} °C</span>
                    </div>
                  )}
                  {consultationData.vital_signs.blood_pressure?.systolic && (
                    <div className="flex gap-2">
                      <span className="font-medium text-gray-500">T/A:</span>
                      <span>
                        {consultationData.vital_signs.blood_pressure.systolic}/
                        {consultationData.vital_signs.blood_pressure.diastolic} mmHg
                      </span>
                    </div>
                  )}
                  {consultationData.vital_signs.heartRate && (
                    <div className="flex gap-2">
                      <span className="font-medium text-gray-500">FC:</span>
                      <span>{consultationData.vital_signs.heartRate} lpm</span>
                    </div>
                  )}
                  {consultationData.vital_signs.oxygenSaturation && (
                    <div className="flex gap-2">
                      <span className="font-medium text-gray-500">SpO₂:</span>
                      <span>{consultationData.vital_signs.oxygenSaturation} %</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Dynamic sections */}
            {Object.entries(SECTION_MAP).map(([key, config]) =>
              renderSection(key, config as any)
            )}

            {/* Prescriptions */}
            {hasPrescriptions && (
              <Card className="p-4 border border-gray-200">
                <h3 className="text-base font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                  Medicamentos Recetados
                </h3>
                <div className="space-y-3">
                  {consultationData.prescriptions.map((med: any, i: number) => (
                    <div key={i} className="border-l-4 border-blue-400 pl-3 py-0.5">
                      <p className="font-semibold text-gray-800 text-sm">{med.name}</p>
                      <div className="text-sm text-gray-600 space-x-2 mt-0.5">
                        {med.dosage && <span>Dosis: {med.dosage}</span>}
                        {med.frequency && <span>· Frecuencia: {med.frequency}</span>}
                        {med.duration && <span>· Duración: {med.duration}</span>}
                      </div>
                      {med.instructions && (
                        <p className="text-sm text-gray-500 mt-0.5">Indicaciones: {med.instructions}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Additional instructions */}
            {hasAdditionalInstructions && (
              <Card className="p-4 border border-gray-200">
                <h3 className="text-base font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                  Instrucciones Adicionales
                </h3>
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {consultationData.additional_instructions}
                </p>
              </Card>
            )}

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-4 mt-6">
              <p>Documento generado el {format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}</p>
              <p className="mt-1 font-medium text-gray-600">{professionalName} · {clinicName}</p>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
