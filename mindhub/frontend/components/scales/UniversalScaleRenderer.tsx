/**
 * RENDERIZADOR UNIVERSAL DE ESCALAS
 * Componente que puede renderizar cualquier escala basándose en su configuración de DB
 */

'use client';

import React, { useState, useEffect } from 'react';
import { UniversalCardBasedAssessment } from '../clinimetrix/UniversalCardBasedAssessment';

interface Scale {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  totalItems: number;
  estimatedDurationMinutes: number;
  administrationMode: string;
  instructions: {
    professional: string;
    patient: string;
  };
  items: ScaleItem[];
  responseOptions: ResponseOption[];
  scoring: {
    method: string;
    range: {
      min: number;
      max: number;
    };
  };
  interpretation: {
    rules: InterpretationRule[];
    subscales: Subscale[];
  };
}

interface ScaleItem {
  id: string;
  number: number;
  text: string;
  subscale?: string;
  reverseScored: boolean;
}

interface ResponseOption {
  value: string;
  label: string;
  score: number;
}

interface InterpretationRule {
  min_score: number;
  max_score: number;
  severity_level: string;
  interpretation_label: string;
  color_code?: string;
  description?: string;
  recommendations?: string;
}

interface Subscale {
  id: string;
  subscale_name: string;
  subscale_code: string;
  min_score?: number;
  max_score?: number;
  description?: string;
}

interface UniversalScaleRendererProps {
  scaleId: string;
  onComplete: (results: any) => void;
  onBack: () => void;
  fullscreen?: boolean;
  patientId?: string;
  clinicianId?: string;
  administrationMode?: 'presencial-mismo' | 'presencial-otro' | 'distancia';
}

export const UniversalScaleRenderer: React.FC<UniversalScaleRendererProps> = ({
  scaleId,
  onComplete,
  onBack,
  fullscreen = false,
  patientId,
  clinicianId,
  administrationMode = 'presencial-mismo'
}) => {
  const [scale, setScale] = useState<Scale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  // Cargar escala desde API
  useEffect(() => {
    const loadScale = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Llamar a la API universal de escalas
        const response = await fetch(`/api/scales/${scaleId}`);
        
        if (!response.ok) {
          throw new Error(`Error cargando escala: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Error desconocido');
        }
        
        // Transformar datos de API al formato esperado
        const transformedScale: Scale = {
          id: data.data.id,
          name: data.data.name,
          abbreviation: data.data.abbreviation,
          description: data.data.description,
          totalItems: data.data.totalItems,
          estimatedDurationMinutes: data.data.estimatedDurationMinutes,
          administrationMode: data.data.administrationMode,
          instructions: {
            professional: data.data.instructions?.[0] || '',
            patient: data.data.instructions?.[0] || ''
          },
          items: data.data.items.map((item: any) => ({
            id: item.id,
            number: item.number,
            text: item.text,
            subscale: item.subscale,
            reverseScored: item.reverseScored || false
          })),
          responseOptions: data.data.responseOptions.map((option: any) => ({
            value: option.value,
            label: option.label,
            score: option.score
          })),
          scoring: {
            method: data.data.scoringMethod || 'sum',
            range: {
              min: data.data.scoreRange?.min || 0,
              max: data.data.scoreRange?.max || 100
            }
          },
          interpretation: {
            rules: data.data.interpretationRules || [],
            subscales: data.data.subscales || []
          }
        };
        
        setScale(transformedScale);
        setIsActive(true);
        
      } catch (err) {
        console.error('Error loading scale:', err);
        setError(err instanceof Error ? err.message : 'Error cargando escala');
      } finally {
        setIsLoading(false);
      }
    };

    if (scaleId) {
      loadScale();
    }
  }, [scaleId]);

  // Función para procesar finalización de evaluación
  const handleComplete = async (results: any) => {
    try {
      // Preparar datos para guardar
      const assessmentData = {
        scaleId: scaleId,
        patientId: patientId,
        clinicianId: clinicianId,
        administrationMode: administrationMode,
        responses: results.responses || [],
        totalScore: results.totalScore,
        subscaleScores: results.subscaleScores || {},
        interpretation: results.interpretation,
        alerts: results.alerts || [],
        completionPercentage: results.completionPercentage || 100,
        completedAt: new Date().toISOString()
      };

      // Guardar en API (opcional - dependiendo de si se quiere persistir)
      // await fetch('/api/assessments', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(assessmentData)
      // });

      // Llamar callback con resultados
      onComplete({
        ...results,
        scaleId: scaleId,
        scaleName: scale?.name,
        scaleAbbreviation: scale?.abbreviation,
        assessmentData: assessmentData
      });

    } catch (error) {
      console.error('Error completing assessment:', error);
      // Aún así llamar callback con los resultados
      onComplete(results);
    }
  };

  // Estados de carga y error
  if (isLoading) {
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
            width: '50px',
            height: '50px',
            border: '3px solid #29A98C',
            borderTop: '3px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <h2 style={{ color: '#112F33', marginBottom: '1rem' }}>
            Cargando Escala...
          </h2>
          <p style={{ color: '#64748b' }}>
            Preparando {scaleId.toUpperCase()}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
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
          maxWidth: '500px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>❌</div>
          <h2 style={{ color: '#F44336', marginBottom: '1rem' }}>
            Error al Cargar Escala
          </h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>
            {error}
          </p>
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
        </div>
      </div>
    );
  }

  if (!scale) {
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
          }}>🔍</div>
          <h2 style={{ color: '#112F33', marginBottom: '1rem' }}>
            Escala No Encontrada
          </h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>
            La escala {scaleId} no pudo ser cargada
          </p>
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
        </div>
      </div>
    );
  }

  // Crear contexto mock para el sistema de cards existente
  const mockContext = {
    isActive,
    scale: {
      id: scale.id,
      name: scale.name,
      abbreviation: scale.abbreviation,
      description: scale.description,
      totalItems: scale.totalItems,
      estimatedDurationMinutes: scale.estimatedDurationMinutes,
      administrationMode: scale.administrationMode,
      items: scale.items,
      responseOptions: scale.responseOptions,
      scoring: scale.scoring,
      interpretation: scale.interpretation
    },
    currentItemIndex: 0,
    currentItem: scale.items[0],
    responses: {},
    completionPercentage: 0,
    canProceed: true,
    nextItem: () => {},
    previousItem: () => {},
    saveResponse: async () => {},
    completeAssessment: async () => {},
    getResponse: () => null
  };

  // Renderizar usando el sistema de cards existente
  return (
    <div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <UniversalCardBasedAssessment
        onBack={onBack}
        onComplete={handleComplete}
        fullscreen={fullscreen}
      />
    </div>
  );
};

export default UniversalScaleRenderer;