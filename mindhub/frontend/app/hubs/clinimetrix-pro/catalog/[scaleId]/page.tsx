'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, DocumentTextIcon, ChartBarIcon, BeakerIcon, CheckCircleIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { ClinimetrixProAssessmentModal } from '@/components/ClinimetrixPro/ClinimetrixProAssessmentModal';
import { useAuth } from '@/lib/providers/AuthProvider';
import { supabase } from '@/lib/supabase/client';
import { clinimetrixProHybridService } from '@/lib/clinimetrix-pro-hybrid-service';

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
  const { user, session, loading: authLoading } = useAuth();
  const scaleId = params?.scaleId as string;
  
  const [scaleData, setScaleData] = useState<ScaleDocumentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (user && session) {
        loadScaleDetails();
      } else {
        // User is not authenticated, redirect to login
        router.push('/auth/sign-in?redirectTo=' + encodeURIComponent(window.location.pathname));
      }
    }
  }, [scaleId, user, session, authLoading, router]);

  const loadScaleDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🧠 [ClinimetrixPro Page] Loading scale details via Hybrid Service - Django ONLY (complex psychometric logic)');
      
      // Use session from context
      if (!session) {
        throw new Error('Not authenticated');
      }
      
      const scaleData = await clinimetrixProHybridService.getScaleTemplate(scaleId, session);
      if (scaleData) {
        console.log('✅ [ClinimetrixPro Page] Scale details loaded successfully via hybrid service');
        setScaleData(scaleData);
      } else {
        throw new Error('Failed to load scale details');
      }
      
    } catch (err) {
      console.error('❌ [ClinimetrixPro Page] Critical error loading scale details via hybrid service:', err);
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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-100 p-8">
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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-100 p-8">
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/hubs/clinimetrix')}
                className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6 text-primary-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                  {metadata.abbreviation}
                </h1>
                <p className="text-gray-600 mt-1">{metadata.name}</p>
              </div>
            </div>
            <button
              onClick={handleApplyScale}
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
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
            <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
              <div className="flex items-center mb-4">
                <DocumentTextIcon className="h-6 w-6 text-primary-600 mr-2" />
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
            <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
              <div className="flex items-center mb-4">
                <ChartBarIcon className="h-6 w-6 text-primary-600 mr-2" />
                <h2 className="text-xl font-bold text-gray-800">Propiedades Psicométricas</h2>
              </div>
              
              {/* Normative Data */}
              {(psychometric.normativeData || psychometric.demographics || psychometric.populationNorms) && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3">Datos Normativos</h3>
                  
                  {psychometric.normativeData && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-600">Datos Normativos:</span>
                      <div className="ml-2 text-gray-700">
                        {typeof psychometric.normativeData === 'object' ? (
                          <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-x-auto">
                            {JSON.stringify(psychometric.normativeData, null, 2)}
                          </pre>
                        ) : (
                          <span>{psychometric.normativeData}</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {psychometric.demographics && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-600">Demografía:</span>
                      <div className="ml-2 text-gray-700">
                        {typeof psychometric.demographics === 'object' ? (
                          <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-x-auto">
                            {JSON.stringify(psychometric.demographics, null, 2)}
                          </pre>
                        ) : (
                          <span>{psychometric.demographics}</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {psychometric.populationNorms && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-600">Normas Poblacionales:</span>
                      <div className="ml-2 text-gray-700">
                        {typeof psychometric.populationNorms === 'object' ? (
                          <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-x-auto">
                            {JSON.stringify(psychometric.populationNorms, null, 2)}
                          </pre>
                        ) : (
                          <span>{psychometric.populationNorms}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Reliability */}
              {(reliability.cronbachAlpha || reliability.testRetest || reliability.interRater) && (
                <div className="mb-6 p-4 bg-primary-50 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3">Confiabilidad</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {reliability.cronbachAlpha && (
                      <div className="bg-white p-3 rounded-lg border border-primary-200">
                        <p className="text-sm text-gray-600 mb-1">Alpha de Cronbach</p>
                        <p className="text-lg font-bold text-primary-600">{reliability.cronbachAlpha}</p>
                      </div>
                    )}
                    
                    {reliability.testRetest && (
                      <div className="bg-white p-3 rounded-lg border border-primary-200">
                        <p className="text-sm text-gray-600 mb-1">Test-Retest</p>
                        <p className="text-lg font-bold text-primary-600">{reliability.testRetest}</p>
                      </div>
                    )}
                    
                    {reliability.interRater && (
                      <div className="bg-white p-3 rounded-lg border border-primary-200">
                        <p className="text-sm text-gray-600 mb-1">Inter-evaluador</p>
                        <p className="text-lg font-bold text-primary-600">{reliability.interRater}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Validity */}
              {psychometric.validity && (
                <div className="mb-6 p-4 bg-primary-50 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3">Validez</h3>
                  <div className="text-gray-700">
                    {typeof psychometric.validity === 'object' ? (
                      <div className="space-y-3">
                        {psychometric.validity.construct && (
                          <div className="bg-white p-3 rounded-lg">
                            <p className="font-medium text-gray-800 mb-1">Validez de Constructo</p>
                            <p className="text-sm text-gray-600">{psychometric.validity.construct}</p>
                          </div>
                        )}
                        {psychometric.validity.criterion && (
                          <div className="bg-white p-3 rounded-lg">
                            <p className="font-medium text-gray-800 mb-1">Validez de Criterio</p>
                            <p className="text-sm text-gray-600">{psychometric.validity.criterion}</p>
                          </div>
                        )}
                        {psychometric.validity.discriminant && (
                          <div className="bg-white p-3 rounded-lg">
                            <p className="font-medium text-gray-800 mb-1">Validez Discriminante</p>
                            <p className="text-sm text-gray-600">{psychometric.validity.discriminant}</p>
                          </div>
                        )}
                        {psychometric.validity.sensitivity && (
                          <div className="bg-white p-3 rounded-lg">
                            <p className="font-medium text-gray-800 mb-1">Sensibilidad</p>
                            <p className="text-lg font-bold text-primary-600">{psychometric.validity.sensitivity}</p>
                          </div>
                        )}
                        {psychometric.validity.specificity && (
                          <div className="bg-white p-3 rounded-lg">
                            <p className="font-medium text-gray-800 mb-1">Especificidad</p>
                            <p className="text-lg font-bold text-primary-600">{psychometric.validity.specificity}</p>
                          </div>
                        )}
                        {psychometric.validity.positivePredicativeValue && (
                          <div className="bg-white p-3 rounded-lg">
                            <p className="font-medium text-gray-800 mb-1">Valor Predictivo Positivo</p>
                            <p className="text-lg font-bold text-primary-600">{psychometric.validity.positivePredicativeValue}</p>
                          </div>
                        )}
                        {psychometric.validity.negativePredicativeValue && (
                          <div className="bg-white p-3 rounded-lg">
                            <p className="font-medium text-gray-800 mb-1">Valor Predictivo Negativo</p>
                            <p className="text-lg font-bold text-primary-600">{psychometric.validity.negativePredicativeValue}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">{psychometric.validity}</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Diagnostic Properties */}
              {(psychometric.sensitivity || psychometric.specificity || psychometric.positivePredicativeValue) && (
                <div className="p-4 bg-secondary-100 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-3">Propiedades Diagnósticas</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {psychometric.sensitivity && (
                      <div className="bg-white p-3 rounded-lg border border-secondary-200">
                        <p className="text-sm text-gray-600 mb-1">Sensibilidad</p>
                        <p className="text-lg font-bold text-secondary-700">{psychometric.sensitivity}</p>
                      </div>
                    )}
                    
                    {psychometric.specificity && (
                      <div className="bg-white p-3 rounded-lg border border-secondary-200">
                        <p className="text-sm text-gray-600 mb-1">Especificidad</p>
                        <p className="text-lg font-bold text-secondary-700">{psychometric.specificity}</p>
                      </div>
                    )}
                    
                    {psychometric.positivePredicativeValue && (
                      <div className="bg-white p-3 rounded-lg border border-secondary-200">
                        <p className="text-sm text-gray-600 mb-1">Valor Predictivo Positivo</p>
                        <p className="text-lg font-bold text-secondary-700">{psychometric.positivePredicativeValue}</p>
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
                    className="w-full px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center"
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