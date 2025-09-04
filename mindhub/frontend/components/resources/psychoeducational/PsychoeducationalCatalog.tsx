'use client';

import React, { useState, useEffect } from 'react';
import { PsychoeducationalDocument, DOCUMENT_CATEGORIES, DocumentCategory } from '@/types/psychoeducational-documents';
import { DocumentRenderer } from './DocumentRenderer';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  BookOpenIcon,
  ClockIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface PsychoeducationalCatalogProps {
  patientId?: string;
  onDocumentSelect?: (document: PsychoeducationalDocument) => void;
  showActions?: boolean;
  filterCategory?: DocumentCategory;
}

export const PsychoeducationalCatalog: React.FC<PsychoeducationalCatalogProps> = ({
  patientId,
  onDocumentSelect,
  showActions = true,
  filterCategory
}) => {
  const [documents, setDocuments] = useState<PsychoeducationalDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<PsychoeducationalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: filterCategory || '',
    search: '',
    evidenceLevel: '',
    targetAudience: ''
  });

  // Simular carga de documentos desde archivos JSON
  const loadDocuments = async () => {
    setLoading(true);
    try {
      // Por ahora, cargaremos solo el documento de ejemplo
      const response = await fetch('/data/psychoeducational-documents/anxiety_management/PSY-EDU-001-breathing-techniques.json');
      const document = await response.json();
      setDocuments([document]);
    } catch (error) {
      console.error('Error loading psychoeducational documents:', error);
      toast.error('Error al cargar documentos psicoeducativos');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  // Filtrar documentos
  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = !filters.category || doc.document.metadata.category === filters.category;
    const matchesSearch = !filters.search || 
      doc.document.metadata.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      doc.document.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()));
    const matchesEvidence = !filters.evidenceLevel || doc.document.context.evidence_level === filters.evidenceLevel;
    const matchesAudience = !filters.targetAudience || 
      doc.document.context.target_audience.includes(filters.targetAudience as any);

    return matchesCategory && matchesSearch && matchesEvidence && matchesAudience;
  });

  const handleDocumentClick = (document: PsychoeducationalDocument) => {
    if (onDocumentSelect) {
      onDocumentSelect(document);
    } else {
      setSelectedDocument(document);
    }
  };

  const handleDownload = async (format: 'pdf' | 'json' | 'html') => {
    if (!selectedDocument) return;

    try {
      if (format === 'json') {
        // Descargar JSON directamente
        const jsonString = JSON.stringify(selectedDocument, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedDocument.document.id}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        // Para PDF y HTML, se necesitaría implementar la conversión
        toast.success(`Descarga en formato ${format.toUpperCase()} estará disponible próximamente`);
      }
    } catch (error) {
      toast.error('Error al descargar el documento');
    }
  };

  const handleSendToPatient = async (method: 'email' | 'whatsapp') => {
    if (!selectedDocument || !patientId) {
      toast.error('No se puede enviar: información del paciente no disponible');
      return;
    }

    // Aquí se implementaría la lógica de envío
    toast.success(`Envío por ${method === 'email' ? 'correo electrónico' : 'WhatsApp'} estará disponible próximamente`);
  };

  // Si hay un documento seleccionado, mostrar el renderizador
  if (selectedDocument) {
    return (
      <div>
        <button
          onClick={() => setSelectedDocument(null)}
          className="mb-4 text-blue-600 hover:text-blue-800 font-medium flex items-center"
        >
          ← Volver al catálogo
        </button>
        <DocumentRenderer
          document={selectedDocument}
          patientId={patientId}
          onDownload={handleDownload}
          onSendToPatient={showActions ? handleSendToPatient : undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-8">
        <BookOpenIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Biblioteca Psicoeducativa
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Documentos educativos basados en evidencia para apoyar el tratamiento y la educación del paciente
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <FunnelIcon className="w-5 h-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las categorías</option>
              {DOCUMENT_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de Evidencia</label>
            <select
              value={filters.evidenceLevel}
              onChange={(e) => setFilters(prev => ({ ...prev, evidenceLevel: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los niveles</option>
              <option value="high">Alta Evidencia</option>
              <option value="moderate">Evidencia Moderada</option>
              <option value="low">Evidencia Limitada</option>
              <option value="expert">Consenso de Expertos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audiencia</label>
            <select
              value={filters.targetAudience}
              onChange={(e) => setFilters(prev => ({ ...prev, targetAudience: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las audiencias</option>
              <option value="patients">Pacientes</option>
              <option value="caregivers">Cuidadores</option>
              <option value="adolescents">Adolescentes</option>
              <option value="adults">Adultos</option>
              <option value="elderly">Adultos Mayores</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{filteredDocuments.length}</div>
          <div className="text-sm text-gray-500">Documentos Disponibles</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-green-600">
            {DOCUMENT_CATEGORIES.length}
          </div>
          <div className="text-sm text-gray-500">Categorías</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-purple-600">
            {documents.filter(d => d.document.context.evidence_level === 'high').length}
          </div>
          <div className="text-sm text-gray-500">Alta Evidencia</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-orange-600">
            {documents.filter(d => d.document.quality_metrics?.peer_reviewed).length}
          </div>
          <div className="text-sm text-gray-500">Revisados por Pares</div>
        </div>
      </div>

      {/* Grid de Documentos */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500 mt-4">Cargando documentos...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <BookOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron documentos</h3>
          <p className="text-gray-500">Ajusta los filtros para encontrar documentos relevantes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc, index) => {
            const categoryConfig = DOCUMENT_CATEGORIES.find(c => c.id === doc.document.metadata.category);
            
            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer p-6 border border-gray-200"
                onClick={() => handleDocumentClick(doc)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">{categoryConfig?.icon}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${categoryConfig?.color}-100 text-${categoryConfig?.color}-800`}>
                        {categoryConfig?.name}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {doc.document.metadata.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {doc.document.metadata.subtitle}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-500">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      <span>{doc.document.metadata.estimated_reading_time} min</span>
                    </div>
                    <div className="flex items-center">
                      <CheckBadgeIcon className="w-4 h-4 mr-1 text-green-500" />
                      <span className={`text-xs font-medium ${
                        doc.document.context.evidence_level === 'high' ? 'text-green-600' :
                        doc.document.context.evidence_level === 'moderate' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {doc.document.context.evidence_level === 'high' ? 'Alta Evidencia' :
                         doc.document.context.evidence_level === 'moderate' ? 'Evidencia Moderada' :
                         doc.document.context.evidence_level === 'low' ? 'Evidencia Limitada' : 'Consenso Expertos'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {doc.document.tags.slice(0, 3).map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {doc.document.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                      +{doc.document.tags.length - 3}
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-blue-600 font-medium text-sm">
                    Leer documento →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};