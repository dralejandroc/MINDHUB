/**
 * GRID UNIVERSAL DE ESCALAS - MANTENIENDO ESTILOS HERMOSOS
 * Mismos estilos visuales, arquitectura simplificada
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUniversalScales } from '../../contexts/UniversalScalesContext';
import { UniversalScale } from '../../contexts/UniversalScalesContext';
import UniversalCardBasedAssessment from './UniversalCardBasedAssessment';
import { clinimetrixApi } from '../../lib/api/clinimetrix-client';

// =====================================================================
// COMPONENTE DE TARJETA (ESTILOS ORIGINALES MANTENIDOS)
// =====================================================================

interface ScaleGridItemProps {
  scale: UniversalScale;
  onSelect: (scale: UniversalScale) => void;
  onToggleFavorite: (scaleId: string) => void;
  onShowHelp: (scaleId: string) => void;
  isFavorite: boolean;
}

const ScaleGridItem: React.FC<ScaleGridItemProps> = ({ 
  scale, 
  onSelect, 
  onToggleFavorite, 
  onShowHelp, 
  isFavorite 
}) => {
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'depression':
        return {
          color: '#3b82f6',
          lightColor: '#dbeafe',
          icon: '🧠'
        };
      case 'anxiety':
        return {
          color: '#8b5cf6',
          lightColor: '#f3e8ff',
          icon: '💭'
        };
      case 'cognitive':
        return {
          color: '#10b981',
          lightColor: '#d1fae5',
          icon: '🎯'
        };
      default:
        return {
          color: '#6b7280',
          lightColor: '#f3f4f6',
          icon: '📋'
        };
    }
  };

  const styles = getCategoryStyles(scale.category || 'general');
  const available = scale.isActive;

  return (
    <div 
      style={{ 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        padding: '1.25rem', 
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        opacity: available ? 1 : 0.7,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Botón de favorito */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(scale.id);
        }}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.2rem',
          padding: '0.25rem',
          borderRadius: '50%',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#f3f4f6';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span style={{ color: isFavorite ? '#29A98C' : '#d1d5db' }}>
          {isFavorite ? '★' : '☆'}
        </span>
      </button>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.875rem' }}>
        <div style={{ 
          width: '2.5rem', 
          height: '2.5rem', 
          backgroundColor: styles.color, 
          borderRadius: '8px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginRight: '0.875rem',
          fontSize: '1.25rem'
        }}>
          {styles.icon}
        </div>
        <div style={{ flex: 1, paddingRight: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#112F33', margin: 0 }}>
            {scale.abbreviation || 'N/A'}
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, marginBottom: '0.25rem' }}>
            {scale.name || 'Escala sin nombre'}
          </p>
          <p style={{ fontSize: '0.7rem', color: scale.administrationMode === 'self_administered' ? '#059669' : '#7c3aed', margin: 0, fontWeight: '600' }}>
            {scale.administrationMode === 'self_administered' ? 'Autoaplicada' : 'Heterodirigida'}
          </p>
        </div>
      </div>
      
      <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.875rem', lineHeight: '1.4', flex: 1 }}>
        {scale.description || 'Sin descripción disponible'}
      </p>
      
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
        <span style={{ backgroundColor: '#f0f9ff', color: '#0369a1', padding: '0.2rem 0.4rem', borderRadius: '10px', fontSize: '0.65rem', fontWeight: '500' }}>
          {scale.totalItems || 0} preguntas
        </span>
        <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '0.2rem 0.4rem', borderRadius: '10px', fontSize: '0.65rem', fontWeight: '500' }}>
          {scale.estimatedDurationMinutes || 0} min
        </span>
        <span style={{ backgroundColor: '#f0fdf4', color: '#059669', padding: '0.2rem 0.4rem', borderRadius: '10px', fontSize: '0.65rem', fontWeight: '500' }}>
          Adultos
        </span>
        <span style={{ backgroundColor: styles.lightColor, color: styles.color, padding: '0.2rem 0.4rem', borderRadius: '10px', fontSize: '0.65rem', fontWeight: '500' }}>
          {scale.category || 'General'}
        </span>
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onShowHelp(scale.id);
          }}
          style={{ 
            padding: '0.625rem', 
            backgroundColor: '#f8fafc', 
            color: '#64748b', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontSize: '0.8rem', 
            fontWeight: '600',
            minWidth: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Ver información detallada de la escala"
        >
          ?
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (available) {
              onSelect(scale);
            }
          }}
          style={{ 
            flex: 1, 
            padding: '0.625rem', 
            backgroundColor: available ? styles.color : '#f1f5f9', 
            color: available ? 'white' : '#64748b', 
            border: available ? 'none' : '1px solid #e2e8f0', 
            borderRadius: '8px', 
            cursor: available ? 'pointer' : 'not-allowed', 
            fontSize: '0.8rem', 
            fontWeight: '600'
          }}
        >
          {available ? 'Iniciar Evaluación' : 'Próximamente'}
        </button>
      </div>
    </div>
  );
};

