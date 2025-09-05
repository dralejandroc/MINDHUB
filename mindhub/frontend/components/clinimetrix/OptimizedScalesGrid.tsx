'use client';

import React, { memo, useMemo, useCallback } from 'react';
import { 
  HeartIcon, 
  ClockIcon, 
  UserIcon, 
  EyeIcon,
  ChartBarIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ClinimetrixRegistry } from '@/lib/clinimetrix-registry';
import { useClinimetrixScales } from '@/lib/hooks/useClinimetrixScales';

interface OptimizedScalesGridProps {
  onScaleSelect?: (scale: ClinimetrixRegistry) => void;
  showFavoriteToggle?: boolean;
  initialFilter?: any;
}

// Memoized scale card component for performance
const ScaleCard = memo(({ 
  scale, 
  onSelect, 
  onToggleFavorite, 
  isFavorite, 
  showFavoriteToggle 
}: {
  scale: ClinimetrixRegistry;
  onSelect: (scale: ClinimetrixRegistry) => void;
  onToggleFavorite: (scaleId: string) => void;
  isFavorite: boolean;
  showFavoriteToggle: boolean;
}) => {
  const getCategoryColor = useCallback((category: string) => {
    const colors = {
      depression: 'bg-blue-100 text-blue-800 border-blue-200',
      anxiety: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cognition: 'bg-purple-100 text-purple-800 border-purple-200',
      autism: 'bg-green-100 text-green-800 border-green-200',
      psychosis: 'bg-red-100 text-red-800 border-red-200',
      personality: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      eating: 'bg-pink-100 text-pink-800 border-pink-200',
      sleep: 'bg-gray-100 text-gray-800 border-gray-200',
      tics: 'bg-orange-100 text-orange-800 border-orange-200',
      trauma: 'bg-red-100 text-red-800 border-red-200',
      suicide: 'bg-red-100 text-red-800 border-red-200',
      ocd: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[category as keyof typeof colors] || colors.cognition;
  }, []);

  const categoryLabels = useMemo(() => ({
    depression: 'Depresión',
    anxiety: 'Ansiedad',
    cognition: 'Cognición',
    autism: 'Autismo/TEA',
    psychosis: 'Psicosis',
    personality: 'Personalidad',
    eating: 'T. Alimentarios',
    sleep: 'Sueño',
    tics: 'Tics',
    trauma: 'Trauma',
    suicide: 'Suicidalidad',
    ocd: 'TOC'
  }), []);

  const getAgeIcon = useCallback((targetAge: string) => {
    switch (targetAge) {
      case 'child':
        return '👶';
      case 'adolescent':
        return '👦';
      case 'adult':
        return '👨';
      case 'elderly':
        return '👴';
      default:
        return '👥';
    }
  }, []);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(scale.id);
  }, [scale.id, onToggleFavorite]);

  const handleCardClick = useCallback(() => {
    onSelect(scale);
  }, [scale, onSelect]);

  return (
    <Card 
      className={`p-4 hover:shadow-lg transition-all duration-200 cursor-pointer h-full ${
        isFavorite ? 'ring-2 ring-red-200 bg-red-50' : 'hover:bg-gray-50'
      }`}
      onClick={handleCardClick}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
              {scale.name}
            </h3>
            <p className="text-xs text-gray-500 line-clamp-1">
              {scale.fullName}
            </p>
          </div>
          
          {showFavoriteToggle && (
            <button
              onClick={handleFavoriteClick}
              className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
              title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              {isFavorite ? (
                <HeartSolidIcon className="h-4 w-4 text-red-500" />
              ) : (
                <HeartIcon className="h-4 w-4 text-gray-400 hover:text-red-500" />
              )}
            </button>
          )}
        </div>

        {/* Category Badge */}
        <div className="mb-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(scale.category)}`}>
            {categoryLabels[scale.category as keyof typeof categoryLabels] || scale.category}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 line-clamp-2 mb-3 flex-1">
          {scale.description}
        </p>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
          <div className="flex items-center space-x-1">
            <ChartBarIcon className="h-3 w-3" />
            <span>{scale.questions} preguntas</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <ClockIcon className="h-3 w-3" />
            <span>~{scale.timeEstimate} min</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <span>{getAgeIcon(scale.targetAge)}</span>
            <span className="capitalize">{scale.targetAge}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <AcademicCapIcon className="h-3 w-3" />
            <span className="capitalize">{scale.primaryUse}</span>
          </div>
        </div>

        {/* Validation Badge */}
        {scale.isValidated && (
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 border border-green-200">
              ✓ Validada
            </span>
          </div>
        )}
      </div>
    </Card>
  );
});

ScaleCard.displayName = 'ScaleCard';

export function OptimizedScalesGrid({
  onScaleSelect = () => {},
  showFavoriteToggle = true,
  initialFilter = {}
}: OptimizedScalesGridProps) {
  const {
    scales,
    loading,
    error,
    favorites,
    filteredCount,
    toggleFavorite
  } = useClinimetrixScales(initialFilter);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-64"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="text-red-500 mb-4">
          <ChartBarIcon className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar escalas</h3>
        <p className="text-gray-600">{error}</p>
      </Card>
    );
  }

  if (scales.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-400 mb-4">
          <ChartBarIcon className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron escalas</h3>
        <p className="text-gray-600">Ajusta los filtros para ver más resultados.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Mostrando {filteredCount} escalas
          {favorites.length > 0 && (
            <span className="ml-2">
              ({favorites.length} favoritas)
            </span>
          )}
        </span>
      </div>

      {/* Optimized grid with lazy loading */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scales.map((scale) => (
          <ScaleCard
            key={scale.id}
            scale={scale}
            onSelect={onScaleSelect}
            onToggleFavorite={toggleFavorite}
            isFavorite={favorites.includes(scale.id)}
            showFavoriteToggle={showFavoriteToggle}
          />
        ))}
      </div>
    </div>
  );
}