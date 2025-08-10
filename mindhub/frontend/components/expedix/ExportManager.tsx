'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentArrowDownIcon,
  TableCellsIcon,
  DocumentTextIcon,
  FolderArrowDownIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ExportManagerProps {
  patientId?: string;
  consultationId?: string;
  mode: 'consultation' | 'patient' | 'patients-table';
  onClose?: () => void;
}

interface ExportOption {
  id: string;
  name: string;
  format: string;
  size: string;
  description: string;
  includes: string[];
  icon: React.ComponentType<any>;
  recommended?: boolean;
}

interface PatientExportData {
  patient: {
    name: string;
    medicalRecordNumber: string;
  };
  available: {
    consultations: number;
    prescriptions: number;
    medicalHistory: number;
    assessments: number;
    documents: number;
  };
  exportSizes: {
    summary: string;
    complete: string;
    withIndividualConsultations: string;
  };
}

export default function ExportManager({ patientId, consultationId, mode, onClose }: ExportManagerProps) {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<PatientExportData | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({});
  const [exportFormats, setExportFormats] = useState<Record<string, ExportOption>>({});

  useEffect(() => {
    loadExportFormats();
    if (patientId && mode === 'patient') {
      loadPatientExportOptions();
    }
  }, [patientId, mode]);

  const loadExportFormats = async () => {
    try {
      const response = await fetch('/api/expedix/export/formats');
      const data = await response.json();
      
      if (data.success) {
        const formatsWithIcons = Object.entries(data.data).reduce((acc, [key, format]: [string, any]) => {
          acc[key] = {
            ...format,
            id: key,
            icon: getFormatIcon(key)
          };
          return acc;
        }, {} as Record<string, ExportOption>);
        
        setExportFormats(formatsWithIcons);
      }
    } catch (error) {
      console.error('Error loading export formats:', error);
    }
  };

  const loadPatientExportOptions = async () => {
    if (!patientId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/expedix/export/bulk-options/${patientId}`);
      const data = await response.json();
      
      if (data.success) {
        setPatientData(data.data);
      }
    } catch (error) {
      console.error('Error loading patient export options:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFormatIcon = (formatKey: string) => {
    switch (formatKey) {
      case 'consultation': return DocumentTextIcon;
      case 'patientRecordSummary': return DocumentArrowDownIcon;
      case 'patientRecordComplete': return FolderArrowDownIcon;
      case 'patientsTable': return TableCellsIcon;
      default: return DocumentArrowDownIcon;
    }
  };

  const handleExport = async (exportType: string) => {
    setExporting(exportType);
    
    try {
      let endpoint = '';
      let requestBody: any = {};
      
      switch (exportType) {
        case 'consultation':
          endpoint = '/api/expedix/export/consultation';
          requestBody = { consultationId };
          break;
          
        case 'patientRecordSummary':
          endpoint = '/api/expedix/export/patient-record';
          requestBody = {
            patientId,
            options: {
              format: 'summary',
              includeIndividualConsultations: false,
              includeAssessments: true
            }
          };
          break;
          
        case 'patientRecordComplete':
          endpoint = '/api/expedix/export/patient-record';
          requestBody = {
            patientId,
            options: {
              format: 'complete',
              includeIndividualConsultations: selectedOptions.includeIndividualConsultations || false,
              includeAssessments: true,
              includeDocumentsList: true
            }
          };
          break;
          
        case 'patientsTable':
          endpoint = '/api/expedix/export/patients-table';
          requestBody = {
            filters: {
              includeInactive: selectedOptions.includeInactive || false,
              includeStats: selectedOptions.includeStats !== false
            }
          };
          break;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        // Crear un blob y descargarlo
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Obtener nombre del archivo del header o generar uno
        const contentDisposition = response.headers.get('content-disposition');
        let fileName = 'export';
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          if (fileNameMatch) {
            fileName = fileNameMatch[1];
          }
        }
        
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        // Mostrar mensaje de éxito
        alert('Archivo descargado exitosamente');
        
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en la exportación');
      }
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Error al exportar: ' + (error as Error).message);
    } finally {
      setExporting(null);
    }
  };

  const renderConsultationExport = () => {
    const format = exportFormats.consultation;
    if (!format) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <DocumentTextIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Exportar Consulta</h3>
          <p className="text-gray-600">Genera un PDF con la información completa de esta consulta</p>
        </div>
        
        <Card className="p-6 border-2 border-blue-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-2">{format.name}</h4>
              <p className="text-sm text-gray-600 mb-3">{format.description}</p>
              <p className="text-xs text-gray-500 mb-3">Tamaño estimado: {format.size}</p>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Incluye:</p>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  {format.includes.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <Button
              onClick={() => handleExport('consultation')}
              disabled={exporting === 'consultation'}
              className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2 ml-4"
            >
              {exporting === 'consultation' ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Generando...</span>
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  <span>Descargar PDF</span>
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  const renderPatientExport = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600">Cargando información del paciente...</span>
        </div>
      );
    }

    if (!patientData) {
      return (
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600">No se pudo cargar la información del paciente</p>
        </div>
      );
    }

    const exportOptions = [
      {
        key: 'patientRecordSummary',
        title: 'Expediente Resumen',
        description: 'PDF compacto con información esencial',
        size: patientData.exportSizes.summary,
        recommended: true,
        icon: DocumentArrowDownIcon,
        color: 'green'
      },
      {
        key: 'patientRecordComplete',
        title: 'Expediente Completo',
        description: 'Archivo ZIP con expediente completo',
        size: patientData.exportSizes.complete,
        recommended: false,
        icon: FolderArrowDownIcon,
        color: 'blue'
      }
    ];

    return (
      <div className="space-y-6">
        {/* Información del paciente */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">
            {patientData.patient.name}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Expediente: {patientData.patient.medicalRecordNumber}
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Consultas:</span>
              <span className="ml-1 text-gray-600">{patientData.available.consultations}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Medicamentos:</span>
              <span className="ml-1 text-gray-600">{patientData.available.prescriptions}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Historial:</span>
              <span className="ml-1 text-gray-600">{patientData.available.medicalHistory}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Evaluaciones:</span>
              <span className="ml-1 text-gray-600">{patientData.available.assessments}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Documentos:</span>
              <span className="ml-1 text-gray-600">{patientData.available.documents}</span>
            </div>
          </div>
        </div>

        {/* Opciones de exportación */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {exportOptions.map((option) => {
            const IconComponent = option.icon;
            const format = exportFormats[option.key];
            const isExporting = exporting === option.key;
            
            return (
              <Card key={option.key} className={`p-6 border-2 ${
                option.recommended ? 'border-green-200 bg-green-50' : 'border-gray-200'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${
                      option.color === 'green' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      <IconComponent className={`h-6 w-6 ${
                        option.color === 'green' ? 'text-green-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{option.title}</h4>
                      {option.recommended && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Recomendado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                <p className="text-xs text-gray-500 mb-4">Tamaño: {option.size}</p>
                
                {format && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Incluye:</p>
                    <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                      {format.includes.slice(0, 4).map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                      {format.includes.length > 4 && (
                        <li>Y {format.includes.length - 4} elementos más...</li>
                      )}
                    </ul>
                  </div>
                )}
                
                {/* Opciones adicionales para expediente completo */}
                {option.key === 'patientRecordComplete' && (
                  <div className="mb-4 space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedOptions.includeIndividualConsultations || false}
                        onChange={(e) => setSelectedOptions(prev => ({
                          ...prev,
                          includeIndividualConsultations: e.target.checked
                        }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Incluir consultas como archivos separados</span>
                    </label>
                  </div>
                )}
                
                <Button
                  onClick={() => handleExport(option.key)}
                  disabled={isExporting}
                  className={`w-full flex items-center justify-center space-x-2 ${
                    option.color === 'green' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isExporting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Generando...</span>
                    </>
                  ) : (
                    <>
                      <DocumentArrowDownIcon className="h-4 w-4" />
                      <span>Descargar {format?.format || 'Archivo'}</span>
                    </>
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPatientsTableExport = () => {
    const format = exportFormats.patientsTable;
    if (!format) return null;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <TableCellsIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Exportar Tabla de Pacientes</h3>
          <p className="text-gray-600">Genera un archivo Excel con todos tus pacientes</p>
        </div>
        
        <Card className="p-6 border-2 border-green-200">
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">{format.name}</h4>
            <p className="text-sm text-gray-600 mb-3">{format.description}</p>
            <p className="text-xs text-gray-500 mb-4">Tamaño estimado: {format.size}</p>
            
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Incluye:</p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {format.includes.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Opciones de filtros */}
          <div className="mb-6 space-y-3">
            <h5 className="font-medium text-gray-700">Opciones de exportación:</h5>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedOptions.includeInactive || false}
                onChange={(e) => setSelectedOptions(prev => ({
                  ...prev,
                  includeInactive: e.target.checked
                }))}
                className="text-green-600 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">Incluir pacientes inactivos</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedOptions.includeStats !== false}
                onChange={(e) => setSelectedOptions(prev => ({
                  ...prev,
                  includeStats: e.target.checked
                }))}
                className="text-green-600 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">Incluir hoja de estadísticas</span>
            </label>
          </div>
          
          <Button
            onClick={() => handleExport('patientsTable')}
            disabled={exporting === 'patientsTable'}
            className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center space-x-2"
          >
            {exporting === 'patientsTable' ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Generando Excel...</span>
              </>
            ) : (
              <>
                <TableCellsIcon className="h-4 w-4" />
                <span>Descargar Excel</span>
              </>
            )}
          </Button>
        </Card>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <DocumentArrowDownIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Exportar Información
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {mode === 'consultation' && renderConsultationExport()}
          {mode === 'patient' && renderPatientExport()}
          {mode === 'patients-table' && renderPatientsTableExport()}
        </div>

        {/* Footer con información */}
        <div className="bg-blue-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-start">
            <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Información sobre las exportaciones:</p>
              <ul className="space-y-1">
                <li>• Los archivos se generan de forma optimizada para minimizar el tamaño</li>
                <li>• Los PDFs usan formato compacto que ahorra espacio de almacenamiento</li>
                <li>• Los archivos temporales se eliminan automáticamente del servidor</li>
                <li>• Cumple con estándares de protección de datos médicos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}