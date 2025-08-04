/**
 * Legacy Clinimetrix Client - ClinimetrixPro Adapter
 * Provides compatibility with legacy components while using ClinimetrixPro backend
 * Migrated to use ClinimetrixPro APIs with data format adaptation
 */

import { clinimetrixProClient, type ClinimetrixRegistry, type TemplateData } from './clinimetrix-pro-client';

export interface Scale {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  category: string;
  version: string;
  totalItems: number;
  estimatedDurationMinutes: number;
  administrationMode: string;
  isPublic: boolean;
  isActive: boolean;
  // Additional fields that might be needed
  templateId?: string;
  isFeatured?: boolean;
}

// Data adapter functions
function adaptRegistryToScale(registry: ClinimetrixRegistry): Scale {
  return {
    id: registry.templateId,
    templateId: registry.templateId,
    name: registry.name,
    abbreviation: registry.abbreviation,
    description: registry.description,
    category: registry.category,
    version: registry.version,
    totalItems: registry.totalItems || 0,
    estimatedDurationMinutes: registry.estimatedDurationMinutes || 0,
    administrationMode: registry.administrationMode || 'self_administered',
    isPublic: registry.isPublic,
    isActive: registry.isActive,
    isFeatured: registry.isFeatured
  };
}

// Legacy API with ClinimetrixPro backend
export const clinimetrixApi = {
  /**
   * Get all scales - migrated to ClinimetrixPro
   */
  async getScales(): Promise<Scale[]> {
    try {
      const registries = await clinimetrixProClient.getTemplateCatalog();
      return registries.map(adaptRegistryToScale);
    } catch (error) {
      console.error('Error getting scales from ClinimetrixPro:', error);
      return [];
    }
  },

  /**
   * Get scale by ID - migrated to ClinimetrixPro
   */
  async getScaleById(id: string): Promise<Scale | null> {
    try {
      const registry = await clinimetrixProClient.getTemplateMetadata(id);
      return adaptRegistryToScale(registry);
    } catch (error) {
      console.error('Error getting scale by ID from ClinimetrixPro:', error);
      return null;
    }
  },

  /**
   * Get scale template data - new method for accessing full template
   */
  async getScaleTemplate(id: string): Promise<TemplateData | null> {
    try {
      return await clinimetrixProClient.getTemplate(id);
    } catch (error) {
      console.error('Error getting scale template from ClinimetrixPro:', error);
      return null;
    }
  },

  /**
   * Create assessment - migrated to ClinimetrixPro
   */
  async createAssessment(scaleId: string, patientId?: string, administratorId?: string): Promise<any> {
    try {
      return await clinimetrixProClient.createAssessment({
        templateId: scaleId,
        patientId: patientId || 'EJE19901231-2507', // Default patient for testing
        administratorId: administratorId || 'cmdpjwxgx0000n1qgo7f5csyt', // Default admin for testing
        mode: 'professional'
      });
    } catch (error) {
      console.error('Error creating assessment in ClinimetrixPro:', error);
      return null;
    }
  },

  /**
   * Complete assessment - new method
   */
  async completeAssessment(assessmentId: string, responses: Record<string, any>, demographics?: any): Promise<any> {
    try {
      return await clinimetrixProClient.completeAssessment(assessmentId, {
        responses,
        demographics
      });
    } catch (error) {
      console.error('Error completing assessment in ClinimetrixPro:', error);
      return null;
    }
  },

  /**
   * Calculate scores in real-time - new method
   */
  async calculateScores(templateId: string, responses: Record<string, any>, demographics?: any): Promise<any> {
    try {
      return await clinimetrixProClient.calculateScores({
        templateId,
        responses,
        demographics
      });
    } catch (error) {
      console.error('Error calculating scores in ClinimetrixPro:', error);
      return null;
    }
  }
};