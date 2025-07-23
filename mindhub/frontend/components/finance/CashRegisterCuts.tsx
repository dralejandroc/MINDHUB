'use client';

import { useState, useEffect } from 'react';
import { 
  CalculatorIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface CashCut {
  id: string;
  cutNumber: number;
  cutType: 'daily' | 'shift' | 'manual';
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalDiscounts: number;
  totalCourtesies: number;
  netIncome: number;
  status: 'open' | 'closed' | 'reconciled';
  notes?: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  closer?: {
    id: string;
    name: string;
    email: string;
  };
  closedAt?: string;
  paymentBreakdown: Array<{
    paymentMethod: string;
    amount: number;
    transactionCount: number;
  }>;
  professionalBreakdown: Array<{
    professional: {
      id: string;
      name: string;
      email: string;
    };
    totalIncome: number;
    professionalAmount: number;
    clinicAmount: number;
    commissionRate: number;
    serviceCount: number;
  }>;
}

interface FinancialSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  totalIncome: number;
  totalDiscounts: number;
  totalCourtesies: number;
  netIncome: number;
  transactionCount: number;
  paymentMethodBreakdown: Record<string, {
    amount: number;
    count: number;
    percentage: number;
  }>;
  professionalBreakdown: Record<string, {
    professional: {
      id: string;
      name: string;
    };
    totalIncome: number;
    serviceCount: number;
    professionalAmount: number;
    clinicAmount: number;
  }>;
  discountAnalysis: {
    totalDiscountPercentage: number;
    courtesyCount: number;
    discountedTransactions: number;
  };
}

