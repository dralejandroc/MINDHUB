/**
 * ClinimetrixPro Presenter
 * Transforms domain data into view models for UI consumption
 * Follows Clean Architecture: Interface Adapters Layer
 */

import { Scale } from '../entities/Scale';
import { Assessment, ScoringResults } from '../entities/Assessment';
import { ScaleRegistry } from '../entities/ScaleRegistry';

// View Models for UI consumption
export interface ScaleViewModel {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  category: string;
  targetPopulation: string;
  difficulty: string;
  difficultyLabel: string;
  difficultyColor: string;
  administrationMode: string;
  administrationModeLabel: string;
  estimatedTime: string;
  totalItems: number;
  hasSubscales: boolean;
  subscaleCount: number;
  authors: string;
  year: number;
  language: string;
  version: string;
  isActive: boolean;
  isFeatured: boolean;
  complexity: {
    level: string;
    label: string;
    color: string;
    description: string;
  };
  requirements: {
    professionalLevel: string[];
    requiresTraining: boolean;
    supervisedRequired: boolean;
  };
  psychometrics: {
    reliability: string;
    validity: string;
    hasNorms: boolean;
  };
  ui: {
    icon: string;
    color: string;
    badge?: string;
    tags: string[];
  };
}

export interface ScaleCatalogViewModel {
  scales: ScaleViewModel[];
  totalCount: number;
  categories: Array<{
    id: string;
    name: string;
    count: number;
    color: string;
    icon: string;
  }>;
  difficulties: Array<{
    id: string;
    name: string;
    count: number;
    color: string;
  }>;
  filters: {
    activeCategory?: string;
    activeDifficulty?: string;
    searchQuery?: string;
    showFeatured?: boolean;
  };
  recommendations?: ScaleViewModel[];
  warnings?: string[];
}

export interface AssessmentViewModel {
  id: string;
  scale: {
    id: string;
    name: string;
    abbreviation: string;
    category: string;
  };
  patient: {
    id: string;
    name?: string;
    age?: number;
  };
  administrator: {
    id: string;
    name?: string;
  };
  status: {
    current: string;
    label: string;
    color: string;
    icon: string;
  };
  progress: {
    currentStep: number;
    totalSteps: number;
    percentage: number;
    completedItems: number;
    totalItems: number;
  };
  timing: {
    startedAt: string;
    startedAtFormatted: string;
    lastActivity: string;
    lastActivityFormatted: string;
    duration?: string;
    isExpired: boolean;
    expiresAt?: string;
  };
  mode: {
    type: string;
    label: string;
    icon: string;
    color: string;
  };
  context: {
    clinicId?: string;
    workspaceId?: string;
    sessionId?: string;
    deviceType?: string;
  };
  actions: {
    canContinue: boolean;
    canComplete: boolean;
    canCancel: boolean;
    canDelete: boolean;
    canView: boolean;
  };
}

export interface AssessmentResultsViewModel {
  assessment: AssessmentViewModel;
  scoring: {
    totalScore: number;
    scoreRange: { min: number; max: number };
    percentile?: number;
    severity: {
      level: string;
      label: string;
      color: string;
      description: string;
    };
    interpretation: {
      primary: string;
      detailed: string;
      clinicalSignificance: string;
      confidence: {
        level: string;
        label: string;
        color: string;
        factors: string[];
        limitations: string[];
      };
    };
    subscales: Array<{
      id: string;
      name: string;
      score: number;
      scoreRange: { min: number; max: number };
      percentile?: number;
      interpretation?: string;
      severity?: {
        level: string;
        label: string;
        color: string;
      };
    }>;
  };
  recommendations: {
    immediate: Array<{
      type: 'warning' | 'info' | 'action';
      message: string;
      priority: number;
    }>;
    followUp: Array<{
      type: 'info' | 'suggestion';
      message: string;
      timeframe?: string;
    }>;
    treatment: Array<{
      type: 'referral' | 'intervention' | 'monitoring';
      message: string;
    }>;
  };
  validity: {
    score?: number;
    level: string;
    indicators: Array<{
      type: string;
      severity: string;
      message: string;
      recommendation: string;
      color: string;
    }>;
    warnings: string[];
  };
  exportOptions: {
    pdf: boolean;
    csv: boolean;
    integration: boolean;
  };
}

