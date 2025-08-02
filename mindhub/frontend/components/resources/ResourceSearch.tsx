'use client';

import React from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

interface ResourceSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  onRefresh: () => void;
}

export const ResourceSearch: React.FC<ResourceSearchProps> = ({
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
  onRefresh
}) => {
  const [showFilters, setShowFilters] = React.useState(false);
  const [fileTypeFilter, setFileTypeFilter] = React.useState('');
  const [dateFilter, setDateFilter] = React.useState('');

  const clearFilters = () => {
    onSearchChange('');
    onCategoryChange('');
    setFileTypeFilter('');
    setDateFilter('');
  };

  const hasActiveFilters = searchQuery || selectedCategory || fileTypeFilter || dateFilter;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 space-y-4">
      {/* Main Search Bar */}
      <div className="flex items-center space-x-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por título, descripción o contenido..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant={showFilters ? 'primary' : 'outline'}
          size="sm"
        >
          <FunnelIcon className="h-4 w-4 mr-2" />
          Filtros
        </Button>

        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
        >
          <ArrowPathIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* File Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Archivo
              </label>
              <select
                value={fileTypeFilter}
                onChange={(e) => setFileTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos los tipos</option>
                <option value="pdfs">PDF</option>
                <option value="images">Imágenes</option>
                <option value="documents">Documentos</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Subida
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Cualquier fecha</option>
                <option value="today">Hoy</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
                <option value="quarter">Últimos 3 meses</option>
                <option value="year">Este año</option>
              </select>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="mt-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-gray-700">Accesos rápidos:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onCategoryChange(categories.find(c => c.name === 'Psicoeducación')?.id || '')}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
              >
                Psicoeducación
              </button>
              <button
                onClick={() => onCategoryChange(categories.find(c => c.name === 'Tareas Terapéuticas')?.id || '')}
                className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors"
              >
                Tareas Terapéuticas
              </button>
              <button
                onClick={() => onCategoryChange(categories.find(c => c.name === 'Evaluaciones')?.id || '')}
                className="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200 transition-colors"
              >
                Evaluaciones
              </button>
              <button
                onClick={() => setFileTypeFilter('pdfs')}
                className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-full hover:bg-red-200 transition-colors"
              >
                Solo PDFs
              </button>
              <button
                onClick={() => setDateFilter('month')}
                className="px-3 py-1 text-xs bg-orange-100 text-orange-800 rounded-full hover:bg-orange-200 transition-colors"
              >
                Este mes
              </button>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {[
                    searchQuery && `Búsqueda: "${searchQuery}"`,
                    selectedCategory && `Categoría: ${categories.find(c => c.id === selectedCategory)?.name}`,
                    fileTypeFilter && `Tipo: ${fileTypeFilter}`,
                    dateFilter && `Fecha: ${dateFilter}`
                  ].filter(Boolean).join(' • ')}
                </div>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Limpiar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Tips */}
      {searchQuery && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start">
            <MagnifyingGlassIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
            <div>
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> La búsqueda incluye contenido dentro de documentos PDF y textos.
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Usa comillas para buscar frases exactas: "ansiedad generalizada"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};