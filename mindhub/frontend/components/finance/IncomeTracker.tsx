'use client';

import { useState, useEffect } from 'react';
import { 
  ChartBarIcon,
  FunnelIcon,
  CalendarDaysIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  BanknotesIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface IncomeData {
  id: string;
  date: string;
  amount: number;
  source: 'consultation' | 'advance' | 'other';
  paymentMethod: 'cash' | 'card' | 'transfer' | 'check';
  patientName?: string;
  description: string;
  professionalId?: string;
  professionalName?: string;
}

interface IncomeTrackerProps {
  selectedDate: Date;
  onNewIncome: () => void;
}

export default function IncomeTracker({ selectedDate, onNewIncome }: IncomeTrackerProps) {
  const [incomes, setIncomes] = useState<IncomeData[]>([]);
  const [filteredIncomes, setFilteredIncomes] = useState<IncomeData[]>([]);
  const [filters, setFilters] = useState({
    dateRange: 'month',
    source: 'all',
    paymentMethod: 'all',
    professional: 'all'
  });
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'source'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Mock data ampliada
  useEffect(() => {
    const mockIncomes: IncomeData[] = [
      {
        id: '1',
        date: '2025-01-21',
        amount: 800,
        source: 'consultation',
        paymentMethod: 'cash',
        patientName: 'María González',
        description: 'Consulta inicial - Psicología',
        professionalId: 'prof1',
        professionalName: 'Dr. Juan Pérez'
      },
      {
        id: '2',
        date: '2025-01-21',
        amount: 1200,
        source: 'advance',
        paymentMethod: 'transfer',
        patientName: 'Carlos Rodríguez',
        description: 'Anticipo para tratamiento',
        professionalId: 'prof1',
        professionalName: 'Dr. Juan Pérez'
      },
      {
        id: '3',
        date: '2025-01-21',
        amount: 600,
        source: 'consultation',
        paymentMethod: 'card',
        patientName: 'Ana Martínez',
        description: 'Seguimiento - Psiquiatría',
        professionalId: 'prof2',
        professionalName: 'Dra. María López'
      },
      {
        id: '4',
        date: '2025-01-20',
        amount: 1500,
        source: 'other',
        paymentMethod: 'transfer',
        description: 'Consultoría externa - Capacitación',
        professionalId: 'prof1',
        professionalName: 'Dr. Juan Pérez'
      },
      {
        id: '5',
        date: '2025-01-19',
        amount: 900,
        source: 'consultation',
        paymentMethod: 'cash',
        patientName: 'Pedro López',
        description: 'Evaluación psicológica',
        professionalId: 'prof1',
        professionalName: 'Dr. Juan Pérez'
      },
      {
        id: '6',
        date: '2025-01-18',
        amount: 750,
        source: 'consultation',
        paymentMethod: 'card',
        patientName: 'Sofía García',
        description: 'Terapia cognitivo-conductual',
        professionalId: 'prof2',
        professionalName: 'Dra. María López'
      },
      {
        id: '7',
        date: '2025-01-17',
        amount: 500,
        source: 'advance',
        paymentMethod: 'cash',
        patientName: 'Roberto Morales',
        description: 'Anticipo sesiones grupales',
        professionalId: 'prof1',
        professionalName: 'Dr. Juan Pérez'
      },
      {
        id: '8',
        date: '2025-01-16',
        amount: 2000,
        source: 'other',
        paymentMethod: 'transfer',
        description: 'Peritaje psicológico',
        professionalId: 'prof2',
        professionalName: 'Dra. María López'
      }
    ];
    setIncomes(mockIncomes);
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...incomes];

    // Filtro por rango de fechas
    const today = new Date();
    const filterDate = new Date(today);
    
    switch (filters.dateRange) {
      case 'today':
        filterDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter(income => 
          new Date(income.date).toDateString() === filterDate.toDateString()
        );
        break;
      case 'week':
        filterDate.setDate(today.getDate() - 7);
        filtered = filtered.filter(income => new Date(income.date) >= filterDate);
        break;
      case 'month':
        filterDate.setMonth(today.getMonth() - 1);
        filtered = filtered.filter(income => new Date(income.date) >= filterDate);
        break;
      case 'quarter':
        filterDate.setMonth(today.getMonth() - 3);
        filtered = filtered.filter(income => new Date(income.date) >= filterDate);
        break;
    }

    // Filtro por fuente
    if (filters.source !== 'all') {
      filtered = filtered.filter(income => income.source === filters.source);
    }

    // Filtro por método de pago
    if (filters.paymentMethod !== 'all') {
      filtered = filtered.filter(income => income.paymentMethod === filters.paymentMethod);
    }

    // Filtro por profesional
    if (filters.professional !== 'all') {
      filtered = filtered.filter(income => income.professionalId === filters.professional);
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'source':
          comparison = a.source.localeCompare(b.source);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredIncomes(filtered);
  }, [incomes, filters, sortBy, sortOrder]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'consultation': return 'Consulta';
      case 'advance': return 'Anticipo';
      case 'other': return 'Otro';
      default: return source;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Efectivo';
      case 'card': return 'Tarjeta';
      case 'transfer': return 'Transferencia';
      case 'check': return 'Cheque';
      default: return method;
    }
  };

  const handleSort = (field: 'date' | 'amount' | 'source') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const totalIncome = filteredIncomes.reduce((sum, income) => sum + income.amount, 0);
  const averageIncome = filteredIncomes.length > 0 ? totalIncome / filteredIncomes.length : 0;

  // Estadísticas por profesional
  const statsByProfessional = filteredIncomes.reduce((acc, income) => {
    if (!acc[income.professionalId || 'unknown']) {
      acc[income.professionalId || 'unknown'] = {
        name: income.professionalName || 'Sin asignar',
        total: 0,
        count: 0
      };
    }
    acc[income.professionalId || 'unknown'].total += income.amount;
    acc[income.professionalId || 'unknown'].count += 1;
    return acc;
  }, {} as Record<string, { name: string; total: number; count: number }>);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filtros
          </h3>
          <Button
            onClick={onNewIncome}
            className="bg-green-600 hover:bg-green-700 flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Nuevo Ingreso</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Rango de fechas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Periodo
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="today">Hoy</option>
              <option value="week">Última semana</option>
              <option value="month">Último mes</option>
              <option value="quarter">Último trimestre</option>
            </select>
          </div>

          {/* Fuente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fuente
            </label>
            <select
              value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Todas</option>
              <option value="consultation">Consultas</option>
              <option value="advance">Anticipos</option>
              <option value="other">Otros</option>
            </select>
          </div>

          {/* Método de pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Pago
            </label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Todos</option>
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
              <option value="check">Cheque</option>
            </select>
          </div>

          {/* Profesional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profesional
            </label>
            <select
              value={filters.professional}
              onChange={(e) => setFilters({ ...filters, professional: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">Todos</option>
              <option value="prof1">Dr. Juan Pérez</option>
              <option value="prof2">Dra. María López</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BanknotesIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalIncome)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Promedio</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(averageIncome)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Transacciones</p>
              <p className="text-2xl font-bold text-gray-900">{filteredIncomes.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Estadísticas por profesional */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Por Profesional</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(statsByProfessional).map(([profId, stats]) => (
            <div key={profId} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{stats.name}</h4>
                  <p className="text-sm text-gray-600">{stats.count} transacciones</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{formatCurrency(stats.total)}</p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(stats.total / stats.count)} promedio
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Lista de ingresos */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Historial de Ingresos ({filteredIncomes.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th 
                  onClick={() => handleSort('date')}
                  className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                >
                  <div className="flex items-center">
                    Fecha
                    {sortBy === 'date' && (
                      sortOrder === 'asc' ? 
                      <ArrowUpIcon className="h-4 w-4 ml-1" /> : 
                      <ArrowDownIcon className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('source')}
                  className="text-left py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                >
                  <div className="flex items-center">
                    Fuente
                    {sortBy === 'source' && (
                      sortOrder === 'asc' ? 
                      <ArrowUpIcon className="h-4 w-4 ml-1" /> : 
                      <ArrowDownIcon className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Descripción</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Paciente</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Método</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Profesional</th>
                <th 
                  onClick={() => handleSort('amount')}
                  className="text-right py-3 px-4 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                >
                  <div className="flex items-center justify-end">
                    Monto
                    {sortBy === 'amount' && (
                      sortOrder === 'asc' ? 
                      <ArrowUpIcon className="h-4 w-4 ml-1" /> : 
                      <ArrowDownIcon className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredIncomes.map((income) => (
                <tr key={income.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-900">
                      {new Date(income.date).toLocaleDateString('es-MX')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      income.source === 'consultation' ? 'bg-green-100 text-green-800' :
                      income.source === 'advance' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {getSourceLabel(income.source)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-900">{income.description}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-900">
                      {income.patientName || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">
                      {getPaymentMethodLabel(income.paymentMethod)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">
                      {income.professionalName || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(income.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredIncomes.length === 0 && (
            <div className="text-center py-8">
              <BanknotesIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron ingresos con los filtros seleccionados</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}