export class ClinimetrixPresenter {
  /**
   * Transform Scale entity to ViewModel for catalog display
   */
  presentScale(scale: Scale): ScaleViewModel {
    const complexity = this.getComplexityPresentation(scale);
    const difficulty = this.getDifficultyPresentation(scale.difficulty);
    const administrationMode = this.getAdministrationModePresentation(scale.administrationMode);
    const category = this.getCategoryPresentation(scale.category);

    return {
      id: scale.id,
      name: scale.name,
      abbreviation: scale.abbreviation,
      description: scale.description,
      category: scale.category,
      targetPopulation: scale.targetPopulation,
      difficulty: scale.difficulty,
      difficultyLabel: difficulty.label,
      difficultyColor: difficulty.color,
      administrationMode: scale.administrationMode,
      administrationModeLabel: administrationMode.label,
      estimatedTime: this.formatEstimatedTime(scale),
      totalItems: scale.items.length,
      hasSubscales: scale.subscales.length > 0,
      subscaleCount: scale.subscales.length,
      authors: scale.authors.join(', ') || 'No especificado',
      year: scale.year,
      language: scale.language,
      version: scale.version,
      isActive: scale.isActive,
      isFeatured: false, // Would come from registry
      complexity,
      requirements: {
        professionalLevel: scale.professionalLevel,
        requiresTraining: scale.requiresProfessionalAdministration(),
        supervisedRequired: scale.requiresProfessionalAdministration()
      },
      psychometrics: {
        reliability: this.formatReliabilityFromProperties(scale.reliability),
        validity: this.formatValidityFromProperties(scale.validity),
        hasNorms: Object.keys(scale.norms || {}).length > 0
      },
      ui: {
        icon: category.icon,
        color: category.color,
        badge: scale.subscales.length > 0 ? `${scale.subscales.length} subscalas` : undefined,
        tags: this.generateScaleTags(scale)
      }
    };
  }

  /**
   * Transform ScaleRegistry entity to ViewModel for catalog display
   */
  presentScaleRegistry(registry: ScaleRegistry): ScaleViewModel {
    const complexity = this.getComplexityPresentationFromRegistry(registry);
    const difficulty = this.getDifficultyPresentation(registry.difficulty);
    const administrationMode = this.getAdministrationModePresentation(registry.administrationMode);
    const category = this.getCategoryPresentation(registry.category);

    return {
      id: registry.id,
      name: registry.name,
      abbreviation: registry.abbreviation,
      description: registry.description,
      category: registry.category,
      targetPopulation: registry.targetPopulation,
      difficulty: registry.difficulty,
      difficultyLabel: difficulty.label,
      difficultyColor: difficulty.color,
      administrationMode: registry.administrationMode,
      administrationModeLabel: administrationMode.label,
      estimatedTime: registry.administrationTime,
      totalItems: registry.metadata.totalItems,
      hasSubscales: registry.metadata.hasSubscales,
      subscaleCount: registry.metadata.subscaleCount,
      authors: registry.authors.join(', ') || 'No especificado',
      year: registry.year,
      language: registry.language,
      version: registry.version,
      isActive: registry.isActive,
      isFeatured: registry.isFeatured,
      complexity,
      requirements: {
        professionalLevel: registry.professionalLevel,
        requiresTraining: registry.professionalLevel.length > 0,
        supervisedRequired: registry.administrationMode === 'professional'
      },
      psychometrics: {
        reliability: this.formatReliabilityFromProperties(registry.psychometricProperties?.reliability),
        validity: this.formatValidityFromProperties(registry.psychometricProperties?.validity),
        hasNorms: !!registry.psychometricProperties?.norms
      },
      ui: {
        icon: category.icon,
        color: category.color,
        badge: registry.isFeatured ? 'Destacada' : 
               registry.metadata.hasSubscales ? `${registry.metadata.subscaleCount} subscalas` : undefined,
        tags: registry.tags
      }
    };
  }

