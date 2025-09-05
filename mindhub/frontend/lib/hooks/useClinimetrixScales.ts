// Optimized hook for ClinimetrixPro scales with performance enhancements
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ClinimetrixRegistry } from '@/lib/clinimetrix-registry';

interface ScalesFilter {
  category?: string;
  targetAge?: string;
  searchTerm?: string;
  onlyFavorites?: boolean;
  primaryUse?: string;
}

interface ScalesHookState {
  scales: ClinimetrixRegistry[];
  filteredScales: ClinimetrixRegistry[];
  loading: boolean;
  error: string | null;
  categories: Array<{ id: string; label: string; count: number }>;
  totalCount: number;
  favorites: string[];
}

// Cache for scales data to avoid repeated imports
let scalesCache: ClinimetrixRegistry[] | null = null;
let categoriesCache: Array<{ id: string; label: string; count: number }> | null = null;

export function useClinimetrixScales(initialFilter: ScalesFilter = {}) {
  const [state, setState] = useState<ScalesHookState>({
    scales: [],
    filteredScales: [],
    loading: true,
    error: null,
    categories: [],
    totalCount: 0,
    favorites: []
  });

  const [filter, setFilter] = useState<ScalesFilter>(initialFilter);

  // Memoized category mapping for performance
  const categoryLabels = useMemo(() => ({
    depression: 'Depresión',
    anxiety: 'Ansiedad',
    cognition: 'Cognición',
    autism: 'Autismo/TEA',
    psychosis: 'Psicosis',
    personality: 'Personalidad',
    eating: 'Trastornos Alimentarios',
    sleep: 'Sueño',
    tics: 'Tics',
    trauma: 'Trauma',
    suicide: 'Suicidalidad',
    ocd: 'TOC'
  }), []);

  // Load scales data with caching
  useEffect(() => {
    const loadScales = async () => {
      if (scalesCache && categoriesCache) {
        // Use cached data
        setState(prev => ({
          ...prev,
          scales: scalesCache!,
          categories: categoriesCache!,
          totalCount: scalesCache!.length,
          loading: false
        }));
        return;
      }

      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        // Dynamic import with performance optimization
        const { CLINIMETRIX_REGISTRY } = await import('@/lib/clinimetrix-registry');
        
        // Cache the data
        scalesCache = CLINIMETRIX_REGISTRY;

        // Generate categories with counts
        const categoryStats = new Map<string, number>();
        CLINIMETRIX_REGISTRY.forEach(scale => {
          const count = categoryStats.get(scale.category) || 0;
          categoryStats.set(scale.category, count + 1);
        });

        const categories = Array.from(categoryStats.entries()).map(([id, count]) => ({
          id,
          label: categoryLabels[id as keyof typeof categoryLabels] || id,
          count
        })).sort((a, b) => b.count - a.count);

        // Cache categories
        categoriesCache = categories;

        setState(prev => ({
          ...prev,
          scales: CLINIMETRIX_REGISTRY,
          categories,
          totalCount: CLINIMETRIX_REGISTRY.length,
          loading: false
        }));

      } catch (error) {
        console.error('Error loading ClinimetrixPro scales:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Error loading scales'
        }));
      }
    };

    loadScales();
  }, [categoryLabels]);

  // Memoized filtering logic for performance
  const filteredScales = useMemo(() => {
    if (!state.scales.length) return [];

    let filtered = [...state.scales];

    // Category filter
    if (filter.category && filter.category !== 'all') {
      filtered = filtered.filter(scale => scale.category === filter.category);
    }

    // Target age filter
    if (filter.targetAge && filter.targetAge !== 'all') {
      filtered = filtered.filter(scale => 
        scale.targetAge === filter.targetAge || scale.targetAge === 'all'
      );
    }

    // Primary use filter
    if (filter.primaryUse && filter.primaryUse !== 'all') {
      filtered = filtered.filter(scale => scale.primaryUse === filter.primaryUse);
    }

    // Search term filter (optimized)
    if (filter.searchTerm) {
      const searchTerm = filter.searchTerm.toLowerCase();
      filtered = filtered.filter(scale =>
        scale.name.toLowerCase().includes(searchTerm) ||
        scale.fullName.toLowerCase().includes(searchTerm) ||
        scale.description.toLowerCase().includes(searchTerm) ||
        scale.domains.some(domain => domain.toLowerCase().includes(searchTerm))
      );
    }

    // Favorites filter
    if (filter.onlyFavorites && state.favorites.length > 0) {
      filtered = filtered.filter(scale => state.favorites.includes(scale.id));
    }

    // Sort by category, then by name for consistency
    filtered.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [state.scales, state.favorites, filter]);

  // Update filtered scales when filter changes
  useEffect(() => {
    setState(prev => ({ ...prev, filteredScales }));
  }, [filteredScales]);

  // Load user favorites (this would typically come from API)
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        // TODO: Replace with actual API call to get user's favorite scales
        const storedFavorites = localStorage.getItem('clinimetrix-favorites');
        const favorites = storedFavorites ? JSON.parse(storedFavorites) : [];
        setState(prev => ({ ...prev, favorites }));
      } catch (error) {
        console.warn('Error loading favorites from localStorage:', error);
      }
    };

    loadFavorites();
  }, []);

  // Optimized filter update function
  const updateFilter = useCallback((newFilter: Partial<ScalesFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  }, []);

  // Clear filter function
  const clearFilter = useCallback(() => {
    setFilter({});
  }, []);

  // Get scale by ID (optimized with memoization)
  const getScaleById = useCallback((id: string): ClinimetrixRegistry | undefined => {
    return state.scales.find(scale => scale.id === id);
  }, [state.scales]);

  // Get scales by category (optimized)
  const getScalesByCategory = useCallback((category: string): ClinimetrixRegistry[] => {
    return state.scales.filter(scale => scale.category === category);
  }, [state.scales]);

  // Toggle favorite function
  const toggleFavorite = useCallback((scaleId: string) => {
    setState(prev => {
      const newFavorites = prev.favorites.includes(scaleId)
        ? prev.favorites.filter(id => id !== scaleId)
        : [...prev.favorites, scaleId];
      
      // Save to localStorage
      try {
        localStorage.setItem('clinimetrix-favorites', JSON.stringify(newFavorites));
      } catch (error) {
        console.warn('Error saving favorites to localStorage:', error);
      }

      return { ...prev, favorites: newFavorites };
    });
  }, []);

  // Get random scales for recommendations
  const getRandomScales = useCallback((count: number = 5): ClinimetrixRegistry[] => {
    const shuffled = [...state.scales].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }, [state.scales]);

  // Get popular scales (by usage or favorites)
  const getPopularScales = useCallback((count: number = 10): ClinimetrixRegistry[] => {
    // This would typically be based on usage statistics
    // For now, return scales commonly used in clinical practice
    const popularIds = ['phq-9', 'gad-7', 'beck-depression-inventory', 'hamilton-anxiety', 'moca'];
    const popular = state.scales.filter(scale => popularIds.includes(scale.id));
    const remaining = state.scales.filter(scale => !popularIds.includes(scale.id))
      .slice(0, count - popular.length);
    
    return [...popular, ...remaining].slice(0, count);
  }, [state.scales]);

  return {
    // State
    scales: state.filteredScales,
    allScales: state.scales,
    loading: state.loading,
    error: state.error,
    categories: state.categories,
    totalCount: state.totalCount,
    filteredCount: state.filteredScales.length,
    favorites: state.favorites,
    currentFilter: filter,

    // Actions
    updateFilter,
    clearFilter,
    toggleFavorite,

    // Utility functions
    getScaleById,
    getScalesByCategory,
    getRandomScales,
    getPopularScales,

    // Performance metrics
    isCached: !!scalesCache
  };
}