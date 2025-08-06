'use client';

import { useState, useEffect } from 'react';
import { 
  BanknotesIcon,
  CreditCardIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface IncomeData {
  id: string;
  amount: number;
  source: 'consultation' | 'advance' | 'therapy' | 'evaluation' | 'other';
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'transfer' | 'payment_gateway' | 'check';
  currency: string;
  description?: string;
  concept?: string;
  notes?: string;
  reference?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  receivedDate: string;
  createdAt: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    medicalRecordNumber: string;
  };
  consultation?: {
    id: string;
    consultationDate: string;
    reason: string;
  };
  professional?: {
    id: string;
    name: string;
    email: string;
  };
}

interface FinancialStats {
  summary: {
    totalAmount: number;
    totalTransactions: number;
    averageAmount: number;
    period: {
      from: string;
      to: string;
    };
  };
  breakdown: {
    bySource: Array<{ source: string; _sum: { amount: number }; _count: number }>;
    byPaymentMethod: Array<{ paymentMethod: string; _sum: { amount: number }; _count: number }>;
    byProfessional: Array<{ professionalId: string; _sum: { amount: number }; _count: number }>;
  };
  trends: {
    daily: Array<{ date: string; total: number; transactions: number }>;
  };
}

interface FinanceDashboardProps {
  selectedDate: Date;
  onNewIncome: () => void;
}