  /**
   * Transform Assessment entity to ViewModel for management views
   */
  presentAssessment(assessment: Assessment, scale?: Scale): AssessmentViewModel {
    const status = this.getStatusPresentation(assessment.status);
    const mode = this.getModePresentation(assessment.mode);
    const progress = this.calculateProgress(assessment, scale);
    const timing = this.formatTiming(assessment);

    return {
      id: assessment.id,
      scale: {
        id: assessment.scaleId,
        name: scale?.name || 'Escala desconocida',
        abbreviation: scale?.abbreviation || assessment.scaleId,
        category: scale?.category || 'general'
      },
      patient: {
        id: assessment.patientId
      },
      administrator: {
        id: assessment.administratorId
      },
      status,
      progress,
      timing,
      mode,
      context: {
        clinicId: assessment.clinicId,
        workspaceId: assessment.workspaceId,
        sessionId: assessment.sessionId,
        deviceType: assessment.deviceInfo?.deviceType
      },
      actions: {
        canContinue: assessment.canBeContinued(),
        canComplete: scale ? assessment.canBeCompleted(scale) : false,
        canCancel: assessment.canBeCancelled(),
        canDelete: assessment.status === 'draft' || assessment.status === 'cancelled',
        canView: true
      }
    };
  }

  /**
   * Transform Assessment with results to comprehensive results ViewModel
   */
  presentAssessmentResults(assessment: Assessment, scale: Scale): AssessmentResultsViewModel {
    if (!assessment.scoringResults) {
      throw new Error('Assessment must have scoring results to present results');
    }

    const assessmentVM = this.presentAssessment(assessment, scale);
    const scoring = this.presentScoringResults(assessment.scoringResults, scale);
    const recommendations = this.presentRecommendations(assessment.scoringResults);
    const validity = this.presentValidityResults(assessment);

    return {
      assessment: assessmentVM,
      scoring,
      recommendations,
      validity,
      exportOptions: {
        pdf: true,
        csv: true,
        integration: !!assessment.clinicId || !!assessment.workspaceId
      }
    };
  }

  // Private helper methods
  private getComplexityPresentation(scale: Scale): {
    level: string;
    label: string;
    color: string;
    description: string;
  } {
    const complexityScore = scale.getComplexityScore();
    
    if (complexityScore >= 80) {
      return {
        level: 'advanced',
        label: 'Avanzada',
        color: 'bg-red-100 text-red-800',
        description: 'Requiere experiencia especializada'
      };
    } else if (complexityScore >= 60) {
      return {
        level: 'complex',
        label: 'Compleja',
        color: 'bg-orange-100 text-orange-800',
        description: 'Requiere experiencia clínica'
      };
    } else if (complexityScore >= 30) {
      return {
        level: 'moderate',
        label: 'Moderada',
        color: 'bg-yellow-100 text-yellow-800',
        description: 'Adecuada para profesionales con experiencia básica'
      };
    } else {
      return {
        level: 'simple',
        label: 'Simple',
        color: 'bg-green-100 text-green-800',
        description: 'Fácil de administrar'
      };
    }
  }

  private getComplexityPresentationFromRegistry(registry: ScaleRegistry): {
    level: string;
    label: string;
    color: string;
    description: string;
  } {
    const complexity = registry.getComplexityLevel();
    
    const presentations = {
      'advanced': {
        level: 'advanced',
        label: 'Avanzada',
        color: 'bg-red-100 text-red-800',
        description: 'Requiere experiencia especializada'
      },
      'complex': {
        level: 'complex',
        label: 'Compleja',
        color: 'bg-orange-100 text-orange-800',
        description: 'Requiere experiencia clínica'
      },
      'moderate': {
        level: 'moderate',
        label: 'Moderada',
        color: 'bg-yellow-100 text-yellow-800',
        description: 'Adecuada para profesionales con experiencia básica'
      },
      'simple': {
        level: 'simple',
        label: 'Simple',
        color: 'bg-green-100 text-green-800',
        description: 'Fácil de administrar'
      }
    };

    return presentations[complexity];
  }

  private getDifficultyPresentation(difficulty: string): {
    label: string;
    color: string;
  } {
    const presentations: { [key: string]: { label: string; color: string } } = {
      'beginner': { label: 'Principiante', color: 'bg-green-100 text-green-800' },
      'intermediate': { label: 'Intermedio', color: 'bg-yellow-100 text-yellow-800' },
      'advanced': { label: 'Avanzado', color: 'bg-red-100 text-red-800' }
    };

    return presentations[difficulty] || { label: 'No especificado', color: 'bg-gray-100 text-gray-800' };
  }

