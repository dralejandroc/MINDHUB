/**
 * useFinance Hook
 * React hook for finance operations with Clean Architecture
 */

import { useState, useEffect, useCallback } from 'react';
import { Income } from '../entities/Income';
import { Service } from '../entities/Service';
import { CashRegister } from '../entities/CashRegister';
import { FinancePresenter, IncomeListItemViewModel, ServiceListItemViewModel, CashRegisterViewModel, FinancialSummaryViewModel } from '../presenters/FinancePresenter';
import { DjangoIncomeAdapter, DjangoServiceAdapter, DjangoCashRegisterAdapter } from '../adapters/DjangoFinanceAdapter';
import { IncomeFilters, IncomeStatistics } from '../repositories/IncomeRepository';
import { ServiceFilters, ServiceStatistics } from '../repositories/ServiceRepository';
import { CashRegisterFilters } from '../repositories/CashRegisterRepository';

interface UseFinanceState {
  // Income state
  incomes: IncomeListItemViewModel[];
  incomeStatistics: FinancialSummaryViewModel | null;
  
  // Service state
  services: ServiceListItemViewModel[];
  serviceCategories: string[];
  serviceStatistics: any | null;
  
  // Cash register state
  cashRegister: CashRegisterViewModel | null;
  registerHistory: CashRegisterViewModel[];
  
  // Loading states
  loading: boolean;
  incomeLoading: boolean;
  serviceLoading: boolean;
  registerLoading: boolean;
  
  // Error state
  error: string | null;
}

interface UseFinanceActions {
  // Income operations
  createIncome: (incomeData: {
    patientId: string;
    serviceId: string;
    professionalId: string;
    amount: number;
    paymentMethod: string;
    concept: string;
    notes?: string;
  }) => Promise<void>;
  loadIncomes: (filters?: IncomeFilters) => Promise<void>;
  updateIncome: (income: Income) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  processRefund: (incomeId: string, amount: number, reason: string) => Promise<void>;
  loadIncomeStatistics: (filters?: IncomeFilters) => Promise<void>;
  
  // Service operations
  createService: (serviceData: {
    name: string;
    description: string;
    price: number;
    duration: number;
    category: string;
    professionalId: string;
  }) => Promise<void>;
  loadServices: (filters?: ServiceFilters) => Promise<void>;
  updateService: (service: Service) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  toggleServiceStatus: (id: string) => Promise<void>;
  loadServiceStatistics: (filters?: ServiceFilters) => Promise<void>;
  
  // Cash register operations
  openCashRegister: (initialAmount: number, operatorId: string) => Promise<void>;
  closeCashRegister: (finalAmount: number, actualCash: number, notes?: string) => Promise<void>;
  getCurrentSession: () => Promise<void>;
  addIncomeToRegister: (amount: number, method: string, reference?: string) => Promise<void>;
  addExpenseToRegister: (amount: number, concept: string, reference?: string) => Promise<void>;
  loadRegisterHistory: (filters?: CashRegisterFilters) => Promise<void>;
  
  // Utility actions
  refreshAll: () => Promise<void>;
  clearError: () => void;
}

export interface UseFinanceResult {
  state: UseFinanceState;
  actions: UseFinanceActions;
}

