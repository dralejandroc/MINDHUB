'use client';

import React, { useState } from 'react';
import { PsychoeducationalDocument } from '@/types/psychoeducational-documents';
import { 
  ArrowDownTrayIcon,
  EnvelopeIcon,
  PrinterIcon,
  ShareIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface DocumentActionsProps {
  document: PsychoeducationalDocument;
  patientId?: string;
  onDownload?: (format: 'pdf' | 'json' | 'html') => void;
  onSendToPatient?: (method: 'email' | 'whatsapp') => void;
}

export const DocumentActions: React.FC<DocumentActionsProps> = ({
  document,
  patientId,
  onDownload,
  onSendToPatient
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleDownload = async (format: 'pdf' | 'json' | 'html') => {
    if (!onDownload) return;
    
    setIsDownloading(true);
    try {
      await onDownload(format);
      toast.success(`Documento descargado en formato ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Error al descargar el documento');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSend = async (method: 'email' | 'whatsapp') => {
    if (!onSendToPatient || !patientId) {
      toast.error('No se puede enviar: información del paciente no disponible');
      return;
    }
    
    setIsSending(true);
    try {
      await onSendToPatient(method);
      toast.success(`Documento enviado por ${method === 'email' ? 'correo electrónico' : 'WhatsApp'}`);
    } catch (error) {
      toast.error('Error al enviar el documento');
    } finally {
      setIsSending(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/resources/psychoeducational/${document.document.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Enlace copiado al portapapeles');
  };

  const handleCopyJson = () => {
    const jsonString = JSON.stringify(document, null, 2);
    navigator.clipboard.writeText(jsonString);
    toast.success('JSON copiado al portapapeles');
  };

  return (
    <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Información del Documento */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {document.document.metadata.title}
          </p>
          <p className="text-xs text-gray-500">
            ID: {document.document.id} • Versión {document.document.metadata.version}
          </p>
        </div>

        {/* Acciones de Descarga */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-white rounded-lg border border-gray-200 p-1">
            <Button
              onClick={() => handleDownload('pdf')}
              disabled={isDownloading}
              variant="outline"
              size="sm"
              className="border-0 shadow-none"
            >
              <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
              PDF
            </Button>
            
            <Button
              onClick={() => handleDownload('json')}
              disabled={isDownloading}
              variant="outline"
              size="sm"
              className="border-0 shadow-none"
            >
              <DocumentDuplicateIcon className="w-4 h-4 mr-1" />
              JSON
            </Button>
            
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="border-0 shadow-none"
            >
              <PrinterIcon className="w-4 h-4 mr-1" />
              Imprimir
            </Button>
          </div>

          {/* Acciones de Envío */}
          {patientId && (
            <div className="flex items-center space-x-1 bg-white rounded-lg border border-gray-200 p-1">
              <Button
                onClick={() => handleSend('email')}
                disabled={isSending}
                variant="outline"
                size="sm"
                className="border-0 shadow-none"
              >
                <EnvelopeIcon className="w-4 h-4 mr-1" />
                Email
              </Button>
              
              <Button
                onClick={() => handleSend('whatsapp')}
                disabled={isSending}
                variant="outline"
                size="sm"
                className="border-0 shadow-none"
              >
                <ShareIcon className="w-4 h-4 mr-1" />
                WhatsApp
              </Button>
            </div>
          )}

          {/* Acciones Adicionales */}
          <div className="flex items-center space-x-1">
            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="sm"
            >
              <ShareIcon className="w-4 h-4 mr-1" />
              Copiar Enlace
            </Button>
            
            <Button
              onClick={handleCopyJson}
              variant="outline"
              size="sm"
            >
              <DocumentDuplicateIcon className="w-4 h-4 mr-1" />
              Copiar JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas de uso (si están disponibles) */}
      {document.document.quality_metrics && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {document.document.quality_metrics.usage_count}
              </div>
              <div className="text-xs text-gray-500">Usos</div>
            </div>
            
            {document.document.quality_metrics.patient_feedback_score && (
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {document.document.quality_metrics.patient_feedback_score}/5
                </div>
                <div className="text-xs text-gray-500">Calificación</div>
              </div>
            )}
            
            {document.document.quality_metrics.effectiveness_rating && (
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {document.document.quality_metrics.effectiveness_rating}/5
                </div>
                <div className="text-xs text-gray-500">Efectividad</div>
              </div>
            )}
            
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {document.document.quality_metrics.peer_reviewed ? '✓' : '✗'}
              </div>
              <div className="text-xs text-gray-500">Revisado</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};