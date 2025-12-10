'use client';

import { useState, useRef, useEffect } from 'react';
import {
  DocumentArrowDownIcon,
  DocumentTextIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import axiosClient from '@/lib/axiosClient';
import Image from 'next/image';
import Swal from 'sweetalert2';

interface PatientDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  url?: string;
}

interface PatientDocumentsProps {
  patientId: string;
  patientName: string;
}

export default function PatientDocuments({ patientId, patientName }: PatientDocumentsProps) {
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewDoc, setPreviewDoc] = useState<PatientDocument | null>(null);


  useEffect(() => {
    const fetchDocuments = async () => {
      const res = await axiosClient.get(`/api/expedix/patient-documents`, {
        params: { patient_id: patientId },
      });
      console.log('RES',res);
      
      const docs: PatientDocument[] = res.data?.results?.map((d: any) => ({
        id: d.id,
        name: d.file_name,
        type: d.file_type,
        size: d.file_size,
        uploadedAt: d.uploaded_at,
        url: d.file_url,
      }));

      setDocuments(docs);
    };

    fetchDocuments();
  }, [patientId]);


  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('Date formatting error:', error, 'for date:', dateString);
      return 'Fecha no válida';
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return PhotoIcon;
    }
    return DocumentTextIcon;
  };

  const isImage = (doc: PatientDocument) =>
  doc.type?.startsWith('image/') ||
  /\.(png|jpe?g|gif|webp)$/i.test(doc.name);

  const isPdf = (doc: PatientDocument) =>
    doc.type === 'application/pdf' || /\.pdf$/i.test(doc.name);

  const getPdfSrc = (url: string) =>
  `/api/pdf-proxy?url=${encodeURIComponent(url)}`;


  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('patient_id', patientId);

    const res = await axiosClient.post('/api/expedix/patient-documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const d = res.data;
    const newDocument: PatientDocument = {
      id: d.id,
      name: d.file_name,
      type: d.file_type,
      size: d.file_size,
      uploadedAt: d.uploaded_at,
      url: d.file_url,
    };
    setDocuments(prev => [newDocument, ...prev]);

    setUploading(false);

  };

  const handleDeleteDocument = async (documentId: string) => {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: "btn btn-success",
        cancelButton: "btn btn-danger"
      },
      buttonsStyling: false
    });
    swalWithBootstrapButtons.fire({
      title: "¿Estás seguro?",
      text: "¡No podrás revertir esto!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, bórralo",
      cancelButtonText: "No, cancelar",
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axiosClient.delete(`/api/expedix/patient-documents/${documentId}/`);
          setDocuments(prev => prev.filter(d => d.id !== documentId));
        } catch (error) {
          console.error('Error deleting document:', error);
        }
        swalWithBootstrapButtons.fire({
          title: "¡Borrado!",
          text: "Tu archivo ha sido borrado.",
          icon: "success"
        });
      } else if (
        /* Read more about handling dismissals below */
        result.dismiss === Swal.DismissReason.cancel
      ) {
        swalWithBootstrapButtons.fire({
          title: "Cancelado",
          text: "Tu archivo imaginario está seguro :)",
          icon: "error"
        });
      }
    });
  };

  const handleViewDocument = (document: PatientDocument) => {
    if (!document.url) {
      alert('Este documento aún no tiene una URL disponible.');
      return;
    }
    setPreviewDoc(document);
  };

  const handleDownloadDocument = (doc: PatientDocument) => {
    // // In a real implementation, this would trigger download
    // console.log('Downloading document:', document.name);
    // alert(`Función de descarga en desarrollo para: ${document.name}`);
    if (doc.url) {
      // download the document no open in new tab
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } 
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
        <div className="text-center">
          <DocumentArrowDownIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Subir Documentos
          </h3>
          <p className="text-gray-600 mb-4">
            Arrastra archivos aquí o haz clic para seleccionar
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Formatos soportados: PDF, JPG, PNG, DOCX (Máximo 10MB por archivo)
          </p>
          
          <div className="space-y-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              {uploading ? 'Subiendo...' : 'Seleccionar Archivos'}
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.docx,.doc"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Documentos del Paciente
          </h3>
          <span className="text-sm text-gray-500">
            {documents.length} documento{documents.length !== 1 ? 's' : ''}
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sin documentos
            </h3>
            <p className="text-gray-600 mb-4">
              Este paciente no tiene documentos subidos todavía
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Subir primer documento
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {documents.map((document) => {
              const IconComponent = getFileIcon(document.type);
              
              return (
                <div
                  key={document.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <IconComponent className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {document.name}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                          <span>{formatFileSize(document.size)}</span>
                          <span>•</span>
                          <span>{formatDate(document.uploadedAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        onClick={() => handleViewDocument(document)}
                        variant="ghost"
                        className="p-2 h-8 w-8"
                        title="Ver documento"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDownloadDocument(document)}
                        variant="ghost"
                        className="p-2 h-8 w-8"
                        title="Descargar documento"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteDocument(document.id)}
                        variant="ghost"
                        className="p-2 h-8 w-8 text-red-600 hover:bg-red-50"
                        title="Eliminar documento"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Storage Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-900 font-medium">
            Almacenamiento utilizado
          </span>
          <span className="text-blue-700">
            {formatFileSize(documents.reduce((total, doc) => total + doc.size, 0))} / 100 MB
          </span>
        </div>
        <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min((documents.reduce((total, doc) => total + doc.size, 0) / (100 * 1024 * 1024)) * 100, 100)}%`
            }}
          />
        </div>
      </div>
      {/* Modal de visualización de documento */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">
                  Documento de: {patientName}
                </span>
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {previewDoc.name}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="text-sm"
                  onClick={() => {
                    if (previewDoc.url) {
                      window.open(previewDoc.url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                  Abrir en pestaña
                </Button>
                <Button
                  variant="ghost"
                  className="text-gray-500 hover:text-gray-900"
                  onClick={() => setPreviewDoc(null)}
                >
                  Cerrar ✕
                </Button>
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-hidden bg-gray-100">
              {isImage(previewDoc) && previewDoc.url && (
                <div className="w-full h-full flex items-center justify-center p-4">
                  {/* Imagen escalada manteniendo proporción */}
                  <Image
                    src={previewDoc.url}
                    alt={previewDoc.name}
                    className="max-h-[80vh] max-w-full object-contain rounded"
                    width={800}
                    height={800}
                  />
                </div>
              )}

              {isPdf(previewDoc) && previewDoc.url && (
                <div className="flex-1">
                  <iframe
                    src={getPdfSrc(previewDoc.url)}
                    className="w-full h-[80vh]"
                    style={{ border: 'none' }}
                  />
                </div>
              )}

              {!isImage(previewDoc) && !isPdf(previewDoc) && (
                <div className="p-6 flex flex-col items-center justify-center text-center space-y-3 h-full">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400" />
                  <p className="text-gray-700 text-sm">
                    Este tipo de archivo no se puede previsualizar aquí.
                  </p>
                  {previewDoc.url && (
                    <Button
                      onClick={() =>
                        window.open(previewDoc.url!, '_blank', 'noopener,noreferrer')
                      }
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                      Abrir / Descargar
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>

    
  );
  
}