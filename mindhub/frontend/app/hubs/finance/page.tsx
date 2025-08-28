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
        <IncomeTracker 
          selectedDate={new Date()} 
          onNewIncome={() => {}} 
        />
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
        <FinancialReports selectedDate={new Date()} />
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
        title="Finance"
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
      <FinanceDashboard 
        selectedDate={new Date()} 
        onNewIncome={() => {}} 
      />
      
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
          {/* No mock data - real transactions only */}
          <div className="text-center py-6 text-gray-500">
            <CurrencyDollarIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700 mb-1">No hay transacciones recientes</p>
            <p className="text-xs text-gray-500 mb-3">Registra tu primer ingreso para comenzar</p>
            <Button onClick={() => setCurrentView('income')} variant="secondary" size="sm" className="mt-2">
              Registrar Primer Ingreso
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}