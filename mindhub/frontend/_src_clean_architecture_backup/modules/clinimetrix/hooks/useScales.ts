/**
 * useScales Hook
 * React Hook integrating Clean Architecture for scale management
 * Provides scales functionality without exposing implementation details
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { ClinimetrixContainer } from '../container/ClinimetrixContainer';
import { GetScaleCatalogRequest } from '../usecases/GetScaleCatalogUseCase';
import { ScaleViewModel, ScaleCatalogViewModel } from '../presenters/ClinimetrixPresenter';

export interface UseScalesOptions {
  autoLoad?: boolean;
  userLevel?: string;
  userExperience?: 'beginner' | 'intermediate' | 'expert';
  defaultFilters?: Partial<GetScaleCatalogRequest>;
}

export interface UseScalesReturn {
  // State
  scales: ScaleViewModel[];
  catalog: ScaleCatalogViewModel | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadScales: (filters?: GetScaleCatalogRequest) => Promise<void>;
  searchScales: (query: string, filters?: GetScaleCatalogRequest) => Promise<void>;
  getScale: (id: string) => Promise<ScaleViewModel | null>;
  getFeaturedScales: (limit?: number) => Promise<void>;
  getPopularScales: (limit?: number) => Promise<void>;
  getScalesForCategory: (category: string) => Promise<void>;
  
  // User interactions
  addToFavorites: (scaleId: string) => Promise<void>;
  removeFromFavorites: (scaleId: string) => Promise<void>;
  rateScale: (scaleId: string, rating: number) => Promise<void>;
  
  // Filters and search
  activeFilters: GetScaleCatalogRequest;
  setFilters: (filters: Partial<GetScaleCatalogRequest>) => void;
  clearFilters: () => void;
  
  // Helpers
  refreshCatalog: () => Promise<void>;
  isScaleFavorite: (scaleId: string) => boolean;
}

export function useScales(options: UseScalesOptions = {}): UseScalesReturn {
  const {
    autoLoad = true,
    userLevel,
    userExperience,
    defaultFilters = {}
  } = options;

  // Get use cases from container
  const container = ClinimetrixContainer.getInstance();
  const getScaleCatalogUseCase = container.getGetScaleCatalogUseCase();
  const presenter = container.getClinimetrixPresenter();

  // State
  const [scales, setScales] = useState<ScaleViewModel[]>([]);
  const [catalog, setCatalog] = useState<ScaleCatalogViewModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [activeFilters, setActiveFilters] = useState<GetScaleCatalogRequest>({
    userLevel,
    userExperience,
    ...defaultFilters
  });

  // Load scales with filters
  const loadScales = useCallback(async (filters?: GetScaleCatalogRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const requestFilters = {
        ...activeFilters,
        ...filters
      };

      const response = await getScaleCatalogUseCase.execute(requestFilters);
      
      // Present scales using presenter
      const presentedScales = response.scales.map(scale => 
        presenter.presentScaleRegistry(scale)
      );

      // Create catalog view model
      const catalogVM: ScaleCatalogViewModel = {
        scales: presentedScales,
        totalCount: response.totalCount,
        categories: response.facets.categories.map(cat => ({
          id: cat.category,
          name: getCategoryName(cat.category),
          count: cat.count,
          color: getCategoryColor(cat.category),
          icon: getCategoryIcon(cat.category)
        })),
        difficulties: response.facets.difficulties.map(diff => ({
          id: diff.difficulty,
          name: getDifficultyName(diff.difficulty),
          count: diff.count,
          color: getDifficultyColor(diff.difficulty)
        })),
        filters: {
          activeCategory: requestFilters.category,
          activeDifficulty: requestFilters.difficulty,
          searchQuery: requestFilters.query,
          showFeatured: requestFilters.isFeatured
        },
        recommendations: response.recommendations?.map(scale => 
          presenter.presentScaleRegistry(scale)
        ),
        warnings: response.warnings
      };

      setScales(presentedScales);
      setCatalog(catalogVM);
      
      if (filters) {
        setActiveFilters(prev => ({ ...prev, ...filters }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading scales';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error loading scales:', err);
    } finally {
      setLoading(false);
    }
  }, [getScaleCatalogUseCase, presenter, activeFilters]);

  // Search scales
  const searchScales = useCallback(async (query: string, filters?: GetScaleCatalogRequest) => {
    await loadScales({
      ...filters,
      query: query.trim() || undefined
    });
  }, [loadScales]);

  // Get single scale
  const getScale = useCallback(async (id: string): Promise<ScaleViewModel | null> => {
    try {
      setError(null);
      const scaleRepository = container.getScaleRepository();
      const scale = await scaleRepository.findById(id);
      
      if (!scale) {
        return null;
      }

      return presenter.presentScale(scale);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading scale';
      setError(errorMessage);
      console.error('Error loading scale:', err);
      return null;
    }
  }, [container, presenter]);

  // Get featured scales
  const getFeaturedScales = useCallback(async (limit: number = 10) => {
    await loadScales({
      isFeatured: true,
      limit,
      sortBy: 'popularity'
    });
  }, [loadScales]);

  // Get popular scales
  const getPopularScales = useCallback(async (limit: number = 10) => {
    await loadScales({
      limit,
      sortBy: 'popularity'
    });
  }, [loadScales]);

  // Get scales by category
  const getScalesForCategory = useCallback(async (category: string) => {
    await loadScales({
      category: category as any,
      sortBy: 'name'
    });
  }, [loadScales]);

  // Add to favorites
  const addToFavorites = useCallback(async (scaleId: string) => {
    try {
      const repository = container.getScaleRegistryRepository();
      // TODO: Get current user ID
      const userId = 'current-user'; // This should come from auth context
      
      await repository.addToFavorites(userId, scaleId);
      setFavorites(prev => new Set(prev).add(scaleId));
      toast.success('Escala agregada a favoritos');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error adding to favorites';
      toast.error(errorMessage);
      console.error('Error adding to favorites:', err);
    }
  }, [container]);

  // Remove from favorites
  const removeFromFavorites = useCallback(async (scaleId: string) => {
    try {
      const repository = container.getScaleRegistryRepository();
      // TODO: Get current user ID
      const userId = 'current-user'; // This should come from auth context
      
      await repository.removeFromFavorites(userId, scaleId);
      setFavorites(prev => {
        const newSet = new Set(prev);
        newSet.delete(scaleId);
        return newSet;
      });
      toast.success('Escala eliminada de favoritos');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error removing from favorites';
      toast.error(errorMessage);
      console.error('Error removing from favorites:', err);
    }
  }, [container]);

  // Rate scale
  const rateScale = useCallback(async (scaleId: string, rating: number) => {
    try {
      const repository = container.getScaleRegistryRepository();
      await repository.addRating(scaleId, rating);
      toast.success('Calificación guardada');
      
      // Refresh the specific scale in the list
      await loadScales();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error rating scale';
      toast.error(errorMessage);
      console.error('Error rating scale:', err);
    }
  }, [container, loadScales]);

  // Set filters
  const setFilters = useCallback((newFilters: Partial<GetScaleCatalogRequest>) => {
    setActiveFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setActiveFilters({
      userLevel,
      userExperience,
      ...defaultFilters
    });
  }, [userLevel, userExperience, defaultFilters]);

  // Refresh catalog
  const refreshCatalog = useCallback(async () => {
    await loadScales(activeFilters);
  }, [loadScales, activeFilters]);

  // Check if scale is favorite
  const isScaleFavorite = useCallback((scaleId: string): boolean => {
    return favorites.has(scaleId);
  }, [favorites]);

  // Load favorites on mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const repository = container.getScaleRegistryRepository();
        // TODO: Get current user ID
        const userId = 'current-user'; // This should come from auth context
        
        const favoriteScales = await repository.getFavorites(userId);
        const favoriteIds = new Set(favoriteScales.map(scale => scale.id));
        setFavorites(favoriteIds);
      } catch (error) {
        console.warn('Could not load user favorites:', error);
      }
    };

    loadFavorites();
  }, [container]);

  // Auto-load scales on mount
  useEffect(() => {
    if (autoLoad) {
      loadScales();
    }
  }, [autoLoad, loadScales]);

  // Memoized return object
  return useMemo(() => ({
    // State
    scales,
    catalog,
    loading,
    error,
    
    // Actions
    loadScales,
    searchScales,
    getScale,
    getFeaturedScales,
    getPopularScales,
    getScalesForCategory,
    
    // User interactions
    addToFavorites,
    removeFromFavorites,
    rateScale,
    
    // Filters and search
    activeFilters,
    setFilters,
    clearFilters,
    
    // Helpers
    refreshCatalog,
    isScaleFavorite
  }), [
    scales,
    catalog,
    loading,
    error,
    loadScales,
    searchScales,
    getScale,
    getFeaturedScales,
    getPopularScales,
    getScalesForCategory,
    addToFavorites,
    removeFromFavorites,
    rateScale,
    activeFilters,
    setFilters,
    clearFilters,
    refreshCatalog,
    isScaleFavorite
  ]);
}

// Helper functions for presentation
function getCategoryName(category: string): string {
  const names: Record<string, string> = {
    'depression': 'Depresión',
    'anxiety': 'Ansiedad',
    'autism': 'Autismo/TEA',
    'eating_disorders': 'Trastornos Alimentarios',
    'cognition': 'Cognición',
    'ocd': 'TOC',
    'psychosis': 'Psicosis',
    'sleep': 'Sueño',
    'tics': 'Tics',
    'personality': 'Personalidad',
    'trauma': 'Trauma',
    'suicide': 'Suicidalidad',
    'general': 'General'
  };
  return names[category] || category;
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'depression': 'bg-blue-100 text-blue-800',
    'anxiety': 'bg-yellow-100 text-yellow-800',
    'autism': 'bg-purple-100 text-purple-800',
    'eating_disorders': 'bg-pink-100 text-pink-800',
    'cognition': 'bg-indigo-100 text-indigo-800',
    'ocd': 'bg-teal-100 text-teal-800',
    'psychosis': 'bg-red-100 text-red-800',
    'sleep': 'bg-gray-100 text-gray-800',
    'tics': 'bg-orange-100 text-orange-800',
    'personality': 'bg-emerald-100 text-emerald-800',
    'trauma': 'bg-rose-100 text-rose-800',
    'suicide': 'bg-red-100 text-red-800',
    'general': 'bg-gray-100 text-gray-800'
  };
  return colors[category] || colors['general'];
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'depression': '😔',
    'anxiety': '😰',
    'autism': '🧩',
    'eating_disorders': '🍽️',
    'cognition': '🧠',
    'ocd': '💭',
    'psychosis': '🏥',
    'sleep': '🌙',
    'tics': '⚡',
    'personality': '🧬',
    'trauma': '💔',
    'suicide': '⚠️',
    'general': '📋'
  };
  return icons[category] || icons['general'];
}

function getDifficultyName(difficulty: string): string {
  const names: Record<string, string> = {
    'beginner': 'Principiante',
    'intermediate': 'Intermedio',
    'advanced': 'Avanzado'
  };
  return names[difficulty] || difficulty;
}

function getDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    'beginner': 'bg-green-100 text-green-800',
    'intermediate': 'bg-yellow-100 text-yellow-800',
    'advanced': 'bg-red-100 text-red-800'
  };
  return colors[difficulty] || 'bg-gray-100 text-gray-800';
}