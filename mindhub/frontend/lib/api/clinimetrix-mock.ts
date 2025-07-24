/**
 * Mock data temporal para testing del frontend de Clinimetrix
 * Se reemplazará cuando el backend esté completo
 */

import { Scale } from './clinimetrix-client';

export const mockScales: Scale[] = [
  {
    id: 'stai',
    name: 'Inventario de Ansiedad Estado-Rasgo',
    abbreviation: 'STAI',
    description: 'Evaluación de ansiedad como estado emocional transitorio y como rasgo de personalidad relativamente estable.',
    version: '1.0',
    category: 'ansiedad',
    subcategory: 'estado_rasgo',
    total_items: 40,
    estimated_duration_minutes: 15,
    administration_mode: 'self_administered' as const,
    target_population: 'Adolescentes y adultos',
    scoring_method: 'sum',
    tags: ['ansiedad', 'estado', 'rasgo', 'emocional', 'psicometria'],
    is_favorite: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'cuestionario-salamanca',
    name: 'Cuestionario Salamanca de Trastornos de la Personalidad',
    abbreviation: 'CS-TP',
    description: 'Instrumento de screening autoaplicado diseñado para la detección temprana de 11 trastornos de personalidad según criterios DSM-IV-TR y CIE-10.',
    version: '2007',
    category: 'personalidad',
    subcategory: 'trastornos_personalidad_screening',
    total_items: 22,
    estimated_duration_minutes: 10,
    administration_mode: 'self_administered' as const,
    target_population: 'Adolescentes y adultos alfabetos',
    scoring_method: 'sum',
    tags: ['personalidad', 'trastornos', 'screening', 'dsm', 'cluster', 'patologia'],
    is_favorite: true,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  },
  {
    id: 'bdi-21',
    name: 'Inventario de Depresión de Beck-21',
    abbreviation: 'BDI-21',
    description: 'Autoinforme de 21 ítems que evalúa la presencia y gravedad de síntomas depresivos en adultos y adolescentes de 13 años o más.',
    version: '1.0',
    category: 'depresion',
    subcategory: 'sintomatologia_depresiva',
    total_items: 21,
    estimated_duration_minutes: 12,
    administration_mode: 'both' as const,
    target_population: 'Adultos y adolescentes de 13 años o más',
    scoring_method: 'sum',
    tags: ['depresion', 'beck', 'sintomas', 'autoinforme', 'clinica', 'seguimiento'],
    is_favorite: false,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z'
  }
];

export const mockCategories = ['ansiedad', 'personalidad', 'depresion'];

export const mockTags = [
  'ansiedad', 'estado', 'rasgo', 'emocional', 'psicometria',
  'personalidad', 'trastornos', 'screening', 'dsm', 'cluster', 'patologia',
  'depresion', 'beck', 'sintomas', 'autoinforme', 'clinica', 'seguimiento'
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