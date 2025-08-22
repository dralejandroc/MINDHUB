'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, DocumentTextIcon, ChartBarIcon, BeakerIcon, CheckCircleIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { ClinimetrixProAssessmentModal } from '@/components/ClinimetrixPro/ClinimetrixProAssessmentModal';
import { useSupabase } from '@/components/providers/supabase-provider';

interface ScaleDocumentation {
  id: string;
  metadata: {
    name: string;
    abbreviation: string;
    version: string;
    lastUpdated?: string;
    category?: string;
    description?: string;
  };
  documentation?: {
    purpose?: string;
    clinicalUtility?: string;
    theoreticalFramework?: string;
    psychometricProperties?: {
      normativeData?: any;
      demographics?: any;
      populationNorms?: any;
      reliability?: {
        cronbachAlpha?: string | number;
        testRetest?: string | number;
        interRater?: string | number;
      };
      validity?: any;
      sensitivity?: string | number;
      specificity?: string | number;
      positivePredicativeValue?: string | number;
    };
    version?: string;
    lastUpdated?: string;
  };
}

export default function ScaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { supabase, user } = useSupabase();
  const scaleId = params?.scaleId as string;
  
  const [scaleData, setScaleData] = useState<ScaleDocumentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);

  useEffect(() => {
    if (user) {
      loadScaleDetails();
    } else if (user === null) {
      // User is not authenticated, redirect to login
      router.push('/auth/sign-in?redirectTo=' + encodeURIComponent(window.location.pathname));
    }
  }, [scaleId, user, router]);

  const loadScaleDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`/api/clinimetrix-pro/templates/${scaleId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to load scale details');
      }
      
      const result = await response.json();
      setScaleData(result.data || result);
      
    } catch (err) {
      console.error('Error loading scale:', err);
      setError('Error al cargar los detalles de la escala');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyScale = () => {
    setShowAssessment(true);
  };

  const handleAssessmentComplete = (results: any) => {
    console.log('Assessment completed:', results);
    setShowAssessment(false);
    // Could redirect to results page or show success message
  };

  const handleAssessmentExit = () => {
    setShowAssessment(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !scaleData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600">{error || 'No se encontró la escala'}</p>
            <button
              onClick={() => router.push('/hubs/clinimetrix')}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Volver al catálogo
            </button>
          </div>
        </div>
      </div>
    );
  }

  const metadata = scaleData.metadata || {};
  const doc = scaleData.documentation || {};
  const psychometric = doc.psychometricProperties || {};
  const reliability = psychometric.reliability || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-teal-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/hubs/clinimetrix')}
                className="p-2 hover:bg-teal-50 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6 text-teal-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  {metadata.abbreviation}
                </h1>
                <p className="text-gray-600 mt-1">{metadata.name}</p>
              </div>
            </div>
            <button
              onClick={handleApplyScale}
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Aplicar Escala
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content - Documentation */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Purpose & Clinical Utility */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-teal-100">
              <div className="flex items-center mb-4">
                <DocumentTextIcon className="h-6 w-6 text-teal-600 mr-2" />
                <h2 className="text-xl font-bold text-gray-800">Propósito y Utilidad Clínica</h2>
              </div>
              
              {doc.purpose && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Propósito</h3>
                  <p className="text-gray-600 leading-relaxed">{doc.purpose}</p>
                </div>
              )}
              
              {doc.clinicalUtility && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Utilidad Clínica</h3>
                  <p className="text-gray-600 leading-relaxed">{doc.clinicalUtility}</p>
                </div>
              )}
              
              {doc.theoreticalFramework && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Marco Teórico</h3>
                  <p className="text-gray-600 leading-relaxed">{doc.theoreticalFramework}</p>
                </div>
              )}
            </div>

            {/* Psychometric Properties */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-cyan-100">
              <div className="flex items-center mb-4">
                <ChartBarIcon className="h-6 w-6 text-cyan-600 mr-2" />
                <h2 className="text-xl font-bold text-gray-800">Propiedades Psicométricas</h2>
              </div>
              
              {/* Normative Data */}
              {(psychometric.normativeData || psychometric.demographics || psychometric.populationNorms) && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3">Datos Normativos</h3>
                  
                  {psychometric.normativeData && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-600">Datos Normativos:</span>
                      <span className="ml-2 text-gray-700">
                        {typeof psychometric.normativeData === 'object' 
                          ? JSON.stringify(psychometric.normativeData, null, 2)
                          : psychometric.normativeData}
                      </span>
                    </div>
                  )}
                  
                  {psychometric.demographics && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-600">Demografía:</span>
                      <span className="ml-2 text-gray-700">
                        {typeof psychometric.demographics === 'object'
                          ? JSON.stringify(psychometric.demographics, null, 2)
                          : psychometric.demographics}
                      </span>
                    </div>
                  )}
                  
                  {psychometric.populationNorms && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-600">Normas Poblacionales:</span>
                      <span className="ml-2 text-gray-700">
                        {typeof psychometric.populationNorms === 'object'
                          ? JSON.stringify(psychometric.populationNorms, null, 2)
                          : psychometric.populationNorms}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Reliability */}
              {(reliability.cronbachAlpha || reliability.testRetest || reliability.interRater) && (
                <div className="mb-6 p-4 bg-teal-50 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3">Confiabilidad</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {reliability.cronbachAlpha && (
                      <div className="bg-white p-3 rounded-lg border border-teal-200">
                        <p className="text-sm text-gray-600 mb-1">Alpha de Cronbach</p>
                        <p className="text-lg font-bold text-teal-600">{reliability.cronbachAlpha}</p>
                      </div>
                    )}
                    
                    {reliability.testRetest && (
                      <div className="bg-white p-3 rounded-lg border border-teal-200">
                        <p className="text-sm text-gray-600 mb-1">Test-Retest</p>
                        <p className="text-lg font-bold text-teal-600">{reliability.testRetest}</p>
                      </div>
                    )}
                    
                    {reliability.interRater && (
                      <div className="bg-white p-3 rounded-lg border border-teal-200">
                        <p className="text-sm text-gray-600 mb-1">Inter-evaluador</p>
                        <p className="text-lg font-bold text-teal-600">{reliability.interRater}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Validity */}
              {psychometric.validity && (
                <div className="mb-6 p-4 bg-cyan-50 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3">Validez</h3>
                  <div className="text-gray-700">
                    {typeof psychometric.validity === 'object'
                      ? <pre className="text-sm bg-white p-3 rounded overflow-x-auto">
                          {JSON.stringify(psychometric.validity, null, 2)}
                        </pre>
                      : psychometric.validity}
                  </div>
                </div>
              )}
              
              {/* Diagnostic Properties */}
              {(psychometric.sensitivity || psychometric.specificity || psychometric.positivePredicativeValue) && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3">Propiedades Diagnósticas</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {psychometric.sensitivity && (
                      <div className="bg-white p-3 rounded-lg border border-purple-200">
                        <p className="text-sm text-gray-600 mb-1">Sensibilidad</p>
                        <p className="text-lg font-bold text-purple-600">{psychometric.sensitivity}</p>
                      </div>
                    )}
                    
                    {psychometric.specificity && (
                      <div className="bg-white p-3 rounded-lg border border-purple-200">
                        <p className="text-sm text-gray-600 mb-1">Especificidad</p>
                        <p className="text-lg font-bold text-purple-600">{psychometric.specificity}</p>
                      </div>
                    )}
                    
                    {psychometric.positivePredicativeValue && (
                      <div className="bg-white p-3 rounded-lg border border-purple-200">
                        <p className="text-sm text-gray-600 mb-1">Valor Predictivo Positivo</p>
                        <p className="text-lg font-bold text-purple-600">{psychometric.positivePredicativeValue}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Quick Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 sticky top-8">
              <div className="flex items-center mb-4">
                <BeakerIcon className="h-6 w-6 text-gray-600 mr-2" />
                <h2 className="text-lg font-bold text-gray-800">Información Rápida</h2>
              </div>
              
              <div className="space-y-4">
                {metadata.category && (
                  <div>
                    <p className="text-sm text-gray-600">Categoría</p>
                    <p className="font-semibold text-gray-800">{metadata.category}</p>
                  </div>
                )}
                
                {metadata.version && (
                  <div>
                    <p className="text-sm text-gray-600">Versión</p>
                    <p className="font-semibold text-gray-800">{metadata.version}</p>
                  </div>
                )}
                
                {(doc.lastUpdated || metadata.lastUpdated) && (
                  <div>
                    <p className="text-sm text-gray-600">Última Actualización</p>
                    <p className="font-semibold text-gray-800">
                      {doc.lastUpdated || metadata.lastUpdated}
                    </p>
                  </div>
                )}
                
                {metadata.description && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Descripción</p>
                    <p className="text-gray-700 text-sm leading-relaxed">{metadata.description}</p>
                  </div>
                )}
                
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleApplyScale}
                    className="w-full px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center"
                  >
                    <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" />
                    Aplicar Escala
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Modal */}
      {showAssessment && scaleData && (
        <ClinimetrixProAssessmentModal
          templateId={scaleId}
          scaleName={metadata.name}
          scaleAbbreviation={metadata.abbreviation}
          onComplete={handleAssessmentComplete}
          onExit={handleAssessmentExit}
        />
      )}
    </div>
  );
}