export function useFinance(
  clinicId?: string,
  workspaceId?: string,
  professionalId?: string
): UseFinanceResult {
  
  // State
  const [state, setState] = useState<UseFinanceState>({
    incomes: [],
    incomeStatistics: null,
    services: [],
    serviceCategories: [],
    serviceStatistics: null,
    cashRegister: null,
    registerHistory: [],
    loading: false,
    incomeLoading: false,
    serviceLoading: false,
    registerLoading: false,
    error: null,
  });

  // Dependencies
  const incomeAdapter = new DjangoIncomeAdapter();
  const serviceAdapter = new DjangoServiceAdapter();
  const cashRegisterAdapter = new DjangoCashRegisterAdapter();
  const presenter = new FinancePresenter();

  // Income operations
  const createIncome = useCallback(async (incomeData: {
    patientId: string;
    serviceId: string;
    professionalId: string;
    amount: number;
    paymentMethod: string;
    concept: string;
    notes?: string;
  }) => {
    setState(prev => ({ ...prev, incomeLoading: true, error: null }));
    
    try {
      const income = new Income(
        '', // ID will be assigned by server
        incomeData.patientId,
        incomeData.serviceId,
        incomeData.professionalId,
        incomeData.amount,
        incomeData.paymentMethod,
        incomeData.concept,
        new Date(),
        'pending',
        incomeData.notes,
        clinicId,
        workspaceId
      );

      const createdIncome = await incomeAdapter.create(income);
      
      // Add to register if session is open
      if (state.cashRegister && state.cashRegister.status === 'open') {
        await addIncomeToRegister(incomeData.amount, incomeData.paymentMethod);
      }
      
      // Refresh incomes
      await loadIncomes();
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error creating income',
        incomeLoading: false,
      }));
      throw error;
    }
  }, [clinicId, workspaceId, state.cashRegister]);

  const loadIncomes = useCallback(async (filters?: IncomeFilters) => {
    setState(prev => ({ ...prev, incomeLoading: true, error: null }));
    
    try {
      const incomes = await incomeAdapter.findAll({
        ...filters,
        clinicId: clinicId || filters?.clinicId,
        workspaceId: workspaceId || filters?.workspaceId,
      });
      
      const presentedIncomes = presenter.presentIncomeList(incomes);
      
      setState(prev => ({
        ...prev,
        incomes: presentedIncomes,
        incomeLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error loading incomes',
        incomeLoading: false,
      }));
    }
  }, [clinicId, workspaceId]);

  const updateIncome = useCallback(async (income: Income) => {
    setState(prev => ({ ...prev, incomeLoading: true, error: null }));
    
    try {
      await incomeAdapter.update(income);
      await loadIncomes();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error updating income',
        incomeLoading: false,
      }));
      throw error;
    }
  }, []);

  const deleteIncome = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, incomeLoading: true, error: null }));
    
    try {
      await incomeAdapter.delete(id);
      await loadIncomes();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error deleting income',
        incomeLoading: false,
      }));
      throw error;
    }
  }, []);

  const processRefund = useCallback(async (incomeId: string, amount: number, reason: string) => {
    setState(prev => ({ ...prev, incomeLoading: true, error: null }));
    
    try {
      await incomeAdapter.processRefund(incomeId, amount, reason);
      await loadIncomes();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error processing refund',
        incomeLoading: false,
      }));
      throw error;
    }
  }, []);

  const loadIncomeStatistics = useCallback(async (filters?: IncomeFilters) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const statistics = await incomeAdapter.getStatistics({
        ...filters,
        clinicId: clinicId || filters?.clinicId,
        workspaceId: workspaceId || filters?.workspaceId,
      });
      
      const presentedStatistics = presenter.presentIncomeStatistics(statistics);
      
      setState(prev => ({
        ...prev,
        incomeStatistics: presentedStatistics,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error loading income statistics',
        loading: false,
      }));
    }
  }, [clinicId, workspaceId]);

  // Service operations
  const createService = useCallback(async (serviceData: {
    name: string;
    description: string;
    price: number;
    duration: number;
    category: string;
    professionalId: string;
  }) => {
    setState(prev => ({ ...prev, serviceLoading: true, error: null }));
    
    try {
      const service = new Service(
        '', // ID will be assigned by server
        serviceData.name,
        serviceData.description,
        serviceData.price,
        serviceData.duration,
        serviceData.category,
        serviceData.professionalId,
        true,
        clinicId,
        workspaceId
      );

      await serviceAdapter.create(service);
      await loadServices();
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error creating service',
        serviceLoading: false,
      }));
      throw error;
    }
  }, [clinicId, workspaceId]);

  const loadServices = useCallback(async (filters?: ServiceFilters) => {
    setState(prev => ({ ...prev, serviceLoading: true, error: null }));
    
    try {
      const services = await serviceAdapter.findAll({
        ...filters,
        clinicId: clinicId || filters?.clinicId,
        workspaceId: workspaceId || filters?.workspaceId,
      });
      
      const presentedServices = presenter.presentServiceList(services);
      
      setState(prev => ({
        ...prev,
        services: presentedServices,
        serviceLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error loading services',
        serviceLoading: false,
      }));
    }
  }, [clinicId, workspaceId]);

  const updateService = useCallback(async (service: Service) => {
    setState(prev => ({ ...prev, serviceLoading: true, error: null }));
    
    try {
      await serviceAdapter.update(service);
      await loadServices();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error updating service',
        serviceLoading: false,
      }));
      throw error;
    }
  }, []);

  const deleteService = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, serviceLoading: true, error: null }));
    
    try {
      await serviceAdapter.delete(id);
      await loadServices();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error deleting service',
        serviceLoading: false,
      }));
      throw error;
    }
  }, []);

  const toggleServiceStatus = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, serviceLoading: true, error: null }));
    
    try {
      const service = await serviceAdapter.findById(id);
      if (service) {
        if (service.isActive) {
          await serviceAdapter.deactivate(id);
        } else {
          await serviceAdapter.activate(id);
        }
        await loadServices();
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error toggling service status',
        serviceLoading: false,
      }));
      throw error;
    }
  }, []);

  const loadServiceStatistics = useCallback(async (filters?: ServiceFilters) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const statistics = await serviceAdapter.getStatistics({
        ...filters,
        clinicId: clinicId || filters?.clinicId,
        workspaceId: workspaceId || filters?.workspaceId,
      });
      
      const presentedStatistics = presenter.presentServiceStatistics(statistics);
      
      setState(prev => ({
        ...prev,
        serviceStatistics: presentedStatistics,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error loading service statistics',
        loading: false,
      }));
    }
  }, [clinicId, workspaceId]);

  // Cash register operations
  const openCashRegister = useCallback(async (initialAmount: number, operatorId: string) => {
    setState(prev => ({ ...prev, registerLoading: true, error: null }));
    
    try {
      const register = new CashRegister(
        '', // ID will be assigned by server
        operatorId,
        initialAmount,
        new Date(),
        undefined,
        undefined,
        undefined,
        'open',
        undefined,
        clinicId,
        workspaceId
      );

      const openedRegister = await cashRegisterAdapter.openRegister(register);
      const presentedRegister = presenter.presentCashRegister(openedRegister);
      
      setState(prev => ({
        ...prev,
        cashRegister: presentedRegister,
        registerLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error opening cash register',
        registerLoading: false,
      }));
      throw error;
    }
  }, [clinicId, workspaceId]);

  const closeCashRegister = useCallback(async (finalAmount: number, actualCash: number, notes?: string) => {
    if (!state.cashRegister) return;
    
    setState(prev => ({ ...prev, registerLoading: true, error: null }));
    
    try {
      const closedRegister = await cashRegisterAdapter.closeRegister(state.cashRegister.id, {
        finalAmount,
        actualCash,
        notes,
        closedBy: professionalId || 'unknown',
      });
      
      const presentedRegister = presenter.presentCashRegister(closedRegister);
      
      setState(prev => ({
        ...prev,
        cashRegister: presentedRegister,
        registerLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error closing cash register',
        registerLoading: false,
      }));
      throw error;
    }
  }, [state.cashRegister, professionalId]);

  const getCurrentSession = useCallback(async () => {
    setState(prev => ({ ...prev, registerLoading: true, error: null }));
    
    try {
      const session = await cashRegisterAdapter.getCurrentSession(professionalId, clinicId, workspaceId);
      
      if (session) {
        const presentedSession = presenter.presentCashRegister(session);
        setState(prev => ({
          ...prev,
          cashRegister: presentedSession,
          registerLoading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          cashRegister: null,
          registerLoading: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error getting current session',
        registerLoading: false,
      }));
    }
  }, [professionalId, clinicId, workspaceId]);

  const addIncomeToRegister = useCallback(async (amount: number, method: string, reference?: string) => {
    if (!state.cashRegister) return;
    
    try {
      await cashRegisterAdapter.addIncome(state.cashRegister.id, amount, method, reference);
      await getCurrentSession(); // Refresh session data
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error adding income to register',
      }));
      throw error;
    }
  }, [state.cashRegister]);

  const addExpenseToRegister = useCallback(async (amount: number, concept: string, reference?: string) => {
    if (!state.cashRegister) return;
    
    try {
      await cashRegisterAdapter.addExpense(state.cashRegister.id, amount, concept, reference);
      await getCurrentSession(); // Refresh session data
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error adding expense to register',
      }));
      throw error;
    }
  }, [state.cashRegister]);

  const loadRegisterHistory = useCallback(async (filters?: CashRegisterFilters) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const registers = await cashRegisterAdapter.findAll({
        ...filters,
        clinicId: clinicId || filters?.clinicId,
        workspaceId: workspaceId || filters?.workspaceId,
      });
      
      const presentedRegisters = presenter.presentCashRegisterList(registers);
      
      setState(prev => ({
        ...prev,
        registerHistory: presentedRegisters,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error loading register history',
        loading: false,
      }));
    }
  }, [clinicId, workspaceId]);

  // Utility actions
  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadIncomes(),
      loadServices(),
      getCurrentSession(),
      loadIncomeStatistics(),
      loadServiceStatistics(),
    ]);
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Load initial data
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return {
    state,
    actions: {
      createIncome,
      loadIncomes,
      updateIncome,
      deleteIncome,
      processRefund,
      loadIncomeStatistics,
      createService,
      loadServices,
      updateService,
      deleteService,
      toggleServiceStatus,
      loadServiceStatistics,
      openCashRegister,
      closeCashRegister,
      getCurrentSession,
      addIncomeToRegister,
      addExpenseToRegister,
      loadRegisterHistory,
      refreshAll,
      clearError,
    },
  };
}