  private getAdministrationModePresentation(mode: string): {
    label: string;
  } {
    const presentations: { [key: string]: { label: string } } = {
      'professional': { label: 'Administración profesional' },
      'self_administered': { label: 'Auto-administrada' },
      'supervised': { label: 'Supervisada' },
      'remote': { label: 'Remota' }
    };

    return presentations[mode] || { label: 'No especificado' };
  }

  private getCategoryPresentation(category: string): {
    icon: string;
    color: string;
  } {
    const presentations: { [key: string]: { icon: string; color: string } } = {
      'depression': { icon: '😔', color: 'bg-blue-100 text-blue-800' },
      'anxiety': { icon: '😰', color: 'bg-yellow-100 text-yellow-800' },
      'autism': { icon: '🧩', color: 'bg-purple-100 text-purple-800' },
      'eating_disorders': { icon: '🍽️', color: 'bg-pink-100 text-pink-800' },
      'cognition': { icon: '🧠', color: 'bg-indigo-100 text-indigo-800' },
      'ocd': { icon: '💭', color: 'bg-teal-100 text-teal-800' },
      'psychosis': { icon: '🏥', color: 'bg-red-100 text-red-800' },
      'sleep': { icon: '🌙', color: 'bg-gray-100 text-gray-800' },
      'tics': { icon: '⚡', color: 'bg-orange-100 text-orange-800' },
      'personality': { icon: '🧬', color: 'bg-emerald-100 text-emerald-800' },
      'trauma': { icon: '💔', color: 'bg-rose-100 text-rose-800' },
      'suicide': { icon: '⚠️', color: 'bg-red-100 text-red-800' },
      'general': { icon: '📋', color: 'bg-gray-100 text-gray-800' }
    };

    return presentations[category] || presentations['general'];
  }

  private formatEstimatedTime(scale: Scale): string {
    const timeEstimate = scale.getEstimatedTimeMinutes();
    
    if (timeEstimate.min === timeEstimate.max) {
      return `${timeEstimate.min} min`;
    } else {
      return `${timeEstimate.min}-${timeEstimate.max} min`;
    }
  }

  private formatReliability(reliability: Record<string, number>): string {
    const cronbach = reliability.cronbachAlpha;
    if (cronbach) {
      if (cronbach >= 0.9) return 'Excelente';
      if (cronbach >= 0.8) return 'Buena';
      if (cronbach >= 0.7) return 'Aceptable';
      return 'Limitada';
    }
    return 'No reportada';
  }

  private formatReliabilityFromProperties(reliability?: Record<string, number>): string {
    if (!reliability) return 'No reportada';
    return this.formatReliability(reliability);
  }

  private formatValidity(validity: Record<string, number>): string {
    const construct = validity.construct;
    if (construct) {
      if (construct >= 0.8) return 'Excelente';
      if (construct >= 0.7) return 'Buena';
      if (construct >= 0.6) return 'Aceptable';
      return 'Limitada';
    }
    return 'No reportada';
  }

  private formatValidityFromProperties(validity?: Record<string, number>): string {
    if (!validity) return 'No reportada';
    return this.formatValidity(validity);
  }

  private generateScaleTags(scale: Scale): string[] {
    const tags: string[] = [];
    
    if (scale.subscales.length > 0) {
      tags.push('Subscalas');
    }
    
    if (scale.requiresProfessionalAdministration()) {
      tags.push('Entrenamiento requerido');
    }
    
    if (Object.keys(scale.norms || {}).length > 0) {
      tags.push('Datos normativos');
    }
    
    if (scale.items.length > 50) {
      tags.push('Evaluación extensa');
    } else if (scale.items.length < 15) {
      tags.push('Evaluación breve');
    }

    return tags;
  }

