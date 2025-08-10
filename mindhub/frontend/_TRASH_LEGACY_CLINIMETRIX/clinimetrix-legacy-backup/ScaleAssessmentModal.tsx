'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { clinimetrixApi, Scale } from '@/lib/api/clinimetrix-client';
import { expedixApi } from '@/lib/api/expedix-client';

interface ScaleAssessmentModalProps {
  selectedScale: Scale;
  onBack: () => void;
  onComplete: (results: any) => void;
  fullscreen?: boolean;
}

interface Patient {
  id: string;
  first_name: string;
  paternal_last_name?: string;
  maternal_last_name?: string;
}

interface ScaleItem {
  id: string;
  number: number;
  text: string;
  responseOptions?: ResponseOption[];
  helpText?: string;
}

interface ResponseOption {
  value: string;
  label: string;
  score: number;
}

interface ScaleData {
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
}

interface Subscale {
  id: string;
  name: string;
  items: number[];
  min_score: number;
  max_score: number;
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

export const ScaleAssessmentModal: React.FC<ScaleAssessmentModalProps> = ({
  selectedScale,
  onBack,
  onComplete,
  fullscreen = false
}) => {
  // Estados principales
  const [currentCard, setCurrentCard] = useState(0);
  const [scaleData, setScaleData] = useState<ScaleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para configuración
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedPatientData, setSelectedPatientData] = useState<Patient | null>(null);
  const [administrationMode, setAdministrationMode] = useState<'presencial-mismo' | 'presencial-otro' | 'distancia'>('presencial-mismo');
  const [selectedAdminMode, setSelectedAdminMode] = useState<'clinician' | 'patient'>('clinician');
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  
  // Estados para búsqueda de pacientes
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([]);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [showPatientResults, setShowPatientResults] = useState(false);
  
  // Estados para evaluación
  const [responses, setResponses] = useState<Record<number, { value: string; label: string; score: number }>>({});
  const [assessmentResults, setAssessmentResults] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para modal de ayuda
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Cargar datos de la escala
  useEffect(() => {
    loadScaleDetails();
  }, [selectedScale.id]);

  // Función para calcular el color de severidad basado en el porcentaje de puntuación
  const getSeverityColor = (percentage: number) => {
    if (percentage <= 30) {
      return {
        color: '#22c55e', // Verde - Baja severidad
        label: 'Bajo'
      };
    } else if (percentage <= 60) {
      return {
        color: '#fbbf24', // Amarillo - Severidad moderada
        label: 'Moderado'
      };
    } else if (percentage <= 80) {
      return {
        color: '#f97316', // Naranja - Severidad alta
        label: 'Alto'
      };
    } else {
      return {
        color: '#ef4444', // Rojo - Severidad muy alta
        label: 'Muy Alto'
      };
    }
  };

  const loadScaleDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading scale details for:', selectedScale.id);
      
      // Usar cliente API oficial en lugar de fetch directo
      const backendScale = await clinimetrixApi.getScale(selectedScale.id);
      
      // Transform the response to match our interface
      const scaleData: ScaleData = {
        id: backendScale.id,
        name: backendScale.name,
        abbreviation: backendScale.abbreviation || '',
        description: backendScale.description,
        items: backendScale.items || [],
        responseOptions: backendScale.responseOptions || [],
        administrationMode: backendScale.administrationMode || 'self_administered',
        totalItems: backendScale.totalItems || backendScale.items?.length || 0,
        estimatedDurationMinutes: backendScale.estimatedDuration,
        instructionsPatient: backendScale.instructionsPatient || backendScale.instructions_patient,
        instructionsProfessional: backendScale.instructionsProfessional || backendScale.instructions_professional,
        interpretationRules: backendScale.interpretationRules || [],
        subscales: backendScale.subscales || []
      };
      
      // Validación básica de datos
      if (!backendScale.items || backendScale.items.length === 0) {
        console.error('❌ No items found in scale data');
      }
      
      // Write debug info to file for inspection
      try {
        const debugInfo = {
          timestamp: new Date().toISOString(),
          scaleId: selectedScale.id,
          backendItemsCount: backendScale.items?.length || 0,
          transformedItemsCount: scaleData.items.length,
          firstItems: scaleData.items.slice(0, 3).map(item => ({ id: item.id, number: item.number, text: item.text.substring(0, 50) })),
          responseOptionsCount: scaleData.responseOptions.length
        };
        console.log('📋 DEBUG SUMMARY:', JSON.stringify(debugInfo, null, 2));
      } catch (e) {
        console.log('Debug logging failed:', e);
      }
      
      if (scaleData.items.length === 0) {
        console.error('❌ CRITICAL: No items found in scale data!');
        console.error('❌ Backend raw items:', backendScale.items);
      }
      
