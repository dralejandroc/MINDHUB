'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentChartBarIcon, 
  ClockIcon,
  StarIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  BeakerIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { clinimetrixProClient } from '@/lib/api/clinimetrix-pro-client';
import type { ClinimetrixRegistry } from '@/lib/api/clinimetrix-pro-client';
import { ClinimetrixProAssessmentModal } from '@/components/ClinimetrixPro/ClinimetrixProAssessmentModal';
import { Button } from '@/components/ui/Button';

interface ClinimetrixScaleSelectorProps {
  patient: {
    id: string;
    first_name: string;
    paternal_last_name: string;
    maternal_last_name?: string;
    age?: number;
  };
  onClose: () => void;
  consultationId?: string; // Si hay una consulta abierta
  isQuickMode?: boolean;
  onAssessmentCompleted?: (result: any) => void;
}

export default function ClinimetrixScaleSelector({
  patient,
  onClose,
  consultationId,
  isQuickMode = false,
  onAssessmentCompleted
}: ClinimetrixScaleSelectorProps) {
  const [scales, setScales] = useState<ClinimetrixRegistry[]>([]);
  const [filteredScales, setFilteredScales] = useState<ClinimetrixRegistry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScale, setSelectedScale] = useState<ClinimetrixRegistry | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    loadScales();
    loadFavorites();
  }, []);

  useEffect(() => {
    filterAndSortScales();
  }, [scales, searchTerm, favorites]);

  const loadScales = async () => {
    try {
      setLoading(true);
      const scalesData = await clinimetrixProClient.getTemplateCatalog();
      setScales(scalesData);
    } catch (error) {
      console.error('Error loading scales:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = () => {
    const storedFavorites = JSON.parse(localStorage.getItem('clinimetrix-favorites') || '[]');
    setFavorites(storedFavorites);
  };

  const toggleFavorite = (scaleId: string) => {
    const newFavorites = favorites.includes(scaleId)
      ? favorites.filter(id => id !== scaleId)
      : [...favorites, scaleId];
    
    setFavorites(newFavorites);
    localStorage.setItem('clinimetrix-favorites', JSON.stringify(newFavorites));
  };

  const filterAndSortScales = () => {
    let filtered = [...scales];

    // Aplicar búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(scale =>
        scale.name.toLowerCase().includes(searchLower) ||
        scale.abbreviation?.toLowerCase().includes(searchLower) ||
        scale.description.toLowerCase().includes(searchLower) ||
        scale.category.toLowerCase().includes(searchLower)
      );
    }

    // Ordenar: favoritos primero, luego alfabético
    filtered.sort((a, b) => {
      const aIsFavorite = favorites.includes(a.templateId);
      const bIsFavorite = favorites.includes(b.templateId);
      
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      
      return a.name.localeCompare(b.name, 'es');
    });

    setFilteredScales(filtered);
  };

  const handleSelectScale = (scale: ClinimetrixRegistry) => {
    setSelectedScale(scale);
    setShowAssessment(true);
  };

  const handleAssessmentComplete = async (results: any) => {
    console.log('Assessment completed:', results);
    
    // Auto-guardar resultados en el expediente del paciente
    try {
      const { expedixAssessmentsClient } = await import('@/lib/api/expedix-assessments-client');
      
      const assessmentData = {
        assessmentId: results.assessmentId,
        templateId: selectedScale?.templateId || '',
        scaleName: selectedScale?.name || '',
        scaleAbbreviation: selectedScale?.abbreviation,
        results: results,
        consultationId: consultationId || undefined
      };

      console.log('💾 Guardando evaluación en expediente...', assessmentData);
      
      const saveResult = await expedixAssessmentsClient.saveAssessmentToPatient(
        patient.id, 
        assessmentData
      );

      console.log('✅ Evaluación guardada exitosamente:', saveResult);
      
      // Mostrar mensaje de éxito con detalles
      const successMessage = consultationId 
        ? `✅ Evaluación ${selectedScale?.name} completada y guardada en el expediente de ${patient.first_name} ${patient.paternal_last_name}.\n\n` +
          `📊 Puntuación Total: ${results.totalScore || 'N/A'}\n` +
          `📈 Nivel: ${results.severityLevel || 'No determinado'}\n` +
          `🔗 Vinculada a consulta activa\n\n` +
          `Los resultados están disponibles en la pestaña "Evaluaciones" del expediente.`
        : `✅ Evaluación ${selectedScale?.name} completada y guardada en el expediente de ${patient.first_name} ${patient.paternal_last_name}.\n\n` +
          `📊 Puntuación Total: ${results.totalScore || 'N/A'}\n` +
          `📈 Nivel: ${results.severityLevel || 'No determinado'}\n\n` +
          `Los resultados están disponibles en la pestaña "Evaluaciones" del expediente.`;

      alert(successMessage);
      
      // Llamar callback si está en modo rápido
      if (isQuickMode && onAssessmentCompleted) {
        onAssessmentCompleted(results);
      }
      
      setShowAssessment(false);
      setSelectedScale(null);
      if (!isQuickMode) onClose();
      
    } catch (error) {
      console.error('❌ Error al guardar evaluación:', error);
      
      // Mostrar error detallado pero no bloquear el flujo
      const errorMessage = `⚠️ La evaluación ${selectedScale?.name} se completó exitosamente, pero hubo un problema al guardarla automáticamente en el expediente.\n\n` +
        `📊 Puntuación Total: ${results.totalScore || 'N/A'}\n` +
        `📈 Nivel: ${results.severityLevel || 'No determinado'}\n\n` +
        `Los resultados se conservaron temporalmente. Por favor, contacte al administrador para resolver el problema de guardado.`;
      
      alert(errorMessage);
      
      // Llamar callback incluso si hubo error guardando
      if (isQuickMode && onAssessmentCompleted) {
        onAssessmentCompleted(results);
      }
      
      setShowAssessment(false);
      setSelectedScale(null);
      if (!isQuickMode) onClose();
    }
  };

  const handleCloseAssessment = () => {
    setShowAssessment(false);
    setSelectedScale(null);
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Ansiedad': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'Depresión': 'bg-blue-50 text-blue-700 border-blue-200',
      'Esquizofrenia y Trastornos Psicóticos': 'bg-purple-50 text-purple-700 border-purple-200',
      'Trastornos del Sueño': 'bg-green-50 text-green-700 border-green-200',
      'general': 'bg-gray-50 text-gray-700 border-gray-200'
    };
    return colors[category] || colors['general'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Cargando escalas disponibles...</span>
      </div>
    );
  }

  if (showAssessment && selectedScale) {
    return (
      <ClinimetrixProAssessmentModal
        templateId={selectedScale.templateId}
        scaleName={selectedScale.name}
        scaleAbbreviation={selectedScale.abbreviation}
        onComplete={handleAssessmentComplete}
        onExit={handleCloseAssessment}
        // Pre-seleccionar el paciente actual
        preSelectedPatient={{
          id: patient.id,
          name: `${patient.first_name} ${patient.paternal_last_name} ${patient.maternal_last_name || ''}`.trim(),
          age: patient.age
        }}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <DocumentChartBarIcon className="h-6 w-6 text-purple-600" />
            Nueva Evaluación Clínica
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Paciente: <span className="font-medium">{patient.first_name} {patient.paternal_last_name}</span>
            {consultationId && <span className="text-xs text-green-600 ml-2">(Consulta activa)</span>}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <XMarkIcon className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar escalas por nombre, abreviación o categoría..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Instructions */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
        <p className="text-xs text-purple-700">
          <strong>Instrucciones:</strong> Seleccione la escala que desea aplicar. 
          Las escalas favoritas (⭐) aparecen primero. 
          {consultationId && ' Los resultados se guardarán automáticamente en la consulta actual.'}
        </p>
      </div>

      {/* Scales List */}
      <div className="max-h-96 overflow-y-auto space-y-2">
        {filteredScales.length === 0 ? (
          <div className="text-center py-8">
            <DocumentChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No se encontraron escalas</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-purple-600 hover:text-purple-700 text-sm mt-2"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          filteredScales.map((scale) => {
            const isFavorite = favorites.includes(scale.templateId);
            
            return (
              <div
                key={scale.templateId}
                className="border border-gray-200 rounded-lg p-4 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => handleSelectScale(scale)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isFavorite && (
                        <StarSolidIcon className="h-4 w-4 text-yellow-500" />
                      )}
                      <h3 className="font-semibold text-gray-900 group-hover:text-purple-700">
                        {scale.name}
                      </h3>
                      {scale.abbreviation && (
                        <span className="text-xs font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                          {scale.abbreviation}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {scale.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className={`px-2 py-1 rounded-full border ${getCategoryColor(scale.category)}`}>
                        {scale.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {scale.administrationTime || '5-10'} min
                      </span>
                      <span>
                        {scale.totalItems} ítems
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(scale.templateId);
                      }}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      {isFavorite ? (
                        <StarSolidIcon className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <StarIcon className="h-5 w-5 text-gray-400 hover:text-yellow-500" />
                      )}
                    </button>
                    
                    <Button
                      size="sm"
                      variant="primary"
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectScale(scale);
                      }}
                    >
                      <BeakerIcon className="h-3 w-3 mr-1" />
                      Aplicar
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {filteredScales.length} escalas disponibles
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}