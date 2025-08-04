"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert } from '@/components/ui/Alert';
import { ClinimetrixRenderer } from '@/components/ClinimetrixPro/ClinimetrixRenderer';
import { clinimetrixProClient } from '@/lib/api/clinimetrix-pro-client';
import type { ClinimetrixProTemplate } from '@/lib/api/clinimetrix-pro-client';

export default function NewAssessmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');
  const patientId = searchParams.get('patientId');
  const mode = (searchParams.get('mode') || 'professional') as 'professional' | 'patient';
  
  const [template, setTemplate] = useState<ClinimetrixProTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    } else {
      setError('No se especificó una escala para aplicar');
      setLoading(false);
    }
  }, [templateId]);

  const loadTemplate = async () => {
    if (!templateId) return;
    
    try {
      setLoading(true);
      const templateData = await clinimetrixProClient.templates.getById(templateId);
      setTemplate(templateData);
      setError(null);
    } catch (error) {
      console.error('Error loading template:', error);
      setError('Error al cargar la escala. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (assessmentId: string) => {
    // Redirect to results page
    router.push(`/hubs/clinimetrix/assessment/${assessmentId}/results`);
  };

  const handleCancel = () => {
    if (confirm('¿Está seguro de que desea cancelar la evaluación? Se perderán todos los datos no guardados.')) {
      router.back();
    }
  };

  const handleSave = async (assessmentId: string) => {
    // Show success message
    alert('Evaluación guardada exitosamente. Puede continuar más tarde.');
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-primary-200 rounded-lg w-64"></div>
            <div className="h-96 bg-white rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen gradient-background p-6">
        <div className="max-w-4xl mx-auto">
          <Alert variant="error" className="mb-4">
            {error || 'Error al cargar la escala'}
          </Alert>
          <button
            onClick={() => router.back()}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Volver al catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <button
            onClick={() => router.back()}
            className="text-primary-600 hover:text-primary-700 font-medium mb-4 inline-flex items-center gap-2"
          >
            ← Volver
          </button>
          
          <h1 className="text-2xl font-heading font-bold text-dark-green mb-2">
            Nueva Evaluación: {template.metadata.name}
          </h1>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>📋 {template.structure.totalItems} ítems</span>
            <span>⏱️ {template.metadata.estimatedDurationMinutes} minutos aprox.</span>
            <span>👤 Modo: {mode === 'professional' ? 'Profesional' : 'Paciente'}</span>
            {patientId && <span>🏥 Paciente ID: {patientId}</span>}
          </div>
        </div>

        {/* Main Content */}
        <ClinimetrixRenderer
          templateId={templateId}
          patientId={patientId || undefined}
          administratorId="current-user-id" // This should come from auth context
          mode="new"
          onComplete={handleComplete}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}