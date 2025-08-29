/**
 * COMPONENTE OPTIMIZADO - ConsultationNotes
 * Nuevo componente usando Clean Architecture para mejor performance
 * Reemplaza al componente original de 2762 líneas
 */

'use client';

import React, { Suspense, lazy } from 'react';
import { Patient } from '@/lib/api/expedix-client';
import { ConsultationData } from './consultation';

// Lazy loading del componente principal para mejor performance inicial
const ConsultationForm = lazy(() => import('./consultation/components/ConsultationForm'));

interface ConsultationNotesProps {
  patient: Patient;
  onSaveConsultation: (data: ConsultationData) => void;
  onCancel: () => void;
}

export default function ConsultationNotesOptimized({ 
  patient, 
  onSaveConsultation, 
  onCancel 
}: ConsultationNotesProps) {
  return (
    <div className="consultation-notes-container">
      <Suspense 
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="space-y-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600">Cargando formulario de consulta...</p>
            </div>
          </div>
        }
      >
        <ConsultationForm
          patient={patient}
          onSave={onSaveConsultation}
          onCancel={onCancel}
        />
      </Suspense>
    </div>
  );
}