  private getStatusPresentation(status: string): {
    current: string;
    label: string;
    color: string;
    icon: string;
  } {
    const presentations: { [key: string]: { current: string; label: string; color: string; icon: string } } = {
      'draft': {
        current: 'draft',
        label: 'Borrador',
        color: 'bg-gray-100 text-gray-800',
        icon: '📝'
      },
      'in_progress': {
        current: 'in_progress',
        label: 'En progreso',
        color: 'bg-blue-100 text-blue-800',
        icon: '⏳'
      },
      'completed': {
        current: 'completed',
        label: 'Completada',
        color: 'bg-green-100 text-green-800',
        icon: '✅'
      },
      'cancelled': {
        current: 'cancelled',
        label: 'Cancelada',
        color: 'bg-red-100 text-red-800',
        icon: '❌'
      }
    };

    return presentations[status] || presentations['draft'];
  }

  private getModePresentation(mode: string): {
    type: string;
    label: string;
    icon: string;
    color: string;
  } {
    const presentations: { [key: string]: { type: string; label: string; icon: string; color: string } } = {
      'professional': {
        type: 'professional',
        label: 'Profesional',
        icon: '👨‍⚕️',
        color: 'bg-blue-100 text-blue-800'
      },
      'self_administered': {
        type: 'self_administered',
        label: 'Auto-administrada',
        icon: '👤',
        color: 'bg-green-100 text-green-800'
      },
      'supervised': {
        type: 'supervised',
        label: 'Supervisada',
        icon: '👥',
        color: 'bg-yellow-100 text-yellow-800'
      },
      'remote': {
        type: 'remote',
        label: 'Remota',
        icon: '💻',
        color: 'bg-purple-100 text-purple-800'
      }
    };

    return presentations[mode] || presentations['self_administered'];
  }

  private calculateProgress(assessment: Assessment, scale?: Scale): {
    currentStep: number;
    totalSteps: number;
    percentage: number;
    completedItems: number;
    totalItems: number;
  } {
    const totalItems = scale?.items.length || 0;
    const completedItems = Object.keys(assessment.responses).length;
    const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return {
      currentStep: assessment.currentStep,
      totalSteps: totalItems,
      percentage,
      completedItems,
      totalItems
    };
  }

  private formatTiming(assessment: Assessment): {
    startedAt: string;
    startedAtFormatted: string;
    lastActivity: string;
    lastActivityFormatted: string;
    duration?: string;
    isExpired: boolean;
    expiresAt?: string;
  } {
    const now = new Date();
    
    return {
      startedAt: assessment.startedAt?.toISOString() || '',
      startedAtFormatted: assessment.startedAt ? this.formatRelativeTime(assessment.startedAt, now) : 'No iniciada',
      lastActivity: assessment.lastActivityAt?.toISOString() || '',
      lastActivityFormatted: assessment.lastActivityAt ? this.formatRelativeTime(assessment.lastActivityAt, now) : 'Sin actividad',
      duration: assessment.completedAt && assessment.startedAt ? 
        this.formatDuration(assessment.startedAt, assessment.completedAt) : undefined,
      isExpired: assessment.isExpired(),
      expiresAt: assessment.startedAt ? this.getExpirationTime(assessment.startedAt) : undefined
    };
  }

  private presentScoringResults(scoringResults: ScoringResults, scale: Scale): any {
    const severity = this.getSeverityPresentation(scoringResults.severityLevel);
    const confidence = this.getConfidencePresentation(scoringResults.interpretation.confidence);

    return {
      totalScore: scoringResults.totalScore,
      scoreRange: scoringResults.scoreRange,
      percentile: scoringResults.percentileScore,
      severity,
      interpretation: {
        primary: scoringResults.interpretation.rule.label,
        detailed: scoringResults.interpretation.clinicalInterpretation,
        clinicalSignificance: scoringResults.interpretation.clinicalSignificance,
        confidence
      },
      subscales: Object.entries(scoringResults.subscaleScores).map(([id, subscale]: [string, any]) => {
        const scaleSubscale = scale.subscales.find(s => s.id === id);
        return {
          id,
          name: subscale.name || scaleSubscale?.name || id,
          score: subscale.score,
          scoreRange: subscale.scoreRange || { min: 0, max: 100 },
          percentile: subscale.percentile,
          interpretation: subscale.interpretation,
          severity: subscale.interpretation ? 
            this.getSeverityPresentation(this.extractSeverityFromInterpretation(subscale.interpretation)) :
            undefined
        };
      })
    };
  }

