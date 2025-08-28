'use client';

import { useState, useEffect, useMemo } from 'react';
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
// Clean Architecture imports temporarily removed for compilation
// import { useScales } from '../../src/modules/clinimetrix/hooks/useScales';
// import { useAssessments } from '../../src/modules/clinimetrix/hooks/useAssessments';
// import type { ScaleViewModel } from '../../src/modules/clinimetrix/presenters/ClinimetrixPresenter';
import { ClinimetrixProAssessmentModal } from '@/components/ClinimetrixPro/ClinimetrixProAssessmentModal';
import { Button } from '@/components/ui/Button';

// Temporary type definition for compilation
type ScaleViewModel = {
  id: string;
  name: string;
  abbreviation: string;
  category: string;
  description: string;
  duration: string;
  totalItems: number;
  isFavorite: boolean;
};

// Mock hooks for compilation
const useScales = () => ({ scales: [], isLoading: false, error: null });
const useAssessments = () => ({ createAssessment: () => Promise.resolve({ success: true, assessmentId: '123', redirectUrl: '/test' }) });

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
  // Clean Architecture hooks
  const {
    scales,
    loading,
    error,
    searchScales,
    addToFavorites,
    removeFromFavorites,
    isScaleFavorite,
    activeFilters,
    setFilters
  } = useScales({
    autoLoad: true,
    userLevel: 'professional', // TODO: Get from auth context
    userExperience: 'intermediate' // TODO: Get from user profile
  });

  const {
    startAssessment,
    error: assessmentError
  } = useAssessments({
    patientId: patient.id,
    clinicId: 'current-clinic', // TODO: Get from context
    administratorId: 'current-user' // TODO: Get from auth context
  });

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScale, setSelectedScale] = useState<ScaleViewModel | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);

  // Search and filter scales
  const filteredScales = useMemo(() => {
    if (!searchTerm) return scales;
    
    const searchLower = searchTerm.toLowerCase();
    return scales.filter(scale =>
      scale.name.toLowerCase().includes(searchLower) ||
      scale.abbreviation.toLowerCase().includes(searchLower) ||
      scale.description.toLowerCase().includes(searchLower) ||
      scale.category.toLowerCase().includes(searchLower)
    );
  }, [scales, searchTerm]);

  // Handle search input changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    
    // Optional: Use debounced search with Clean Architecture
    if (value.trim()) {
      // searchScales(value); // Could be used for server-side search
    }
  };

  // Toggle favorites using Clean Architecture
  const toggleFavorite = async (scaleId: string) => {
    try {
      if (isScaleFavorite(scaleId)) {
        await removeFromFavorites(scaleId);
      } else {
        await addToFavorites(scaleId);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleSelectScale = async (scale: ScaleViewModel) => {
    try {
      setSelectedScale(scale);
      
      console.log(`🚀 Iniciando evaluación ${scale.abbreviation} para ${patient.first_name}...`);
      
      // Use Clean Architecture assessment hook
      const assessmentUrl = await startAssessment(scale.id, patient.id);
      
      console.log('✅ Assessment URL generated:', assessmentUrl);
      
      // For hybrid system: redirect to Django focused_take
      if (assessmentUrl.includes('focused-take')) {
        // Create return URL with patient context
        const returnUrl = `${window.location.origin}/hubs/expedix/patients/${patient.id}`;
        const urlWithReturn = `${assessmentUrl}?return_url=${encodeURIComponent(returnUrl)}`;
        
        window.location.href = urlWithReturn;
      } else {
        // Fallback to React modal (if implemented)
        console.log('🔄 Fallback activado: usando React Assessment Modal...');
        setShowAssessment(true);
      }
      
    } catch (error) {
      console.error('❌ Error starting assessment:', error);
      
      // Reset selection on error
      setSelectedScale(null);
      
      // Show user-friendly error
      alert(`No se pudo iniciar la evaluación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const handleAssessmentComplete = async (results: any) => {
    console.log('Assessment completed:', results);
    
    // Auto-guardar resultados en el expediente del paciente
    try {
      const expedixAssessmentsClient = await import('@/lib/api/expedix-assessments-client');
      
      const assessmentData = {
        assessmentId: results.assessmentId,
        templateId: selectedScale?.id || '',
        scaleName: selectedScale?.name || '',
        scaleAbbreviation: selectedScale?.abbreviation,
        results: {
          totalScore: results.totalScore,
          severityLevel: results.severityLevel,
          interpretation: results.interpretation,
          ...results
        },
        responses: results.responses || [],
        metadata: {
          completedAt: new Date().toISOString(),
          consultationId: consultationId || undefined
        }
      };

      console.log('💾 Guardando evaluación en expediente...', assessmentData);
      
      const saveResult = await expedixAssessmentsClient.default.saveAssessmentToPatient(
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

  // Category color now comes from the presenter in the ViewModel
  const getCategoryColor = (scale: ScaleViewModel) => {
    return scale.ui.color || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-3 text-gray-600">Cargando escalas disponibles...</span>
      </div>
    );
  }

  if (error || assessmentError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <XMarkIcon className="h-5 w-5 text-red-400 mr-2" />
          <h3 className="text-sm font-medium text-red-800">Error al cargar escalas</h3>
        </div>
        <p className="text-sm text-red-700 mt-1">
          {error || assessmentError}
        </p>
        <button
          onClick={onClose}
          className="mt-3 text-sm text-red-800 underline hover:text-red-900"
        >
          Cerrar
        </button>
      </div>
    );
  }

  if (showAssessment && selectedScale) {
    return (
      <ClinimetrixProAssessmentModal
        templateId={selectedScale.id}
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
          onChange={(e) => handleSearchChange(e.target.value)}
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
            const isFavorite = isScaleFavorite(scale.id);
            
            return (
              <div
                key={scale.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => handleSelectScale(scale)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isFavorite && (
                        <StarSolidIcon className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="text-lg mr-1">{scale.ui.icon}</span>
                      <h3 className="font-semibold text-gray-900 group-hover:text-purple-700">
                        {scale.name}
                      </h3>
                      <span className="text-xs font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                        {scale.abbreviation}
                      </span>
                      {scale.isFeatured && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                          Destacada
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {scale.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className={`px-2 py-1 rounded-full border ${getCategoryColor(scale)}`}>
                        {scale.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {scale.estimatedTime}
                      </span>
                      <span>
                        {scale.totalItems} ítems
                      </span>
                      {scale.hasSubscales && (
                        <span className="text-purple-600">
                          {scale.subscaleCount} subscalas
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(scale.id);
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