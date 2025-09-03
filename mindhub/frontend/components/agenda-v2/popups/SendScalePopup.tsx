'use client';

import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  ChartBarIcon,
  EnvelopeIcon,
  ClipboardDocumentIcon,
  PhoneIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { clinimetrixProClient } from '@/lib/api/clinimetrix-pro-client';
import type { ClinimetrixRegistry } from '@/lib/api/clinimetrix-pro-client';

interface SendScalePopupProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
}

interface SendMethod {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  requiresEmail?: boolean;
  requiresPhone?: boolean;
}

const sendMethods: SendMethod[] = [
  {
    id: 'email',
    name: 'Correo Electrónico',
    icon: EnvelopeIcon,
    description: 'Enviar link de evaluación por email',
    requiresEmail: true
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: PhoneIcon,
    description: 'Enviar link por WhatsApp',
    requiresPhone: true
  },
  {
    id: 'copy-link',
    name: 'Copiar Link',
    icon: ClipboardDocumentIcon,
    description: 'Generar link para copiar y pegar'
  }
];

const linkDurations = [
  { value: 24, label: '24 horas' },
  { value: 48, label: '48 horas' },
  { value: 72, label: '3 días' },
  { value: 168, label: '1 semana' },
  { value: 336, label: '2 semanas' }
];

export const SendScalePopup: React.FC<SendScalePopupProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  patientEmail,
  patientPhone
}) => {
  const [scales, setScales] = useState<ClinimetrixRegistry[]>([]);
  const [selectedScale, setSelectedScale] = useState<string>('');
  const [sendMethod, setSendMethod] = useState<string>('email');
  const [customEmail, setCustomEmail] = useState(patientEmail || '');
  const [customPhone, setCustomPhone] = useState(patientPhone || '');
  const [linkDuration, setLinkDuration] = useState<number>(48);
  const [loading, setLoading] = useState(false);
  const [loadingScales, setLoadingScales] = useState(true);

  // Load scales when component mounts
  useEffect(() => {
    if (isOpen) {
      loadScales();
    }
  }, [isOpen]);

  const loadScales = async () => {
    try {
      setLoadingScales(true);
      const scalesData = await clinimetrixProClient.getTemplateCatalog();
      setScales(scalesData);
    } catch (error) {
      console.error('Error loading scales:', error);
    } finally {
      setLoadingScales(false);
    }
  };

  const handleSend = async () => {
    if (!selectedScale) {
      alert('Por favor selecciona una escala');
      return;
    }

    const method = sendMethods.find(m => m.id === sendMethod);
    if (!method) return;

    // Validate required fields
    if (method.requiresEmail && !customEmail) {
      alert('Por favor ingresa un email válido');
      return;
    }
    if (method.requiresPhone && !customPhone) {
      alert('Por favor ingresa un teléfono válido');
      return;
    }

    setLoading(true);
    try {
      // Create assessment link
      const response = await fetch('/api/clinimetrix/assessment/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          scaleId: selectedScale,
          method: sendMethod,
          email: customEmail,
          phone: customPhone,
          expirationHours: linkDuration,
          singleUse: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (sendMethod === 'copy-link') {
          // Copy to clipboard
          await navigator.clipboard.writeText(data.link);
          alert('Link copiado al portapapeles');
        } else {
          alert(`Escala enviada exitosamente a ${patientName}`);
        }
        
        onClose();
      } else {
        throw new Error('Error creating assessment link');
      }
    } catch (error) {
      console.error('Error sending scale:', error);
      alert('Error al enviar la escala');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedMethod = sendMethods.find(m => m.id === sendMethod);
  const selectedScaleData = scales.find(s => s.templateId === selectedScale);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <ChartBarIcon className="w-6 h-6 text-pink-600" />
            <h3 className="text-lg font-semibold text-gray-900">Enviar Escala</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Patient Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-medium text-gray-900">{patientName}</p>
            <p className="text-sm text-gray-600">ID: {patientId}</p>
          </div>

          {/* Scale Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Escala
            </label>
            {loadingScales ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
              </div>
            ) : (
              <select
                value={selectedScale}
                onChange={(e) => setSelectedScale(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="">Seleccionar escala...</option>
                {scales.map((scale) => (
                  <option key={scale.templateId} value={scale.templateId}>
                    {scale.abbreviation} - {scale.name}
                  </option>
                ))}
              </select>
            )}
            {selectedScaleData && (
              <p className="text-xs text-gray-600 mt-1">
                {selectedScaleData.totalItems} ítems • {selectedScaleData.administrationTime} min
              </p>
            )}
          </div>

          {/* Send Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Envío
            </label>
            <div className="space-y-2">
              {sendMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <label key={method.id} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="sendMethod"
                      value={method.id}
                      checked={sendMethod === method.id}
                      onChange={(e) => setSendMethod(e.target.value)}
                      className="mt-1 text-pink-600 focus:ring-pink-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">{method.name}</span>
                      </div>
                      <p className="text-xs text-gray-600">{method.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Contact Info */}
          {selectedMethod?.requiresEmail && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="email@ejemplo.com"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          )}

          {selectedMethod?.requiresPhone && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono (WhatsApp)
              </label>
              <input
                type="tel"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="+52 55 1234 5678"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Link Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ClockIcon className="w-4 h-4 inline mr-1" />
              Vigencia del Link
            </label>
            <select
              value={linkDuration}
              onChange={(e) => setLinkDuration(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              {linkDurations.map((duration) => (
                <option key={duration.value} value={duration.value}>
                  {duration.label}
                </option>
              ))}
            </select>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <ExclamationCircleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Link de un solo uso</p>
                <p>El link expirará después del tiempo seleccionado o al completar la evaluación.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={loading || !selectedScale}
            className="bg-pink-600 hover:bg-pink-700"
          >
            {loading ? 'Enviando...' : 'Enviar Escala'}
          </Button>
        </div>
      </div>
    </div>
  );
};