// =====================================================================
// COMPONENTE PRINCIPAL (MISMA UI, NUEVA ARQUITECTURA)
// =====================================================================

export const UniversalScalesGrid: React.FC = () => {
  const router = useRouter();
  const { state, loadScales } = useUniversalScales();
  const { scales, isLoading: loading, error } = state;
  
  // Force load scales on mount
  useEffect(() => {
    if (scales.length === 0 && !loading) {
      loadScales();
    }
  }, [scales.length, loading, loadScales]);
  
  
  // Estados locales (simplificados)
  const [selectedScale, setSelectedScale] = useState<UniversalScale | null>(null);
  const [scalesSearch, setScalesSearch] = useState('');
  const [scalesView, setScalesView] = useState<'grid' | 'list' | 'favorites'>('grid');
  const [favoriteScales, setFavoriteScales] = useState<string[]>([]);
  const [showScaleHelp, setShowScaleHelp] = useState(false);
  const [currentScaleHelp, setCurrentScaleHelp] = useState<string | null>(null);

  // Estado para información de ayuda de escalas (datos reales del API)
  const [scalesHelpInfo, setScalesHelpInfo] = useState<Record<string, any>>({});
  const [loadingHelpInfo, setLoadingHelpInfo] = useState<Record<string, boolean>>({});

  // Función para cargar información de ayuda de una escala
  const loadScaleHelpInfo = async (scaleId: string) => {
    if (scalesHelpInfo[scaleId] || loadingHelpInfo[scaleId]) {
      return; // Ya se cargó o se está cargando
    }

    setLoadingHelpInfo(prev => ({...prev, [scaleId]: true}));
    
    try {
      const helpInfo = await clinimetrixApi.getScaleHelpInfo(scaleId);
      setScalesHelpInfo(prev => ({...prev, [scaleId]: helpInfo}));
    } catch (error) {
      console.error(`Error loading help info for scale ${scaleId}:`, error);
      // Fallback: información básica
      setScalesHelpInfo(prev => ({
        ...prev, 
        [scaleId]: {
          purpose: 'Evaluación psicométrica especializada',
          scoring: { ranges: [] },
          administration: { duration: 'Variable', instructions: 'Seguir instrucciones estándar' },
          interpretation: { notes: ['Consultar documentación clínica'], warnings: [] }
        }
      }));
    } finally {
      setLoadingHelpInfo(prev => ({...prev, [scaleId]: false}));
    }
  };

  // Funciones de manejo (ahora redirige a pantalla completa)
  const handleSelectScale = async (scale: UniversalScale) => {
    try {
      // Redirigir a la página de evaluación en pantalla completa
      router.push(`/assessment/${scale.id}`);
    } catch (error) {
      console.error('Error navigating to assessment:', error);
      // En producción, mostrarías un toast de error
    }
  };

  const handleBackToGrid = () => {
    setSelectedScale(null);
  };

  const handleAssessmentComplete = (results: any) => {
    console.log('Assessment completed for scale:', selectedScale?.abbreviation, results);
    // Los resultados se manejan en la página de assessment
  };

  const toggleFavorite = (scaleId: string) => {
    setFavoriteScales(prev => 
      prev.includes(scaleId) 
        ? prev.filter(id => id !== scaleId)
        : [...prev, scaleId]
    );
  };

  const showScaleHelpModal = async (scaleId: string) => {
    setCurrentScaleHelp(scaleId);
    setShowScaleHelp(true);
    
    // Cargar información de ayuda si no está disponible
    await loadScaleHelpInfo(scaleId);
  };

  // Filtrar escalas (idéntico)
  const getFilteredScales = () => {
    if (!scales) return [];
    
    let filteredScales = [...scales];
    
    if (scalesSearch.trim()) {
      filteredScales = filteredScales.filter(scale => 
        (scale.name || '').toLowerCase().includes(scalesSearch.toLowerCase()) ||
        (scale.abbreviation || '').toLowerCase().includes(scalesSearch.toLowerCase()) ||
        (scale.category || '').toLowerCase().includes(scalesSearch.toLowerCase()) ||
        (scale.description || '').toLowerCase().includes(scalesSearch.toLowerCase())
      );
    }
    
    if (scalesView === 'favorites') {
      filteredScales = filteredScales.filter(scale => favoriteScales.includes(scale.id));
    }

    return filteredScales;
  };

  // Estados de carga y error (simplificados)
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#29A98C]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!scales || scales.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800">No hay escalas disponibles en este momento.</p>
      </div>
    );
  }

  // Ya no necesitamos mostrar assessment aquí, se hace en la página especial

  const filteredScales = getFilteredScales();

  // UI IDÉNTICA A LA ORIGINAL
  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 4rem)', padding: '1rem' }}>
      <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
        

        {/* Barra de búsqueda (IDÉNTICA) */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            
            <div style={{ flex: 1, minWidth: '300px' }}>
              <input 
                type="text"
                value={scalesSearch}
                onChange={(e) => setScalesSearch(e.target.value)}
                placeholder="⌕ Buscar escalas por nombre, diagnóstico, edad, tipo de aplicación..."
                style={{ 
                  width: '100%', 
                  padding: '0.875rem 1rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '8px', 
                  fontSize: '0.875rem', 
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#29A98C'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#f8fafc', borderRadius: '8px', padding: '0.25rem' }}>
              <button
                onClick={() => setScalesView('grid')}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: scalesView === 'grid' ? '#29A98C' : 'transparent',
                  color: scalesView === 'grid' ? 'white' : '#64748b',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                🔳 Tarjetas
              </button>
              <button
                onClick={() => setScalesView('list')}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: scalesView === 'list' ? '#29A98C' : 'transparent',
                  color: scalesView === 'list' ? 'white' : '#64748b',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                📋 Lista
              </button>
              <button
                onClick={() => setScalesView('favorites')}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: scalesView === 'favorites' ? '#29A98C' : 'transparent',
                  color: scalesView === 'favorites' ? 'white' : '#64748b',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                ⭐ Favoritas
              </button>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            {filteredScales.length} escalas encontradas
            {loading && ' (cargando desde nueva API...)'}
          </p>
        </div>

        {/* Vista en Tarjetas */}
        {(scalesView === 'grid' || scalesView === 'favorites') && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {filteredScales.length > 0 ? (
              filteredScales.map(scale => (
                <ScaleGridItem
                  key={scale.id}
                  scale={scale}
                  onSelect={handleSelectScale}
                  onToggleFavorite={toggleFavorite}
                  onShowHelp={showScaleHelpModal}
                  isFavorite={favoriteScales.includes(scale.id)}
                />
              ))
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                No se encontraron escalas
              </div>
            )}
          </div>
        )}

        {/* Vista en Lista (código idéntico al original) */}
        {scalesView === 'list' && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
            {filteredScales.map((scale, index) => (
              <div key={scale.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '1rem 1.5rem', 
                borderBottom: index < filteredScales.length - 1 ? '1px solid #f3f4f6' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}>
                
                <div style={{ 
                  width: '2.5rem', 
                  height: '2.5rem', 
                  backgroundColor: '#29A98C', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginRight: '1rem',
                  flexShrink: 0,
                  fontSize: '1.25rem'
                }}>
                  📋
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#112F33', margin: 0 }}>{scale.abbreviation}</h3>
                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{scale.name}</span>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: scale.administrationMode === 'self_administered' ? '#059669' : '#7c3aed', 
                      backgroundColor: scale.administrationMode === 'self_administered' ? '#f0fdf4' : '#f5f3ff',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      fontWeight: '600'
                    }}>
                      {scale.administrationMode === 'self_administered' ? 'Autoaplicada' : 'Heterodirigida'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '0.125rem 0.375rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '500' }}>
                      {scale.category}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#112F33' }}>{scale.totalItems}</span>
                    <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0 }}>preguntas</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#112F33' }}>{scale.estimatedDurationMinutes}</span>
                    <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0 }}>minutos</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(scale.id);
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      padding: '0.25rem',
                      borderRadius: '50%',
                      transition: 'all 0.2s ease',
                      color: favoriteScales.includes(scale.id) ? '#29A98C' : '#d1d5db'
                    }}
                  >
                    {favoriteScales.includes(scale.id) ? '★' : '☆'}
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      showScaleHelpModal(scale.id);
                    }}
                    style={{ 
                      padding: '0.5rem', 
                      backgroundColor: '#f8fafc', 
                      color: '#64748b', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '6px', 
                      cursor: 'pointer', 
                      fontSize: '0.75rem', 
                      fontWeight: '600',
                      minWidth: '30px'
                    }}
                  >
                    ?
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (scale.isActive) {
                        handleSelectScale(scale);
                      }
                    }}
                    style={{ 
                      padding: '0.5rem 1rem', 
                      backgroundColor: scale.isActive ? '#29A98C' : '#f1f5f9', 
                      color: scale.isActive ? 'white' : '#64748b', 
                      border: 'none', 
                      borderRadius: '6px', 
                      cursor: scale.isActive ? 'pointer' : 'not-allowed', 
                      fontSize: '0.75rem', 
                      fontWeight: '600',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {scale.isActive ? 'Iniciar' : 'Próximamente'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sin resultados */}
        {filteredScales.length === 0 && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '3rem', textAlign: 'center', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
            <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>
              {scalesView === 'favorites' ? '⭐' : '🔍'}
            </span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#112F33', marginBottom: '0.5rem' }}>
              {scalesView === 'favorites' ? 'No tienes escalas favoritas' : 'No se encontraron escalas'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
              {scalesView === 'favorites' 
                ? 'Marca escalas como favoritas haciendo clic en la estrella para verlas aquí.'
                : 'Intenta modificar los filtros de búsqueda para encontrar más resultados.'
              }
            </p>
          </div>
        )}

        {/* Modal de Ayuda (IDÉNTICO) */}
        {showScaleHelp && currentScaleHelp && scalesHelpInfo[currentScaleHelp] && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              <button
                onClick={() => setShowScaleHelp(false)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ×
              </button>

              {(() => {
                const helpInfo = scalesHelpInfo[currentScaleHelp];
                const scaleInfo = scales?.find(s => s.id === currentScaleHelp);
                
                return (
                  <>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#112F33', margin: 0 }}>
                        {scaleInfo?.abbreviation}
                      </h2>
                      <p style={{ fontSize: '1rem', color: '#64748b', marginTop: '0.5rem' }}>
                        {scaleInfo?.name}
                      </p>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#112F33', marginBottom: '0.75rem' }}>
                        ▶ Propósito
                      </h3>
                      <p style={{ color: '#4a5568', lineHeight: '1.6', margin: 0 }}>
                        {helpInfo.purpose}
                      </p>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#112F33', marginBottom: '0.75rem' }}>
                        📊 Método de Calificación
                      </h3>
                      <p style={{ color: '#4a5568', marginBottom: '1rem' }}>
                        <strong>Método:</strong> {helpInfo.scoring.method}
                      </p>
                      <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {helpInfo.scoring.ranges.map((range: any, index: number) => (
                          <div key={index} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.5rem 0.75rem',
                            backgroundColor: `${range.color}15`,
                            border: `1px solid ${range.color}40`,
                            borderRadius: '6px'
                          }}>
                            <span style={{ fontWeight: '600', color: '#112F33' }}>{range.range}</span>
                            <span style={{ color: range.color, fontWeight: '600' }}>{range.severity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => setShowScaleHelp(false)}
                        style={{
                          padding: '0.75rem 1.5rem',
                          backgroundColor: '#29A98C',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '600'
                        }}
                      >
                        Cerrar
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UniversalScalesGrid;