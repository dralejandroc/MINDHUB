'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, Copy, Clock, Mail, MessageSquare, AlertCircle, Check, Loader2 } from 'lucide-react';
import RemoteAssessmentsClient, { MessageTemplate } from '@/lib/api/remote-assessments-client';

interface SendRemoteAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  scale: {
    id: string;
    name: string;
    abbreviation: string;
    totalItems: number;
    estimatedDurationMinutes?: number;
  };
  administratorId: string;
  onSuccess?: (assessment: any) => void;
}

export default function SendRemoteAssessmentModal({
  isOpen,
  onClose,
  patient,
  scale,
  administratorId,
  onSuccess
}: SendRemoteAssessmentModalProps) {
  const [formData, setFormData] = useState({
    expirationDays: 7,
    customMessage: '',
    patientEmail: patient.email || '',
    patientPhone: patient.phone || '',
    deliveryMethod: 'copy_link' as 'email' | 'sms' | 'whatsapp' | 'copy_link',
    reminderEnabled: true,
    privacyNoticeId: ''
  });
  
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [createdAssessment, setCreatedAssessment] = useState<any>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Cargar plantillas de mensajes
  useEffect(() => {
    if (isOpen) {
      loadMessageTemplates();
      // Reset form when modal opens
      setFormData({
        ...formData,
        patientEmail: patient.email || '',
        patientPhone: patient.phone || '',
        customMessage: ''
      });
      setSelectedTemplate('');
      setCreatedAssessment(null);
      setError('');
    }
  }, [isOpen, patient]);

  const loadMessageTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await RemoteAssessmentsClient.getMessageTemplates();
      setMessageTemplates(response.data);
    } catch (error: any) {
      console.error('Error cargando plantillas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = messageTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setFormData(prev => ({
        ...prev,
        customMessage: template.messageTemplate
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validaciones básicas
      if (formData.expirationDays < 1 || formData.expirationDays > 30) {
        throw new Error('Los días de expiración deben ser entre 1 y 30');
      }

      if (!formData.customMessage.trim()) {
        throw new Error('El mensaje personalizado es requerido');
      }

      if (formData.deliveryMethod === 'email' && !formData.patientEmail) {
        throw new Error('Email del paciente es requerido para envío por correo');
      }

      if (formData.deliveryMethod === 'sms' && !formData.patientPhone) {
        throw new Error('Teléfono del paciente es requerido para envío por SMS');
      }

      // Crear evaluación remota
      const response = await RemoteAssessmentsClient.createRemoteAssessment({
        patientId: patient.id,
        scaleId: scale.id,
        administratorId,
        expirationDays: formData.expirationDays,
        customMessage: formData.customMessage.trim(),
        patientEmail: formData.patientEmail || undefined,
        patientPhone: formData.patientPhone || undefined,
        deliveryMethod: formData.deliveryMethod,
        reminderEnabled: formData.reminderEnabled,
        privacyNoticeId: formData.privacyNoticeId || undefined
      });

      setCreatedAssessment(response.data);
      onSuccess?.(response.data);

    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
    }
  };

  const generateWhatsAppMessage = () => {
    if (!createdAssessment) return '';
    
    const message = `Hola ${patient.firstName},
    
${formData.customMessage}

Por favor accede al siguiente enlace para completar la evaluación:
${createdAssessment.assessmentUrl}

Esta evaluación expira el: ${new Date(createdAssessment.settings.expiresAt).toLocaleDateString('es-ES')}

Saludos,
${createdAssessment.administrator.name}`;

    return encodeURIComponent(message);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Enviar Evaluación Remota
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {patient.firstName} {patient.lastName} • {scale.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {!createdAssessment ? (
          // Formulario de configuración
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Información de la escala */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Escala a Aplicar</h3>
              <div className="text-sm text-blue-800">
                <p><strong>{scale.name}</strong> ({scale.abbreviation})</p>
                <p>{scale.totalItems} ítems • {scale.estimatedDurationMinutes || 15} min aprox.</p>
              </div>
            </div>

            {/* Configuración de expiración */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Días hasta expiración
              </label>
              <select
                value={formData.expirationDays}
                onChange={(e) => setFormData(prev => ({ ...prev, expirationDays: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value={1}>1 día</option>
                <option value={3}>3 días</option>
                <option value={7}>7 días (recomendado)</option>
                <option value={14}>14 días</option>
                <option value={30}>30 días</option>
              </select>
            </div>

            {/* Plantillas de mensajes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plantilla de mensaje (opcional)
              </label>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              ) : (
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar plantilla...</option>
                  {messageTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.category})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Mensaje personalizado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-1" />
                Mensaje personalizado *
              </label>
              <textarea
                value={formData.customMessage}
                onChange={(e) => setFormData(prev => ({ ...prev, customMessage: e.target.value }))}
                placeholder="Explique al paciente el motivo del envío de esta evaluación..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Este mensaje se mostrará al paciente junto con el aviso de privacidad.
              </p>
            </div>

            {/* Información de contacto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email del paciente
                </label>
                <input
                  type="email"
                  value={formData.patientEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, patientEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ejemplo@correo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono del paciente
                </label>
                <input
                  type="tel"
                  value={formData.patientPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, patientPhone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(55) 1234-5678"
                />
              </div>
            </div>

            {/* Método de entrega */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de entrega
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: 'copy_link', label: 'Copiar enlace', icon: Copy },
                  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                  { value: 'email', label: 'Email', icon: Mail, disabled: true },
                  { value: 'sms', label: 'SMS', icon: MessageSquare, disabled: true }
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    disabled={method.disabled}
                    onClick={() => setFormData(prev => ({ ...prev, deliveryMethod: method.value as any }))}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      formData.deliveryMethod === method.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : method.disabled
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <method.icon className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-xs">{method.label}</span>
                    {method.disabled && (
                      <span className="block text-xs mt-1 text-gray-400">Próximamente</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Recordatorios */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="reminderEnabled"
                checked={formData.reminderEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, reminderEnabled: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="reminderEnabled" className="ml-2 text-sm font-medium text-gray-700">
                Enviar recordatorios automáticos (próximamente)
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{isSubmitting ? 'Creando...' : 'Crear Evaluación'}</span>
              </button>
            </div>
          </form>
        ) : (
          // Resultado exitoso
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¡Evaluación Remota Creada!
              </h3>
              <p className="text-gray-600">
                La evaluación ha sido generada exitosamente para {patient.firstName} {patient.lastName}
              </p>
            </div>

            {/* Información de la evaluación */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Detalles de la Evaluación</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Token:</strong> {createdAssessment.token.substring(0, 8)}...</p>
                <p><strong>Expira:</strong> {new Date(createdAssessment.settings.expiresAt).toLocaleDateString('es-ES')}</p>
                <p><strong>Estado:</strong> {createdAssessment.status}</p>
              </div>
            </div>

            {/* Enlace */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enlace de la Evaluación
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={createdAssessment.assessmentUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                />
                <button
                  onClick={() => copyToClipboard(createdAssessment.assessmentUrl)}
                  className={`px-4 py-2 border border-l-0 border-gray-300 rounded-r-md transition-colors ${
                    linkCopied
                      ? 'bg-green-50 text-green-700'
                      : 'bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {linkCopied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Opciones de envío */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Opciones de Envío</h4>
              
              {/* WhatsApp */}
              <a
                href={`https://wa.me/${formData.patientPhone?.replace(/\D/g, '')}?text=${generateWhatsAppMessage()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full p-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Enviar por WhatsApp
              </a>

              {/* Copiar mensaje completo */}
              <button
                onClick={() => copyToClipboard(`Hola ${patient.firstName},\n\n${formData.customMessage}\n\nPor favor accede al siguiente enlace para completar la evaluación:\n${createdAssessment.assessmentUrl}\n\nEsta evaluación expira el: ${new Date(createdAssessment.settings.expiresAt).toLocaleDateString('es-ES')}\n\nSaludos,\n${createdAssessment.administrator.name}`)}
                className="flex items-center justify-center w-full p-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar Mensaje Completo
              </button>
            </div>

            {/* Botón cerrar */}
            <div className="flex justify-end mt-6">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}