/**
 * Mock data temporal para testing del frontend de Clinimetrix
 * Se reemplazará cuando el backend esté completo
 * DEPRECATED: Use real backend data instead
 */

import { Scale } from './clinimetrix-client';

export const mockScales: Scale[] = [
  {
    id: 'sample-scale-1',
    name: 'Sample Clinical Scale 1',
    abbreviation: 'SCS1',
    description: 'Evaluación genérica de construcción psicológica con validez científica establecida.',
    version: '1.0',
    category: 'sample',
    subcategory: 'generic_assessment',
    total_items: 20,
    estimated_duration_minutes: 15,
    administration_mode: 'self_administered' as const,
    target_population: 'Adolescentes y adultos',
    scoring_method: 'sum',
    tags: ['generic', 'sample', 'clinical', 'assessment', 'testing'],
    is_favorite: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'sample-scale-2',
    name: 'Sample Clinical Scale 2',
    abbreviation: 'SCS2',
    description: 'Instrumento de evaluación genérico diseñado para pruebas de funcionalidad del sistema universal.',
    version: '2.0',
    category: 'sample',
    subcategory: 'generic_screening',
    total_items: 15,
    estimated_duration_minutes: 10,
    administration_mode: 'self_administered' as const,
    target_population: 'Adolescentes y adultos alfabetos',
    scoring_method: 'sum',
    tags: ['sample', 'generic', 'screening', 'testing', 'universal'],
    is_favorite: true,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  },
  {
    id: 'sample-scale-3',
    name: 'Sample Clinical Scale 3',
    abbreviation: 'SCS3',
    description: 'Escala de ejemplo que evalúa constructos genéricos para testing del sistema universal.',
    version: '1.5',
    category: 'sample',
    subcategory: 'generic_evaluation',
    total_items: 25,
    estimated_duration_minutes: 12,
    administration_mode: 'both' as const,
    target_population: 'Adultos y adolescentes de 13 años o más',
    scoring_method: 'sum',
    tags: ['sample', 'generic', 'evaluation', 'testing', 'clinical'],
    is_favorite: false,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z'
  }
];

export const mockCategories = ['sample', 'generic', 'testing'];

export const mockTags = [
  'sample', 'generic', 'clinical', 'assessment', 'testing',
  'screening', 'evaluation', 'universal', 'example', 'mock'
];

// Mock API functions for testing
export const mockClinimetrixApi = {
  async getScales(filters: any = {}) {
    let filteredScales = [...mockScales];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredScales = filteredScales.filter(scale =>
        scale.name.toLowerCase().includes(searchTerm) ||
        scale.description.toLowerCase().includes(searchTerm) ||
        scale.category.toLowerCase().includes(searchTerm) ||
        scale.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    if (filters.category && filters.category !== 'all') {
      filteredScales = filteredScales.filter(scale => scale.category === filters.category);
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredScales = filteredScales.filter(scale =>
        scale.tags?.some(tag => filters.tags.includes(tag))
      );
    }

    if (filters.favorites_only) {
      filteredScales = filteredScales.filter(scale => scale.is_favorite);
    }

    return filteredScales;
  },

  async getScaleCategories() {
    return mockCategories;
  },

  async getScaleTags() {
    return mockTags;
  },

  async getFavoriteScales() {
    return mockScales.filter(scale => scale.is_favorite);
  },

  async addScaleToFavorites(scaleId: string) {
    // Mock implementation - in real app this would update the backend
    const scale = mockScales.find(s => s.id === scaleId);
    if (scale) {
      scale.is_favorite = true;
    }
  },

  async removeScaleFromFavorites(scaleId: string) {
    // Mock implementation - in real app this would update the backend
    const scale = mockScales.find(s => s.id === scaleId);
    if (scale) {
      scale.is_favorite = false;
    }
  },

  async getScaleStats() {
    return {
      total_scales: mockScales.length,
      total_assessments: 0,
      total_reports: 0,
      most_used_scales: []
    };
  }
};