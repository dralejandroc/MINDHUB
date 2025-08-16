'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { clinimetrixProClient } from '@/lib/api/clinimetrix-pro-client';
import type { ClinimetrixRegistry } from '@/lib/api/clinimetrix-pro-client';
import { useExpedixApi } from '@/lib/api/expedix-client';
import type { Patient as ExpedixPatient } from '@/lib/api/expedix-client';

interface ClinimetrixProAssessmentModalProps {
  templateId: string;
  scaleName?: string;
  scaleAbbreviation?: string;
  onComplete: (results: any) => void;
  onExit: () => void;
  fullscreen?: boolean;
  preSelectedPatient?: {
    id: string;
    name: string;
    age?: number;
  };
}

// Remove local Patient interface since we'll use ExpedixPatient

interface ScaleItem {
  id: string;
  itemNumber: number;
  questionText: string;
  responseOptions?: ResponseOption[];
  helpText?: string;
  instructionText?: string;
  required: boolean;
  subscale?: string;
}

interface ResponseOption {
  value: string;
  label: string;
  score: number;
}

interface TemplateData {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  items: ScaleItem[];
  responseOptions: ResponseOption[];
  administrationMode: string;
  totalItems: number;
  estimatedDurationMinutes?: number;
  instructionsPatient?: string;
  instructionsProfessional?: string;
  interpretationRules?: InterpretationRule[];
  subscales?: Subscale[];
  scoring?: any;
  documentation?: any;
}

interface Subscale {
  id: string;
  name: string;
  items: number[];
  minScore: number;
  maxScore: number;
  description?: string;
}

interface InterpretationRule {
  minScore: number;
  maxScore: number;
  severityLevel: string;
  label: string;
  color?: string;
  description?: string;
  recommendations?: string;
}

// Helper functions for modern design and size reduction
const getModernTextStyle = (baseFontSize: string, isGradient: boolean = false, colors: string[] = ['#29A98C', '#0e7490']) => ({
  fontSize: `${parseFloat(baseFontSize) * 0.7}rem`,
  fontWeight: isGradient ? '700' : '600',
  ...(isGradient && {
    background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textShadow: `0 2px 4px ${colors[0]}30`
  })
});

const getModernCardStyle = (opacity: number = 0.15) => ({
  background: `linear-gradient(135deg, rgba(41, 169, 140, ${opacity}) 0%, rgba(16, 185, 129, ${opacity * 0.8}) 100%)`,
  borderRadius: '16px',
  border: `1px solid rgba(41, 169, 140, ${opacity + 0.1})`,
  boxShadow: `0 6px 20px rgba(41, 169, 140, ${opacity}), inset 0 1px 0 rgba(255, 255, 255, 0.6)`,
  transform: 'translateY(0)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative' as const,
  overflow: 'hidden' as const
});

const getModernButtonStyle = (variant: 'primary' | 'secondary' | 'danger' = 'primary') => {
  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #29A98C, #0e7490)',
      color: 'white',
      boxShadow: '0 8px 20px rgba(41, 169, 140, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
    },
    secondary: {
      background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
      color: '#374151',
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
    },
    danger: {
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: 'white',
      boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
    }
  };
  
  return {
    ...variants[variant],
    border: 'none',
    borderRadius: '12px',
    padding: '10px 21px',
    fontSize: '0.7rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'translateY(0)'
  };
};