  private presentRecommendations(scoringResults: ScoringResults): any {
    const recommendations = scoringResults.interpretation.recommendations;
    
    return {
      immediate: recommendations.immediate.map((rec: string, index: number) => ({
        type: rec.toLowerCase().includes('risk') ? 'warning' : 
              rec.toLowerCase().includes('attention') ? 'warning' : 'action',
        message: rec,
        priority: index + 1
      })),
      followUp: recommendations.followUp.map((rec: string) => ({
        type: rec.toLowerCase().includes('monitor') ? 'info' : 'suggestion',
        message: rec,
        timeframe: this.extractTimeframe(rec)
      })),
      treatment: recommendations.treatment.map((rec: string) => ({
        type: rec.toLowerCase().includes('referral') ? 'referral' :
              rec.toLowerCase().includes('intervention') ? 'intervention' : 'monitoring',
        message: rec
      }))
    };
  }

  private presentValidityResults(assessment: Assessment): any {
    const validityScore = assessment.validityScore;
    const level = validityScore ? 
      (validityScore >= 80 ? 'high' : validityScore >= 60 ? 'medium' : 'low') : 'unknown';

    return {
      score: validityScore,
      level,
      indicators: [], // Would be populated from assessment validity indicators
      warnings: [] // Would be populated from assessment warnings
    };
  }

  // Utility methods
  private getSeverityPresentation(severity: string): {
    level: string;
    label: string;
    color: string;
    description: string;
  } {
    const presentations: { [key: string]: { level: string; label: string; color: string; description: string } } = {
      'minimal': {
        level: 'minimal',
        label: 'Mínimo',
        color: 'bg-green-100 text-green-800',
        description: 'Síntomas mínimos o ausentes'
      },
      'mild': {
        level: 'mild',
        label: 'Leve',
        color: 'bg-yellow-100 text-yellow-800',
        description: 'Síntomas leves que pueden requerir monitoreo'
      },
      'moderate': {
        level: 'moderate',
        label: 'Moderado',
        color: 'bg-orange-100 text-orange-800',
        description: 'Síntomas moderados que requieren intervención'
      },
      'severe': {
        level: 'severe',
        label: 'Severo',
        color: 'bg-red-100 text-red-800',
        description: 'Síntomas severos que requieren atención inmediata'
      },
      'very_severe': {
        level: 'very_severe',
        label: 'Muy severo',
        color: 'bg-red-200 text-red-900',
        description: 'Síntomas muy severos que requieren intervención urgente'
      }
    };

    return presentations[severity] || presentations['minimal'];
  }

  private getConfidencePresentation(confidence: any): {
    level: string;
    label: string;
    color: string;
    factors: string[];
    limitations: string[];
  } {
    return {
      level: confidence.level,
      label: confidence.level === 'high' ? 'Alta' :
             confidence.level === 'medium' ? 'Media' : 'Baja',
      color: confidence.level === 'high' ? 'bg-green-100 text-green-800' :
             confidence.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
             'bg-red-100 text-red-800',
      factors: confidence.factors || [],
      limitations: confidence.limitations || []
    };
  }

  private formatRelativeTime(date: Date, now: Date): string {
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Ahora mismo';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES');
  }

  private formatDuration(start: Date, end: Date): string {
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  private getExpirationTime(startedAt: Date): string {
    // Assuming 24 hour expiration
    const expiresAt = new Date(startedAt.getTime() + 24 * 60 * 60 * 1000);
    return expiresAt.toISOString();
  }

  private extractSeverityFromInterpretation(interpretation: string): string {
    const lower = interpretation.toLowerCase();
    if (lower.includes('severe') || lower.includes('severo')) return 'severe';
    if (lower.includes('moderate') || lower.includes('moderado')) return 'moderate';
    if (lower.includes('mild') || lower.includes('leve')) return 'mild';
    if (lower.includes('minimal') || lower.includes('mínimo')) return 'minimal';
    return 'minimal';
  }

  private extractTimeframe(recommendation: string): string | undefined {
    if (recommendation.includes('2-4 weeks') || recommendation.includes('2-4 semanas')) {
      return '2-4 semanas';
    }
    if (recommendation.includes('4-8 weeks') || recommendation.includes('4-8 semanas')) {
      return '4-8 semanas';
    }
    return undefined;
  }
}