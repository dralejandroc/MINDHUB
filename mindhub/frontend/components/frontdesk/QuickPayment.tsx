'use client';

import { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  UserIcon,
  CheckCircleIcon,
  CreditCardIcon,
  BanknotesIcon,
  PlusIcon,
  ArrowsRightLeftIcon,
  TagIcon,
  CogIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import PatientServiceAssignment from '@/components/finance/PatientServiceAssignment';

interface QuickPaymentProps {
  onPaymentComplete: () => void;
}

interface Patient {
  id: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name?: string;
  cell_phone: string;
}

interface PendingPayment {
  id: string;
  patientId: string;
  patientName: string;
  concept: string;
  amount: number;
  dueDate: string;
  type: 'consultation' | 'advance' | 'balance';
}

export default function QuickPayment({ onPaymentComplete }: QuickPaymentProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showServiceAssignment, setShowServiceAssignment] = useState(false);
  
  // Payment form state
  const [paymentData, setPaymentData] = useState({
    amount: '',
    concept: 'consultation',
    paymentMethod: 'cash',
    notes: '',
    isAdvancePayment: false
  });

  const paymentMethods = [
    { id: 'cash', name: 'Efectivo', icon: BanknotesIcon, description: 'Pago en efectivo' },
    { id: 'credit_card', name: 'Tarjeta Crédito', icon: CreditCardIcon, description: 'Tarjeta de crédito' },
    { id: 'debit_card', name: 'Tarjeta Débito', icon: DevicePhoneMobileIcon, description: 'Tarjeta de débito' },
    { id: 'transfer', name: 'Transferencia', icon: ArrowsRightLeftIcon, description: 'Transferencia bancaria' },
    { id: 'payment_gateway', name: 'Pasarela', icon: GlobeAltIcon, description: 'Pasarela de pago online' }
  ];

  const concepts = [
    { id: 'consultation', name: 'Consulta', amount: 800 },
    { id: 'followup', name: 'Seguimiento', amount: 600 },
    { id: 'therapy', name: 'Terapia', amount: 1000 },
    { id: 'evaluation', name: 'Evaluación', amount: 1200 },
    { id: 'other', name: 'Otro', amount: 0 }
  ];

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchPatients();
    } else {
      setPatients([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (selectedPatient) {
      loadPendingPayments(selectedPatient.id);
    }
  }, [selectedPatient]);

  const searchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/expedix/patients?search=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      
      if (data.patients) {
        setPatients(data.patients.slice(0, 10)); // Limit to 10 results
      }
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingPayments = async (patientId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://mindhub-production.up.railway.app'}/v1/frontdesk/payments/pending/${patientId}`);
      const data = await response.json();
      
      if (data.success) {
        setPendingPayments(data.data);
      }
    } catch (error) {
      console.error('Error loading pending payments:', error);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchTerm(`${patient.first_name} ${patient.paternal_last_name}`);
    setPatients([]);
  };

  const handleConceptChange = (conceptId: string) => {
    const concept = concepts.find(c => c.id === conceptId);
    setPaymentData(prev => ({
      ...prev,
      concept: conceptId,
      amount: concept?.amount ? concept.amount.toString() : ''
    }));
  };

  const processPayment = async () => {
    if (!selectedPatient || !paymentData.amount) {
      alert('Por favor selecciona un paciente y monto');
      return;
    }

    try {
      setProcessing(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://mindhub-production.up.railway.app'}/v1/frontdesk/payments/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          amount: parseFloat(paymentData.amount),
          concept: paymentData.concept,
          paymentMethod: paymentData.paymentMethod,
          notes: paymentData.notes,
          isAdvancePayment: paymentData.isAdvancePayment
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Pago registrado exitosamente');
        resetForm();
        onPaymentComplete();
      } else {
        alert('Error al procesar el pago: ' + data.message);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Error al procesar el pago');
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setSelectedPatient(null);
    setSearchTerm('');
    setPendingPayments([]);
    setPaymentData({
      amount: '',
      concept: 'consultation',
      paymentMethod: 'cash',
      notes: '',
      isAdvancePayment: false
    });
  };

  const payPendingAmount = async (pendingPayment: PendingPayment) => {
    try {
      setProcessing(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://mindhub-production.up.railway.app'}/v1/frontdesk/payments/pay-pending/${pendingPayment.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod: paymentData.paymentMethod,
          notes: paymentData.notes
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Pago pendiente registrado exitosamente');
        loadPendingPayments(selectedPatient!.id);
        onPaymentComplete();
      } else {
        alert('Error al procesar el pago: ' + data.message);
      }
    } catch (error) {
      console.error('Error paying pending amount:', error);
      alert('Error al procesar el pago');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <CurrencyDollarIcon className="h-6 w-6 mr-2 text-green-600" />
          Gestión de Cobros
        </h3>
        <p className="text-gray-600 mt-1">
          Registra pagos de consultas, anticipos y saldos pendientes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patient Search */}
        <Card className="p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Buscar Paciente</h4>
          
          <div className="relative">
            <Input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          {loading && (
            <div className="mt-4 flex items-center justify-center">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-gray-600">Buscando...</span>
            </div>
          )}

          {patients.length > 0 && (
            <div className="mt-4 max-h-60 overflow-y-auto">
              {patients.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => handlePatientSelect(patient)}
                  className="w-full text-left p-3 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {patient.first_name} {patient.paternal_last_name} {patient.maternal_last_name || ''}
                      </div>
                      <div className="text-sm text-gray-600">{patient.cell_phone}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedPatient && (
            <Card className="mt-4 p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <div>
                    <div className="font-medium text-blue-900">
                      {selectedPatient.first_name} {selectedPatient.paternal_last_name}
                    </div>
                    <div className="text-sm text-blue-700">{selectedPatient.cell_phone}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowServiceAssignment(true)}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    <CogIcon className="h-4 w-4 mr-1" />
                    Servicios
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetForm}
                  >
                    Cambiar
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </Card>

        {/* Payment Form */}
        <Card className="p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Nuevo Cobro</h4>
          
          {!selectedPatient ? (
            <div className="text-center py-8 text-gray-500">
              <UserIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Selecciona un paciente para continuar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Concept Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Concepto
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {concepts.map((concept) => (
                    <button
                      key={concept.id}
                      onClick={() => handleConceptChange(concept.id)}
                      className={`p-3 text-left rounded-lg border ${
                        paymentData.concept === concept.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium">{concept.name}</div>
                      {concept.amount > 0 && (
                        <div className="text-sm text-green-600">${concept.amount}</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pago
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {paymentMethods.map((method) => {
                    const IconComponent = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setPaymentData(prev => ({ ...prev, paymentMethod: method.id }))}
                        className={`p-3 text-center rounded-lg border transition-all ${
                          paymentData.paymentMethod === method.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                            : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                        }`}
                        title={method.description}
                      >
                        <IconComponent className="h-5 w-5 mx-auto mb-2" />
                        <div className="text-xs font-medium">{method.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{method.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advance Payment Toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="advancePayment"
                  checked={paymentData.isAdvancePayment}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, isAdvancePayment: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="advancePayment" className="ml-2 text-sm text-gray-700">
                  Es un anticipo / pago adelantado
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Notas adicionales sobre el pago..."
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <Button
                onClick={processPayment}
                disabled={processing || !paymentData.amount}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {processing ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                    Registrar Pago
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Pending Payments */}
      {selectedPatient && pendingPayments.length > 0 && (
        <Card className="p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Pagos Pendientes de {selectedPatient.first_name}
          </h4>
          
          <div className="space-y-3">
            {pendingPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{payment.concept}</div>
                  <div className="text-sm text-gray-600">Vencimiento: {payment.dueDate}</div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="font-semibold text-orange-600">${payment.amount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{payment.type}</div>
                  </div>
                  <Button
                    onClick={() => payPendingAmount(payment)}
                    disabled={processing}
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Pagar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Service Assignment Modal */}
      {showServiceAssignment && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <PatientServiceAssignment
                patientId={selectedPatient.id}
                patientName={`${selectedPatient.first_name} ${selectedPatient.paternal_last_name}`}
                onClose={() => setShowServiceAssignment(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}