export default function CashRegisterCuts() {
  const [cuts, setCuts] = useState<CashCut[]>([]);
  const [selectedCut, setSelectedCut] = useState<CashCut | null>(null);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNewCutForm, setShowNewCutForm] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Form states
  const [newCutData, setNewCutData] = useState({
    startDate: '',
    endDate: '',
    cutType: 'manual' as 'daily' | 'shift' | 'manual',
    notes: ''
  });

  // Summary filters
  const [summaryFilters, setSummaryFilters] = useState({
    startDate: '',
    endDate: '',
    professionalId: ''
  });

  useEffect(() => {
    loadCashCuts();
  }, []);

  const loadCashCuts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/finance/cash-register/cuts');
      const data = await response.json();
      
      if (data.success) {
        setCuts(data.data);
      }
    } catch (error) {
      console.error('Error loading cash cuts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCashCut = async () => {
    if (!newCutData.startDate || !newCutData.endDate) {
      alert('Por favor completa las fechas');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/finance/cash-register/cuts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCutData),
      });

      const data = await response.json();
      
      if (data.success) {
        await loadCashCuts();
        setShowNewCutForm(false);
        setNewCutData({
          startDate: '',
          endDate: '',
          cutType: 'manual',
          notes: ''
        });
        alert('Corte de caja creado exitosamente');
      } else {
        alert('Error al crear corte de caja: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating cash cut:', error);
      alert('Error al crear corte de caja');
    } finally {
      setLoading(false);
    }
  };

  const generateDailyCut = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/finance/cash-register/cuts/daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (data.success) {
        await loadCashCuts();
        alert('Corte diario generado exitosamente');
      } else {
        alert('Error al generar corte diario: ' + data.error);
      }
    } catch (error) {
      console.error('Error generating daily cut:', error);
      alert('Error al generar corte diario');
    } finally {
      setLoading(false);
    }
  };

  const viewCutDetails = async (cutId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/finance/cash-register/cuts/${cutId}`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedCut(data.data);
      }
    } catch (error) {
      console.error('Error loading cut details:', error);
    } finally {
      setLoading(false);
    }
  };

  const closeCashCut = async (cutId: string, notes?: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/finance/cash-register/cuts/${cutId}/close`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });

      const data = await response.json();
      
      if (data.success) {
        await loadCashCuts();
        setSelectedCut(data.data);
        alert('Corte de caja cerrado exitosamente');
      } else {
        alert('Error al cerrar corte: ' + data.error);
      }
    } catch (error) {
      console.error('Error closing cash cut:', error);
      alert('Error al cerrar corte');
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    if (!summaryFilters.startDate || !summaryFilters.endDate) {
      alert('Por favor selecciona el período');
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams(summaryFilters);
      const response = await fetch(`/api/finance/cash-register/summary?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setSummary(data.data);
        setShowSummaryModal(true);
      } else {
        alert('Error al generar resumen: ' + data.error);
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Error al generar resumen');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <BanknotesIcon className="h-4 w-4" />;
      case 'credit_card': return <CreditCardIcon className="h-4 w-4" />;
      case 'debit_card': return <DevicePhoneMobileIcon className="h-4 w-4" />;
      case 'transfer': return <CurrencyDollarIcon className="h-4 w-4" />;
      case 'payment_gateway': return <GlobeAltIcon className="h-4 w-4" />;
      default: return <CurrencyDollarIcon className="h-4 w-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      cash: 'Efectivo',
      credit_card: 'Tarjeta Crédito',
      debit_card: 'Tarjeta Débito', 
      transfer: 'Transferencia',
      payment_gateway: 'Pasarela',
      check: 'Cheque'
    };
    return labels[method] || method;
  };

  const getCutTypeLabel = (type: string) => {
    const labels = {
      daily: 'Diario',
      shift: 'Por Turno',
      manual: 'Manual'
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      closed: 'bg-green-100 text-green-800',
      reconciled: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cortes de Caja</h2>
          <p className="text-gray-600">Gestión de cortes y reportes financieros</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setShowSummaryModal(true)}
            variant="outline"
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            Resumen
          </Button>
          <Button
            onClick={generateDailyCut}
            variant="outline"
            disabled={loading}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Corte Diario
          </Button>
          <Button
            onClick={() => setShowNewCutForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nuevo Corte
          </Button>
        </div>
      </div>

      {/* Cash Cuts List */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cortes de Caja</h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
            <span className="ml-3">Cargando cortes...</span>
          </div>
        ) : cuts.length > 0 ? (
          <div className="space-y-4">
            {cuts.map((cut) => (
              <div key={cut.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">Corte #{cut.cutNumber}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(cut.status)}`}>
                        {cut.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {getCutTypeLabel(cut.cutType)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Período:</span>
                        <div className="font-medium">
                          {new Date(cut.startDate).toLocaleDateString('es-MX')} - {new Date(cut.endDate).toLocaleDateString('es-MX')}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Total:</span>
                        <div className="font-medium text-green-600">{formatCurrency(cut.totalIncome)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Descuentos:</span>
                        <div className="font-medium text-orange-600">{formatCurrency(cut.totalDiscounts)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Cortesías:</span>
                        <div className="font-medium text-red-600">{formatCurrency(cut.totalCourtesies)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewCutDetails(cut.id)}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    {cut.status === 'open' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => closeCashCut(cut.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CalculatorIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No hay cortes de caja registrados</p>
            <Button onClick={() => setShowNewCutForm(true)} className="mt-4">
              Crear Primer Corte
            </Button>
          </div>
        )}
      </Card>

      {/* New Cut Form Modal */}
      {showNewCutForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Nuevo Corte de Caja</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewCutForm(false)}
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Corte
                </label>
                <select
                  value={newCutData.cutType}
                  onChange={(e) => setNewCutData(prev => ({ ...prev, cutType: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="manual">Manual</option>
                  <option value="shift">Por Turno</option>
                  <option value="daily">Diario</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio
                </label>
                <Input
                  type="datetime-local"
                  value={newCutData.startDate}
                  onChange={(e) => setNewCutData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Fin
                </label>
                <Input
                  type="datetime-local"
                  value={newCutData.endDate}
                  onChange={(e) => setNewCutData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Notas sobre el corte..."
                  value={newCutData.notes}
                  onChange={(e) => setNewCutData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowNewCutForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={createCashCut}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creando...
                    </>
                  ) : (
                    'Crear Corte'
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Cut Details Modal */}
      {selectedCut && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Corte #{selectedCut.cutNumber}
                  </h3>
                  <p className="text-gray-600">
                    {new Date(selectedCut.startDate).toLocaleString('es-MX')} - {new Date(selectedCut.endDate).toLocaleString('es-MX')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedCut(null)}
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="p-4 text-center">
                  <CurrencyDollarIcon className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(selectedCut.totalIncome)}</div>
                  <div className="text-sm text-gray-600">Total Ingresos</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{formatCurrency(selectedCut.totalDiscounts)}</div>
                  <div className="text-sm text-gray-600">Descuentos</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(selectedCut.totalCourtesies)}</div>
                  <div className="text-sm text-gray-600">Cortesías</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(selectedCut.netIncome)}</div>
                  <div className="text-sm text-gray-600">Ingreso Neto</div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Methods Breakdown */}
                <Card className="p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Desglose por Método de Pago</h4>
                  <div className="space-y-3">
                    {selectedCut.paymentBreakdown.map((payment) => (
                      <div key={payment.paymentMethod} className="flex items-center justify-between">
                        <div className="flex items-center">
                          {getPaymentMethodIcon(payment.paymentMethod)}
                          <span className="ml-2 text-gray-700">
                            {getPaymentMethodLabel(payment.paymentMethod)}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(payment.amount)}</div>
                          <div className="text-xs text-gray-500">{payment.transactionCount} transacciones</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Professional Breakdown */}
                <Card className="p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Desglose por Profesional</h4>
                  <div className="space-y-3">
                    {selectedCut.professionalBreakdown.map((prof) => (
                      <div key={prof.professional.id} className="border-b border-gray-200 pb-3 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{prof.professional.name}</span>
                          <span className="text-sm text-gray-500">{prof.serviceCount} servicios</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500">Total</div>
                            <div className="font-medium">{formatCurrency(prof.totalIncome)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Profesional ({prof.commissionRate}%)</div>
                            <div className="font-medium text-green-600">{formatCurrency(prof.professionalAmount)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Clínica</div>
                            <div className="font-medium text-blue-600">{formatCurrency(prof.clinicAmount)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {selectedCut.status === 'open' && (
                <div className="mt-6 text-center">
                  <Button
                    onClick={() => closeCashCut(selectedCut.id)}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Cerrando...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Cerrar Corte
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Resumen Financiero</h3>
                <Button
                  variant="outline"
                  onClick={() => setShowSummaryModal(false)}
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>

              {!summary ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha Inicio
                      </label>
                      <Input
                        type="date"
                        value={summaryFilters.startDate}
                        onChange={(e) => setSummaryFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha Fin
                      </label>
                      <Input
                        type="date"
                        value={summaryFilters.endDate}
                        onChange={(e) => setSummaryFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={generateSummary}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Generando...
                        </>
                      ) : (
                        'Generar Resumen'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalIncome)}</div>
                      <div className="text-sm text-gray-600">Total Ingresos</div>
                      <div className="text-xs text-gray-500">{summary.transactionCount} transacciones</div>
                    </Card>
                    <Card className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">{formatCurrency(summary.totalDiscounts)}</div>
                      <div className="text-sm text-gray-600">Descuentos</div>
                      <div className="text-xs text-gray-500">{summary.discountAnalysis.discountedTransactions} con descuento</div>
                    </Card>
                    <Card className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalCourtesies)}</div>
                      <div className="text-sm text-gray-600">Cortesías</div>
                      <div className="text-xs text-gray-500">{summary.discountAnalysis.courtesyCount} cortesías</div>
                    </Card>
                    <Card className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{formatCurrency(summary.netIncome)}</div>
                      <div className="text-sm text-gray-600">Ingreso Neto</div>
                      <div className="text-xs text-gray-500">{summary.discountAnalysis.totalDiscountPercentage.toFixed(1)}% descuento</div>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Payment Methods */}
                    <Card className="p-4">
                      <h4 className="font-medium text-gray-900 mb-4">Por Método de Pago</h4>
                      <div className="space-y-3">
                        {Object.entries(summary.paymentMethodBreakdown).map(([method, data]) => (
                          <div key={method} className="flex items-center justify-between">
                            <div className="flex items-center">
                              {getPaymentMethodIcon(method)}
                              <span className="ml-2">{getPaymentMethodLabel(method)}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(data.amount)}</div>
                              <div className="text-xs text-gray-500">{data.percentage.toFixed(1)}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {/* Professionals */}
                    <Card className="p-4">
                      <h4 className="font-medium text-gray-900 mb-4">Por Profesional</h4>
                      <div className="space-y-3">
                        {Object.entries(summary.professionalBreakdown).map(([profId, data]) => (
                          <div key={profId} className="border-b border-gray-200 pb-3 last:border-b-0">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{data.professional.name}</span>
                              <span className="text-sm text-gray-500">{data.serviceCount} servicios</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <div className="text-gray-500">Total</div>
                                <div className="font-medium">{formatCurrency(data.totalIncome)}</div>
                              </div>
                              <div>
                                <div className="text-gray-500">Profesional</div>
                                <div className="font-medium text-green-600">{formatCurrency(data.professionalAmount)}</div>
                              </div>
                              <div>
                                <div className="text-gray-500">Clínica</div>
                                <div className="font-medium text-blue-600">{formatCurrency(data.clinicAmount)}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>

                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setSummary(null)}
                    >
                      Nuevo Resumen
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}