export default function FinanceDashboard({ selectedDate, onNewIncome }: FinanceDashboardProps) {
  const [incomes, setIncomes] = useState<IncomeData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<FinancialStats>({
    summary: {
      totalAmount: 0,
      totalTransactions: 0,
      averageAmount: 0,
      period: { from: '', to: '' }
    },
    breakdown: {
      bySource: [],
      byPaymentMethod: [],
      byProfessional: []
    },
    trends: { daily: [] }
  });

  useEffect(() => {
    loadFinancialData();
  }, [selectedPeriod, selectedDate]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      
      // Load recent income records
      const incomeResponse = await fetch('/api/finance/income?limit=50&status=confirmed');
      const incomeData = await incomeResponse.json();
      
      if (incomeData.success) {
        setIncomes(incomeData.data || []);
      }
      
      // Load financial statistics
      const statsResponse = await fetch(`/api/finance/stats?period=${selectedPeriod}`);
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
      setIncomes([]);
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

  const getSourceLabel = (source: string) => {
    const labels = {
      consultation: 'Consulta',
      advance: 'Anticipo',
      therapy: 'Terapia',
      evaluation: 'Evaluación',
      other: 'Otro'
    };
    return (labels as any)[source] || source;
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <BanknotesIcon className="h-4 w-4" />;
      case 'credit_card': return <CreditCardIcon className="h-4 w-4" />;
      case 'debit_card': return <DevicePhoneMobileIcon className="h-4 w-4" />;
      case 'transfer': return <CurrencyDollarIcon className="h-4 w-4" />;
      case 'payment_gateway': return <GlobeAltIcon className="h-4 w-4" />;
      case 'check': return <BanknotesIcon className="h-4 w-4" />;
      // Legacy support
      case 'card': return <CreditCardIcon className="h-4 w-4" />;
      default: return <CurrencyDollarIcon className="h-4 w-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      cash: 'Efectivo',
      credit_card: 'Tarjeta Crédito',
      debit_card: 'Tarjeta Débito',
      transfer: 'Transferencia',
      payment_gateway: 'Pasarela de Pago',
      check: 'Cheque',
      // Legacy support
      card: 'Tarjeta'
    };
    return (labels as any)[method] || method;
  };

  const getTodayIncome = () => {
    const today = new Date().toISOString().split('T')[0];
    return incomes
      .filter(income => income.receivedDate.startsWith(today))
      .reduce((sum, income) => sum + income.amount, 0);
  };

  const getIncomeBySource = () => {
    return stats.breakdown.bySource.reduce((acc, item) => {
      acc[item.source] = item._sum.amount || 0;
      return acc;
    }, {} as Record<string, number>);
  };

  const getIncomeByPaymentMethod = () => {
    return stats.breakdown.byPaymentMethod.reduce((acc, item) => {
      acc[item.paymentMethod] = item._sum.amount || 0;
      return acc;
    }, {} as Record<string, number>);
  };

  const periods = [
    { id: 'week', name: 'Semana', icon: CalendarIcon },
    { id: 'month', name: 'Mes', icon: CalendarIcon },
    { id: 'year', name: 'Año', icon: CalendarIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Financiero</h2>
          <p className="text-gray-600">Resumen de ingresos y métricas financieras</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={loadFinancialData} variant="outline" disabled={loading}>
            {loading ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <ArrowPathIcon className="h-4 w-4 mr-2" />
            )}
            Actualizar
          </Button>
          <Button onClick={onNewIncome} className="bg-green-600 hover:bg-green-700">
            <CurrencyDollarIcon className="h-4 w-4 mr-2" />
            Nuevo Ingreso
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex space-x-2">
        {periods.map((period) => (
          <button
            key={period.id}
            onClick={() => setSelectedPeriod(period.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPeriod === period.id
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <period.icon className="h-4 w-4 inline mr-2" />
            {period.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="md" />
          <span className="ml-3 text-gray-600">Cargando datos financieros...</span>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats.summary.totalAmount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.summary.totalTransactions} transacciones
                  </p>
                </div>
                <ArrowTrendingUpIcon className="h-8 w-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hoy</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(getTodayIncome())}
                  </p>
                  <p className="text-xs text-gray-500">
                    {incomes.filter(i => i.receivedDate.startsWith(new Date().toISOString().split('T')[0])).length} ingresos
                  </p>
                </div>
                <CalendarIcon className="h-8 w-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Promedio</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(stats.summary.averageAmount)}
                  </p>
                  <p className="text-xs text-gray-500">por transacción</p>
                </div>
                <ArrowTrendingUpIcon className="h-8 w-8 text-purple-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Métodos de Pago</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {Object.keys(getIncomeByPaymentMethod()).length}
                  </p>
                  <p className="text-xs text-gray-500">activos</p>
                </div>
                <CreditCardIcon className="h-8 w-8 text-orange-500" />
              </div>
            </Card>
          </div>

          {/* Charts and Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Income */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingresos Recientes</h3>
              {incomes.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {incomes.slice(0, 10).map((income) => (
                    <div key={income.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getPaymentMethodIcon(income.paymentMethod)}
                        <div>
                          <div className="font-medium text-gray-900">
                            {income.patient 
                              ? `${income.patient.firstName} ${income.patient.lastName}`
                              : income.description || 'Sin descripción'
                            }
                          </div>
                          <div className="text-sm text-gray-600">
                            {getSourceLabel(income.source)} • {getPaymentMethodLabel(income.paymentMethod)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(income.receivedDate).toLocaleDateString('es-MX')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          {formatCurrency(income.amount)}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded ${
                          income.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          income.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {income.status === 'confirmed' ? 'Confirmado' :
                           income.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CurrencyDollarIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No hay ingresos registrados</p>
                  <Button onClick={onNewIncome} className="mt-4">
                    Registrar Primer Ingreso
                  </Button>
                </div>
              )}
            </Card>

            {/* Income by Source */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingresos por Tipo</h3>
              <div className="space-y-3">
                {Object.entries(getIncomeBySource()).map(([source, amount]) => (
                  <div key={source} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">{getSourceLabel(source)}</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Métodos de Pago</h4>
                <div className="space-y-2">
                  {Object.entries(getIncomeByPaymentMethod()).map(([method, amount]) => (
                    <div key={method} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        {getPaymentMethodIcon(method)}
                        <span className="text-gray-600">{getPaymentMethodLabel(method)}</span>
                      </div>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}