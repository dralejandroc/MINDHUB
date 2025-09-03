'use client';

import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  ClipboardDocumentIcon,
  PhoneIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

interface SendFormPopupProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
}

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedTime: number;
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
    description: 'Enviar link de formulario por email',
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

// Mock form templates - TODO: Load from FormX API
const mockForms: FormTemplate[] = [
  {
    id: 'intake-form',
    name: 'Formulario de Admisión',
    description: 'Información general del paciente para primera consulta',
    category: 'Admisión',
    estimatedTime: 10
  },
  {
    id: 'medical-history',
    name: 'Historia Médica',
    description: 'Antecedentes médicos y familiares completos',
    category: 'Clínico',
    estimatedTime: 15
  },
  {
    id: 'pre-consultation',
    name: 'Pre-Consulta',
    description: 'Preparación para la cita médica',
    category: 'Consulta',
    estimatedTime: 5
  },
  {
    id: 'satisfaction-survey',
    name: 'Encuesta de Satisfacción',
    description: 'Evaluación del servicio recibido',
    category: 'Feedback',
    estimatedTime: 3
  }
];

export const SendFormPopup: React.FC<SendFormPopupProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  patientEmail,
  patientPhone
}) => {
  const [forms] = useState<FormTemplate[]>(mockForms);
  const [selectedForm, setSelectedForm] = useState<string>('');
  const [sendMethod, setSendMethod] = useState<string>('email');
  const [customEmail, setCustomEmail] = useState(patientEmail || '');
  const [customPhone, setCustomPhone] = useState(patientPhone || '');
  const [linkDuration, setLinkDuration] = useState<number>(48);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!selectedForm) {
      alert('Por favor selecciona un formulario');
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
      // Create form link
      const response = await fetch('/api/formx/form/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          formId: selectedForm,
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
          alert(`Formulario enviado exitosamente a ${patientName}`);
        }
        
        onClose();
      } else {
        throw new Error('Error creating form link');
      }
    } catch (error) {
      console.error('Error sending form:', error);
      alert('Error al enviar el formulario');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedMethod = sendMethods.find(m => m.id === sendMethod);
  const selectedFormData = forms.find(f => f.id === selectedForm);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="w-6 h-6 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Enviar Formulario</h3>
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

          {/* Form Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Formulario
            </label>
            <select
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Seleccionar formulario...</option>
              {forms.map((form) => (
                <option key={form.id} value={form.id}>
                  {form.name} ({form.category})
                </option>
              ))}
            </select>
            {selectedFormData && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900 font-medium">{selectedFormData.name}</p>
                <p className="text-xs text-blue-700">{selectedFormData.description}</p>
                <p className="text-xs text-blue-600 mt-1">
                  Tiempo estimado: {selectedFormData.estimatedTime} minutos
                </p>
              </div>
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
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                <p className="font-medium">Formulario de un solo uso</p>
                <p>El link expirará después del tiempo seleccionado o al completar el formulario.</p>
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
            disabled={loading || !selectedForm}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? 'Enviando...' : 'Enviar Formulario'}
          </Button>
        </div>
      </div>
    </div>
  );
};