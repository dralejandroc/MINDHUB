'use client';

import { useState } from 'react';
import {
  DocumentArrowDownIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  FolderArrowDownIcon,
  UserIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import ExportManager from './ExportManager';

interface ExportDropdownProps {
  patientId?: string;
  consultationId?: string;
  showPatientOptions?: boolean;
  showConsultationOptions?: boolean;
  showTableOption?: boolean;
  className?: string;
}

interface ExportOption {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  mode: 'consultation' | 'patient' | 'patients-table';
}

export default function ExportDropdown({
  patientId,
  consultationId,
  showPatientOptions = true,
  showConsultationOptions = false,
  showTableOption = false,
  className = ''
}: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportMode, setSelectedExportMode] = useState<'consultation' | 'patient' | 'patients-table' | null>(null);
  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);

  const exportOptions: ExportOption[] = [];

  if (showConsultationOptions && consultationId) {
    exportOptions.push({
      id: 'consultation',
      label: 'Exportar Consulta',
      description: 'Descargar PDF de esta consulta específica',
      icon: DocumentTextIcon,
      mode: 'consultation'
    });
  }

  if (showPatientOptions && patientId) {
    exportOptions.push(
      {
        id: 'patient-summary',
        label: 'Expediente Resumen',
        description: 'PDF compacto con información esencial',
        icon: DocumentArrowDownIcon,
        mode: 'patient'
      },
      {
        id: 'patient-complete',
        label: 'Expediente Completo',
        description: 'ZIP con expediente completo y consultas',
        icon: FolderArrowDownIcon,
        mode: 'patient'
      },
      {
        id: 'patient-data',
        label: 'Datos del Paciente',
        description: 'Ficha de identificación y datos personales',
        icon: UserIcon,
        mode: 'patient'
      }
    );
  }

  if (showTableOption) {
    exportOptions.push({
      id: 'patients-table',
      label: 'Tabla de Pacientes',
      description: 'Excel con todos los pacientes',
      icon: TableCellsIcon,
      mode: 'patients-table'
    });
  }

  const handleExportOption = (option: ExportOption) => {
    setSelectedExportMode(option.mode);
    
    if (option.mode === 'consultation') {
      setSelectedConsultationId(consultationId || null);
    } else {
      setSelectedConsultationId(null);
    }
    
    setShowExportModal(true);
    setIsOpen(false);
  };

  const handleCloseExport = () => {
    setShowExportModal(false);
    setSelectedExportMode(null);
    setSelectedConsultationId(null);
  };

  // Si no hay opciones disponibles, no mostrar el dropdown
  if (exportOptions.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
        >
          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
          <span>Exportar</span>
          <ChevronDownIcon className={`h-4 w-4 ml-1 transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} />
        </button>

        {isOpen && (
          <>
            {/* Overlay para cerrar el dropdown al hacer click fuera */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu dropdown */}
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-20 py-2">
              <div className="px-4 py-2 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-900">Opciones de Exportación</h3>
                <p className="text-xs text-gray-600 mt-1">Selecciona el formato que necesitas</p>
              </div>
              
              <div className="py-1">
                {exportOptions.map((option) => {
                  const IconComponent = option.icon;
                  
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleExportOption(option)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                            <IconComponent className="h-4 w-4 text-gray-600" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                            {option.label}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              <div className="px-4 py-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Los archivos se optimizan automáticamente para minimizar el tamaño
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Export Manager Modal */}
      {showExportModal && selectedExportMode && (
        <ExportManager
          patientId={selectedExportMode === 'patients-table' ? undefined : patientId}
          consultationId={selectedConsultationId}
          mode={selectedExportMode}
          onClose={handleCloseExport}
        />
      )}
    </>
  );
}