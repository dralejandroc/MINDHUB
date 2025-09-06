'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentTextIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface FinancialData {
  period: string;
  totalIncome: number;
  consultations: number;
  advances: number;
  other: number;
  cash: number;
  card: number;
  transfer: number;
  check: number;
  transactions: number;
}

interface FinancialReportsProps {
  selectedDate: Date;
}

export default function FinancialReports({ selectedDate }: FinancialReportsProps) {
  const [reportData, setReportData] = useState<FinancialData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [loading, setLoading] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  // Load real financial data from Django API
  useEffect(() => {
    const loadFinancialReports = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/finance/django/api/stats/?period=${selectedPeriod}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to load financial reports');
        }
        
        const data = await response.json();
        
        if (data.success && data.data) {
          setReportData(data.data.periods || []);
        } else {
          // Fallback to basic structure if no data
          setReportData([]);
        }
      } catch (error) {
        console.error('Error loading financial reports:', error);
        // Fallback to empty data instead of mock data
        setReportData([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadFinancialReports();
  }, [selectedPeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatPercentage = (value: number, total: number) => {
    return ((value / total) * 100).toFixed(1) + '%';
  };

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const response = await fetch(`/api/finance/django/api/reports/pdf/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          period: selectedPeriod,
          reportType: 'financial',
          data: reportData
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF report');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-financiero-${selectedPeriod}-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error al exportar el reporte. Usando vista de impresión como alternativa.');
      // Fallback to print view
      window.print();
    } finally {
      setExportingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getCurrentPeriodData = () => {
    return reportData[reportData.length - 1] || {
      period: '',
      totalIncome: 0,
      consultations: 0,
      advances: 0,
      other: 0,
      cash: 0,
      card: 0,
      transfer: 0,
      check: 0,
      transactions: 0
    };
  };

  const getPreviousPeriodData = () => {
    return reportData[reportData.length - 2] || getCurrentPeriodData();
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const currentData = getCurrentPeriodData();
  const previousData = getPreviousPeriodData();
  const incomeGrowth = calculateGrowth(currentData.totalIncome, previousData.totalIncome);
  const transactionsGrowth = calculateGrowth(currentData.transactions, previousData.transactions);

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reportes Financieros</h2>
          <p className="text-gray-600 mt-1">Análisis detallado de ingresos y tendencias</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Selector de periodo */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as typeof selectedPeriod)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="week">Semanal</option>
            <option value="month">Mensual</option>
            <option value="quarter">Trimestral</option>
            <option value="year">Anual</option>
          </select>
          
          {/* Botones de acción */}
          <Button
            variant="outline"
            onClick={handlePrint}
            className="flex items-center space-x-2"
          >
            <PrinterIcon className="h-4 w-4" />
            <span>Imprimir</span>
          </Button>
          
          <Button
            onClick={handleExportPDF}
            disabled={exportingPDF}
            className="bg-green-600 hover:bg-green-700 flex items-center space-x-2"
          >
            {exportingPDF ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Exportando...</span>
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>Exportar PDF</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Resumen ejecutivo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BanknotesIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentData.totalIncome)}</p>
              <div className="flex items-center mt-1">
                {incomeGrowth >= 0 ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${
                  incomeGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {incomeGrowth > 0 ? '+' : ''}{incomeGrowth.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Transacciones</p>
              <p className="text-2xl font-bold text-gray-900">{currentData.transactions}</p>
              <div className="flex items-center mt-1">
                {transactionsGrowth >= 0 ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${
                  transactionsGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transactionsGrowth > 0 ? '+' : ''}{transactionsGrowth.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CreditCardIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ticket Promedio</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(currentData.totalIncome / (currentData.transactions || 1))}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Periodo Actual</p>
              <p className="text-lg font-bold text-gray-900">{currentData.period}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por fuente */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Fuente</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-3" />
                <span className="text-gray-700">Consultas</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatCurrency(currentData.consultations)}</p>
                <p className="text-sm text-gray-600">
                  {formatPercentage(currentData.consultations, currentData.totalIncome)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full mr-3" />
                <span className="text-gray-700">Anticipos</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatCurrency(currentData.advances)}</p>
                <p className="text-sm text-gray-600">
                  {formatPercentage(currentData.advances, currentData.totalIncome)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-purple-500 rounded-full mr-3" />
                <span className="text-gray-700">Otros</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatCurrency(currentData.other)}</p>
                <p className="text-sm text-gray-600">
                  {formatPercentage(currentData.other, currentData.totalIncome)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Distribución por método de pago */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Métodos de Pago</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BanknotesIcon className="h-4 w-4 text-gray-500 mr-3" />
                <span className="text-gray-700">Efectivo</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatCurrency(currentData.cash)}</p>
                <p className="text-sm text-gray-600">
                  {formatPercentage(currentData.cash, currentData.totalIncome)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CreditCardIcon className="h-4 w-4 text-gray-500 mr-3" />
                <span className="text-gray-700">Tarjeta</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatCurrency(currentData.card)}</p>
                <p className="text-sm text-gray-600">
                  {formatPercentage(currentData.card, currentData.totalIncome)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BanknotesIcon className="h-4 w-4 text-gray-500 mr-3" />
                <span className="text-gray-700">Transferencia</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatCurrency(currentData.transfer)}</p>
                <p className="text-sm text-gray-600">
                  {formatPercentage(currentData.transfer, currentData.totalIncome)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DocumentTextIcon className="h-4 w-4 text-gray-500 mr-3" />
                <span className="text-gray-700">Cheque</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatCurrency(currentData.check)}</p>
                <p className="text-sm text-gray-600">
                  {formatPercentage(currentData.check, currentData.totalIncome)}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Histórico de ingresos */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendencia Histórica</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Periodo</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Ingresos Totales</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Consultas</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Anticipos</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Otros</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Transacciones</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((data, index) => (
                <tr key={index} className={`border-b border-gray-100 hover:bg-gray-50 ${
                  index === reportData.length - 1 ? 'bg-green-50' : ''
                }`}>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-900 font-medium">{data.period}</span>
                    {index === reportData.length - 1 && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Actual
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(data.totalIncome)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm text-gray-600">{formatCurrency(data.consultations)}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm text-gray-600">{formatCurrency(data.advances)}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm text-gray-600">{formatCurrency(data.other)}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm text-gray-600">{data.transactions}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Notas del reporte */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Notas del Reporte</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• Los datos mostrados corresponden al periodo seleccionado: {selectedPeriod}</p>
          <p>• Las tendencias se calculan comparando con el periodo anterior</p>
          <p>• El ticket promedio se calcula dividiendo ingresos totales entre número de transacciones</p>
          <p>• Los reportes pueden exportarse en formato PDF para archivo o impresión</p>
        </div>
      </Card>
    </div>
  );
}