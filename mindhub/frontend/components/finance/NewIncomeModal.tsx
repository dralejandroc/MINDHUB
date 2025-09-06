'use client';

import { useState } from 'react';
import { 
  XMarkIcon,
  BanknotesIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  UserIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface NewIncomeModalProps {
  selectedDate: Date;
  onClose: () => void;
  onSave: (incomeData: any) => void;
}

interface IncomeFormData {
  amount: string;
  source: 'consultation' | 'advance' | 'other';
  paymentMethod: 'cash' | 'card' | 'transfer' | 'check';
  patientName: string;
  description: string;
  date: string;
  professionalId?: string;
  patientId?: string;
  appointmentId?: string;
  notes?: string;
}

export default function NewIncomeModal({ selectedDate, onClose, onSave }: NewIncomeModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<IncomeFormData>({
    amount: '',
    source: 'consultation',
    paymentMethod: 'cash',
    patientName: '',
    description: '',
    date: selectedDate.toISOString().split('T')[0],
    professionalId: 'current-user' // En producción vendría del contexto de usuario
  });

  const sourceOptions = [
    { value: 'consultation', label: 'Consulta', icon: UserIcon },
    { value: 'advance', label: 'Anticipo', icon: CurrencyDollarIcon },
    { value: 'other', label: 'Otro', icon: DocumentTextIcon }
  ];

  const paymentMethodOptions = [
    { value: 'cash', label: 'Efectivo', icon: BanknotesIcon },
    { value: 'card', label: 'Tarjeta', icon: CreditCardIcon },
    { value: 'transfer', label: 'Transferencia', icon: CurrencyDollarIcon },
    { value: 'check', label: 'Cheque', icon: DocumentTextIcon }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        amount: parseFloat(formData.amount),
        description: formData.description,
        source: formData.source || 'other',
        payment_method: formData.paymentMethod,
        patient_id: formData.patientId || null,
        appointment_id: formData.appointmentId || null,
        notes: formData.notes || '',
      };

      const response = await fetch('/api/finance/django/api/income/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save income');
      }
      
      const savedIncome = await response.json();
      onSave(savedIncome);
    } catch (error) {
      console.error('Error saving income:', error);
      alert('Error al guardar el ingreso. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof IncomeFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <BanknotesIcon className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Registrar Nuevo Ingreso
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fuente de ingreso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuente de Ingreso
              </label>
              <div className="space-y-2">
                {sourceOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <label key={option.value} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="source"
                        value={option.value}
                        checked={formData.source === option.value}
                        onChange={(e) => handleInputChange('source', e.target.value)}
                        className="text-green-600 focus:ring-green-500"
                      />
                      <div className="ml-3 flex items-center">
                        <IconComponent className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-900">{option.label}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Método de pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pago
              </label>
              <div className="space-y-2">
                {paymentMethodOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <label key={option.value} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={option.value}
                        checked={formData.paymentMethod === option.value}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                        className="text-green-600 focus:ring-green-500"
                      />
                      <div className="ml-3 flex items-center">
                        <IconComponent className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-900">{option.label}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Nombre del paciente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Paciente
              {formData.source === 'consultation' && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={formData.patientName}
              onChange={(e) => handleInputChange('patientName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Nombre completo del paciente"
              required={formData.source === 'consultation'}
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="Describe el concepto del ingreso..."
              required
            />
          </div>

          {/* Información adicional para consultas */}
          {formData.source === 'consultation' && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-green-800 mb-2">
                Información de Consulta
              </h4>
              <p className="text-sm text-green-700">
                Este ingreso se registrará como una consulta médica y se incluirá en las estadísticas de práctica profesional.
              </p>
            </div>
          )}

          {/* Información adicional para anticipos */}
          {formData.source === 'advance' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                Información de Anticipo
              </h4>
              <p className="text-sm text-blue-700">
                Este ingreso se registrará como un anticipo y podrá ser aplicado a futuras consultas del paciente.
              </p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <BanknotesIcon className="h-4 w-4" />
                <span>Registrar Ingreso</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}