export const ClinimetrixProAssessmentModal: React.FC<ClinimetrixProAssessmentModalProps> = ({
  templateId,
  scaleName,
  scaleAbbreviation,
  onComplete,
  onExit,
  fullscreen = false,
  preSelectedPatient
}) => {
  // Use the authenticated Expedix API hook
  const expedixApi = useExpedixApi();
  
  // Estados principales
  const [currentCard, setCurrentCard] = useState(0);
  const [templateData, setTemplateData] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para configuración - inicializar con paciente pre-seleccionado si existe
  const [selectedPatient, setSelectedPatient] = useState(preSelectedPatient?.id || '');
  const [selectedPatientData, setSelectedPatientData] = useState<ExpedixPatient | null>(null);
  const [administrationMode, setAdministrationMode] = useState<'presencial-mismo' | 'presencial-otro' | 'distancia' | 'dispositivo-secundario'>('presencial-mismo');
  const [selectedAdminMode, setSelectedAdminMode] = useState<'clinician' | 'patient'>('patient');
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  
  // Estados para evaluación a distancia
  const [showRemoteOptions, setShowRemoteOptions] = useState(false);
  const [linkDuration, setLinkDuration] = useState<'24h' | '48h' | '72h' | '7d'>('48h');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Estados para búsqueda de pacientes
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<ExpedixPatient[]>([]);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [showPatientResults, setShowPatientResults] = useState(false);
  
  // Estados para evaluación
  const [responses, setResponses] = useState<Record<number, { value: string; label: string; score: number }>>({});
  const [assessmentResults, setAssessmentResults] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para modal de ayuda
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Verificar si estamos en el cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cargar datos del template
  useEffect(() => {
    loadTemplateDetails();
  }, [templateId]);

  const loadTemplateDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading ClinimetrixPro template for:', templateId);
      
      // Cargar template completo desde la base de datos
      const template = await clinimetrixProClient.getTemplate(templateId);
      console.log('📄 Raw template data:', template);
      console.log('📄 Template keys:', Object.keys(template || {}));
      // console.log('📄 Template.items:', template?.items?.length);
      // console.log('📄 Template structure:', {
      //   hasItems: !!template?.items,
      //   hasTemplateData: !!template?.templateData,
      //   hasInterpretationRules: !!template?.interpretationRules,
      //   hasSubscales: !!template?.subscales
      // });
      
      // El backend devuelve el templateData como un campo anidado con estructura específica
      const templateData = template || {};
      
      // Mapear la estructura real de la base de datos
      const metadata = templateData?.metadata || {};
      const structure = templateData?.structure || {};
      // const interpretation = templateData?.interpretation || {};
      // const responseGroups = templateData?.responseGroups || {};
      
      console.log('🔧 Debug template data structure:', {
        hasMetadata: !!metadata,
        hasStructure: !!structure,
        // hasResponseGroups: !!responseGroups,
        // responseGroupsKeys: Object.keys(responseGroups),
        structureSections: structure?.sections?.length || 0,
        // hasInterpretation: !!interpretation,
        // interpretationKeys: Object.keys(interpretation),
        // interpretationRules: interpretation?.rules?.length || 0,
        fullTemplateDataKeys: Object.keys(templateData || {})
      });
      
      // Extraer todos los items de todas las secciones y mapear response options
      const allItems: any[] = [];
      if (structure.sections && Array.isArray(structure.sections)) {
        structure.sections.forEach((section: any) => {
          if (section.items && Array.isArray(section.items)) {
            section.items.forEach((item: any) => {
              // Mapear las opciones de respuesta desde responseGroups
              // if (item.responseGroup && responseGroups[item.responseGroup]) {
              //   item.specificOptions = responseGroups[item.responseGroup];
              // } else 
              if (item.specificOptions && Array.isArray(item.specificOptions)) {
                // Mantener opciones específicas si ya existen
                item.specificOptions = item.specificOptions;
              } else {
                // Fallback a un arreglo vacío para evitar errores
                item.specificOptions = [];
                console.warn(`⚠️ No response options found for item:`, item);
              }
              
              allItems.push(item);
            });
          }
        });
      }
      
      // Transformar datos para compatibilidad con la estructura esperada
      const transformedData: any = {
        id: templateId,
        name: metadata.name || 'Escala sin nombre',
        abbreviation: metadata.abbreviation || '',
        description: metadata.description || '',
        items: allItems,
        responseOptions: [],
        // administrationMode: metadata.administrationMode || 'self_administered',
        totalItems: structure.totalItems || allItems.length || 0,
        // estimatedDurationMinutes: metadata.estimatedDurationMinutes || metadata.duration,
        // instructionsPatient: metadata.instructionsPatient || null,
        // instructionsProfessional: metadata.instructionsProfessional || null,
        // interpretationRules: interpretation.rules || interpretation.interpretationRules || [],
        // subscales: structure.subscales || [],
        // Agregar datos adicionales del template
        scoring: templateData?.scoring || {},
        documentation: templateData?.documentation || {}
      };
      
      console.log('📊 Transformed data with interpretation rules:', transformedData.interpretationRules?.length);
      console.log('📈 Transformed data with subscales:', transformedData.subscales?.length);
      console.log('📝 Transformed data items:', transformedData.items?.length);
      console.log('🔍 Full transformed data:', transformedData);
      // console.log('🔍 Metadata instructions professional:', metadata.instructionsProfessional);
      console.log('🔍 Available metadata keys:', Object.keys(metadata || {}));
      
      // Validación básica de datos
      if (!transformedData.items || transformedData.items.length === 0) {
        console.error('❌ No items found in template structure');
        console.error('❌ Full template data was:', templateData);
        console.error('❌ Available keys in templateData:', Object.keys(templateData || {}));
        setError('No se encontraron ítems en la escala');
        return;
      }
      
      console.log('✅ Template loaded successfully:', {
        templateId: templateId,
        name: metadata.name,
        totalItems: transformedData.totalItems,
        itemsFound: transformedData.items.length
      });
      
      setTemplateData(transformedData);
    } catch (err) {
      console.error('❌ Error loading template details:', err);
      setError('Error al cargar los detalles de la escala');
    } finally {
      setLoading(false);
    }
  };

  // Búsqueda de pacientes desde Expedix
  const searchPatients = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setPatientSearchResults([]);
      setIsSearchingPatients(false);
      return;
    }

    setIsSearchingPatients(true);
    
    try {
      // Buscar pacientes en Expedix
      const response = await expedixApi.getPatients(query);
      setPatientSearchResults(response.data || []);
    } catch (error) {
      console.error('❌ Error searching patients:', error);
      setPatientSearchResults([]);
    } finally {
      setIsSearchingPatients(false);
    }
  };

  // Debounce para búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPatients(patientSearchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [patientSearchQuery]);

  // Effect para bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    // Bloquear scroll del body
    const originalStyle = window.getComputedStyle(document.body);
    const originalOverflow = originalStyle.overflow;
    const originalPosition = originalStyle.position;
    const originalWidth = originalStyle.width;
    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = '0';
    document.body.style.left = '0';
    
    return () => {
      // Restaurar scroll del body al desmontar
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.top = '';
      document.body.style.left = '';
    };
  }, []);

  const handleSelectPatient = (patient: ExpedixPatient) => {
    setSelectedPatientData(patient);
    const fullName = `${patient.first_name} ${patient.paternal_last_name || ''} ${patient.maternal_last_name || ''}`.trim();
    setSelectedPatient(fullName);
    setPatientSearchQuery(fullName);
    setShowPatientResults(false);
  };

  const handleResponseChange = useCallback((itemNumber: number, option: ResponseOption) => {
    setResponses(prev => ({
      ...prev,
      [itemNumber]: {
        value: option.value,
        label: option.label,
        score: option.score
      }
    }));

    // Avance automático más rápido
    setTimeout(() => {
      if (templateData && itemNumber < templateData.totalItems) {
        setCurrentCard(itemNumber + 1);
      } else if (templateData && itemNumber === templateData.totalItems) {
        setCurrentCard(templateData.totalItems + 1); // Card completada
      }
    }, 200);
  }, [templateData]);

  const calculateResults = () => {
    if (!templateData) return null;

    const totalScore = Object.values(responses).reduce((sum, response) => sum + response.score, 0);
    const completedItems = Object.keys(responses).length;
    const completionPercentage = (completedItems / templateData.totalItems) * 100;
    const completionTime = startTime ? Date.now() - startTime : 0;

    // Calcular puntajes de subescalas desde los ítems del template
    console.log('🔍 Debug subscales - extracting from template items...');
    const subscaleScores: { [key: string]: number } = {};
    const subscaleItemCounts: { [key: string]: number } = {};
    
    // Extraer subescalas dinámicamente desde los ítems
    if (templateData.items && templateData.items.length > 0) {
      templateData.items.forEach(item => {
        if (item.subscale && responses[item.itemNumber]) {
          const subscaleName = item.subscale;
          if (!subscaleScores[subscaleName]) {
            subscaleScores[subscaleName] = 0;
            subscaleItemCounts[subscaleName] = 0;
          }
          subscaleScores[subscaleName] += responses[item.itemNumber].score;
          subscaleItemCounts[subscaleName]++;
        }
      });
    }
    
    console.log('🔍 Subscales calculadas desde ítems:', subscaleScores);
    console.log('🔍 Conteo de ítems por subescala:', subscaleItemCounts);

    // Determinar interpretación basada en reglas del template
    let interpretation = null;

    // Buscar interpretación específica si existen reglas
    console.log('🔍 Checking interpretation rules:', {
      hasRules: !!templateData.interpretationRules,
      rulesCount: templateData.interpretationRules?.length || 0,
      totalScore,
      templateDataKeys: Object.keys(templateData || {}),
      rules: templateData.interpretationRules
    });
    
    console.log('🔍 Raw template data interpretationRules:', templateData.interpretationRules);
    console.log('🔍 Looking for score:', totalScore);

    if (templateData.interpretationRules && templateData.interpretationRules.length > 0) {
      const rule = templateData.interpretationRules.find(r => 
        totalScore >= r.minScore && totalScore <= r.maxScore
      );
      
      console.log('🎯 Found interpretation rule:', rule);
      
      if (rule) {
        interpretation = {
          severity: rule.severityLevel || (rule as any).severity,
          label: rule.label,
          color: rule.color || getColorBySeverity(rule.severityLevel || (rule as any).severity),
          description: rule.description || (rule as any).clinicalInterpretation || (rule as any).clinicalSignificance,
          recommendations: (rule as any).recommendations || (rule as any).professionalRecommendations?.immediate || (rule as any).professionalRecommendations?.treatment,
          clinicalRange: rule.severityLevel || (rule as any).severity,
          scoreRange: `${rule.minScore}-${rule.maxScore}`,
          fullRule: rule // Incluir la regla completa para acceso a todos sus datos
        };
      } else {
        console.error('❌ No interpretation rule found for score:', totalScore, 'Available rules:', templateData.interpretationRules);
      }
    } else {
      console.error('❌ No interpretation rules available in template data');
    }
    
    // Si no hay interpretación, crear una mínima solo con datos básicos
    if (!interpretation) {
      interpretation = {
        severity: 'unknown',
        label: 'Resultados Obtenidos',
        color: '#6B7280',
        description: null,
        recommendations: null,
        clinicalRange: null,
        scoreRange: `0-${templateData.scoring?.scoreRange?.max || 'N/A'}`
      };
    }

    // Calcular el score máximo real desde el template
    const maxPossibleScore = templateData.scoring?.scoreRange?.max ||
      (templateData.interpretationRules && templateData.interpretationRules.length > 0 
        ? Math.max(...templateData.interpretationRules.map(r => r.maxScore))
        : templateData.totalItems * 4); // fallback

    return {
      totalScore,
      maxPossibleScore,
      completionPercentage,
      completionTime,
      interpretation,
      subscaleScores,
      highRiskItems: [],
      specificAnalysis: {},
      responses: Object.entries(responses).map(([itemNumber, response]) => ({
        itemNumber: parseInt(itemNumber),
        ...response
      })),
      alerts: [],
      calculatedAt: new Date().toISOString()
    };
  };

  const getColorBySeverity = (severity: string): string => {
    const colors: { [key: string]: string } = {
      'MINIMAL': '#10b981',
      'MILD': '#f59e0b',
      'MODERATE': '#ef4444',
      'SEVERE': '#991b1b',
      'NORMAL': '#10b981',
      'LEVE': '#f59e0b',
      'MODERADO': '#ef4444',
      'SEVERO': '#991b1b'
    };
    return colors[severity.toUpperCase()] || '#29A98C';
  };

  const completeAssessment = async () => {
    setIsSubmitting(true);
    try {
      const results = calculateResults();
      setAssessmentResults(results);
      setCurrentCard(templateData ? templateData.totalItems + 2 : 999); // Card de resultados
    } catch (error) {
      console.error('Error completing assessment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToNextCard = () => {
    if (!templateData) return;
    
    const hasPatientCard = !!(templateData?.instructionsPatient);
    
    if (currentCard === 0) {
      const nextCard = hasPatientCard ? 0.5 : 1;
      setCurrentCard(nextCard);
      if (nextCard === 1 && !startTime) {
        setStartTime(Date.now());
      }
    } else if (currentCard === 0.5) {
      setCurrentCard(1);
      if (!startTime) {
        setStartTime(Date.now());
      }
    } else if (currentCard <= templateData.totalItems) {
      if (currentCard === templateData.totalItems) {
        setCurrentCard(templateData.totalItems + 1);
      } else {
        setCurrentCard(currentCard + 1);
      }
    }
  };

  const goToPreviousCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
    }
  };

  const canProceed = () => {
    if (currentCard === 0) {
      const hasPatient = selectedPatient.trim() !== '';
      if (templateData?.administrationMode === 'both') {
        return hasPatient && selectedAdminMode !== null && selectedAdminMode.trim() !== '';
      }
      return hasPatient;
    } else if (currentCard >= 1 && currentCard <= (templateData?.totalItems || 0)) {
      return responses[currentCard] !== undefined;
    }
    return true;
  };

  const renderConfigurationCard = () => (
    <div style={{ padding: '21px' }}>
      <h1 style={{ 
        background: 'linear-gradient(135deg, #29A98C, #0e7490)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        marginBottom: '6px',
        fontSize: '1.4rem',
        fontWeight: '800',
        textAlign: 'center',
        lineHeight: '1.2',
        textShadow: '0 2px 4px rgba(41, 169, 140, 0.2)'
      }}>
        {templateData?.name} {templateData?.abbreviation && `(${templateData.abbreviation})`}
      </h1>
      <p style={{ 
        color: '#6b7280', 
        marginBottom: '14px',
        fontSize: '0.7rem',
        fontWeight: '600',
        textAlign: 'center',
        opacity: '0.8'
      }}>
        ⚙️ Configuración de Evaluación
      </p>

      {/* Información de la escala */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '14px', 
        marginBottom: '18px',
        fontSize: '0.56rem',
        color: '#6b7280'
      }}>
        <div>📝 {templateData?.totalItems} ítems</div>
        <div>⏱️ {templateData?.estimatedDurationMinutes} min</div>
      </div>

      {/* Instrucciones para el profesional - Siempre mostrar */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(41, 169, 140, 0.1) 0%, rgba(16, 185, 129, 0.08) 100%)',
        borderRadius: '16px',
        padding: '14px',
        marginBottom: '18px',
        textAlign: 'left',
        border: '1px solid rgba(41, 169, 140, 0.15)',
        boxShadow: '0 4px 12px rgba(41, 169, 140, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <h3 style={{ 
          background: 'linear-gradient(135deg, #29A98C, #10b981)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '8px',
          fontSize: '0.7rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          👨‍⚕️ Instrucciones para el Profesional
        </h3>
        <p style={{ 
          color: '#374151', 
          fontSize: '0.63rem',
          lineHeight: '1.5',
          margin: '0',
          opacity: '0.9'
        }}>
          {(templateData as any)?.instructionsProfessional || 
           (templateData as any)?.interpretationGuidelines || 
           (templateData as any)?.clinicalInstructions ||
           (templateData as any)?.clinical_considerations ||
           (templateData as any)?.implementation_notes ||
           `Aplicar la escala ${templateData?.name || 'clínica'} según protocolo estándar. Asegurar ambiente adecuado, privacidad y comprensión completa del paciente antes de iniciar. Proporcionar las instrucciones claramente y verificar que el paciente comprenda cada ítem antes de responder.`}
        </p>
      </div>

      {/* Selección de paciente simplificada */}
      <div style={{ marginBottom: '18px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          background: 'linear-gradient(135deg, #112F33, #1f2937)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: '700',
          textAlign: 'left',
          fontSize: '0.7rem'
        }}>
          👤 Seleccionar Paciente
        </label>

        {selectedPatientData && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(41, 169, 140, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)',
            border: '2px solid rgba(41, 169, 140, 0.3)',
            borderRadius: '16px',
            padding: '11px',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 6px 16px rgba(41, 169, 140, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
            transform: 'translateY(0)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div>
              <div style={{ 
                fontWeight: '700', 
                background: 'linear-gradient(135deg, #112F33, #29A98C)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: '0.77rem',
                marginBottom: '3px'
              }}>
                {selectedPatientData.first_name} {selectedPatientData.paternal_last_name}
                {selectedPatientData.maternal_last_name && ` ${selectedPatientData.maternal_last_name}`}
              </div>
              <div style={{ color: '#29A98C', fontSize: '0.85rem' }}>
                ✅ Paciente seleccionado
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedPatient('');
                setSelectedPatientData(null);
                setPatientSearchQuery('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '4px'
              }}
              title="Cambiar paciente"
            >
              ✕
            </button>
          </div>
        )}

        {!selectedPatientData && (
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={patientSearchQuery}
              onChange={(e) => setPatientSearchQuery(e.target.value)}
              placeholder="Escriba el nombre del paciente para buscar..."
              style={{
                width: '100%',
                padding: '14px 48px 14px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.3s ease',
                background: 'white',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#29A98C';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(41, 169, 140, 0.1)';
                setShowPatientResults(true);
              }}
              onBlur={(e) => {
                setTimeout(() => setShowPatientResults(false), 200);
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            
            <div style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: isSearchingPatients ? '#29A98C' : '#999',
              fontSize: '1.2rem'
            }}>
              {isSearchingPatients ? '🔄' : '🔍'}
            </div>

            {showPatientResults && patientSearchQuery.length > 0 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: '0',
                right: '0',
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 9999,
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {isSearchingPatients ? (
                  <div style={{ 
                    padding: '16px', 
                    textAlign: 'center',
                    color: '#666'
                  }}>
                    <div style={{ marginBottom: '8px' }}>🔄</div>
                    <div>Buscando pacientes...</div>
                  </div>
                ) : patientSearchResults.length > 0 ? (
                  <>
                    <div style={{
                      padding: '8px 12px',
                      background: '#f8fafc',
                      borderBottom: '1px solid #e2e8f0',
                      fontSize: '0.8rem',
                      color: '#666',
                      fontWeight: '500'
                    }}>
                      {patientSearchResults.length} resultado{patientSearchResults.length !== 1 ? 's' : ''}
                    </div>
                    {patientSearchResults.map((patient) => (
                      <div
                        key={patient.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectPatient(patient);
                        }}
                        style={{
                          padding: '12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f0f9f7';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                        }}
                      >
                        <div style={{ 
                          fontWeight: '600', 
                          color: '#112F33',
                          fontSize: '0.9rem'
                        }}>
                          {patient.first_name} {patient.paternal_last_name}
                          {patient.maternal_last_name && ` ${patient.maternal_last_name}`}
                        </div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#666',
                          marginTop: '2px'
                        }}>
                          ID: {patient.id}
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ 
                    padding: '16px', 
                    textAlign: 'center', 
                    color: '#666'
                  }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>😔</div>
                    <div style={{ fontSize: '0.9rem' }}>
                      No se encontraron pacientes
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modo de administración con opciones más compactas */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ 
          color: '#112F33', 
          marginBottom: '10px',
          fontSize: '0.75rem',
          fontWeight: '700'
        }}>
          📋 Modo de Administración
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {/* Evaluación Presencial - Compacta */}
          <div 
            onClick={() => {
              setAdministrationMode('presencial-mismo');
              setShowRemoteOptions(false);
            }}
            style={{
              background: administrationMode === 'presencial-mismo' 
                ? 'linear-gradient(135deg, #e8f5f3, #f0f9f7)'
                : 'white',
              border: `1px solid ${administrationMode === 'presencial-mismo' ? '#29A98C' : '#e2e8f0'}`,
              borderRadius: '6px',
              padding: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center',
              fontSize: '0.65rem'
            }}
          >
            <div style={{ fontSize: '1rem', marginBottom: '2px' }}>🏥</div>
            <div style={{ 
              color: '#112F33', 
              fontWeight: '600',
              lineHeight: '1.2'
            }}>
              Presencial
            </div>
          </div>

          {/* Evaluación a Distancia - Compacta */}
          <div 
            onClick={() => {
              setAdministrationMode('distancia');
              setShowRemoteOptions(true);
            }}
            style={{
              background: administrationMode === 'distancia' 
                ? 'linear-gradient(135deg, #f0f4ff, #e8efff)'
                : 'white',
              border: `1px solid ${administrationMode === 'distancia' ? '#4A90E2' : '#e2e8f0'}`,
              borderRadius: '6px',
              padding: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center',
              fontSize: '0.65rem'
            }}
          >
            <div style={{ fontSize: '1rem', marginBottom: '2px' }}>📧</div>
            <div style={{ 
              color: '#112F33', 
              fontWeight: '600',
              lineHeight: '1.2'
            }}>
              A Distancia
            </div>
          </div>

          {/* Evaluación en Dispositivo Secundario - Nueva opción compacta */}
          <div 
            onClick={() => {
              setAdministrationMode('dispositivo-secundario');
              setShowRemoteOptions(false);
            }}
            style={{
              background: administrationMode === 'dispositivo-secundario' 
                ? 'linear-gradient(135deg, #fff4e6, #fef7ed)'
                : 'white',
              border: `1px solid ${administrationMode === 'dispositivo-secundario' ? '#f97316' : '#e2e8f0'}`,
              borderRadius: '6px',
              padding: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center',
              fontSize: '0.65rem'
            }}
          >
            <div style={{ fontSize: '1rem', marginBottom: '2px' }}>📱</div>
            <div style={{ 
              color: '#112F33', 
              fontWeight: '600',
              lineHeight: '1.2'
            }}>
              Dispositivo Secundario
            </div>
          </div>
        </div>

        {/* Opciones de evaluación a distancia */}
        {showRemoteOptions && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{ 
              color: '#112F33', 
              marginBottom: '12px',
              fontSize: '0.95rem',
              fontWeight: '600'
            }}>
              ⏱️ Duración del enlace
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {(['24h', '48h', '72h', '7d'] as const).map((duration) => (
                <button
                  key={duration}
                  onClick={() => setLinkDuration(duration)}
                  style={{
                    padding: '8px',
                    border: `2px solid ${linkDuration === duration ? '#4A90E2' : '#e2e8f0'}`,
                    borderRadius: '8px',
                    background: linkDuration === duration ? '#e8efff' : 'white',
                    color: linkDuration === duration ? '#4A90E2' : '#666',
                    fontWeight: linkDuration === duration ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {duration === '24h' ? '24 horas' : 
                   duration === '48h' ? '48 horas' : 
                   duration === '72h' ? '72 horas' : '7 días'}
                </button>
              ))}
            </div>

            {generatedLink ? (
              <div style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px'
              }}>
                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
                  Enlace generado (válido por {linkDuration === '24h' ? '24 horas' : 
                                               linkDuration === '48h' ? '48 horas' : 
                                               linkDuration === '72h' ? '72 horas' : '7 días'}):
                </p>
                <div style={{ 
                  display: 'flex', 
                  gap: '8px',
                  alignItems: 'center',
                  background: '#f8fafc',
                  padding: '8px',
                  borderRadius: '6px',
                  marginBottom: '12px'
                }}>
                  <input
                    type="text"
                    value={generatedLink}
                    readOnly
                    style={{
                      flex: 1,
                      border: 'none',
                      background: 'transparent',
                      fontSize: '0.85rem',
                      color: '#4A90E2'
                    }}
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLink);
                      setCopySuccess(true);
                      setTimeout(() => setCopySuccess(false), 2000);
                    }}
                    style={{
                      padding: '6px 12px',
                      background: copySuccess ? '#10b981' : '#4A90E2',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {copySuccess ? '✓ Copiado' : '📋 Copiar'}
                  </button>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      // Abrir cliente de correo con el enlace
                      const subject = encodeURIComponent(`Evaluación ${templateData?.name || ''}`);
                      const body = encodeURIComponent(`Estimado/a paciente,\n\nPor favor complete la siguiente evaluación clínica:\n\n${generatedLink}\n\nEste enlace estará disponible por ${linkDuration === '24h' ? '24 horas' : linkDuration === '48h' ? '48 horas' : linkDuration === '72h' ? '72 horas' : '7 días'}.\n\nSaludos cordiales.`);
                      window.open(`mailto:?subject=${subject}&body=${body}`);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: 'linear-gradient(135deg, #4A90E2, #357ABD)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    📧 Enviar por Email
                  </button>
                  <button
                    onClick={() => {
                      // Abrir WhatsApp con el mensaje
                      const message = encodeURIComponent(`Hola, por favor complete esta evaluación clínica:\n\n${generatedLink}\n\nEl enlace estará disponible por ${linkDuration === '24h' ? '24 horas' : linkDuration === '48h' ? '48 horas' : linkDuration === '72h' ? '72 horas' : '7 días'}.`);
                      window.open(`https://wa.me/?text=${message}`);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: 'linear-gradient(135deg, #25D366, #128C7E)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    💬 Enviar por WhatsApp
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  // Generar enlace tokenizado
                  const token = btoa(`${templateId}-${selectedPatientData?.id || 'anonymous'}-${Date.now()}`);
                  const baseUrl = window.location.origin;
                  setGeneratedLink(`${baseUrl}/assessment/remote/${token}`);
                }}
                disabled={!selectedPatientData && administrationMode === 'distancia'}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: selectedPatientData || administrationMode !== 'distancia' 
                    ? 'linear-gradient(135deg, #4A90E2, #357ABD)' 
                    : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: selectedPatientData || administrationMode !== 'distancia' ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease'
                }}
              >
                🔗 Generar Enlace Seguro
              </button>
            )}
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '30px' }}>
        <button
          onClick={onExit}
          style={{
            background: 'linear-gradient(135deg, #6b7280, #374151)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '15px 30px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(107, 114, 128, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          ❌ Cancelar
        </button>
        <button
          onClick={goToNextCard}
          disabled={!canProceed()}
          style={{
            background: canProceed() 
              ? 'linear-gradient(135deg, #29A98C, #112F33)' 
              : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '15px 30px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: canProceed() ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            if (canProceed()) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(41, 169, 140, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (canProceed()) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          ✅ Comenzar Evaluación
        </button>
      </div>
    </div>
  );

  const renderPatientInstructionsCard = () => (
    <div style={{ textAlign: 'center', padding: '21px' }}>
      <h2 style={{ 
        ...getModernTextStyle('1.5', true),
        marginBottom: '14px'
      }}>
        📖 {templateData?.name}
      </h2>
      
      <div style={{ 
        ...getModernCardStyle(0.1),
        padding: '18px',
        marginBottom: '21px',
        textAlign: 'left'
      }}>
        <h3 style={{ 
          ...getModernTextStyle('1.1', true),
          marginBottom: '11px',
          textAlign: 'center'
        }}>
          Instrucciones
        </h3>
        <div style={{ 
          ...getModernTextStyle('1'),
          color: '#374151',
          lineHeight: '1.6',
          marginBottom: '0',
          whiteSpace: 'pre-wrap',
          opacity: '0.9'
        }}>
          {templateData?.instructionsPatient}
        </div>
      </div>

      <button
        onClick={goToNextCard}
        style={{
          background: 'linear-gradient(135deg, #29A98C, #20B2AA)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          padding: '15px 30px',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(41, 169, 140, 0.3)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(41, 169, 140, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(41, 169, 140, 0.3)';
        }}
      >
        ✅ Comenzar Evaluación
      </button>
    </div>
  );

  const renderCompletionCard = () => (
    <div style={{ textAlign: 'center', padding: '21px' }}>
      <div style={{
        ...getModernCardStyle(0.2),
        padding: '21px',
        marginBottom: '14px',
        border: '2px solid rgba(41, 169, 140, 0.4)'
      }}>
        <div style={{ 
          fontSize: '2.8rem', 
          marginBottom: '11px',
          background: 'linear-gradient(135deg, #29A98C, #10b981)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 4px 8px rgba(41, 169, 140, 0.3)'
        }}>
          ✓
        </div>
        <h2 style={{ 
          color: '#29A98C', 
          marginBottom: '15px',
          fontSize: '1.8rem',
          fontWeight: '700'
        }}>
          Escala Completada
        </h2>
        <p style={{ 
          color: '#666', 
          marginBottom: '10px',
          fontSize: '1.1rem',
          lineHeight: '1.5'
        }}>
          Muchas gracias por completar la evaluación.
        </p>
        <p style={{ 
          color: '#888', 
          fontSize: '0.9rem'
        }}>
          Ha respondido todos los elementos de la escala correctamente.
        </p>
      </div>
      <button
        onClick={() => {
          const results = calculateResults();
          setAssessmentResults(results);
          setCurrentCard(templateData ? templateData.totalItems + 2 : 0);
        }}
        style={{
          background: 'linear-gradient(135deg, #29A98C, #20B2AA)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          padding: '15px 30px',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(41, 169, 140, 0.3)'
        }}
      >
        Ver Resultados
      </button>
    </div>
  );

  const renderQuestionCard = useMemo(() => (itemNumber: number) => {
    if (!templateData) {
      return <div>No hay datos de la escala</div>;
    }

    const item = templateData.items.find(i => i.itemNumber === itemNumber) || templateData.items[itemNumber - 1];
    
    if (!item) {
      return <div>Ítem {itemNumber} no encontrado</div>;
    }

    const itemText = item.questionText || 'Sin texto';
    const currentResponse = responses[itemNumber];
    
    // Usar las opciones específicas del ítem desde el JSON real
    const responseOptions = item.responseOptions || [];
    
    // Validación de opciones de respuesta
    if (!responseOptions || responseOptions.length === 0) {
      console.error(`❌ No response options found for item ${itemNumber}:`, {
        itemId: item.id,
        itemText: item.questionText,
        responseGroup: (item as any).responseGroup,
        hasSpecificOptions: !!(item as any).specificOptions
      });
      
      return (
        <div style={{ padding: '30px', textAlign: 'center' }}>
          <div style={{ 
            color: '#ef4444', 
            fontSize: '18px', 
            marginBottom: '20px',
            fontWeight: 'bold'
          }}>
            ⚠️ Error en el ítem {itemNumber}
          </div>
          <div style={{ color: '#666', marginBottom: '20px' }}>
            No se encontraron opciones de respuesta para este ítem.
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>
            {item.questionText || 'Sin texto'}
          </div>
        </div>
      );
    }
    
    console.log('🔍 Item details for question', itemNumber, ':', {
      itemId: item.id,
      itemText: item.questionText,
      hasSpecificOptions: !!(item as any).specificOptions,
      optionsCount: responseOptions.length,
      firstOption: responseOptions[0]
    });

    return (
      <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>

        {/* Número de pregunta */}
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #29A98C, #112F33)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 25px',
          fontWeight: '700',
          fontSize: '1.3rem',
          boxShadow: '0 8px 25px rgba(41, 169, 140, 0.35)'
        }}>
          {itemNumber}
        </div>

        {/* Container especial para la pregunta */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(41, 169, 140, 0.05), rgba(17, 47, 51, 0.02))',
            borderRadius: '16px',
            padding: '30px',
            border: '2px solid rgba(41, 169, 140, 0.2)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            transform: 'translateY(-5px)'
          }}>
            <h2 style={{ 
              color: '#112F33', 
              marginBottom: item.instructionText ? '12px' : '0', 
              lineHeight: '1.5', 
              textAlign: 'center',
              fontSize: '1.2rem',
              fontWeight: '600',
              letterSpacing: '-0.02em'
            }}>
              {itemText}
              {item.required && <span style={{ color: '#E74C3C', marginLeft: '8px' }}>*</span>}
            </h2>

            {/* Texto de ayuda */}
            {item.instructionText && (
              <p style={{
                color: '#666',
                fontSize: '0.76rem',
                textAlign: 'center',
                fontStyle: 'italic',
                margin: '0',
                opacity: 0.85
              }}>
                {item.instructionText}
              </p>
            )}
          </div>
        </div>

        {/* Opciones de respuesta más oscuras */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {responseOptions.length === 0 ? (
            <div style={{
              padding: '20px',
              background: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              color: '#856404',
              textAlign: 'center'
            }}>
              ⚠️ No se encontraron opciones de respuesta para este ítem
            </div>
          ) : responseOptions.map((option, index) => {
            const isSelected = currentResponse?.value === option.value;
            
            return (
              <button
                key={`${option.value}-${index}`}
                onClick={() => handleResponseChange(itemNumber, option)}
                style={{
                  background: isSelected 
                    ? 'linear-gradient(135deg, #1a5f4f, #0d2e25)' 
                    : 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                  border: '2px solid',
                  borderColor: isSelected ? '#29A98C' : '#dee2e6',
                  borderRadius: '10px',
                  padding: '7px 10px',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  textAlign: 'left',
                  fontSize: '0.88rem',
                  lineHeight: '1.4',
                  color: isSelected ? 'white' : '#2d3748',
                  fontWeight: isSelected ? '600' : '500',
                  transform: isSelected ? 'translateY(-3px) scale(1.02)' : 'translateY(0) scale(1)',
                  boxShadow: isSelected 
                    ? '0 12px 24px rgba(26, 95, 79, 0.4), 0 0 0 1px rgba(255,255,255,0.1) inset' 
                    : '0 2px 8px rgba(0, 0, 0, 0.05)',
                  letterSpacing: '0.01em'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = '#29A98C';
                    e.currentTarget.style.background = 'linear-gradient(135deg, #e8f5f3, #d1e7e3)';
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(41, 169, 140, 0.25)';
                    e.currentTarget.style.color = '#1a5f4f';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = '#dee2e6';
                    e.currentTarget.style.background = 'linear-gradient(135deg, #f8f9fa, #e9ecef)';
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                    e.currentTarget.style.color = '#2d3748';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: '2px solid',
                    borderColor: isSelected ? 'white' : '#cbd5e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.3s ease'
                  }}>
                    {isSelected && (
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: 'white'
                      }} />
                    )}
                  </div>
                  <span>{option.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Botones circulares de navegación y ayuda */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '15px', 
          marginTop: '20px',
          marginBottom: '10px' 
        }}>
          {/* Botón Regresar */}
          {itemNumber > 1 && (
            <button
              onClick={goToPreviousCard}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6b7280, #374151)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
              title="Regresar a la pregunta anterior"
            >
              ←
            </button>
          )}

          {/* Botón Ayuda */}
          <button
            onClick={() => setShowHelpModal(true)}
            style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #29A98C, #112F33)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(41, 169, 140, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
              title={`Ver ayuda para el ítem ${itemNumber}`}
            >
              ?
            </button>
        </div>

        {/* Barra de progreso */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: '#666', fontSize: '12px' }}>
              Pregunta {itemNumber} de {templateData.totalItems}
            </span>
            <span style={{ color: '#666', fontSize: '12px' }}>
              {Math.round((itemNumber / templateData.totalItems) * 100)}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            background: '#e1e5e9',
            borderRadius: '3px'
          }}>
            <div style={{
              width: `${(itemNumber / templateData.totalItems) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #29A98C, #20B2AA)',
              borderRadius: '3px',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
      </div>
    );
  }, [templateData, responses]);

  const renderResultsCard = () => {
    if (!assessmentResults || !templateData) return null;
    
    const { totalScore, maxPossibleScore, interpretation, subscaleScores, completionTime } = assessmentResults;
    
    // Debug logging para ver qué datos tenemos realmente
    console.log('🔍 DEBUGGING RESULTS DATA:');
    console.log('- totalScore:', totalScore);
    console.log('- interpretation object:', interpretation);
    console.log('- subscaleScores:', subscaleScores);
    console.log('- templateData.subscales:', templateData.subscales);
    
    if (interpretation) {
      console.log('- interpretation keys:', Object.keys(interpretation));
      console.log('- professionalRecommendations:', interpretation.professionalRecommendations);
      console.log('- clinicalInterpretation:', interpretation.clinicalInterpretation);
      console.log('- prognosticImplications:', interpretation.prognosticImplications);
    }

    return (
      <div style={{ 
        padding: '21px',
        height: '100%',
        overflowY: 'auto',
        background: 'linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%)'
      }}>
        {/* Header con información de la escala */}
        <div style={{ 
          textAlign: 'center',
          marginBottom: '21px',
          paddingBottom: '14px',
          borderBottom: '2px solid rgba(41, 169, 140, 0.2)'
        }}>
          <h2 style={{ 
            ...getModernTextStyle('2', true),
            marginBottom: '8px',
            letterSpacing: '-0.02em'
          }}>
            Informe de Resultados
          </h2>
          <h3 style={{ 
            color: '#112F33',
            fontSize: '1.3rem',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            {templateData.name}
          </h3>
          <p style={{ 
            color: '#666',
            fontSize: '1rem',
            margin: '0'
          }}>
            {templateData.abbreviation} • {new Date().toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Información del paciente y evaluación */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h4 style={{ color: '#666', fontSize: '0.85rem', marginBottom: '4px' }}>Paciente</h4>
              <p style={{ color: '#112F33', fontSize: '1.1rem', fontWeight: '600' }}>
                {selectedPatientData ? `${selectedPatientData.first_name} ${selectedPatientData.paternal_last_name}` : 'Anónimo'}
              </p>
            </div>
            <div>
              <h4 style={{ color: '#666', fontSize: '0.85rem', marginBottom: '4px' }}>Duración</h4>
              <p style={{ color: '#112F33', fontSize: '1.1rem', fontWeight: '600' }}>
                {Math.floor(completionTime / 60000)} min {Math.floor((completionTime % 60000) / 1000)} seg
              </p>
            </div>
          </div>
        </div>

        {/* 1. Puntuación Total y Severidad */}
        <div style={{
          background: `linear-gradient(135deg, ${interpretation?.color}15 0%, ${interpretation?.color}08 100%)`,
          border: `2px solid ${interpretation?.color}30`,
          borderRadius: '16px',
          padding: '30px',
          textAlign: 'center',
          marginBottom: '20px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '0',
            right: '0',
            width: '100px',
            height: '100px',
            background: interpretation?.color + '20',
            borderRadius: '0 0 0 100%',
            transform: 'translate(20px, -20px)'
          }} />
          
          <div style={{ 
            fontSize: '2.45rem', // 30% más pequeño que 3.5rem
            fontWeight: '800', 
            color: interpretation?.color || '#29A98C',
            marginBottom: '8px',
            letterSpacing: '-0.03em'
          }}>
            {totalScore}
          </div>
          <div style={{ 
            color: '#444', 
            fontSize: '1.2rem',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            Puntuación Total
          </div>
          <div style={{ 
            color: '#666', 
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <span>Rango: 0-{maxPossibleScore}</span>
            <span style={{
              background: interpretation?.color + '20',
              color: interpretation?.color,
              padding: '4px 12px',
              borderRadius: '20px',
              fontWeight: '600',
              fontSize: '0.85rem'
            }}>
              {interpretation?.severity || interpretation?.label || 'No evaluado'}
            </span>
          </div>
        </div>

        {/* 2. Subescalas - Formato específico solicitado */}
        {((subscaleScores && Object.keys(subscaleScores).length > 0) || (templateData.subscales && templateData.subscales.length > 0)) && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{
              color: '#112F33',
              fontSize: '1.1rem',
              fontWeight: '700',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📊 Subescalas
            </h3>
            <div style={{ display: 'grid', gap: '10px' }}>
              {subscaleScores && Object.keys(subscaleScores).length > 0 ? (
                // Si tenemos puntuaciones calculadas, mostrarlas
                Object.entries(subscaleScores).map(([subscaleName, score]) => {
                  const subscale = templateData.subscales?.find(s => (s as any).subscaleName === subscaleName);
                  const maxScore = subscale?.maxScore || 0;
                  
                  return (
                    <div key={subscaleName} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid #f1f5f9'
                    }}>
                      <span style={{ 
                        color: '#374151', 
                        fontWeight: '600',
                        fontSize: '0.9rem'
                      }}>
                        {subscaleName}
                      </span>
                      <span style={{ 
                        color: '#29A98C', 
                        fontWeight: '700',
                        fontSize: '1rem'
                      }}>
                        {score as number}/{maxScore}
                      </span>
                    </div>
                  );
                })
              ) : (
                // Si no tenemos puntuaciones pero sí definiciones de subescalas, mostrar estructura
                templateData.subscales?.map((subscale) => (
                  <div key={(subscale as any).subscaleName} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid #f1f5f9'
                  }}>
                    <span style={{ 
                      color: '#374151', 
                      fontWeight: '600',
                      fontSize: '0.9rem'
                    }}>
                      {(subscale as any).subscaleName}
                    </span>
                    <span style={{ 
                      color: '#94a3b8', 
                      fontWeight: '700',
                      fontSize: '1rem'
                    }}>
                      Pendiente/{subscale.maxScore}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 3. INTERPRETACIÓN */}
        {interpretation && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            border: `2px solid ${interpretation.color}30`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{
              color: interpretation?.color || '#0284c7',
              fontSize: '1.1rem',
              fontWeight: '700',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🎯 INTERPRETACIÓN
            </h3>
            

            {/* Interpretación Clínica */}
            {(interpretation.fullRule?.clinicalInterpretation || interpretation.description) && (
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ 
                  color: '#374151', 
                  fontSize: '0.9rem', 
                  fontWeight: '600', 
                  marginBottom: '8px' 
                }}>
                  Interpretación Clínica
                </h4>
                <p style={{ 
                  color: '#4b5563', 
                  fontSize: '0.85rem', 
                  lineHeight: '1.5',
                  margin: '0'
                }}>
                  {interpretation.fullRule?.clinicalInterpretation || interpretation.description}
                </p>
              </div>
            )}

            {/* Significancia Clínica */}
            {interpretation.fullRule?.clinicalSignificance && (
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ 
                  color: '#374151', 
                  fontSize: '0.9rem', 
                  fontWeight: '600', 
                  marginBottom: '8px' 
                }}>
                  Significancia Clínica
                </h4>
                <p style={{ 
                  color: '#4b5563', 
                  fontSize: '0.85rem', 
                  lineHeight: '1.5',
                  margin: '0'
                }}>
                  {interpretation.fullRule.clinicalSignificance}
                </p>
              </div>
            )}

            {/* Consideraciones Diferenciales */}
            {interpretation.fullRule?.differentialConsiderations && (
              <div>
                <h4 style={{ 
                  color: '#374151', 
                  fontSize: '0.9rem', 
                  fontWeight: '600', 
                  marginBottom: '8px' 
                }}>
                  Consideraciones Diferenciales
                </h4>
                <p style={{ 
                  color: '#4b5563', 
                  fontSize: '0.85rem', 
                  lineHeight: '1.5',
                  margin: '0'
                }}>
                  {interpretation.fullRule.differentialConsiderations}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 4. RECOMENDACIONES */}
        {(interpretation?.fullRule?.professionalRecommendations || interpretation?.recommendations) && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            border: '2px solid #f59e0b30',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{
              color: '#f59e0b',
              fontSize: '1.1rem',
              fontWeight: '700',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              💡 RECOMENDACIONES
            </h3>
            
            {/* Intentar acceder a recomendaciones de diferentes maneras */}
            {(() => {
              const profRecs = interpretation.fullRule?.professionalRecommendations;
              const basicRecs = interpretation.recommendations;
              
              if (profRecs) {
                return (
                  <>
                    {profRecs.immediate && (
                      <div style={{ marginBottom: '15px' }}>
                        <h4 style={{ 
                          color: '#dc2626', 
                          fontSize: '0.9rem', 
                          fontWeight: '600', 
                          marginBottom: '8px' 
                        }}>
                          🚨 Inmediatas
                        </h4>
                        <p style={{ 
                          color: '#4b5563', 
                          fontSize: '0.85rem', 
                          lineHeight: '1.5',
                          margin: '0'
                        }}>
                          {profRecs.immediate}
                        </p>
                      </div>
                    )}

                    {profRecs.monitoring && (
                      <div style={{ marginBottom: '15px' }}>
                        <h4 style={{ 
                          color: '#0891b2', 
                          fontSize: '0.9rem', 
                          fontWeight: '600', 
                          marginBottom: '8px' 
                        }}>
                          📊 Monitoreo
                        </h4>
                        <p style={{ 
                          color: '#4b5563', 
                          fontSize: '0.85rem', 
                          lineHeight: '1.5',
                          margin: '0'
                        }}>
                          {profRecs.monitoring}
                        </p>
                      </div>
                    )}

                    {profRecs.riskAssessment && (
                      <div style={{ marginBottom: '15px' }}>
                        <h4 style={{ 
                          color: '#dc2626', 
                          fontSize: '0.9rem', 
                          fontWeight: '600', 
                          marginBottom: '8px' 
                        }}>
                          ⚠️ Evaluación de Riesgo
                        </h4>
                        <p style={{ 
                          color: '#4b5563', 
                          fontSize: '0.85rem', 
                          lineHeight: '1.5',
                          margin: '0'
                        }}>
                          {profRecs.riskAssessment}
                        </p>
                      </div>
                    )}

                    {profRecs.familySupport && (
                      <div style={{ marginBottom: '15px' }}>
                        <h4 style={{ 
                          color: '#059669', 
                          fontSize: '0.9rem', 
                          fontWeight: '600', 
                          marginBottom: '8px' 
                        }}>
                          👨‍👩‍👧‍👦 Apoyo Familiar
                        </h4>
                        <p style={{ 
                          color: '#4b5563', 
                          fontSize: '0.85rem', 
                          lineHeight: '1.5',
                          margin: '0'
                        }}>
                          {profRecs.familySupport}
                        </p>
                      </div>
                    )}

                    {profRecs.treatment && (
                      <div>
                        <h4 style={{ 
                          color: '#7c3aed', 
                          fontSize: '0.9rem', 
                          fontWeight: '600', 
                          marginBottom: '8px' 
                        }}>
                          🏥 Tratamiento
                        </h4>
                        <p style={{ 
                          color: '#4b5563', 
                          fontSize: '0.85rem', 
                          lineHeight: '1.5',
                          margin: '0'
                        }}>
                          {profRecs.treatment}
                        </p>
                      </div>
                    )}
                  </>
                );
              } else if (basicRecs) {
                return (
                  <div>
                    <h4 style={{ 
                      color: '#f59e0b', 
                      fontSize: '0.9rem', 
                      fontWeight: '600', 
                      marginBottom: '8px' 
                    }}>
                      Recomendaciones Generales
                    </h4>
                    <p style={{ 
                      color: '#4b5563', 
                      fontSize: '0.85rem', 
                      lineHeight: '1.5',
                      margin: '0'
                    }}>
                      {basicRecs}
                    </p>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {/* 5. PRONÓSTICO */}
        {(interpretation?.fullRule?.prognosticImplications || interpretation?.fullRule?.prognosis) && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            border: '2px solid #8b5cf630',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{
              color: '#8b5cf6',
              fontSize: '1.1rem',
              fontWeight: '700',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              🔮 PRONÓSTICO
            </h3>
            
            <div>
              <h4 style={{ 
                color: '#374151', 
                fontSize: '0.9rem', 
                fontWeight: '600', 
                marginBottom: '8px' 
              }}>
                Implicaciones Pronósticas
              </h4>
              <p style={{ 
                color: '#4b5563', 
                fontSize: '0.85rem', 
                lineHeight: '1.5',
                margin: '0'
              }}>
                {interpretation.fullRule?.prognosticImplications}
              </p>
            </div>
          </div>
        )}




        {/* Subescalas y puntajes específicos */}
        {assessmentResults?.subscaleScores && Object.keys(assessmentResults.subscaleScores).length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
            borderRadius: '12px',
            padding: '25px',
            marginBottom: '25px',
            border: '1px solid #fbbf24'
          }}>
            <h3 style={{
              color: '#d97706',
              fontSize: '1.2rem',
              fontWeight: '700',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📊 Puntajes por Subescala
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '12px'
            }}>
              {Object.entries(assessmentResults.subscaleScores).map(([subscaleName, score]) => {
                // Calcular puntaje máximo dinámicamente para esta subescala
                const subscaleItems = templateData.items?.filter(item => item.subscale === subscaleName) || [];
                const maxScore = subscaleItems.reduce((max, item) => {
                  const responseOptions = (templateData as any).responseOptions?.filter((opt: any) => 
                    opt.responseGroup === (item as any).responseGroup
                  ) || [];
                  const itemMaxScore = Math.max(...responseOptions.map((opt: any) => opt.scoreValue || 0));
                  return max + (itemMaxScore || 0);
                }, 0);
                
                // Formatear nombre de subescala más legible
                const displayName = subscaleName.charAt(0).toUpperCase() + subscaleName.slice(1).replace(/([A-Z])/g, ' $1');
                
                return (
                  <div key={subscaleName} style={{
                    background: 'white',
                    borderRadius: '8px',
                    padding: '16px',
                    border: '1px solid #fbbf24',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#d97706', marginBottom: '4px' }}>
                      {score as number}/{maxScore}
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333', marginBottom: '4px' }}>
                      {displayName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>
                      {subscaleItems.length} ítems
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '2px solid #e2e8f0'
        }}>
          <button
            onClick={async () => {
              try {
                const { clinimetrixPDFGenerator } = await import('@/lib/utils/pdf-generator');
                
                const pdfData = {
                  scaleName: templateData.name,
                  scaleAbbreviation: templateData.abbreviation,
                  patientName: selectedPatientData ? `${selectedPatientData.first_name} ${selectedPatientData.paternal_last_name}` : 'Anónimo',
                  patientAge: selectedPatientData?.age,
                  date: new Date().toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }),
                  totalScore: assessmentResults.totalScore,
                  maxPossibleScore: assessmentResults.maxPossibleScore,
                  severityLevel: assessmentResults.interpretation?.primaryInterpretation || 'No determinado',
                  interpretation: {
                    description: assessmentResults.interpretation?.description,
                    clinicalInterpretation: assessmentResults.interpretation?.clinicalInterpretation,
                    professionalRecommendations: assessmentResults.interpretation?.professionalRecommendations,
                    prognosticImplications: assessmentResults.interpretation?.prognosticImplications,
                    color: assessmentResults.interpretation?.color
                  },
                  subscaleScores: assessmentResults.subscaleScores?.map((sub: any) => ({
                    name: sub.name,
                    score: sub.score,
                    severity: sub.severity
                  })),
                  completionTime: assessmentResults.completionTime,
                  templateData: templateData
                };
                
                await clinimetrixPDFGenerator.generateAssessmentPDF(pdfData);
              } catch (error) {
                console.error('Error generating PDF:', error);
                alert('Error al generar el PDF. Por favor, intenta de nuevo.');
              }
            }}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #29A98C, #112F33)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '14px 20px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            📥 Descargar PDF
          </button>
          
          <button
            onClick={async () => {
              try {
                const { clinimetrixPDFGenerator } = await import('@/lib/utils/pdf-generator');
                await clinimetrixPDFGenerator.printResults();
              } catch (error) {
                console.error('Error printing:', error);
                alert('Error al imprimir. Por favor, intenta de nuevo.');
              }
            }}
            style={{
              flex: 1,
              background: 'white',
              color: '#112F33',
              border: '2px solid #e2e8f0',
              borderRadius: '10px',
              padding: '14px 20px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            🖨️ Imprimir
          </button>
          
          <button
            onClick={onExit}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #6b7280, #374151)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '14px 20px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            🏠 Finalizar
          </button>
        </div>
      </div>
    );
  };

  const renderCard = () => {
    const hasPatientCard = !!(templateData?.instructionsPatient);
    
    if (currentCard === 0) {
      return renderConfigurationCard();
    } else if (currentCard === 0.5 && hasPatientCard) {
      return renderPatientInstructionsCard();
    } else if (currentCard >= 1 && currentCard <= (templateData?.totalItems || 0)) {
      return renderQuestionCard(currentCard);
    } else if (currentCard === (templateData?.totalItems || 0) + 1) {
      return renderCompletionCard();
    } else if (assessmentResults) {
      return renderResultsCard();
    }
    return null;
  };

  if (!isMounted) {
    return null;
  }

  const modalContent = (
    <>
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999
        }}>
          <div style={{ color: 'white', textAlign: 'center' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            Cargando escala...
          </div>
        </div>
      )}

      {error && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            textAlign: 'center',
            maxWidth: '400px'
          }}>
            <div style={{ color: '#ef4444', marginBottom: '15px' }}>❌ Error</div>
            <p style={{ marginBottom: '20px' }}>{error}</p>
            <button
              onClick={onExit}
              style={{
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                cursor: 'pointer'
              }}
            >
              Volver
            </button>
          </div>
        </div>
      )}

      {!loading && !error && (
    <div style={{
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      height: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '20px',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 999999,
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      <div style={{
        maxWidth: '490px',
        width: '100%',
        position: 'relative',
        marginTop: '10px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '20px',
          padding: '0',
          boxShadow: '0 25px 50px rgba(41, 169, 140, 0.15), 0 10px 20px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
          textAlign: 'center',
          position: 'relative',
          minHeight: 'auto',
          border: '1px solid rgba(41, 169, 140, 0.1)',
          overflow: 'hidden',
          transform: 'translateY(0)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {renderCard()}
        </div>

        {/* Modal de ayuda */}
        {showHelpModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '30px',
              maxWidth: '500px',
              margin: '20px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
              position: 'relative'
            }}>
              <button
                onClick={() => setShowHelpModal(false)}
                style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>

              <h3 style={{
                color: '#29A98C',
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                💡 Información de Ayuda
              </h3>

              <div style={{ color: '#333', lineHeight: '1.6' }}>
                <h4 style={{ color: '#112F33', fontWeight: '600', marginBottom: '12px' }}>
                  Sobre esta escala:
                </h4>
                <p style={{ marginBottom: '16px', fontSize: '0.95rem' }}>
                  {templateData?.description}
                </p>

                <h4 style={{ color: '#112F33', fontWeight: '600', marginBottom: '12px' }}>
                  Instrucciones:
                </h4>
                <ul style={{ marginLeft: '20px', marginBottom: '16px', fontSize: '0.95rem' }}>
                  <li>Lea cada pregunta cuidadosamente</li>
                  <li>Seleccione la respuesta que mejor describe su situación</li>
                  <li>No hay respuestas correctas o incorrectas</li>
                  <li>Responda de forma honesta y espontánea</li>
                </ul>

                <h4 style={{ color: '#112F33', fontWeight: '600', marginBottom: '12px' }}>
                  Navegación:
                </h4>
                <ul style={{ marginLeft: '20px', fontSize: '0.95rem' }}>
                  <li>La evaluación avanza automáticamente al seleccionar una respuesta</li>
                  <li>Puede regresar a preguntas anteriores usando el botón ←</li>
                  <li>Use este botón ? en cualquier momento para obtener ayuda</li>
                </ul>
              </div>

              <div style={{ textAlign: 'center', marginTop: '25px' }}>
                <button
                  onClick={() => setShowHelpModal(false)}
                  style={{
                    background: 'linear-gradient(135deg, #29A98C, #112F33)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px 24px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
      )}
    </>
  );

  return createPortal(modalContent, document.body);
};

export default ClinimetrixProAssessmentModal;