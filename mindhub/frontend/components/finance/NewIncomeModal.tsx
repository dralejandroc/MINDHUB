'use client';

import { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  BanknotesIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  UserIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { authPost, authGet } from '@/lib/api/auth-fetch';
import toast from 'react-hot-toast';

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
  requiresInvoice?: boolean;
}

interface Patient {
  id: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  cell_phone: string;
  email: string;
}

export default function NewIncomeModal({ selectedDate, onClose, onSave }: NewIncomeModalProps) {
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientSearch, setShowPatientSearch] = useState(false);

  const [formData, setFormData] = useState<IncomeFormData>({
    amount: '',
    source: 'consultation',
    paymentMethod: 'cash',
    patientName: '',
    description: '',
    date: selectedDate.toISOString().split('T')[0],
    requiresInvoice: false
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

  // Load patients for search
  const handlePatientSearch = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setPatients([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await authGet(`/api/expedix/django/patients/search?q=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setPatients(data.results || data.data || []);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      patientId: patient.id,
      patientName: `${patient.first_name} ${patient.paternal_last_name} ${patient.maternal_last_name || ''}`.trim()
    }));
    setShowPatientSearch(false);
    setPatientSearch('');
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    setFormData(prev => ({
      ...prev,
      patientId: undefined,
      patientName: ''
    }));
  };

  useEffect(() => {
    if (patientSearch.length >= 2) {
      handlePatientSearch(patientSearch);
    } else {
      setPatients([]);
    }
  }, [patientSearch]);

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
        requires_invoice: formData.requiresInvoice || false,
        patient_name: formData.patientName,
        date: formData.date
      };

      const response = await authPost('/api/finance/django/income/', payload);
      
      if (response.ok) {
        const savedIncome = await response.json();
        onSave(savedIncome);
        toast.success('Ingreso registrado exitosamente');
        
        // Create patient payment log if patient is selected
        if (selectedPatient) {
          try {
            await authPost('/api/expedix/django/patients/payment-log/', {
              patient_id: selectedPatient.id,
              amount: parseFloat(formData.amount),
              payment_method: formData.paymentMethod,
              description: formData.description,
              requires_invoice: formData.requiresInvoice,
              transaction_date: formData.date
            });
          } catch (logError) {
            console.error('Error creating payment log:', logError);
            // Don't fail the main operation if logging fails
          }
        }
      } else {
        throw new Error('Failed to save income');
      }
    } catch (error) {
      console.error('Error saving income:', error);
      toast.error('Error al guardar el ingreso. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof IncomeFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'requiresInvoice' ? value : value
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

          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paciente
              {formData.source === 'consultation' && <span className="text-red-500 ml-1">*</span>}
            </label>

            {selectedPatient ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-900">{`${selectedPatient.first_name} ${selectedPatient.paternal_last_name} ${selectedPatient.maternal_last_name || ''}`.trim()}</p>
                  <p className="text-sm text-green-700">{selectedPatient.cell_phone} • {selectedPatient.email}</p>
                </div>
                <Button onClick={clearPatient} variant="outline" size="sm">
                  Cambiar
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar paciente por nombre, teléfono o email..."
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setShowPatientSearch(true);
                    }}
                    onFocus={() => setShowPatientSearch(true)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {showPatientSearch && (patientSearch || patients.length > 0) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                    {searchLoading ? (
                      <div className="p-3 text-center">
                        <LoadingSpinner size="sm" />
                        <span className="ml-2 text-sm text-gray-600">Buscando...</span>
                      </div>
                    ) : (
                      <>
                        {patients.map((patient) => (
                          <button
                            key={patient.id}
                            type="button"
                            onClick={() => selectPatient(patient)}
                            className="w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">
                              {`${patient.first_name} ${patient.paternal_last_name} ${patient.maternal_last_name || ''}`.trim()}
                            </div>
                            <div className="text-sm text-gray-600">
                              {patient.cell_phone} • {patient.email}
                            </div>
                          </button>
                        ))}
                        {patients.length === 0 && patientSearch && (
                          <div className="p-3 text-center text-gray-500">
                            No se encontraron pacientes
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Manual patient name input (for non-registered patients) */}
            <div className="mt-3">
              <input
                type="text"
                placeholder="O ingresa un nombre manualmente"
                value={formData.patientName}
                onChange={(e) => handleInputChange('patientName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Invoice Options */}
          <div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiresInvoice}
                onChange={(e) => handleInputChange('requiresInvoice', e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                El paciente solicita factura
              </span>
            </label>
            {formData.requiresInvoice && (
              <div className="mt-2 p-3 bg-blue-50 rounded-md">
                <p className="text-xs text-blue-700">
                  <strong>Nota:</strong> Se registrará que el paciente requiere factura. 
                  La facturación se realizará por separado según los procesos internos.
                </p>
              </div>
            )}
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