/**
 * HOOK PARA MANEJO UNIVERSAL DE ESCALAS
 * Hook personalizado para gestionar escalas, evaluaciones y estados
 */

import { useState, useEffect, useCallback } from 'react';

interface Scale {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  category: string;
  subcategory?: string;
  totalItems: number;
  estimatedDurationMinutes: number;
  administrationMode: string;
  targetPopulation: string;
  isActive: boolean;
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

interface AssessmentResponse {
  itemNumber: number;
  value: string;
  label: string;
  score: number;
}

interface AssessmentResults {
  totalScore: number;
  subscaleScores: Record<string, any>;
  interpretation: {
    severity: string;
    label: string;
    description: string;
    recommendations: string[];
  };
  alerts: any[];
  completionPercentage: number;
  validResponses: number;
}

interface UseUniversalScalesProps {
  autoLoadScales?: boolean;
  cacheScales?: boolean;
}

export const useUniversalScales = ({
  autoLoadScales = true,
  cacheScales = true
}: UseUniversalScalesProps = {}) => {
  // Estados principales
  const [scales, setScales] = useState<Scale[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentScale, setCurrentScale] = useState<Scale | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados de evaluación
  const [currentAssessment, setCurrentAssessment] = useState<{
    scaleId: string;
    responses: AssessmentResponse[];
    currentItemIndex: number;
    startedAt: Date;
  } | null>(null);

  // Cache de escalas
  const scalesCache = new Map<string, Scale>();

  // Cargar todas las escalas
  const loadScales = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:8080/api/scales');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error desconocido');
      }
      
      setScales(data.data || []);
      
      // Extraer categorías únicas
      const uniqueCategories = [...new Set(data.data.map((scale: Scale) => scale.category))];
      setCategories(uniqueCategories.filter(Boolean));
      
      // Actualizar cache
      if (cacheScales) {
        data.data.forEach((scale: Scale) => {
          scalesCache.set(scale.id, scale);
        });
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error cargando escalas';
      setError(errorMessage);
      console.error('Error loading scales:', err);
    } finally {
      setIsLoading(false);
    }
  }, [cacheScales]);

  // Cargar escala específica
  const loadScale = useCallback(async (scaleId: string): Promise<Scale | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Verificar cache primero
      if (cacheScales && scalesCache.has(scaleId)) {
        const cachedScale = scalesCache.get(scaleId)!;
        setCurrentScale(cachedScale);
        return cachedScale;
      }
      
      const response = await fetch(`http://localhost:8080/api/scales/${scaleId}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error desconocido');
      }
      
      // Transformar datos al formato esperado
      const scale: Scale = {
        id: data.data.id,
        name: data.data.name,
        abbreviation: data.data.abbreviation,
        description: data.data.description,
        category: data.data.category,
        subcategory: data.data.subcategory,
        totalItems: data.data.totalItems,
        estimatedDurationMinutes: data.data.estimatedDurationMinutes,
        administrationMode: data.data.administrationMode,
        targetPopulation: data.data.targetPopulation,
        isActive: data.data.isActive,
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
      
      setCurrentScale(scale);
      
      // Actualizar cache
      if (cacheScales) {
        scalesCache.set(scaleId, scale);
      }
      
      return scale;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error cargando escala';
      setError(errorMessage);
      console.error('Error loading scale:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [cacheScales]);

  // Iniciar evaluación
  const startAssessment = useCallback((scaleId: string) => {
    setCurrentAssessment({
      scaleId,
      responses: [],
      currentItemIndex: 0,
      startedAt: new Date()
    });
  }, []);

  // Guardar respuesta
  const saveResponse = useCallback((response: AssessmentResponse) => {
    setCurrentAssessment(prev => {
      if (!prev) return null;
      
      const existingIndex = prev.responses.findIndex(r => r.itemNumber === response.itemNumber);
      const newResponses = [...prev.responses];
      
      if (existingIndex >= 0) {
        newResponses[existingIndex] = response;
      } else {
        newResponses.push(response);
      }
      
      return {
        ...prev,
        responses: newResponses
      };
    });
  }, []);

  // Calcular resultados
  const calculateResults = useCallback((responses: AssessmentResponse[], scale: Scale): AssessmentResults => {
    let totalScore = 0;
    const subscaleScores: Record<string, any> = {};
    
    // Calcular puntuación total
    responses.forEach(response => {
      const item = scale.items.find(item => item.number === response.itemNumber);
      let score = response.score;
      
      // Aplicar puntuación inversa si es necesario
      if (item && item.reverseScored) {
        const maxScore = Math.max(...scale.responseOptions.map(opt => opt.score));
        const minScore = Math.min(...scale.responseOptions.map(opt => opt.score));
        score = maxScore + minScore - score;
      }
      
      totalScore += score;
      
      // Acumular por subescala
      if (item && item.subscale) {
        if (!subscaleScores[item.subscale]) {
          subscaleScores[item.subscale] = {
            name: item.subscale,
            score: 0,
            itemCount: 0
          };
        }
        subscaleScores[item.subscale].score += score;
        subscaleScores[item.subscale].itemCount++;
      }
    });
    
    // Buscar interpretación
    const interpretation = scale.interpretation.rules.find(rule =>
      totalScore >= rule.min_score && totalScore <= rule.max_score
    );
    
    // Detectar alertas (lógica simplificada)
    const alerts: any[] = [];
    responses.forEach(response => {
      // Ejemplo: detectar respuestas de alto riesgo
      if (response.score >= 3 && response.itemNumber === 9) { // Item 9 típicamente ideación suicida
        alerts.push({
          itemNumber: response.itemNumber,
          message: 'Respuesta indica posible riesgo - requiere atención especial',
          severity: 'high'
        });
      }
    });
    
    return {
      totalScore,
      subscaleScores,
      interpretation: {
        severity: interpretation?.severity_level || 'unknown',
        label: interpretation?.interpretation_label || 'No determinado',
        description: interpretation?.description || `Puntuación: ${totalScore}`,
        recommendations: interpretation?.recommendations ? 
          interpretation.recommendations.split('\n').filter(r => r.trim()) : []
      },
      alerts,
      completionPercentage: (responses.length / scale.totalItems) * 100,
      validResponses: responses.length
    };
  }, []);

  // Finalizar evaluación
  const completeAssessment = useCallback((additionalData?: any): AssessmentResults | null => {
    if (!currentAssessment || !currentScale) return null;
    
    const results = calculateResults(currentAssessment.responses, currentScale);
    
    // Limpiar evaluación actual
    setCurrentAssessment(null);
    
    return results;
  }, [currentAssessment, currentScale, calculateResults]);

  // Buscar escalas
  const searchScales = useCallback((searchTerm: string, category?: string): Scale[] => {
    let filtered = scales;
    
    if (category && category !== 'all') {
      filtered = filtered.filter(scale => scale.category === category);
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(scale =>
        scale.name.toLowerCase().includes(searchLower) ||
        scale.abbreviation.toLowerCase().includes(searchLower) ||
        scale.description.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [scales]);

  // Obtener estadísticas
  const getScaleStats = useCallback((scaleId: string) => {
    const scale = scales.find(s => s.id === scaleId);
    if (!scale) return null;
    
    return {
      totalItems: scale.totalItems,
      estimatedDuration: scale.estimatedDurationMinutes,
      category: scale.category,
      administrationMode: scale.administrationMode,
      targetPopulation: scale.targetPopulation,
      scoreRange: scale.scoring.range
    };
  }, [scales]);

  // Cargar escalas automáticamente
  useEffect(() => {
    if (autoLoadScales) {
      loadScales();
    }
  }, [autoLoadScales, loadScales]);

  // Limpiar cache cuando sea necesario
  const clearCache = useCallback(() => {
    scalesCache.clear();
  }, []);

  return {
    // Estados
    scales,
    categories,
    currentScale,
    currentAssessment,
    isLoading,
    error,
    
    // Funciones principales
    loadScales,
    loadScale,
    searchScales,
    getScaleStats,
    
    // Funciones de evaluación
    startAssessment,
    saveResponse,
    calculateResults,
    completeAssessment,
    
    // Utilidades
    clearCache,
    
    // Datos computados
    isAssessmentActive: !!currentAssessment,
    assessmentProgress: currentAssessment ? 
      (currentAssessment.responses.length / (currentScale?.totalItems || 1)) * 100 : 0
  };
};

export default useUniversalScales;