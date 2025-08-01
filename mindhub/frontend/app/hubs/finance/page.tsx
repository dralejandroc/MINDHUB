'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import FinanceDashboard from '@/components/finance/FinanceDashboard';
import IncomeTracker from '@/components/finance/IncomeTracker';
import FinancialReports from '@/components/finance/FinancialReports';
import CashRegisterCuts from '@/components/finance/CashRegisterCuts';
import FinanceConfiguration from '@/components/finance/FinanceConfiguration';
import { 
  CurrencyDollarIcon, 
  PlusIcon, 
  BanknotesIcon, 
  ChartBarIcon, 
  Cog6ToothIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

type FinanceView = 'dashboard' | 'income' | 'reports' | 'cash-register' | 'config';

export default function FinancePage() {
  const [currentView, setCurrentView] = useState<FinanceView>('dashboard');

  const handleNewIncome = () => {
    console.log('New income');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  // Render specific views
  if (currentView === 'income') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Finance - Registro de Ingresos"
          description="Gestiona y registra todos los ingresos de la clínica"
          icon={BanknotesIcon}
          iconColor="text-secondary-600"
          actions={[
            <Button key="back" onClick={handleBackToDashboard} variant="outline" size="sm">
              Volver al Dashboard
            </Button>,
            <Button key="new" onClick={handleNewIncome} variant="secondary" size="sm">
              <PlusIcon className="h-3 w-3 mr-1" />
              Nuevo Ingreso
            </Button>
          ]}
        />
        <IncomeTracker />
      </div>
    );
  }

  if (currentView === 'reports') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Finance - Reportes Financieros"
          description="Análisis detallado de ingresos y rendimiento financiero"
          icon={ChartBarIcon}
          iconColor="text-secondary-600"
          actions={[
            <Button key="back" onClick={handleBackToDashboard} variant="outline" size="sm">
              Volver al Dashboard
            </Button>
          ]}
        />
        <FinancialReports />
      </div>
    );
  }

  if (currentView === 'cash-register') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Finance - Cortes de Caja"
          description="Gestiona los cortes diarios y arqueos de caja"
          icon={ClipboardDocumentListIcon}
          iconColor="text-secondary-600"
          actions={[
            <Button key="back" onClick={handleBackToDashboard} variant="outline" size="sm">
              Volver al Dashboard
            </Button>
          ]}
        />
        <CashRegisterCuts />
      </div>
    );
  }

  if (currentView === 'config') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Finance - Configuración"
          description="Configura servicios, precios y descuentos"
          icon={Cog6ToothIcon}
          iconColor="text-secondary-600"
          actions={[
            <Button key="back" onClick={handleBackToDashboard} variant="outline" size="sm">
              Volver al Dashboard
            </Button>
          ]}
        />
        <FinanceConfiguration />
      </div>
    );
  }

  // Dashboard view
  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance - Gestión Financiera"
        description="Control integral de ingresos, gastos y rendimiento financiero"
        icon={CurrencyDollarIcon}
        iconColor="text-secondary-600"
        actions={[
          <Button
            key="new-income"
            onClick={handleNewIncome}
            variant="secondary"
            size="sm"
          >
            <PlusIcon className="h-3 w-3 mr-1" />
            Nuevo Ingreso
          </Button>
        ]}
      />
      
      {/* Main Finance Dashboard */}
      <FinanceDashboard />
      
      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          className="bg-white rounded-2xl shadow-lg border border-secondary-100 p-4 hover-lift transition-all duration-300 cursor-pointer relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-secondary"
          onClick={() => setCurrentView('income')}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-dark-green">Registro de Ingresos</h3>
            <BanknotesIcon className="h-5 w-5 text-secondary-600" />
          </div>
          <p className="text-gray-600 text-xs mb-3">
            Registra pagos de consultas, terapias y servicios adicionales
          </p>
          <Button variant="outline" size="sm" className="w-full border-secondary-200 text-secondary-600 hover:bg-secondary-50">
            Gestionar Ingresos
          </Button>
        </div>

        <div 
          className="bg-white rounded-2xl shadow-lg border border-secondary-100 p-4 hover-lift transition-all duration-300 cursor-pointer relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-secondary"
          onClick={() => setCurrentView('reports')}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-dark-green">Reportes</h3>
            <ChartBarIcon className="h-5 w-5 text-secondary-600" />
          </div>
          <p className="text-gray-600 text-xs mb-3">
            Análisis detallado de ingresos y rendimiento por período
          </p>
          <Button variant="outline" size="sm" className="w-full border-primary-200 text-primary-600 hover:bg-primary-50">
            Ver Reportes
          </Button>
        </div>

        <div 
          className="bg-white rounded-2xl shadow-lg border border-secondary-100 p-4 hover-lift transition-all duration-300 cursor-pointer relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-secondary"
          onClick={() => setCurrentView('cash-register')}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-dark-green">Cortes de Caja</h3>
            <ClipboardDocumentListIcon className="h-5 w-5 text-secondary-600" />
          </div>
          <p className="text-gray-600 text-xs mb-3">
            Realiza cortes diarios y arqueos de caja para control financiero
          </p>
          <Button variant="outline" size="sm" className="w-full border-orange-200 text-orange-600 hover:bg-orange-50">
            Gestionar Cortes
          </Button>
        </div>

        <div 
          className="bg-white rounded-2xl shadow-lg border border-secondary-100 p-4 hover-lift transition-all duration-300 cursor-pointer relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-secondary"
          onClick={() => setCurrentView('config')}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-dark-green">Configuración</h3>
            <Cog6ToothIcon className="h-5 w-5 text-secondary-600" />
          </div>
          <p className="text-gray-600 text-xs mb-3">
            Configura servicios, precios, descuentos y métodos de pago
          </p>
          <Button variant="outline" size="sm" className="w-full border-purple-200 text-purple-600 hover:bg-purple-50">
            Configurar
          </Button>
        </div>
      </div>

      {/* Recent Transactions Preview */}
      <div className="bg-white rounded-2xl shadow-lg border border-secondary-100 p-4 hover-lift relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:border-gradient-secondary">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-dark-green">Transacciones Recientes</h3>
          <Button onClick={() => setCurrentView('income')} variant="outline" size="sm">
            Ver Todas
          </Button>
        </div>
        
        <div className="space-y-2">
          {/* Mock recent transactions */}
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <div className="flex items-center">
              <div className="w-8 h-8 gradient-secondary rounded-full flex items-center justify-center mr-3">
                <CurrencyDollarIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900 text-xs">Consulta General</div>
                <div className="text-xs text-gray-500">Ana López • Efectivo</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-secondary-600 text-sm">$1,200.00</div>
              <div className="text-xs text-gray-500">Hace 2 horas</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
            <div className="flex items-center">
              <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center mr-3">
                <CurrencyDollarIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900 text-xs">Terapia Psicológica</div>
                <div className="text-xs text-gray-500">Carlos Ruiz • Tarjeta</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-secondary-600 text-sm">$800.00</div>
              <div className="text-xs text-gray-500">Hace 4 horas</div>
            </div>
          </div>

          <div className="text-center py-3 text-gray-500">
            <CurrencyDollarIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs">¿Listo para registrar más ingresos?</p>
            <Button onClick={handleNewIncome} variant="secondary" size="sm" className="mt-2">
              Registrar Ingreso
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}