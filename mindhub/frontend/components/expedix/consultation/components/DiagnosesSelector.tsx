/**
 * 🔍 DIAGNOSES SELECTOR COMPONENT
 * 
 * Selector avanzado de diagnósticos con:
 * - Soporte para múltiples diagnósticos CIE-10 y DSM-5TR
 * - Búsqueda inteligente por código o descripción
 * - Diagnósticos personalizados (no del catálogo)
 * - Jerarquía de categorías
 * - Validación clínica
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  BookOpenIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Diagnosis {
  id: string;
  code?: string;
  description: string;
  category?: string;
  system?: 'CIE-10' | 'DSM-5TR' | 'CIE-11' | 'custom';
  isPrimary?: boolean;
  notes?: string;
  severity?: 'leve' | 'moderado' | 'grave';
  specifiers?: string[];
}

interface CatalogDiagnosis {
  code: string;
  description: string;
  category: string;
  system: 'CIE-10' | 'DSM-5TR' | 'CIE-11';
}

interface DiagnosesSelectorProps {
  selectedDiagnoses: Diagnosis[];
  onChange: (diagnoses: Diagnosis[]) => void;
  maxDiagnoses?: number;
  allowCustom?: boolean;
  className?: string;
}

export default function DiagnosesSelector({
  selectedDiagnoses,
  onChange,
  maxDiagnoses = 10,
  allowCustom = true,
  className = ''
}: DiagnosesSelectorProps) {
  // Estados
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CatalogDiagnosis[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [customDiagnosis, setCustomDiagnosis] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSystem, setSelectedSystem] = useState<string>('all');

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Categorías para filtrar
  const categories = [
    'all',
    'Trastornos del estado de ánimo',
    'Trastornos de ansiedad',
    'Trastornos neuróticos',
    'Esquizofrenia',
    'Trastornos de la personalidad',
    'Trastornos del neurodesarrollo',
    'Trastornos alimentarios',
    'Trauma y estrés',
    'TOC y relacionados'
  ];

  const systems = [
    { value: 'all', label: 'Todos los sistemas' },
    { value: 'CIE-10', label: 'CIE-10' },
    { value: 'DSM-5TR', label: 'DSM-5TR' },
    { value: 'CIE-11', label: 'CIE-11' }
  ];

  // Búsqueda de diagnósticos con debounce
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchDiagnoses(searchQuery);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, selectedCategory, selectedSystem]);

  // Click outside para cerrar resultados
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchDiagnoses = async (query: string) => {
    try {
      setIsSearching(true);
      
      let url = `/api/expedix/django/diagnoses/search?q=${encodeURIComponent(query)}`;
      
      // Agregar filtros
      if (selectedCategory !== 'all') {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      if (selectedSystem !== 'all') {
        url += `&system=${encodeURIComponent(selectedSystem)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.diagnoses || []);
        setShowResults(true);
      } else {
        console.error('Error searching diagnoses:', data.error);
        toast.error('Error al buscar diagnósticos');
      }
    } catch (error) {
      console.error('Error searching diagnoses:', error);
      toast.error('Error al conectar con el servidor');
    } finally {
      setIsSearching(false);
    }
  };

  const addDiagnosis = (catalogDiagnosis: CatalogDiagnosis) => {
    if (selectedDiagnoses.length >= maxDiagnoses) {
      toast.error(`Máximo ${maxDiagnoses} diagnósticos permitidos`);
      return;
    }

    // Verificar si ya existe
    const exists = selectedDiagnoses.some(d => 
      d.code === catalogDiagnosis.code || 
      d.description.toLowerCase() === catalogDiagnosis.description.toLowerCase()
    );

    if (exists) {
      toast.error('Este diagnóstico ya está seleccionado');
      return;
    }

    const newDiagnosis: Diagnosis = {
      id: crypto.randomUUID(),
      code: catalogDiagnosis.code,
      description: catalogDiagnosis.description,
      category: catalogDiagnosis.category,
      system: catalogDiagnosis.system,
      isPrimary: selectedDiagnoses.length === 0 // El primero es primario por defecto
    };

    onChange([...selectedDiagnoses, newDiagnosis]);
    setSearchQuery('');
    setShowResults(false);
    toast.success('Diagnóstico agregado correctamente');
  };

  const addCustomDiagnosis = () => {
    if (!customDiagnosis.trim()) {
      toast.error('Ingrese la descripción del diagnóstico');
      return;
    }

    if (selectedDiagnoses.length >= maxDiagnoses) {
      toast.error(`Máximo ${maxDiagnoses} diagnósticos permitidos`);
      return;
    }

    // Verificar si ya existe
    const exists = selectedDiagnoses.some(d => 
      d.description.toLowerCase() === customDiagnosis.trim().toLowerCase()
    );

    if (exists) {
      toast.error('Este diagnóstico ya está registrado');
      return;
    }

    const newDiagnosis: Diagnosis = {
      id: crypto.randomUUID(),
      description: customDiagnosis.trim(),
      system: 'custom',
      category: 'Diagnóstico personalizado',
      isPrimary: selectedDiagnoses.length === 0
    };

    onChange([...selectedDiagnoses, newDiagnosis]);
    setCustomDiagnosis('');
    setShowCustomForm(false);
    toast.success('Diagnóstico personalizado agregado');
  };

  const removeDiagnosis = (diagnosisId: string) => {
    const updatedDiagnoses = selectedDiagnoses.filter(d => d.id !== diagnosisId);
    
    // Si eliminamos el diagnóstico primario, hacer primario al siguiente
    if (updatedDiagnoses.length > 0 && !updatedDiagnoses.some(d => d.isPrimary)) {
      updatedDiagnoses[0].isPrimary = true;
    }
    
    onChange(updatedDiagnoses);
    toast.success('Diagnóstico eliminado');
  };

  const setPrimaryDiagnosis = (diagnosisId: string) => {
    const updatedDiagnoses = selectedDiagnoses.map(d => ({
      ...d,
      isPrimary: d.id === diagnosisId
    }));
    
    onChange(updatedDiagnoses);
    toast.success('Diagnóstico principal actualizado');
  };

  const updateDiagnosisNotes = (diagnosisId: string, notes: string) => {
    const updatedDiagnoses = selectedDiagnoses.map(d =>
      d.id === diagnosisId ? { ...d, notes } : d
    );
    onChange(updatedDiagnoses);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header con título y contadores */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BookOpenIcon className="h-5 w-5 text-primary-teal" />
          <h3 className="text-lg font-medium text-gray-900">
            Diagnósticos Clínicos
          </h3>
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
            {selectedDiagnoses.length}/{maxDiagnoses}
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sistema de clasificación
          </label>
          <select
            value={selectedSystem}
            onChange={(e) => setSelectedSystem(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent text-sm"
          >
            {systems.map(system => (
              <option key={system.value} value={system.value}>
                {system.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent text-sm"
          >
            <option value="all">Todas las categorías</option>
            {categories.slice(1).map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Búsqueda principal */}
      <div className="relative" ref={resultsRef}>
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código (ej: F32.0) o descripción (ej: depresión)..."
            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
          {isSearching && (
            <div className="absolute right-3 top-3.5">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-teal border-t-transparent"></div>
            </div>
          )}
        </div>

        {/* Resultados de búsqueda */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {searchResults.map((diagnosis, index) => (
              <div
                key={index}
                onClick={() => addDiagnosis(diagnosis)}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-mono text-sm font-medium text-primary-teal">
                        {diagnosis.code}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        diagnosis.system === 'CIE-10' 
                          ? 'bg-blue-100 text-blue-700'
                          : diagnosis.system === 'DSM-5TR'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {diagnosis.system}
                      </span>
                    </div>
                    <div className="font-medium text-gray-900 mb-1">
                      {diagnosis.description}
                    </div>
                    <div className="text-sm text-gray-600">
                      {diagnosis.category}
                    </div>
                  </div>
                  <PlusIcon className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {showResults && searchResults.length === 0 && !isSearching && searchQuery.length >= 2 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 mb-2">No se encontraron diagnósticos</p>
            {allowCustom && (
              <button
                onClick={() => {
                  setCustomDiagnosis(searchQuery);
                  setShowCustomForm(true);
                  setShowResults(false);
                }}
                className="text-sm text-primary-teal hover:text-teal-700 font-medium"
              >
                + Agregar como diagnóstico personalizado
              </button>
            )}
          </div>
        )}
      </div>

      {/* Botón para agregar diagnóstico personalizado */}
      {allowCustom && !showCustomForm && (
        <button
          onClick={() => setShowCustomForm(true)}
          className="flex items-center space-x-2 text-sm text-primary-teal hover:text-teal-700 font-medium"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Agregar diagnóstico personalizado</span>
        </button>
      )}

      {/* Formulario para diagnóstico personalizado */}
      {showCustomForm && (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center space-x-2 mb-3">
            <TagIcon className="h-5 w-5 text-orange-500" />
            <h4 className="font-medium text-gray-900">Diagnóstico Personalizado</h4>
          </div>
          
          <div className="space-y-3">
            <textarea
              value={customDiagnosis}
              onChange={(e) => setCustomDiagnosis(e.target.value)}
              placeholder="Descripción del diagnóstico personalizado..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent resize-none"
              rows={3}
            />
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowCustomForm(false);
                  setCustomDiagnosis('');
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={addCustomDiagnosis}
                className="px-3 py-2 bg-primary-teal text-white text-sm rounded-lg hover:bg-teal-600 transition-colors"
              >
                Agregar Diagnóstico
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de diagnósticos seleccionados */}
      {selectedDiagnoses.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">
            Diagnósticos Seleccionados ({selectedDiagnoses.length})
          </h4>
          
          <div className="space-y-3">
            {selectedDiagnoses.map((diagnosis, index) => (
              <div
                key={diagnosis.id}
                className={`p-4 border rounded-lg ${
                  diagnosis.isPrimary 
                    ? 'border-primary-teal bg-teal-50' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {diagnosis.isPrimary && (
                        <span className="px-2 py-1 text-xs bg-primary-teal text-white rounded-full font-medium">
                          Principal
                        </span>
                      )}
                      {diagnosis.code && (
                        <span className="font-mono text-sm font-medium text-gray-600">
                          {diagnosis.code}
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        diagnosis.system === 'CIE-10' 
                          ? 'bg-blue-100 text-blue-700'
                          : diagnosis.system === 'DSM-5TR'
                          ? 'bg-purple-100 text-purple-700'
                          : diagnosis.system === 'CIE-11'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {diagnosis.system === 'custom' ? 'Personalizado' : diagnosis.system}
                      </span>
                    </div>
                    
                    <div className="font-medium text-gray-900 mb-1">
                      {diagnosis.description}
                    </div>
                    
                    {diagnosis.category && (
                      <div className="text-sm text-gray-600 mb-2">
                        {diagnosis.category}
                      </div>
                    )}

                    {/* Campo para notas adicionales */}
                    <textarea
                      value={diagnosis.notes || ''}
                      onChange={(e) => updateDiagnosisNotes(diagnosis.id!, e.target.value)}
                      placeholder="Notas adicionales, especificadores, severidad..."
                      className="w-full mt-2 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-teal focus:border-transparent resize-none"
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {!diagnosis.isPrimary && (
                      <button
                        onClick={() => setPrimaryDiagnosis(diagnosis.id!)}
                        className="text-xs text-primary-teal hover:text-teal-700 font-medium"
                        title="Establecer como diagnóstico principal"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => removeDiagnosis(diagnosis.id!)}
                      className="text-red-500 hover:text-red-700"
                      title="Eliminar diagnóstico"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información de ayuda */}
      <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
        <div className="flex items-start space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900 mb-1">Información sobre diagnósticos:</p>
            <ul className="text-blue-800 space-y-1">
              <li>• El primer diagnóstico se marca automáticamente como principal</li>
              <li>• Puede seleccionar hasta {maxDiagnoses} diagnósticos simultáneos</li>
              <li>• Use códigos específicos (F32.0) o términos generales (depresión)</li>
              <li>• Los diagnósticos personalizados permiten descripciones libres</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}