      setScaleData(scaleData);
    } catch (err) {
      console.error('❌ Error loading scale details:', err);
      setError('Error al cargar los detalles de la escala');
    } finally {
      setLoading(false);
    }
  };

  // Búsqueda mejorada de pacientes
  const searchPatients = async (query: string) => {
    // Buscar pacientes
    
    if (!query.trim() || query.length < 3) {
      // Query muy corto, limpiar resultados
      setPatientSearchResults([]);
      setIsSearchingPatients(false);
      return;
    }

    // Iniciar búsqueda de pacientes
    setIsSearchingPatients(true);
    
    try {
      const url = `http://localhost:8080/api/expedix/patients?search=${encodeURIComponent(query)}&limit=10`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setPatientSearchResults(data.data);
        // Pacientes encontrados exitosamente
      } else {
        console.error('❌ Error en respuesta del servidor:', data.error || 'No data field');
        setPatientSearchResults([]);
      }
    } catch (error) {
      console.error('❌ Error de red al buscar pacientes:', error);
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

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatientData(patient);
    const fullName = `${patient.first_name} ${patient.paternal_last_name || ''}`.trim();
    setSelectedPatient(fullName);
    setPatientSearchQuery(fullName);
    setShowPatientResults(false);
  };

  const handleResponseChange = useCallback((itemNumber: number, option: ResponseOption) => {
    // Manejar respuesta del usuario
    
    setResponses(prev => ({
      ...prev,
      [itemNumber]: {
        value: option.value,
        label: option.label,
        score: option.score
      }
    }));

    // Avance automático más rápido - reducir lag
    setTimeout(() => {
      if (scaleData && itemNumber < scaleData.totalItems) {
        setCurrentCard(itemNumber + 1);
      } else if (scaleData && itemNumber === scaleData.totalItems) {
        setCurrentCard(scaleData.totalItems + 1); // Card completada
      }
    }, 200);
  }, [scaleData]);

  const calculateResults = () => {
    if (!scaleData) return null;

    // Cálculo universal de puntuaciones
    
    // 1. CALCULAR PUNTUACIÓN TOTAL (Score bruto)
    const totalScore = Object.values(responses).reduce((sum, response) => sum + response.score, 0);
    
    // 2. CALCULAR PUNTUACIONES POR SUBESCALAS
    
    const subscaleScores = scaleData?.subscales?.map(subscale => {
      // Asegurar que items sea un array
      const items = Array.isArray(subscale.items) ? subscale.items : 
                   (typeof subscale.items === 'string' ? JSON.parse(subscale.items) : []);
      
      const subscaleScore = items.reduce((sum, itemNumber) => {
        const response = responses[itemNumber];
        const score = response?.score || 0;
        return sum + score;
      }, 0);
      
      return {
        id: subscale.id,
        name: subscale.name,
        items: items,
        score: subscaleScore,
        maxScore: subscale.max_score,
        minScore: subscale.min_score,
        percentage: (subscaleScore / subscale.max_score) * 100,
        description: subscale.description,
        cronbachAlpha: subscale.indice_cronbach,
        references: subscale.referencias_bibliograficas
      };
    }) || [];

    // 3. BUSCAR INTERPRETACIÓN CLÍNICA SEGÚN SCORE
    let interpretation = null;
    
    if (scaleData.interpretationRules && Array.isArray(scaleData.interpretationRules) && scaleData.interpretationRules.length > 0) {
      const matchingRule = scaleData.interpretationRules.find(rule => {
        const minScore = typeof rule.minScore === 'string' ? parseInt(rule.minScore) : rule.minScore;
        const maxScore = typeof rule.maxScore === 'string' ? parseInt(rule.maxScore) : rule.maxScore;
        return totalScore >= minScore && totalScore <= maxScore;
      });
      
      if (matchingRule) {
        interpretation = {
          severity: matchingRule.severityLevel,
          label: matchingRule.label,
          color: matchingRule.color || '#29A98C',
          description: matchingRule.description || 'Sin descripción disponible',
          recommendations: matchingRule.recommendations || 'Sin recomendaciones disponibles',
          clinicalRange: matchingRule.severityLevel?.toUpperCase() || 'UNKNOWN',
          scoreRange: `${matchingRule.minScore}-${matchingRule.maxScore}`
        };
      }
    }
    
    // Fallback interpretation
    if (!interpretation) {
      interpretation = { 
        severity: 'error', 
        label: 'ERROR: Sin interpretación disponible', 
        color: '#dc2626', 
        description: 'No se pudo determinar la interpretación para esta puntuación',
        recommendations: 'Verificar configuración de la escala',
        clinicalRange: 'ERROR',
        scoreRange: 'N/A'
      };
    }

    // 4. IDENTIFICAR ÍTEMS DE ALERTA PRIORITARIA
    const highRiskItems = [];
    Object.entries(responses).forEach(([itemNumber, response]) => {
      const itemNum = parseInt(itemNumber);
      const item = scaleData.items.find(i => i.number === itemNum);
      
      // Verificar si el ítem tiene alerta configurada
      if (item?.alertTrigger && item?.alertCondition) {
        const score = response.score;
        const condition = item.alertCondition;
        
        let triggersAlert = false;
        if (condition.startsWith('≥') || condition.startsWith('>=')) {
          const threshold = parseInt(condition.replace(/[≥>=]/g, ''));
          triggersAlert = score >= threshold;
        } else if (condition.startsWith('=')) {
          const threshold = parseInt(condition.replace('=', ''));
          triggersAlert = score === threshold;
        } else if (condition.startsWith('>')) {
          const threshold = parseInt(condition.replace('>', ''));
          triggersAlert = score > threshold;
        }
        
        if (triggersAlert) {
          highRiskItems.push({
            itemNumber: itemNum,
            itemText: item.text,
            score: score,
            maxScore: Math.max(...(item.responseOptions || scaleData.responseOptions || []).map(opt => opt.score || 0)),
            alertCondition: condition,
            selectedOption: response.label
          });
        }
      }
    });

    // 5. ANÁLISIS ESPECÍFICOS (si aplican)
    const specificAnalysis = {};
    
    // Para BDI-21: Análisis del sueño (ítem 16)
    if (scaleData.id === 'bdi-21' && responses[16]) {
      const sleepResponse = responses[16];
      const sleepPatterns = [
        {
          type: "Sin alteraciones del sueño",
          description: "No se identifican trastornos del sueño significativos.",
          clinical: "No requiere intervención específica para trastornos del sueño."
        },
        {
          type: "Sueño no reparador", 
          description: "Fatiga matutina a pesar de horas aparentemente adecuadas.",
          clinical: "Evaluar higiene del sueño, descartar trastornos respiratorios."
        },
        {
          type: "Despertar precoz clásico",
          description: "Despertar temprano con incapacidad para retomar el sueño.",
          clinical: "Altamente asociado con depresión mayor. Considerar tratamiento antidepresivo."
        },
        {
          type: "Insomnio de conciliación",
          description: "Dificultad para iniciar el sueño con latencia prolongada.",
          clinical: "Técnicas de relajación, higiene del sueño, manejo de ansiedad."
        }
      ];
      
      const sleepScore = sleepResponse.score;
      if (sleepScore < sleepPatterns.length) {
        specificAnalysis.sleep = sleepPatterns[sleepScore];
      }
    }

    const completedItems = Object.keys(responses).length;
    const completionPercentage = (completedItems / scaleData.totalItems) * 100;

    // 6. RETORNAR SCORING COMPLETO
    const scoring = {
      rawScore: totalScore,
      maxPossibleScore: scaleData.scoreRangeMax || (scaleData.totalItems * 4), // Usar scoreRangeMax del backend o calcular para GADI (0-4)
      interpretation: interpretation.label,
      clinicalRange: interpretation.clinicalRange,
      recommendations: interpretation.recommendations ? 
        (typeof interpretation.recommendations === 'string' ? 
          interpretation.recommendations.split('\n').filter(r => r.trim() !== '') : 
          [interpretation.recommendations]) : 
        [],
      subscaleScores: subscaleScores,
      highRiskItems: highRiskItems,
      specificAnalysis: specificAnalysis
    };

    // Scoring completo calculado

    return {
      totalScore,
      maxPossibleScore: scoring.maxPossibleScore,
      completionPercentage,
      interpretation,
      subscaleScores,
      highRiskItems,
      specificAnalysis,
      scoring, // Objeto completo de scoring
      responses: Object.entries(responses).map(([itemNumber, response]) => ({
        itemNumber: parseInt(itemNumber),
        ...response
      })),
      alerts: [],
      calculatedAt: new Date().toISOString()
    };
  };

  const completeAssessment = async () => {
    setIsSubmitting(true);
    try {
      const results = calculateResults();
      setAssessmentResults(results);
      setCurrentCard(scaleData ? scaleData.totalItems + 2 : 999); // Card de resultados
    } catch (error) {
      console.error('Error completing assessment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToNextCard = () => {
    if (!scaleData) return;
    
    // Lógica universal de administración - MOSTRAR SIEMPRE LAS INSTRUCCIONES
    const determineShowPatientInstructions = () => {
      // Siempre mostrar las instrucciones del paciente si existen
      return !!(scaleData?.instructionsPatient);
    };
    
    const hasPatientCard = determineShowPatientInstructions();
    
    if (currentCard === 0) {
      // De configuración a instrucciones paciente o primer ítem
      const nextCard = hasPatientCard ? 0.5 : 1;
      setCurrentCard(nextCard);
      // Iniciar timer cuando empiece la evaluación real
      if (nextCard === 1 && !startTime) {
        setStartTime(Date.now());
      }
    } else if (currentCard === 0.5) {
      // De instrucciones paciente a primer ítem
      setCurrentCard(1);
      // Iniciar timer cuando empiece la evaluación real
      if (!startTime) {
        setStartTime(Date.now());
      }
    } else if (currentCard <= scaleData.totalItems) {
      // De ítem a ítem o card completada
      if (currentCard === scaleData.totalItems) {
        setCurrentCard(scaleData.totalItems + 1); // Card completada
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
      // Para la card de configuración
      const hasPatient = selectedPatient.trim() !== '';
      
      // Si la escala requiere selección de modo de administración
      if (scaleData?.administrationMode === 'both') {
        return hasPatient && selectedAdminMode !== '';
      }
      
      return hasPatient;
    } else if (currentCard >= 1 && currentCard <= (scaleData?.totalItems || 0)) {
      return responses[currentCard] !== undefined;
    }
    return true;
  };

  const renderConfigurationCard = () => (
    <div style={{ padding: '20px' }}>
      <h1 style={{ 
        color: '#29A98C', 
        marginBottom: '8px',
        fontSize: '2rem',
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: '1.2'
      }}>
        {scaleData?.name} {scaleData?.abbreviation && `(${scaleData.abbreviation})`}
      </h1>
      <p style={{ 
        color: '#666', 
        marginBottom: '20px',
        fontSize: '1rem',
        fontWeight: '600',
        textAlign: 'center'
      }}>
        ⚙️ Configuración de Evaluación
      </p>

      {/* Información de la escala */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '20px', 
        marginBottom: '25px',
        fontSize: '0.8rem',
        color: '#666'
      }}>
        <div>📝 {scaleData?.totalItems} ítems</div>
        <div>⏱️ {scaleData?.estimatedDurationMinutes || selectedScale.estimated_duration_minutes} min</div>
      </div>

      {/* Instrucciones para el profesional */}
      {scaleData?.instructionsProfessional && (
        <div style={{ 
          background: '#e8f5f3',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '25px',
          textAlign: 'left'
        }}>
          <h3 style={{ 
            color: '#29A98C', 
            marginBottom: '12px',
            fontSize: '1rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            👨‍⚕️ Instrucciones para el Profesional
          </h3>
          <p style={{ 
            color: '#333', 
            fontSize: '0.9rem',
            lineHeight: '1.5',
            margin: '0'
          }}>
            {scaleData.instructionsProfessional}
          </p>
        </div>
      )}

      {/* Enhanced Patient Selection */}
      <div style={{ marginBottom: '25px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '12px', 
          color: '#112F33', 
          fontWeight: '600',
          textAlign: 'left',
          fontSize: '1rem'
        }}>
          👤 Seleccionar Paciente
        </label>

        {/* Selected Patient Display */}
        {selectedPatientData && (
          <div style={{
            background: 'linear-gradient(135deg, #e8f5f3, #f0f9f7)',
            border: '2px solid #29A98C',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ 
                fontWeight: '600', 
                color: '#112F33',
                fontSize: '1.1rem',
                marginBottom: '4px'
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

        {/* Simplified Search Input - only show if no patient selected */}
        {!selectedPatientData && (
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={patientSearchQuery}
              onChange={(e) => {
                setPatientSearchQuery(e.target.value);
                console.log('🔍 Buscando:', e.target.value);
              }}
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
                // Delay hiding results to allow clicking
                setTimeout(() => {
                  setShowPatientResults(false);
                }, 200);
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

            {/* Fixed position dropdown that stays within modal */}
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
                    {patientSearchResults.slice(0, 8).map((patient) => (
                      <div
                        key={patient.id}
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevent blur from firing first
                          handleSelectPatient(patient);
                        }}
                        style={{
                          padding: '12px',
                          cursor: 'pointer',
                          borderBottom: patientSearchResults.indexOf(patient) !== patientSearchResults.length - 1 ? '1px solid #f1f5f9' : 'none',
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
                ) : patientSearchQuery.length > 2 ? (
                  <div style={{ 
                    padding: '16px', 
                    textAlign: 'center', 
                    color: '#666'
                  }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>😔</div>
                    <div style={{ fontSize: '0.9rem' }}>
                      No se encontraron pacientes
                    </div>
                    <div style={{ fontSize: '0.75rem', marginTop: '4px', color: '#999' }}>
                      Intenta con otro nombre
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    padding: '16px', 
                    textAlign: 'center', 
                    color: '#999',
                    fontSize: '0.85rem'
                  }}>
                    Escribe al menos 3 caracteres para buscar
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Status indicators */}
        {!selectedPatientData && (
          <div style={{ marginTop: '8px' }}>
            {!patientSearchQuery ? (
              <div style={{
                padding: '12px',
                background: '#fefefe',
                border: '1px solid #f0f0f0',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: '#666'
              }}>
                💡 <strong>Tip:</strong> Escribe al menos 3 caracteres para buscar pacientes
              </div>
            ) : patientSearchQuery.length < 3 ? (
              <div style={{
                padding: '12px',
                background: '#fff8e1',
                border: '1px solid #ffecb3',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: '#f57c00'
              }}>
                ⏳ Escribe al menos 3 caracteres para buscar...
              </div>
            ) : isSearchingPatients ? (
              <div style={{
                padding: '12px',
                background: '#e8f5f3',
                border: '1px solid #29A98C',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: '#29A98C',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ animation: 'spin 1s linear infinite' }}>🔄</span>
                <strong>Buscando pacientes...</strong>
              </div>
            ) : patientSearchResults.length === 0 && patientSearchQuery.length >= 3 ? (
              <div style={{
                padding: '12px',
                background: '#ffebee',
                border: '1px solid #ffcdd2',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: '#d32f2f'
              }}>
                😔 No se encontraron pacientes con "{patientSearchQuery}"
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Simplified Administration Mode */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #e8f5f3, #f0f9f7)',
          border: '2px solid #29A98C',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ 
              color: '#112F33', 
              marginBottom: '4px',
              fontSize: '1.1rem',
              fontWeight: '600'
            }}>
              🏥 Evaluación Presencial
            </h3>
            <p style={{ 
              color: '#29A98C', 
              fontSize: '0.9rem',
              margin: '0'
            }}>
              Modo recomendado: El paciente responde en este dispositivo
            </p>
          </div>
          
          {!showAdvancedConfig && (
            <button
              onClick={() => setShowAdvancedConfig(true)}
              style={{
                background: 'white',
                border: '1px solid #29A98C',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#29A98C',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#29A98C';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#29A98C';
              }}
            >
              ⚙️ Opciones avanzadas
            </button>
          )}
        </div>

        {/* Advanced Configuration Panel */}
        {showAdvancedConfig && (
          <div style={{
            marginTop: '15px',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <h4 style={{ 
                color: '#112F33', 
                fontSize: '1rem',
                fontWeight: '600',
                margin: '0'
              }}>
                ⚙️ Configuración Avanzada
              </h4>
              <button
                onClick={() => setShowAdvancedConfig(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '4px'
                }}
                title="Cerrar opciones avanzadas"
              >
                ✕
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '8px' }}>
              {/* Presencial - Mismo Dispositivo */}
              <button
                onClick={() => {
                  setAdministrationMode('presencial-mismo');
                  setShowAdvancedConfig(false);
                }}
                style={{
                  background: administrationMode === 'presencial-mismo' 
                    ? 'linear-gradient(135deg, #29A98C, #112F33)' 
                    : 'white',
                  color: administrationMode === 'presencial-mismo' ? 'white' : '#112F33',
                  border: `1px solid ${administrationMode === 'presencial-mismo' ? '#29A98C' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  fontSize: '0.9rem'
                }}
              >
                <strong>🏥 Presencial - Mismo Dispositivo</strong>
                <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '2px' }}>
                  El paciente responde en este dispositivo (recomendado)
                </div>
              </button>

              {/* Presencial - Dispositivo Secundario */}
              <button
                onClick={() => {
                  setAdministrationMode('presencial-otro');
                  setShowAdvancedConfig(false);
                }}
                style={{
                  background: administrationMode === 'presencial-otro' 
                    ? 'linear-gradient(135deg, #29A98C, #112F33)' 
                    : 'white',
                  color: administrationMode === 'presencial-otro' ? 'white' : '#112F33',
                  border: `1px solid ${administrationMode === 'presencial-otro' ? '#29A98C' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  fontSize: '0.9rem'
                }}
              >
                <strong>📱 Presencial - Dispositivo Secundario</strong>
                <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '2px' }}>
                  El paciente responde en su propio dispositivo
                </div>
              </button>

              {/* A Distancia */}
              <button
                onClick={() => {
                  setAdministrationMode('distancia');
                  setShowAdvancedConfig(false);
                }}
                style={{
                  background: administrationMode === 'distancia' 
                    ? 'linear-gradient(135deg, #29A98C, #112F33)' 
                    : 'white',
                  color: administrationMode === 'distancia' ? 'white' : '#112F33',
                  border: `1px solid ${administrationMode === 'distancia' ? '#29A98C' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  fontSize: '0.9rem'
                }}
              >
                <strong>🌐 A Distancia</strong>
                <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '2px' }}>
                  Generar link para enviar por correo electrónico
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selector de modo de administración para escalas tipo 'both' */}
      {scaleData?.administrationMode === 'both' && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '12px',
          padding: '20px',
          marginTop: '20px',
          border: '1px solid #e2e8f0'
        }}>
          <h4 style={{ 
            margin: '0 0 15px 0', 
            color: '#112F33', 
            fontSize: '1.1rem', 
            fontWeight: '600' 
          }}>
            🎯 Método de Administración
          </h4>
          <p style={{ 
            margin: '0 0 15px 0', 
            color: '#666', 
            fontSize: '0.9rem',
            lineHeight: '1.4'
          }}>
            Esta escala puede ser administrada de ambas formas. Selecciona cómo será aplicada:
          </p>
          
          <div style={{ display: 'grid', gap: '10px' }}>
            {/* Autoaplicada */}
            <button
              onClick={() => setSelectedAdminMode('patient')}
              style={{
                background: selectedAdminMode === 'patient' 
                  ? 'linear-gradient(135deg, #29A98C, #112F33)' 
                  : 'rgba(255, 255, 255, 0.8)',
                color: selectedAdminMode === 'patient' ? 'white' : '#112F33',
                border: `2px solid ${selectedAdminMode === 'patient' ? '#29A98C' : '#e2e8f0'}`,
                borderRadius: '8px',
                padding: '12px 16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'left',
                fontSize: '0.9rem',
                lineHeight: '1.3'
              }}
              onMouseEnter={(e) => {
                if (selectedAdminMode !== 'patient') {
                  e.currentTarget.style.borderColor = '#29A98C';
                  e.currentTarget.style.background = 'rgba(41, 169, 140, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(41, 169, 140, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedAdminMode !== 'patient') {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <strong>👤 Autoaplicada</strong>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>
                El paciente responde las preguntas por sí mismo
              </p>
            </button>

            {/* Heteroaplicada */}
            <button
              onClick={() => setSelectedAdminMode('clinician')}
              style={{
                background: selectedAdminMode === 'clinician' 
                  ? 'linear-gradient(135deg, #29A98C, #112F33)' 
                  : 'rgba(255, 255, 255, 0.8)',
                color: selectedAdminMode === 'clinician' ? 'white' : '#112F33',
                border: `2px solid ${selectedAdminMode === 'clinician' ? '#29A98C' : '#e2e8f0'}`,
                borderRadius: '8px',
                padding: '12px 16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textAlign: 'left',
                fontSize: '0.9rem',
                lineHeight: '1.3'
              }}
              onMouseEnter={(e) => {
                if (selectedAdminMode !== 'clinician') {
                  e.currentTarget.style.borderColor = '#29A98C';
                  e.currentTarget.style.background = 'rgba(41, 169, 140, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(41, 169, 140, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedAdminMode !== 'clinician') {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <strong>👨‍⚕️ Heteroaplicada</strong>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>
                El profesional lee las preguntas y registra las respuestas
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '30px' }}>
        <button
          onClick={onBack}
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
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2 style={{ 
        color: '#29A98C', 
        marginBottom: '20px',
        fontSize: '1.5rem',
        fontWeight: '700'
      }}>
        📖 {scaleData?.name}
      </h2>
      
      {/* Instrucciones para el paciente */}
      <div style={{ 
        background: '#f8f9fa',
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '30px',
        textAlign: 'left'
      }}>
        <h3 style={{ 
          color: '#29A98C', 
          marginBottom: '15px',
          fontSize: '1.1rem',
          fontWeight: '600',
          textAlign: 'center'
        }}>
          Instrucciones
        </h3>
        <div style={{ 
          color: '#333', 
          fontSize: '1rem',
          lineHeight: '1.6',
          marginBottom: '0',
          whiteSpace: 'pre-wrap'
        }}>
          {scaleData?.instructionsPatient || 'Lea cuidadosamente cada pregunta y seleccione la respuesta que mejor describa su situación actual.'}
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
    <div className="animate-modal-fade-in" style={{ textAlign: 'center', padding: '20px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #e8f5f3, #f0fdfa)',
        borderRadius: '20px',
        padding: '30px',
        marginBottom: '20px'
      }}>
        <div style={{ 
          fontSize: '4rem', 
          marginBottom: '15px',
          color: '#29A98C'
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
          setCurrentCard(scaleData ? scaleData.totalItems + 2 : 0);
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
    if (!scaleData) {
      return <div>No hay datos de la escala</div>;
    }

    // Buscar item eficientemente
    const item = scaleData.items.find(i => i.itemNumber === itemNumber) || scaleData.items[itemNumber - 1];
    
    if (!item) {
      return <div>Ítem {itemNumber} no encontrado</div>;
    }

    const itemText = item.text || item.itemText || 'Sin texto';
    const currentResponse = responses[itemNumber];
    
    // Lógica de opciones optimizada con memoización
    let responseOptions = [];
    
    // 1. PRIORIDAD MÁS ALTA: Opciones específicas del ítem (para BDI-21, etc.)
    if (item.specificOptions && Array.isArray(item.specificOptions) && item.specificOptions.length > 0) {
      responseOptions = item.specificOptions;
    }
    // 2. SEGUNDA PRIORIDAD: Opciones del grupo de respuesta del ítem (para Vanderbilt, etc.)
    else if (item.responseOptions && Array.isArray(item.responseOptions) && item.responseOptions.length > 0) {
      responseOptions = item.responseOptions;
    }
    // 3. TERCERA PRIORIDAD: Opciones globales de la escala (para STAI, etc.)
    else if (scaleData.responseOptions && Array.isArray(scaleData.responseOptions) && scaleData.responseOptions.length > 0) {
      responseOptions = scaleData.responseOptions;
    }
    else {
      // Usar opciones por defecto si no hay nada
      responseOptions = [
        { value: '0', label: 'Nunca', score: 0 },
        { value: '1', label: 'Algunas veces', score: 1 },
        { value: '2', label: 'Frecuentemente', score: 2 },
        { value: '3', label: 'Casi siempre', score: 3 }
      ];
    }

    // Validar que tenemos opciones disponibles
    if (!responseOptions || responseOptions.length === 0) {
      return <div>Error: No hay opciones de respuesta disponibles</div>;
    }

    return (
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Texto de la pregunta - más prominente */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ 
            color: '#1a1a1a', 
            marginBottom: '20px', 
            lineHeight: '1.5', 
            textAlign: 'center',
            fontSize: '1.4rem',
            fontWeight: '600',
            padding: '20px 0',
            minHeight: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {itemText}
          </h2>

        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {responseOptions.map((option) => {
            const optionValue = option.optionValue || option.value || option.id;
            const optionLabel = option.optionLabel || option.label || option.optionText || option.text || 'Sin texto';
            const optionScore = option.score || option.scoreValue || 0;
            
            return (
            <button
              key={optionValue}
              onClick={() => handleResponseChange(itemNumber, { ...option, value: optionValue, label: optionLabel, score: optionScore })}
              style={{
                background: currentResponse?.value === optionValue ? '#29A98C' : 'white',
                color: currentResponse?.value === optionValue ? 'white' : '#333',
                border: '2px solid #29A98C',
                borderRadius: '12px',
                padding: '15px 20px',
                cursor: 'pointer',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                if (currentResponse?.value !== optionValue) {
                  e.currentTarget.style.backgroundColor = '#f0f9f7';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(41, 169, 140, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentResponse?.value !== optionValue) {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <strong>{optionLabel}</strong>
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

          {/* Botón Ayuda - Solo visible si hay helpText para el ítem */}
          {(item.helpText || item.help_text) && (
            <button
              onClick={() => {
                // Mostrar el texto de ayuda específico del ítem
                const helpText = item.helpText || item.help_text;
                alert(`Ayuda para el ítem ${itemNumber}:\n\n${helpText}`);
              }}
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
          )}
        </div>

        {/* Barra de progreso abajo */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: '#666', fontSize: '12px' }}>
              Pregunta {itemNumber} de {scaleData.totalItems || scaleData.items?.length || 0}
            </span>
            <span style={{ color: '#666', fontSize: '12px' }}>
              {Math.round((itemNumber / (scaleData.totalItems || scaleData.items?.length || 1)) * 100)}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            background: '#e1e5e9',
            borderRadius: '3px'
          }}>
            <div style={{
              width: `${(itemNumber / (scaleData.totalItems || scaleData.items?.length || 1)) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #29A98C, #20B2AA)',
              borderRadius: '3px',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
      </div>
    );
  }, [scaleData, responses]);

  const renderResultsCard = () => {
    if (!assessmentResults) return null;
    
    // Usar los datos ya calculados del scoring
    const { totalScore, maxPossibleScore, interpretation, subscaleScores, highRiskItems, specificAnalysis, scoring } = assessmentResults;
    const scorePercentage = (totalScore / maxPossibleScore) * 100;

    return (
      <div style={{ padding: '10px' }}>
        {/* Header con información básica */}
        <div style={{ 
          textAlign: 'center',
          marginBottom: '25px'
        }}>
          <h2 style={{ 
            color: '#29A98C', 
            marginBottom: '10px',
            fontSize: '1.8rem',
            fontWeight: '700'
          }}>
            Resultados de la Evaluación
          </h2>
          <p style={{ 
            color: '#666',
            fontSize: '1rem',
            margin: '0'
          }}>
            {scaleData?.name} ({scaleData?.abbreviation})
          </p>
        </div>

        {/* Puntuación Total - Card destacada */}
        <div style={{
          background: `linear-gradient(135deg, ${assessmentResults.interpretation?.color}15 0%, ${assessmentResults.interpretation?.color}08 100%)`,
          border: `2px solid ${assessmentResults.interpretation?.color}30`,
          borderRadius: '16px',
          padding: '25px',
          textAlign: 'center',
          marginBottom: '25px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            color: assessmentResults.interpretation?.color || '#29A98C',
            marginBottom: '8px'
          }}>
            {assessmentResults.totalScore}
          </div>
          <div style={{ 
            color: '#444', 
            fontSize: '1.1rem',
            fontWeight: '600',
            marginBottom: '5px'
          }}>
            Puntuación Total
          </div>
          <div style={{ 
            color: '#666', 
            fontSize: '0.9rem'
          }}>
            Rango: 0-{maxPossibleScore} • {assessmentResults.interpretation?.label}
          </div>
        </div>

        {/* Grid de subescalas */}
        {subscaleScores.length > 0 && (
          <div>
            <h3 style={{
              color: '#333',
              fontSize: '1.2rem',
              fontWeight: '700',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              Puntuaciones por Subescalas
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: subscaleScores.length === 4 ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '15px',
              marginBottom: '25px'
            }}>
              {subscaleScores.map((subscale, index) => {
                const severityInfo = getSeverityColor(subscale.percentage);
                return (
                  <div key={subscale.id} style={{
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e8ecef 100%)',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    border: `2px solid ${severityInfo.color}30`
                  }}>
                    <div style={{ 
                      fontSize: '2rem', 
                      fontWeight: 'bold', 
                      color: severityInfo.color,
                      marginBottom: '8px',
                      textAlign: 'center'
                    }}>
                      {subscale.score}
                    </div>
                    
                    <div style={{ 
                      color: '#333', 
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      marginBottom: '4px',
                      textAlign: 'center'
                    }}>
                      {subscale.name}
                    </div>
                    
                    <div style={{ 
                      color: '#666', 
                      fontSize: '0.8rem',
                      textAlign: 'center',
                      marginBottom: '8px'
                    }}>
                      Rango: {subscale.min_score}-{subscale.max_score}
                    </div>
                    
                    {/* Indicador de severidad */}
                    <div style={{
                      background: `${severityInfo.color}20`,
                      color: severityInfo.color,
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      textAlign: 'center',
                      marginBottom: '12px',
                      border: `1px solid ${severityInfo.color}40`
                    }}>
                      Nivel: {severityInfo.label}
                    </div>
                    
                    {/* Barra de progreso por subescala */}
                    <div style={{
                      background: '#e2e8f0',
                      borderRadius: '4px',
                      height: '8px',
                      overflow: 'hidden',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        background: severityInfo.color,
                        width: `${subscale.percentage}%`,
                        height: '100%',
                        transition: 'width 0.8s ease'
                      }} />
                    </div>
                    
                    <div style={{ 
                      color: '#777', 
                      fontSize: '0.75rem',
                      textAlign: 'center'
                    }}>
                      {subscale.percentage.toFixed(1)}% del máximo
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ítems de Alerta Prioritaria */}
        {highRiskItems && highRiskItems.length > 0 && (
          <div style={{
            background: '#fef2f2',
            border: '2px solid #fecaca',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '25px'
          }}>
            <h3 style={{
              color: '#dc2626',
              fontSize: '1.2rem',
              fontWeight: '700',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              ⚠️ Ítems de Atención Prioritaria
            </h3>
            
            <p style={{
              color: '#7f1d1d',
              fontSize: '0.9rem',
              marginBottom: '15px'
            }}>
              Los siguientes ítems presentan puntuaciones elevadas que requieren atención clínica:
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {highRiskItems.map((item, index) => (
                <div key={index} style={{
                  background: 'white',
                  borderLeft: '4px solid #dc2626',
                  padding: '12px 15px',
                  borderRadius: '6px'
                }}>
                  <div style={{
                    fontWeight: '600',
                    color: '#7f1d1d',
                    marginBottom: '4px'
                  }}>
                    Ítem {item.itemNumber}: {item.itemText.substring(0, 60)}...
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#991b1b'
                  }}>
                    Puntuación: {item.score}/{item.maxScore} • Respuesta: "{item.selectedOption}"
                  </div>
                </div>
              ))}
            </div>
            
            {/* Alerta especial para ideación suicida */}
            {highRiskItems.some(item => item.itemNumber === 9) && (
              <div style={{
                background: '#7f1d1d',
                color: 'white',
                padding: '15px',
                borderRadius: '8px',
                marginTop: '15px',
                fontWeight: '600'
              }}>
                🚨 ALERTA CRÍTICA: Se detectó puntuación elevada en ideación suicida. Se requiere evaluación inmediata del riesgo.
              </div>
            )}
          </div>
        )}

        {/* Análisis Específicos (ej: análisis del sueño para BDI-21) */}
        {specificAnalysis && Object.keys(specificAnalysis).length > 0 && (
          <div style={{
            background: '#f0f9ff',
            border: '2px solid #bfdbfe',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '25px'
          }}>
            <h3 style={{
              color: '#1e40af',
              fontSize: '1.2rem',
              fontWeight: '700',
              marginBottom: '15px'
            }}>
              📊 Análisis Específicos
            </h3>
            
            {specificAnalysis.sleep && (
              <div style={{
                marginBottom: '15px'
              }}>
                <h4 style={{
                  color: '#1d4ed8',
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '10px'
                }}>
                  Análisis del Patrón de Sueño
                </h4>
                
                <div style={{
                  background: 'white',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #dbeafe'
                }}>
                  <div style={{
                    fontWeight: '600',
                    color: '#1e40af',
                    marginBottom: '8px'
                  }}>
                    Clasificación: {specificAnalysis.sleep.type}
                  </div>
                  
                  <div style={{
                    color: '#374151',
                    fontSize: '0.9rem',
                    marginBottom: '10px',
                    lineHeight: '1.5'
                  }}>
                    <strong>Descripción:</strong> {specificAnalysis.sleep.description}
                  </div>
                  
                  <div style={{
                    color: '#374151',
                    fontSize: '0.9rem',
                    lineHeight: '1.5'
                  }}>
                    <strong>Consideraciones clínicas:</strong> {specificAnalysis.sleep.clinical}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Barra de progreso visual del puntaje */}
        <div style={{
          background: '#f8f9fa',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '25px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '10px'
          }}>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>Nivel de severidad</span>
            <span style={{ 
              fontSize: '0.9rem', 
              fontWeight: '600',
              color: assessmentResults.interpretation?.color 
            }}>
              {assessmentResults.interpretation?.label}
            </span>
          </div>
          
          <div style={{
            background: '#e2e8f0',
            borderRadius: '50px',
            height: '20px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              background: `linear-gradient(90deg, ${assessmentResults.interpretation?.color}dd, ${assessmentResults.interpretation?.color})`,
              width: `${scorePercentage}%`,
              height: '100%',
              borderRadius: '50px',
              transition: 'width 1s ease',
              boxShadow: `0 0 10px ${assessmentResults.interpretation?.color}44`
            }} />
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '5px'
          }}>
            <span style={{ fontSize: '0.8rem', color: '#999' }}>0</span>
            <span style={{ fontSize: '0.8rem', color: '#999' }}>{maxPossibleScore}</span>
          </div>
        </div>

        {/* Interpretación detallada */}
        <div style={{
          background: assessmentResults.interpretation?.color + '15',
          border: `2px solid ${assessmentResults.interpretation?.color}30`,
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '25px'
        }}>
          <h3 style={{
            color: assessmentResults.interpretation?.color,
            fontSize: '1.3rem',
            fontWeight: '700',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ 
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: assessmentResults.interpretation?.color
            }}></span>
            {assessmentResults.interpretation?.label}
          </h3>
          
          <div style={{
            color: '#333',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            marginBottom: '20px'
          }}>
            <p style={{ margin: '0 0 15px 0' }}>
              {assessmentResults.interpretation?.description}
            </p>
          </div>

          <div style={{
            borderTop: `1px solid ${assessmentResults.interpretation?.color}30`,
            paddingTop: '20px'
          }}>
            <h4 style={{
              color: '#444',
              fontSize: '1.1rem',
              fontWeight: '600',
              marginBottom: '10px'
            }}>
              Recomendaciones Profesionales
            </h4>
            <p style={{
              color: '#555',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              margin: 0
            }}>
              {assessmentResults.interpretation?.recommendations}
            </p>
          </div>
        </div>

        {/* Información adicional */}
        <div style={{
          background: '#f8f9fa',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '25px',
          fontSize: '0.85rem',
          color: '#666'
        }}>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '15px'
          }}>
            <div>
              <strong>Fecha de evaluación:</strong> {new Date().toLocaleDateString('es-MX')}
            </div>
            <div>
              <strong>Hora:</strong> {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div>
              <strong>Modo de administración:</strong> {(() => {
                // Usar el administrationMode de la escala desde el backend
                if (scaleData?.administrationMode === 'self_administered') {
                  return 'Autoaplicada';
                } else if (scaleData?.administrationMode === 'clinician_administered') {
                  return 'Heteroaplicada';
                } else if (scaleData?.administrationMode === 'both') {
                  return selectedAdminMode === 'patient' ? 'Autoaplicada' : 'Heteroaplicada';
                } else {
                  return 'Flexible';
                }
              })()}
            </div>
            <div>
              <strong>Tiempo empleado:</strong> {(() => {
                if (!startTime) {
                  console.log('🎯 startTime is null, showing 0 minutes');
                  return 0;
                }
                const timeElapsed = Math.round((Date.now() - startTime) / 60000);
                console.log('🎯 startTime:', startTime);
                console.log('🎯 currentTime:', Date.now());
                console.log('🎯 timeElapsed (minutes):', timeElapsed);
                return Math.max(timeElapsed, 1); // Mínimo 1 minuto
              })()} minutos
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          justifyContent: 'center'
        }}>
          <button
            onClick={() => {
              // TODO: Implementar descarga de PDF
              console.log('Descargar PDF');
            }}
            style={{
              background: 'white',
              color: '#29A98C',
              border: '2px solid #29A98C',
              borderRadius: '8px',
              padding: '12px 25px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            📄 Descargar PDF
          </button>
          
          <button
            onClick={() => onComplete(assessmentResults)}
            style={{
              background: '#29A98C',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 30px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(41, 169, 140, 0.3)'
            }}
          >
            Finalizar Evaluación
          </button>
        </div>
      </div>
    );
  };

  const renderCard = () => {
    // Estructura de cards:
    // Card 0: Settings/Instrucciones profesional
    // Card 0.5: Instrucciones para el paciente (solo escalas autoaplicadas)
    // Card 1, 2, 3...N: Items (N = scale.totalItems)
    // Card X: Escala completada - card (scale.totalItems + 1)
    // Card R: Resultados - card (scale.totalItems + 2)
    
    // Lógica universal de administración - MOSTRAR SIEMPRE LAS INSTRUCCIONES
    const determineShowPatientInstructions = () => {
      // Siempre mostrar las instrucciones del paciente si existen
      return !!(scaleData?.instructionsPatient);
    };
    
    const hasPatientCard = determineShowPatientInstructions();
    
    if (currentCard === 0) {
      return renderConfigurationCard();
    } else if (currentCard === 0.5 && hasPatientCard) {
      return renderPatientInstructionsCard();
    } else if (currentCard >= 1 && currentCard <= (scaleData?.totalItems || 0)) {
      return renderQuestionCard(currentCard);
    } else if (currentCard === (scaleData?.totalItems || 0) + 1) {
      return renderCompletionCard();
    } else if (assessmentResults) {
      return renderResultsCard();
    }
    return null;
  };

  if (loading) {
    return (
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
        zIndex: 1000
      }}>
        <div style={{ color: 'white', textAlign: 'center' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          Cargando escala...
        </div>
      </div>
    );
  }

  if (error) {
    return (
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
        zIndex: 1000
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
            onClick={onBack}
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
    );
  }

  return (
    <div style={{
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: 'linear-gradient(135deg, var(--warm-100, #fef7ee) 0%, var(--secondary-500, #29a98c) 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      overflowY: 'auto'
    }}>
      {/* Container principal */}
      <div style={{
        maxWidth: '600px',
        width: '100%',
        position: 'relative',
        marginTop: '20px',
        paddingBottom: '80px'
      }}>
        {/* Card principal flotante */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
          textAlign: 'center',
          position: 'relative',
          minHeight: 'auto',
          margin: '20px 0',
          transform: 'translateY(0)',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          
          {renderCard()}
        </div>
      </div>

      {/* Modal de Ayuda */}
      {showHelpModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="animate-modal-fade-in" style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
            transform: 'scale(1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ 
                margin: 0, 
                color: '#333',
                fontSize: '1.25rem',
                fontWeight: '600'
              }}>
                💡 Ayuda - Cómo Responder
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ 
              color: '#555',
              lineHeight: '1.6',
              fontSize: '1rem'
            }}>
              {scaleData && currentCard > 0 && currentCard <= scaleData.totalItems && (() => {
                // Buscar el ítem actual usando la misma lógica que en renderQuestionCard
                let currentItem = scaleData.items.find(i => i.number === currentCard);
                if (!currentItem) {
                  currentItem = scaleData.items.find(i => i.itemNumber === currentCard);
                }
                if (!currentItem) {
                  currentItem = scaleData.items.find(i => i.order === currentCard);
                }
                if (!currentItem) {
                  currentItem = scaleData.items[currentCard - 1];
                }
                
                return currentItem && (
                  <div>
                    {/* Pregunta actual */}
                    <div style={{ 
                      marginBottom: '15px',
                      padding: '15px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '10px',
                      borderLeft: '4px solid #29A98C'
                    }}>
                      <strong>Pregunta actual:</strong><br/>
                      {currentItem.text || currentItem.itemText || 'Sin texto'}
                    </div>
                    
                    {/* Ayuda específica del ítem */}
                    {currentItem.helpText && (
                      <div style={{ 
                        marginBottom: '15px',
                        padding: '15px',
                        backgroundColor: '#e8f5f2',
                        borderRadius: '10px',
                        borderLeft: '4px solid #29A98C'
                      }}>
                        <strong>💡 Ayuda específica:</strong><br/>
                        {currentItem.helpText}
                      </div>
                    )}
                  </div>
                );
              })()} 
                  
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '25px' }}>
              <button
                onClick={() => setShowHelpModal(false)}
                style={{
                  background: 'linear-gradient(135deg, #29A98C, #112F33)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(41, 169, 140, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};