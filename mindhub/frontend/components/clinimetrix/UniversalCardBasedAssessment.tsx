/**
 * SISTEMA DE CARDS INDEPENDIENTES PARA ESCALAS
 * Estructura exacta solicitada con navegación por cards
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useCurrentAssessment } from '../../contexts/UniversalScalesContext';
import { useUniversalScales } from '../../contexts/UniversalScalesContext';
import { getQuestionComponent } from './question-types';

interface UniversalCardBasedAssessmentProps {
  onBack: () => void;
  onComplete: (results: any) => void;
  fullscreen?: boolean;
  scaleId?: string;
  patientId?: string;
  clinicianId?: string;
}

export const UniversalCardBasedAssessment: React.FC<UniversalCardBasedAssessmentProps> = ({
  onBack,
  onComplete,
  fullscreen = false,
  scaleId,
  patientId = 'anonymous',
  clinicianId
}) => {
  const { startAssessment, loadScale } = useUniversalScales();
  const {
    isActive,
    scale,
    currentItemIndex,
    currentItem,
    responses,
    completionPercentage,
    canProceed,
    nextItem,
    previousItem,
    saveResponse,
    completeAssessment,
    getResponse
  } = useCurrentAssessment();

  // Estados para el sistema de cards
  const [currentCard, setCurrentCard] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState(patientId || '');
  const [administrationMode, setAdministrationMode] = useState<'presencial-mismo' | 'presencial-otro' | 'distancia'>('presencial-mismo');
  const [showHelp, setShowHelp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardResponses, setCardResponses] = useState<Record<number, string>>({});
  const [localResponses, setLocalResponses] = useState<Array<{
    itemId: string;
    itemNumber: number;
    responseValue: string;
    responseLabel: string;
    scoreValue: number;
  }>>([]);
  const [assessmentResults, setAssessmentResults] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Estados para búsqueda de pacientes
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<any[]>([]);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [selectedPatientData, setSelectedPatientData] = useState<any>(null);

  // Inicializar evaluación automáticamente si se proporciona scaleId
  useEffect(() => {
    const initializeAssessment = async () => {
      if (scaleId && !isInitialized && !isActive) {
        try {
          console.log('🚀 Inicializando evaluación automática para:', scaleId);
          await startAssessment(scaleId, patientId, clinicianId);
          setIsInitialized(true);
        } catch (error) {
          console.error('Error inicializando evaluación:', error);
        }
      }
    };

    initializeAssessment();
  }, [scaleId, patientId, clinicianId, isInitialized, isActive, startAssessment]);

  // Función para buscar pacientes
  const searchPatients = async (query: string) => {
    if (!query.trim()) {
      setPatientSearchResults([]);
      setShowPatientResults(false);
      return;
    }

    setIsSearchingPatients(true);
    try {
      const response = await fetch(`http://localhost:8080/api/v1/expedix/patients?search=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setPatientSearchResults(data.data || []);
        setShowPatientResults(true);
      } else {
        console.error('Error searching patients:', data.error);
        setPatientSearchResults([]);
        setShowPatientResults(false);
      }
    } catch (error) {
      console.error('Failed to search patients:', error);
      setPatientSearchResults([]);
      setShowPatientResults(false);
    } finally {
      setIsSearchingPatients(false);
    }
  };

  // Debounce para búsqueda de pacientes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPatients(patientSearchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [patientSearchQuery]);

  // Función para seleccionar un paciente
  const handleSelectPatient = (patient: any) => {
    setSelectedPatientData(patient);
    setSelectedPatient(`${patient.firstName} ${patient.lastName}`);
    setPatientSearchQuery(`${patient.firstName} ${patient.lastName}`);
    setShowPatientResults(false);
  };

  // Effect para cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-patient-search]')) {
        setShowPatientResults(false);
      }
    };

    if (showPatientResults) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPatientResults]);

  // Estructura de cards:
  // Card 0: Settings/Instrucciones profesional
  // Card 00: Instrucciones para el paciente (solo escalas autoaplicadas) - card 0.5
  // Card 1, 2, 3...N: Items (N = scale.totalItems) - Solo estos cuentan para progreso
  // Card X: Escala completada - card (scale.totalItems + 1)
  // Card R: Resultados - card (scale.totalItems + 2)
  const hasPatientCard = scale?.administrationMode === 'self_administered';
  const totalCards = scale ? scale.totalItems + 3 : 0; // Card 0, Cards 1-N, Card X, Card R
  const cardX = scale ? scale.totalItems + 1 : 0; // Card "Escala completada"
  const cardR = scale ? scale.totalItems + 2 : 0; // Card "Resultados"


  // Debug: Monitor currentCard changes
  useEffect(() => {
    console.log('🔄 Card changed to:', currentCard, 'CardX:', cardX, 'CardR:', cardR);
    if (currentCard === 0 && cardX > 0) {
      console.log('⚠️ WARNING: Card went back to 0 unexpectedly!');
    }
  }, [currentCard, cardX, cardR]);

  // Auto-avance tras selección
  const handleOptionSelect = async (optionValue: string, optionLabel: string, scoreValue: number) => {
    if (!currentItem) return;

    try {
      console.log('🔵 Saving response:', {
        itemId: currentItem.id,
        itemNumber: currentItem.number,
        optionValue,
        optionLabel,
        scoreValue
      });
      
      // Guardar respuesta en el contexto universal
      await saveResponse(currentItem.id, optionValue, optionLabel, scoreValue);
      
      // Guardar respuesta local para el card
      setCardResponses(prev => ({ ...prev, [currentCard]: optionValue }));
      
      // Guardar respuesta local como respaldo
      setLocalResponses(prev => {
        const newResponses = prev.filter(r => r.itemId !== currentItem.id);
        return [...newResponses, {
          itemId: currentItem.id,
          itemNumber: currentItem.number,
          responseValue: optionValue,
          responseLabel: optionLabel,
          scoreValue: scoreValue
        }];
      });

      console.log('🔵 Response saved successfully');

      // Auto-avance después de 150ms
      setTimeout(() => {
        const isLastItem = currentCard === scale?.totalItems; // Card N es el último item
        
        if (isLastItem) {
          // Si es el último ítem, ir a Card X (escala completada)
          console.log('🔵 Last item completed, going to CardX:', cardX);
          setCurrentCard(cardX);
        } else {
          // Avanzar al siguiente ítem
          setCurrentCard(currentCard + 1);
          nextItem();
        }
      }, 150);
    } catch (error) {
      console.error('Error saving response:', error);
    }
  };

  // Navegación entre cards
  const goToPreviousCard = () => {
    if (currentCard > 0) {
      if (currentCard === 0.5) {
        // Desde Card 00 (instrucciones paciente) regresar a Card 0 (settings)
        setCurrentCard(0);
      } else if (currentCard === 1) {
        // Desde Card 1 (primer item) regresar a Card 00 si existe, o Card 0
        if (hasPatientCard) {
          setCurrentCard(0.5); // Card 00
        } else {
          setCurrentCard(0); // Card 0
        }
      } else if (currentCard > 1) {
        // Navegación normal entre items
        setCurrentCard(currentCard - 1);
        previousItem();
      } else {
        // Cualquier otro caso, regresar a la card anterior
        setCurrentCard(currentCard - 1);
      }
    }
  };


  // Completar assessment usando directamente el backend
  const handleComplete = async () => {
    console.log('🎯 handleComplete called - DIRECT BACKEND');
    console.log('Current card:', currentCard, 'Target CardR:', cardR);
    console.log('Local responses:', localResponses);
    console.log('Current scale:', scale?.id);
    
    setIsSubmitting(true);
    
    try {
      if (!scale || localResponses.length === 0) {
        throw new Error('No scale or responses available');
      }
      
      // Llamar directamente al backend con los datos correctos
      const response = await fetch('http://localhost:8080/api/administrations/direct-completion/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scaleId: scale.id,
          responses: localResponses.map(r => ({
            itemNumber: r.itemNumber,
            value: r.responseValue,
            label: r.responseLabel,
            score: r.scoreValue
          }))
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('📊 Backend response successful:', data.data);
        const results = data.data.results;
        
        // Establecer resultados y navegar
        setAssessmentResults(results);
        setCurrentCard(cardR);
        
        console.log('📊 Navigation completed to CardR with real results:', results);
      } else {
        throw new Error(data.error || 'Backend returned error');
      }
      
    } catch (error) {
      console.error('Error completing assessment:', error);
      
      // Fallback: crear resultados básicos usando las respuestas disponibles
      const totalScore = localResponses.reduce((sum, r) => sum + (r.scoreValue || 0), 0);
      
      console.log('📊 Calculating fallback results with score:', totalScore);
      
      const fallbackResults = {
        totalScore: totalScore,
        interpretation: {
          severity: 'unknown',
          label: 'Evaluación completada',
          description: `Los resultados han sido calculados basándose en las respuestas proporcionadas. Puntuación total: ${totalScore}`,
          recommendations: [
            'Revisar resultados con profesional',
            'Considerar seguimiento si es necesario'
          ]
        },
        validResponses: localResponses.length,
        completionPercentage: (localResponses.length / (scale?.totalItems || 1)) * 100,
        subscaleScores: {},
        alerts: []
      };
      
      console.log('📊 Using fallback results:', fallbackResults);
      setAssessmentResults(fallbackResults);
      setCurrentCard(cardR);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isActive || !scale) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFF8EE, #29A98C)'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '3rem',
          textAlign: 'center',
          maxWidth: '400px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>⏳</div>
          <h2 style={{ color: '#112F33', marginBottom: '1rem' }}>
            Preparando Evaluación
          </h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>
            {scaleId ? `Cargando escala ${scaleId}...` : 'Inicializando sistema...'}
          </p>
          {!scaleId && (
            <button
              onClick={onBack}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#29A98C',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              Regresar
            </button>
          )}
        </div>
      </div>
    );
  }

  // Renderizar card específico
  const renderCard = () => {
    console.log('🃏 Rendering card:', currentCard, 'of', totalCards);
    console.log('🃏 CardX:', cardX, 'CardR:', cardR);
    console.log('🃏 Assessment results:', assessmentResults);
    // Card 0: Settings/Instrucciones para el profesional
    if (currentCard === 0) {
      return (
        <div className="card" id="card-0">
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ 
              background: 'linear-gradient(135deg, #29A98C, #112F33)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '2rem',
              marginBottom: '20px',
              fontWeight: '600'
            }}>
              📋 Instrucciones para el Profesional
            </h2>
            <h3 style={{ 
              color: '#112F33',
              fontSize: '1.4rem',
              marginBottom: '30px',
              fontWeight: '500'
            }}>
              {scale.name} ({scale.abbreviation})
            </h3>
          </div>

          {/* Búsqueda de paciente */}
          <div data-patient-search style={{ marginBottom: '2rem', position: 'relative' }}>
            <label style={{ display: 'block', fontWeight: '600', color: '#112F33', marginBottom: '0.5rem' }}>
              Buscar Paciente (opcional):
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={patientSearchQuery}
                onChange={(e) => {
                  setPatientSearchQuery(e.target.value);
                  if (!e.target.value.trim()) {
                    setSelectedPatient('');
                    setSelectedPatientData(null);
                  }
                }}
                placeholder="Escriba nombre, apellido o número de expediente..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  paddingRight: isSearchingPatients ? '2.5rem' : '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}
                onFocus={() => {
                  if (patientSearchResults.length > 0) {
                    setShowPatientResults(true);
                  }
                }}
              />
              
              {/* Loading indicator */}
              {isSearchingPatients && (
                <div style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid #e2e8f0',
                  borderTop: '2px solid #29A98C',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              )}
            </div>

            {/* Search results dropdown */}
            {showPatientResults && patientSearchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {patientSearchResults.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    style={{
                      padding: '0.75rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <div style={{ fontWeight: '600', color: '#112F33' }}>
                      {patient.firstName} {patient.lastName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Expediente: {patient.medicalRecordNumber}
                    </div>
                    {patient.dateOfBirth && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Fecha nac.: {new Date(patient.dateOfBirth).toLocaleDateString('es-MX')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Selected patient info */}
            {selectedPatientData && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.75rem',
                backgroundColor: '#f0f9ff',
                border: '1px solid #0ea5e9',
                borderRadius: '8px'
              }}>
                <div style={{ fontWeight: '600', color: '#0c4a6e' }}>
                  ✓ Paciente seleccionado: {selectedPatientData.firstName} {selectedPatientData.lastName}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#0369a1' }}>
                  Expediente: {selectedPatientData.medicalRecordNumber}
                </div>
              </div>
            )}

            {/* No results message */}
            {showPatientResults && patientSearchQuery.trim() && patientSearchResults.length === 0 && !isSearchingPatients && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.75rem',
                color: '#64748b',
                fontSize: '0.875rem',
                textAlign: 'center'
              }}>
                No se encontraron pacientes
              </div>
            )}
          </div>

          {/* Modo de aplicación */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontWeight: '600', color: '#112F33', marginBottom: '1rem' }}>
              Seleccione el modo de aplicación:
            </h3>
            
            <div style={{ display: 'grid', gap: '15px' }}>
              <button
                onClick={() => setAdministrationMode('presencial-mismo')}
                style={{
                  background: administrationMode === 'presencial-mismo' 
                    ? 'linear-gradient(135deg, #29A98C, #112F33)' 
                    : 'rgba(255, 255, 255, 0.8)',
                  color: administrationMode === 'presencial-mismo' ? 'white' : '#112F33',
                  border: `2px solid ${administrationMode === 'presencial-mismo' ? '#29A98C' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  padding: '15px 20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left',
                  fontSize: '1rem',
                  lineHeight: '1.4'
                }}
                onMouseEnter={(e) => {
                  if (administrationMode !== 'presencial-mismo') {
                    e.currentTarget.style.borderColor = '#29A98C';
                    e.currentTarget.style.background = 'rgba(41, 169, 140, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(41, 169, 140, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (administrationMode !== 'presencial-mismo') {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <strong>🏥 Presencial - Mismo Dispositivo</strong>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', opacity: 0.8 }}>
                  El paciente responde en este dispositivo
                </p>
              </button>

              <button
                onClick={() => setAdministrationMode('presencial-otro')}
                style={{
                  background: administrationMode === 'presencial-otro' 
                    ? 'linear-gradient(135deg, #29A98C, #112F33)' 
                    : 'rgba(255, 255, 255, 0.8)',
                  color: administrationMode === 'presencial-otro' ? 'white' : '#112F33',
                  border: `2px solid ${administrationMode === 'presencial-otro' ? '#29A98C' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  padding: '15px 20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left',
                  fontSize: '1rem',
                  lineHeight: '1.4'
                }}
                onMouseEnter={(e) => {
                  if (administrationMode !== 'presencial-otro') {
                    e.currentTarget.style.borderColor = '#29A98C';
                    e.currentTarget.style.background = 'rgba(41, 169, 140, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(41, 169, 140, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (administrationMode !== 'presencial-otro') {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <strong>📱 Presencial - Dispositivo Secundario</strong>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', opacity: 0.8 }}>
                  El paciente responde en su propio dispositivo
                </p>
              </button>

              <button
                onClick={() => setAdministrationMode('distancia')}
                style={{
                  background: administrationMode === 'distancia' 
                    ? 'linear-gradient(135deg, #29A98C, #112F33)' 
                    : 'rgba(255, 255, 255, 0.8)',
                  color: administrationMode === 'distancia' ? 'white' : '#112F33',
                  border: `2px solid ${administrationMode === 'distancia' ? '#29A98C' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  padding: '15px 20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left',
                  fontSize: '1rem',
                  lineHeight: '1.4'
                }}
                onMouseEnter={(e) => {
                  if (administrationMode !== 'distancia') {
                    e.currentTarget.style.borderColor = '#29A98C';
                    e.currentTarget.style.background = 'rgba(41, 169, 140, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(41, 169, 140, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (administrationMode !== 'distancia') {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <strong>🌐 A Distancia</strong>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', opacity: 0.8 }}>
                  Generar link para enviar por correo electrónico
                </p>
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              if (hasPatientCard) {
                setCurrentCard(0.5); // Ir a Card 00 (instrucciones paciente)
              } else {
                setCurrentCard(1); // Ir directamente a Card 1 (primer item)
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #29A98C, #112F33)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '15px 30px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              margin: '20px 10px',
              minWidth: '140px',
              width: '100%'
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
            {hasPatientCard ? 'Continuar a Instrucciones' : 'Iniciar Evaluación'}
          </button>
        </div>
      );
    }

    // Card 00: Instrucciones para el paciente (solo escalas autoaplicadas)
    if (currentCard === 0.5 && hasPatientCard) {
      return (
        <div className="card" id="card-00">
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ 
              background: 'linear-gradient(135deg, #29A98C, #112F33)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '2rem',
              marginBottom: '20px',
              fontWeight: '600'
            }}>
              👋 Instrucciones para el Paciente
            </h2>
            <h3 style={{ 
              color: '#112F33',
              fontSize: '1.4rem',
              marginBottom: '30px',
              fontWeight: '500'
            }}>
              A continuación responderá algunas preguntas sobre {scale.name}
            </h3>
          </div>

          <div style={{ 
            background: 'rgba(41, 169, 140, 0.1)', 
            borderLeft: '4px solid #29A98C', 
            padding: '20px', 
            margin: '20px 0', 
            borderRadius: '8px', 
            textAlign: 'left', 
            color: '#112F33', 
            lineHeight: '1.6' 
          }}>
            <h3 style={{ color: '#29A98C', marginBottom: '15px', fontSize: '1.1rem' }}>
              📋 Instrucciones importantes:
            </h3>
            <ul style={{ color: '#112F33', lineHeight: '1.6', paddingLeft: '1.5rem', margin: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>Lea cada pregunta cuidadosamente</li>
              <li style={{ marginBottom: '0.5rem' }}>No hay respuestas correctas o incorrectas</li>
              <li style={{ marginBottom: '0.5rem' }}>Seleccione la opción que mejor describa su situación</li>
              <li style={{ marginBottom: '0.5rem' }}>Responda pensando en las últimas 2 semanas</li>
              <li>Si tiene dudas, consulte con el profesional</li>
            </ul>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Tiempo estimado: <strong>{scale.estimatedDurationMinutes} minutos</strong><br />
              Total de preguntas: <strong>{scale.totalItems}</strong>
            </p>
          </div>

          <button
            onClick={() => setCurrentCard(1)} // Ir a Card 1 (primer item)
            style={{
              background: 'linear-gradient(135deg, #29A98C, #112F33)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '15px 30px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              margin: '20px 10px',
              minWidth: '140px',
              width: '100%'
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
            Comenzar Evaluación
          </button>
        </div>
      );
    }

    // Cards 1 a N: Ítems individuales
    if (currentCard >= 1 && currentCard <= scale.totalItems) {
      const itemIndex = currentCard - 1;
      const item = scale.items[itemIndex];
      const options = scale.responseOptions || []; // Usar opciones de respuesta universales

      // Obtener tipo de pregunta y metadatos
      const questionType = item.questionType || 'likert';
      const metadata = item.metadata || {};
      const QuestionComponent = getQuestionComponent(questionType);

      // Si no hay componente específico, usar el renderizado por defecto (Likert)
      if (!QuestionComponent) {
        return (
          <div className="card" id={`card-${itemIndex + 1}`}>
            {/* Renderizado por defecto - Likert */}
            <div style={{
              background: 'linear-gradient(135deg, #29A98C, #112F33)',
              color: 'white',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontWeight: '600',
              fontSize: '1.1rem'
            }}>
              {item.number}
            </div>

            <h3 style={{ 
              color: '#112F33',
              fontSize: '1.4rem',
              marginBottom: '30px',
              fontWeight: '500',
              textAlign: 'center'
            }}>
              {item.text}
            </h3>

            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              marginTop: '30px'
            }}>
              {options.map((option, index) => {
                const isSelected = cardResponses[currentCard] === option.value;
                
                return (
                  <button
                    key={index}
                    onClick={() => handleOptionSelect(option.value, option.label, option.score)}
                    style={{
                      background: isSelected 
                        ? 'linear-gradient(135deg, #29A98C, #112F33)' 
                        : 'rgba(255, 255, 255, 0.8)',
                      border: '2px solid #e2e8f0',
                      borderColor: isSelected ? '#29A98C' : '#e2e8f0',
                      borderRadius: '12px',
                      padding: '15px 20px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textAlign: 'left',
                      fontSize: '1rem',
                      lineHeight: '1.4',
                      color: isSelected ? 'white' : '#112F33',
                      transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
                      boxShadow: isSelected ? '0 4px 12px rgba(41, 169, 140, 0.3)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#29A98C';
                        e.currentTarget.style.background = 'rgba(41, 169, 140, 0.1)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(41, 169, 140, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      // Usar componente específico por tipo de pregunta
      return (
        <div className="card" id={`card-${itemIndex + 1}`}>
          <QuestionComponent
            item={{
              id: item.id,
              number: item.number,
              text: item.text,
              helpText: item.helpText,
              required: item.required !== false
            }}
            options={options}
            value={cardResponses[currentCard] || null}
            onValueChange={handleOptionSelect}
            metadata={metadata}
          />
        </div>
      );
    }

    // Card X: Escala completada
    if (currentCard === cardX) {
      const getMessage = () => {
        switch (administrationMode) {
          case 'presencial-mismo':
            return {
              title: '✅ Escala Completada',
              message: 'Muchas gracias por sus respuestas.',
              instruction: 'Por favor pase el dispositivo a su médico o profesional para revisar e interpretar resultados.',
              buttonText: 'Revisar Resultados (Médico)'
            };
          case 'presencial-otro':
            return {
              title: '✅ Escala Completada',
              message: 'Gracias por sus respuestas, escala completada.',
              instruction: 'Los resultados se enviaron a su médico o profesional.',
              buttonText: 'Muchas gracias, la aplicación ha terminado'
            };
          case 'distancia':
            return {
              title: '✅ Escala Completada',
              message: 'Escala completada, muchas gracias.',
              instruction: 'Los resultados han sido enviados a su profesional para su revisión e interpretación.',
              buttonText: 'Muchas gracias, la aplicación ha terminado'
            };
        }
      };

      const finalMessage = getMessage();

      return (
        <div className="card" id="card-x">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🎉</div>
            <h2 style={{ 
              background: 'linear-gradient(135deg, #29A98C, #112F33)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '2rem',
              marginBottom: '20px',
              fontWeight: '600'
            }}>
              {finalMessage.title}
            </h2>
            <h3 style={{ 
              color: '#112F33',
              fontSize: '1.4rem',
              marginBottom: '30px',
              fontWeight: '500'
            }}>
              {finalMessage.message}
            </h3>
            
            <div style={{ 
              background: 'rgba(41, 169, 140, 0.1)', 
              borderLeft: '4px solid #29A98C', 
              padding: '20px', 
              margin: '20px 0', 
              borderRadius: '8px', 
              textAlign: 'left', 
              color: '#112F33', 
              lineHeight: '1.6' 
            }}>
              <p style={{ margin: 0 }}>{finalMessage.instruction}</p>
            </div>

            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              style={{
                background: isSubmitting 
                  ? 'linear-gradient(135deg, #6b7280, #374151)' 
                  : 'linear-gradient(135deg, #29A98C, #112F33)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '15px 30px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                margin: '20px 10px',
                minWidth: '140px',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(41, 169, 140, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {isSubmitting ? 'Procesando...' : (administrationMode === 'presencial-mismo' ? 'Revisar Resultados (Médico)' : 'Completar Evaluación')}
            </button>
          </div>
        </div>
      );
    }

    // Card R: Resultados para el profesional
    if (currentCard === cardR) {
      const results = assessmentResults;
      
      // Determinar color según severidad
      const getSeverityColor = (severity: string) => {
        switch (severity?.toLowerCase()) {
          case 'minimal':
          case 'low':
            return { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' };
          case 'mild':
          case 'leve':
            return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
          case 'moderate':
          case 'moderado':
            return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
          case 'severe':
          case 'high':
            return { color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)' };
          default:
            return { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' };
        }
      };

      const severityColor = results?.interpretation ? getSeverityColor(results.interpretation.severity) : getSeverityColor('');

      // Función para generar PDF
      const generatePDF = () => {
        const printContent = `
          <html>
          <head>
            <title>Reporte ${scale.abbreviation}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #29A98C; padding-bottom: 15px; }
              .score { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .interpretation { background: #f9fafb; padding: 15px; border-left: 4px solid #29A98C; margin: 15px 0; }
              .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ccc; font-size: 0.9em; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${scale.name.toUpperCase()}</h1>
              <h2>(${scale.abbreviation})</h2>
            </div>
            
            <div class="score">
              <h2>Resultado: ${results?.totalScore || 0} / ${scale.totalItems * Math.max(...scale.responseOptions.map(opt => opt.score))}</h2>
              <h3 style="color: ${severityColor.color};">${results?.interpretation?.label || 'Sin interpretación'}</h3>
            </div>
            
            <div class="interpretation">
              <h3>Interpretación Clínica</h3>
              <p>${results?.interpretation?.description || 'Sin descripción disponible'}</p>
            </div>
            
            <div class="footer">
              <p><strong>Nota importante:</strong> Este reporte es un instrumento de evaluación psicométrica y debe ser interpretado únicamente por profesionales de la salud mental calificados. No constituye un diagnóstico por sí mismo.</p>
            </div>
          </body>
          </html>
        `;
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(printContent);
          printWindow.document.close();
          printWindow.print();
        }
      };

      // Función para nueva evaluación
      const newEvaluation = () => {
        if (confirm('¿Está seguro de que desea iniciar una nueva evaluación? Se perderán los datos actuales.')) {
          // Navegar directamente al sistema de escalas sin usar Auth0
          if (window.location.pathname.includes('/hubs/clinimetrix')) {
            window.location.reload();
          } else {
            window.location.href = '/hubs/clinimetrix';
          }
        }
      };

      return (
        <div className="card" id="card-r">
          {/* Título principal */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ 
              background: 'linear-gradient(135deg, #29A98C, #112F33)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '2rem',
              marginBottom: '20px',
              fontWeight: '600'
            }}>
              📊 Resultados de {scale.abbreviation}
            </h2>
            <h3 style={{ 
              color: '#112F33',
              fontSize: '1.4rem',
              marginBottom: '30px',
              fontWeight: '500'
            }}>
              Interpretación para profesional en salud mental
            </h3>
            {selectedPatient && (
              <p style={{ color: '#112F33', fontWeight: '600', marginTop: '10px' }}>
                Paciente: {selectedPatient}
              </p>
            )}
          </div>

          {/* Puntuación total con diseño elegante */}
          <div style={{ 
            background: `linear-gradient(135deg, ${severityColor.color}, #112F33)`,
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: 'white', marginBottom: '10px', fontSize: '1.2rem' }}>
              Puntuación Total: {results?.totalScore || 0}
            </h3>
            {results?.interpretation && (
              <h3 style={{ color: 'white', margin: 0, fontSize: '1.1rem' }}>
                {results.interpretation.label}
              </h3>
            )}
          </div>

          {/* Interpretación clínica */}
          {results?.interpretation && (
            <div style={{ 
              background: 'rgba(41, 169, 140, 0.1)', 
              borderLeft: '4px solid #29A98C', 
              padding: '20px', 
              margin: '20px 0', 
              borderRadius: '8px' 
            }}>
              <h3 style={{ color: '#29A98C', marginBottom: '10px' }}>Interpretación Clínica</h3>
              <p style={{ color: '#112F33', marginBottom: '15px' }}>
                <strong>Descripción:</strong> {results.interpretation.description}
              </p>
            </div>
          )}

          {/* Información técnica de la escala */}
          <div style={{ 
            background: 'rgba(41, 169, 140, 0.1)', 
            borderLeft: '4px solid #29A98C', 
            padding: '20px', 
            margin: '20px 0', 
            borderRadius: '8px' 
          }}>
            <h3 style={{ color: '#29A98C', marginBottom: '15px' }}>Información Técnica</h3>
            <p style={{ color: '#112F33', margin: '5px 0' }}>
              <strong>Instrumento:</strong> {scale.name} ({scale.abbreviation})
            </p>
            <p style={{ color: '#112F33', margin: '5px 0' }}>
              <strong>Número de ítems:</strong> {scale.totalItems}
            </p>
            <p style={{ color: '#112F33', margin: '5px 0' }}>
              <strong>Tiempo de aplicación:</strong> {scale.estimatedDurationMinutes} minutos
            </p>
            <p style={{ color: '#112F33', margin: '5px 0' }}>
              <strong>Completitud:</strong> {Math.round(results?.completionPercentage || 0)}%
            </p>
          </div>

          {/* Alertas mejoradas */}
          {results?.alerts && results.alerts.length > 0 && (
            <div style={{ 
              background: 'rgba(245, 101, 101, 0.1)', 
              borderLeft: '4px solid #f56565', 
              padding: '15px', 
              margin: '15px 0', 
              borderRadius: '8px' 
            }}>
              <h4 style={{ color: '#742a2a', marginBottom: '15px' }}>⚠️ Ítems de Atención Clínica</h4>
              <p style={{ color: '#742a2a', marginBottom: '15px' }}>
                Los siguientes elementos requieren evaluación clínica específica:
              </p>
              {results.alerts.map((alert: any, index: number) => (
                <div key={index} style={{ 
                  margin: '10px 0', 
                  padding: '10px', 
                  background: 'rgba(245, 101, 101, 0.1)', 
                  borderRadius: '6px' 
                }}>
                  <strong style={{ color: '#742a2a' }}>
                    {alert.itemNumber ? `Ítem ${alert.itemNumber}: ` : ''}{alert.message}
                  </strong>
                  {alert.type === 'critical_item' && (
                    <div style={{ 
                      marginTop: '15px', 
                      padding: '15px', 
                      background: 'rgba(245, 101, 101, 0.2)', 
                      borderRadius: '6px', 
                      border: '2px solid #f56565' 
                    }}>
                      <strong style={{ color: '#742a2a' }}>
                        ⚠️ ALERTA: Riesgo identificado. Evaluación inmediata requerida.
                      </strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Recomendaciones */}
          {results?.interpretation?.recommendations && results.interpretation.recommendations.length > 0 && (
            <div style={{ 
              background: 'rgba(41, 169, 140, 0.1)', 
              borderLeft: '4px solid #29A98C', 
              padding: '20px', 
              margin: '20px 0', 
              borderRadius: '8px' 
            }}>
              <h3 style={{ color: '#29A98C', marginBottom: '15px' }}>💡 Recomendaciones</h3>
              <ul style={{ color: '#112F33', lineHeight: '1.6', paddingLeft: '20px', margin: 0 }}>
                {results.interpretation.recommendations.map((rec: string, index: number) => (
                  <li key={index} style={{ marginBottom: '8px' }}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Botones de acción elegantes */}
          <div style={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            justifyContent: 'center',
            marginTop: '30px'
          }}>
            <button
              onClick={() => {
                console.log('Guardar resultados:', results);
                onComplete(results);
              }}
              style={{
                background: 'linear-gradient(135deg, #29A98C, #112F33)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '15px 30px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                margin: '20px 10px',
                minWidth: '140px'
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
              💾 Guardar y Salir
            </button>
            
            <button
              onClick={newEvaluation}
              style={{
                background: 'linear-gradient(135deg, #6b7280, #374151)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '15px 30px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                margin: '20px 10px',
                minWidth: '140px'
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
              📋 Nueva Escala
            </button>
            
            <button
              onClick={generatePDF}
              style={{
                background: 'linear-gradient(135deg, #6b7280, #374151)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '15px 30px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                margin: '20px 10px',
                minWidth: '140px'
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
              🖨️ Imprimir PDF
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: 'linear-gradient(135deg, #29A98C 0%, #112F33 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Container principal */}
      <div style={{
        maxWidth: '600px',
        width: '100%',
        position: 'relative'
      }}>

        {/* Card principal con animación */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          position: 'relative',
          animation: 'slideIn 0.5s ease-out'
        }}>
          {/* Debug info - quitar en producción */}
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '15px',
            background: 'linear-gradient(135deg, #29A98C, #112F33)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            Card {currentCard === 0.5 ? '00' : currentCard} / R
          </div>
          {renderCard()}
        </div>
      </div>

      {/* Botón Atrás flotante */}
      {currentCard > 0 && (
        <button
          onClick={goToPreviousCard}
          style={{
            position: 'fixed',
            top: '50%',
            left: '20px',
            transform: 'translateY(-50%)',
            background: 'linear-gradient(135deg, #29A98C, #112F33)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '42px',
            height: '42px',
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease',
            zIndex: 1000
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%) translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(41, 169, 140, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
          }}
        >
          ←
        </button>
      )}

      {/* Botón Adelante flotante */}
      {currentCard < cardR && currentCard !== 0 && (
        <button
          onClick={goToNextCard}
          style={{
            position: 'fixed',
            top: '50%',
            right: '20px',
            transform: 'translateY(-50%)',
            background: 'linear-gradient(135deg, #29A98C, #112F33)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '42px',
            height: '42px',
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease',
            zIndex: 1000
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%) translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(41, 169, 140, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(-50%)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
          }}
        >
          →
        </button>
      )}

      {/* Botón Ayuda flotante */}
      <button
        onClick={() => setShowHelp(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #29A98C, #112F33)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '42px',
          height: '42px',
          fontSize: '1rem',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.3s ease',
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(41, 169, 140, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        }}
      >
        ?
      </button>

      {/* Barra de progreso fija elegante */}
      {currentCard >= 1 && currentCard <= scale.totalItems && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #29A98C, #112F33)',
          transition: 'width 0.3s ease',
          zIndex: 1000,
          width: `${(currentCard / scale.totalItems) * 100}%`
        }} />
      )}

      {/* Modal de ayuda elegante */}
      {showHelp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              background: 'linear-gradient(135deg, #29A98C, #112F33)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '2rem',
              marginBottom: '20px',
              fontWeight: '600'
            }}>
              ❓ Ayuda
            </h2>
            <div style={{ 
              background: 'rgba(41, 169, 140, 0.1)', 
              borderLeft: '4px solid #29A98C', 
              padding: '20px', 
              margin: '20px 0', 
              borderRadius: '8px', 
              textAlign: 'left', 
              color: '#112F33', 
              lineHeight: '1.6' 
            }}>
              <p style={{ margin: 0 }}>
                Para responder esta escala, lee cada pregunta cuidadosamente y selecciona la opción que mejor describe tu experiencia. No hay respuestas correctas o incorrectas.
              </p>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              style={{
                background: 'linear-gradient(135deg, #29A98C, #112F33)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '15px 30px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                margin: '20px 10px',
                minWidth: '140px'
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
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default UniversalCardBasedAssessment;