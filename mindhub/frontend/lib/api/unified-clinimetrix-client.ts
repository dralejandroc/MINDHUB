/**
 * 🎯 UNIFIED CLINIMETRIX CLIENT
 * Cliente unificado que maneja tanto React como Django
 * - Catálogo desde React (funcional y probado)
 * - Evaluaciones desde Django (focused_take.html mejor funcionamiento)
 * - Fallback automático a React si Django falla
 */

import { clinimetrixProClient } from './clinimetrix-pro-client';
import { djangoClinimetrixClient } from './django-clinimetrix-client';
import type { ClinimetrixRegistry } from './clinimetrix-pro-client';

interface PatientData {
  id: string;
  first_name: string;
  last_name?: string;
  paternal_last_name?: string;
  maternal_last_name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  age?: number;
}

interface AssessmentOptions {
  useDjangoFirst?: boolean;
  fallbackToReact?: boolean;
  onFallback?: () => void;
}

class UnifiedClinimetrixClient {
  /**
   * 📋 CATÁLOGO DE ESCALAS (siempre desde React - funciona perfecto)
   */
  async getTemplateCatalog(): Promise<ClinimetrixRegistry[]> {
    return clinimetrixProClient.getTemplateCatalog();
  }

  async getTemplate(templateId: string) {
    return clinimetrixProClient.getTemplate(templateId);
  }

  /**
   * 🚀 INICIO DE EVALUACIÓN (Django first, React fallback)
   */
  async startAssessment(
    patientData: PatientData,
    scaleAbbreviation: string,
    returnUrl?: string,
    options: AssessmentOptions = {}
  ): Promise<{ method: 'django' | 'react'; success: boolean }> {
    const {
      useDjangoFirst = true,
      fallbackToReact = true,
      onFallback
    } = options;

    // 1. INTENTAR DJANGO PRIMERO (sistema que funciona mejor)
    if (useDjangoFirst) {
      try {
        console.log('🐍 Intentando con Django backend (focused_take.html)...');
        
        await djangoClinimetrixClient.startAssessment(
          patientData,
          scaleAbbreviation,
          returnUrl
        );
        
        console.log('✅ Evaluación iniciada exitosamente con Django');
        return { method: 'django', success: true };
        
      } catch (error) {
        console.warn('⚠️ Django falló, evaluando fallback...', error);
        
        if (!fallbackToReact) {
          throw error;
        }
      }
    }

    // 2. FALLBACK A REACT (si Django falla)
    if (fallbackToReact) {
      console.log('🔄 Usando fallback: React Assessment Modal...');
      
      if (onFallback) {
        onFallback();
      }
      
      // No ejecutamos React aquí, solo indicamos que debe usarse
      // El componente manejará mostrar el modal React
      return { method: 'react', success: true };
    }

    throw new Error('No hay métodos de evaluación disponibles');
  }

  /**
   * 🔍 HEALTH CHECK de sistemas
   */
  async getSystemStatus(): Promise<{
    django: boolean;
    react: boolean;
    recommended: 'django' | 'react';
  }> {
    const djangoHealth = await djangoClinimetrixClient.healthCheck();
    
    return {
      django: djangoHealth,
      react: true, // React siempre disponible
      recommended: djangoHealth ? 'django' : 'react'
    };
  }

  /**
   * 🛠️ MÉTODOS DE UTILIDAD
   */
  async checkDjangoAvailability(): Promise<boolean> {
    return djangoClinimetrixClient.healthCheck();
  }

  // Proxy methods for compatibility
  async createAssessment(data: any) {
    return clinimetrixProClient.createAssessment(data);
  }

  async saveResponses(id: string, data: any) {
    // return clinimetrixProClient.saveResponses(id, data); // Method doesn't exist yet
    return { success: true }; // Placeholder
  }

  async completeAssessment(assessmentId: string, data: any) {
    return clinimetrixProClient.completeAssessment(assessmentId, data);
  }
}

// Export singleton instance
export const unifiedClinimetrixClient = new UnifiedClinimetrixClient();
export default unifiedClinimetrixClient;

// Export types for convenience
export type { ClinimetrixRegistry, PatientData, AssessmentOptions };