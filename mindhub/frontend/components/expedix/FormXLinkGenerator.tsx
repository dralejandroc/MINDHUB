/**
 * COMPONENTE - Generador de Links Genéricos FormX
 * Crea enlaces únicos para enviar a pacientes con auto-matching
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  LinkIcon,
  DocumentDuplicateIcon,
  PaperAirplaneIcon,
  QrCodeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase/client';

interface FormTemplate {
  id: string;
  title: string;
  description: string;
  fields: string[];
  category: 'intake' | 'followup' | 'symptoms' | 'background';
  estimatedTime: number;
}

interface GeneratedLink {
  id: string;
  url: string;
  qrCode?: string;
  createdAt: string;
  expiresAt: string;
  formId: string;
  formTitle: string;
  status: 'active' | 'expired' | 'used';
}

export default function FormXLinkGenerator() {
  const [availableForms, setAvailableForms] = useState<FormTemplate[]>([
    {
      id: 'intake-general',
      title: 'Formulario de Admisión General',
      description: 'Información básica del paciente, antecedentes médicos y síntomas actuales',
      fields: ['Datos personales', 'Antecedentes médicos', 'Síntomas actuales', 'Medicamentos'],
      category: 'intake',
      estimatedTime: 10
    },
    {
      id: 'background-comprehensive',
      title: 'Antecedentes Médicos Completos',
      description: 'Historial médico detallado, alergias, cirugías y antecedentes familiares',
      fields: ['Historial médico', 'Alergias', 'Cirugías', 'Antecedentes familiares', 'Hábitos'],
      category: 'background',
      estimatedTime: 15
    },
    {
      id: 'symptoms-mental-health',
      title: 'Evaluación de Síntomas de Salud Mental',
      description: 'Cuestionario específico para síntomas psicológicos y emocionales',
      fields: ['Estado de ánimo', 'Ansiedad', 'Sueño', 'Apetito', 'Concentración'],
      category: 'symptoms',
      estimatedTime: 8
    },
    {
      id: 'followup-consultation',
      title: 'Seguimiento Post-Consulta',
      description: 'Evaluación de progreso y efectos de tratamiento',
      fields: ['Evolución de síntomas', 'Efectos del tratamiento', 'Nuevas molestias'],
      category: 'followup',
      estimatedTime: 5
    }
  ]);

  const [selectedForm, setSelectedForm] = useState<string>('');
  const [linkSettings, setLinkSettings] = useState({
    expiresInHours: 72,
    allowMultipleUse: false,
    requireVerification: true,
    customMessage: ''
  });
  const [generatedLinks, setGeneratedLinks] = useState<GeneratedLink[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const generateLink = async () => {
    if (!selectedForm) return;

    setIsGenerating(true);
    try {
      const selectedFormData = availableForms.find(f => f.id === selectedForm);
      if (!selectedFormData) return;

      // Generar ID único para el link
      const linkId = `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Calcular fecha de expiración
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + linkSettings.expiresInHours);

      // Crear registro en base de datos
      const linkRecord = {
        id: linkId,
        form_id: selectedForm,
        form_title: selectedFormData.title,
        expires_at: expiresAt.toISOString(),
        allow_multiple_use: linkSettings.allowMultipleUse,
        require_verification: linkSettings.requireVerification,
        custom_message: linkSettings.customMessage,
        status: 'active',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('formx_generic_links')
        .insert(linkRecord);

      if (error) throw error;

      // Generar URL completa
      const baseUrl = window.location.origin;
      const formUrl = `${baseUrl}/formx/fill/${linkId}`;

      // Generar código QR (implementación simplificada)
      const qrCodeUrl = await generateQRCode(formUrl);

      const newLink: GeneratedLink = {
        id: linkId,
        url: formUrl,
        qrCode: qrCodeUrl,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        formId: selectedForm,
        formTitle: selectedFormData.title,
        status: 'active'
      };

      setGeneratedLinks(prev => [newLink, ...prev]);

    } catch (error) {
      console.error('Error generating link:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateQRCode = async (url: string): Promise<string> => {
    // Implementación simplificada - en producción usar QRCode.js o similar
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
  };

  const copyToClipboard = async (linkId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLinkId(linkId);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const getFormCategoryColor = (category: FormTemplate['category']) => {
    switch (category) {
      case 'intake': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'background': return 'bg-green-100 text-green-800 border-green-200';
      case 'symptoms': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'followup': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFormCategoryLabel = (category: FormTemplate['category']) => {
    switch (category) {
      case 'intake': return 'Admisión';
      case 'background': return 'Antecedentes';
      case 'symptoms': return 'Síntomas';
      case 'followup': return 'Seguimiento';
      default: return 'General';
    }
  };

  const formatTimeLeft = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const hoursLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (hoursLeft <= 0) return 'Expirado';
    if (hoursLeft < 24) return `${hoursLeft}h restantes`;
    
    const daysLeft = Math.ceil(hoursLeft / 24);
    return `${daysLeft} día(s) restantes`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-blue-900 flex items-center gap-2">
              <LinkIcon className="w-6 h-6" />
              Generador de Enlaces FormX
            </h2>
            <p className="text-blue-700 mt-2">
              Crea enlaces únicos para enviar formularios a pacientes con identificación automática
            </p>
          </div>
          <div className="bg-blue-100 rounded-lg p-3">
            <InformationCircleIcon className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </Card>

      {/* Generador de Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de configuración */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CogIcon className="w-5 h-5" />
            Configurar Nuevo Enlace
          </h3>

          {/* Selección de formulario */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Formulario
            </label>
            <select
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccione un formulario...</option>
              {availableForms.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.title} ({form.estimatedTime} min)
                </option>
              ))}
            </select>
          </div>

          {/* Detalles del formulario seleccionado */}
          {selectedForm && (
            <div className="mb-4">
              {(() => {
                const form = availableForms.find(f => f.id === selectedForm);
                if (!form) return null;
                
                return (
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getFormCategoryColor(form.category)}`}>
                        {getFormCategoryLabel(form.category)}
                      </span>
                      <span className="text-xs text-gray-500">~{form.estimatedTime} minutos</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{form.description}</p>
                    <div className="text-xs text-gray-600">
                      <strong>Campos incluidos:</strong> {form.fields.join(', ')}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Configuraciones del enlace */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expira en (horas)
              </label>
              <select
                value={linkSettings.expiresInHours}
                onChange={(e) => setLinkSettings(prev => ({ ...prev, expiresInHours: Number(e.target.value) }))}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value={24}>24 horas (1 día)</option>
                <option value={72}>72 horas (3 días)</option>
                <option value={168}>168 horas (1 semana)</option>
                <option value={720}>720 horas (30 días)</option>
              </select>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={linkSettings.allowMultipleUse}
                  onChange={(e) => setLinkSettings(prev => ({ ...prev, allowMultipleUse: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Permitir uso múltiple</span>
              </label>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={linkSettings.requireVerification}
                  onChange={(e) => setLinkSettings(prev => ({ ...prev, requireVerification: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Requerir verificación de identidad</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje personalizado (opcional)
              </label>
              <textarea
                value={linkSettings.customMessage}
                onChange={(e) => setLinkSettings(prev => ({ ...prev, customMessage: e.target.value }))}
                placeholder="Ej: Por favor complete este formulario antes de su consulta del viernes..."
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                rows={3}
              />
            </div>
          </div>

          {/* Botón generar */}
          <Button
            onClick={generateLink}
            disabled={!selectedForm || isGenerating}
            className="w-full flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <LinkIcon className="w-4 h-4" />
            )}
            {isGenerating ? 'Generando...' : 'Generar Enlace'}
          </Button>
        </Card>

        {/* Panel de información */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Cómo Funciona la Identificación Automática
          </h3>
          
          <div className="space-y-4 text-sm text-gray-700">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-blue-600">1</span>
              </div>
              <div>
                <p className="font-medium">Paciente recibe el enlace</p>
                <p className="text-gray-600">El enlace genérico se puede enviar por email, SMS o mostrar código QR</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-blue-600">2</span>
              </div>
              <div>
                <p className="font-medium">Completa el formulario</p>
                <p className="text-gray-600">Incluye nombre completo y fecha de nacimiento para identificación</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-blue-600">3</span>
              </div>
              <div>
                <p className="font-medium">Matching automático</p>
                <p className="text-gray-600">El sistema busca coincidencias en Expedix usando algoritmos inteligentes</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-blue-600">4</span>
              </div>
              <div>
                <p className="font-medium">Procesamiento automático</p>
                <p className="text-gray-600">Si la confianza es alta (>85%), se procesa automáticamente. Si no, requiere confirmación manual</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">Beneficios del Sistema</span>
            </div>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• PDF automático guardado en documentos del paciente</li>
              <li>• Antecedentes médicos estructurados en pestaña "Antecedentes"</li>
              <li>• Zero esfuerzo manual para procesar formularios</li>
              <li>• Información consultable directamente en el expediente</li>
            </ul>
          </div>
        </Card>
      </div>

      {/* Enlaces generados */}
      {generatedLinks.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Enlaces Generados ({generatedLinks.length})
          </h3>
          
          <div className="space-y-4">
            {generatedLinks.map((link) => (
              <div key={link.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{link.formTitle}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Creado: {new Date(link.createdAt).toLocaleDateString()} • 
                      {' '}{formatTimeLeft(link.expiresAt)}
                    </p>
                    <div className="mt-2 p-2 bg-gray-100 rounded text-sm font-mono break-all">
                      {link.url}
                    </div>
                  </div>
                  
                  {link.qrCode && (
                    <div className="ml-4 flex-shrink-0">
                      <img src={link.qrCode} alt="QR Code" className="w-16 h-16" />
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(link.id, link.url)}
                    className="flex items-center gap-1"
                  >
                    {copiedLinkId === link.id ? (
                      <CheckCircleIcon className="w-3 h-3" />
                    ) : (
                      <DocumentDuplicateIcon className="w-3 h-3" />
                    )}
                    {copiedLinkId === link.id ? 'Copiado' : 'Copiar'}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`mailto:?subject=Formulario médico&body=Por favor complete este formulario: ${link.url}`)}
                    className="flex items-center gap-1"
                  >
                    <PaperAirplaneIcon className="w-3 h-3" />
                    Email
                  </Button>
                  
                  {link.qrCode && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(link.qrCode, '_blank')}
                      className="flex items-center gap-1"
                    >
                      <QrCodeIcon className="w-3 h-3" />
                      QR
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}