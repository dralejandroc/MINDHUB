'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { 
  CurrencyDollarIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { authGet, authPost, authPut, authDelete } from '@/lib/api/auth-fetch';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'transfer' | 'check' | 'other';
  isActive: boolean;
  fees?: number;
  description?: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // minutes
  category: string;
  description?: string;
  isActive: boolean;
}

interface FinanceConfig {
  paymentMethods: PaymentMethod[];
  services: Service[];
  taxRate: number;
  currency: string;
  requireInvoiceByDefault: boolean;
  autoGenerateReceipts: boolean;
}

export function FinanceSettings() {
  const [config, setConfig] = useState<FinanceConfig>({
    paymentMethods: [],
    services: [],
    taxRate: 0,
    currency: 'MXN',
    requireInvoiceByDefault: false,
    autoGenerateReceipts: true
  });
  
  const [loading, setLoading] = useState(false);
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // New payment method form
  const [newPaymentMethod, setNewPaymentMethod] = useState<Omit<PaymentMethod, 'id'>>({
    name: '',
    type: 'cash',
    isActive: true,
    fees: 0,
    description: ''
  });

  // New service form
  const [newService, setNewService] = useState<Omit<Service, 'id'>>({
    name: '',
    price: 0,
    duration: 60,
    category: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      
      // Load payment methods
      const paymentMethodsResponse = await authGet('/api/finance/django/payment-methods/');
      const servicesResponse = await authGet('/api/finance/django/services/');
      const configResponse = await authGet('/api/finance/django/config/');

      if (paymentMethodsResponse.ok) {
        const data = await paymentMethodsResponse.json();
        const methods = data.results || data.data || [];
        setConfig(prev => ({ ...prev, paymentMethods: methods }));
      }

      if (servicesResponse.ok) {
        const data = await servicesResponse.json();
        const services = data.results || data.data || [];
        setConfig(prev => ({ ...prev, services }));
      }

      if (configResponse.ok) {
        const data = await configResponse.json();
        if (data.settings) {
          setConfig(prev => ({ 
            ...prev, 
            ...data.settings 
          }));
        }
      }
    } catch (error) {
      console.error('Error loading finance configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setLoading(true);
      const response = await authPost('/api/finance/django/config/', {
        settings: {
          taxRate: config.taxRate,
          currency: config.currency,
          requireInvoiceByDefault: config.requireInvoiceByDefault,
          autoGenerateReceipts: config.autoGenerateReceipts
        }
      });
      
      if (response.ok) {
        toast.success('Configuración de Finance guardada');
      } else {
        throw new Error('Failed to save finance configuration');
      }
    } catch (error) {
      console.error('Error saving finance configuration:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const addPaymentMethod = async () => {
    try {
      const response = await authPost('/api/finance/django/payment-methods/', newPaymentMethod);
      
      if (response.ok) {
        const savedMethod = await response.json();
        setConfig(prev => ({
          ...prev,
          paymentMethods: [...prev.paymentMethods, savedMethod]
        }));
        setNewPaymentMethod({
          name: '',
          type: 'cash',
          isActive: true,
          fees: 0,
          description: ''
        });
        setShowAddPaymentMethod(false);
        toast.success('Método de pago agregado');
      } else {
        throw new Error('Failed to add payment method');
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast.error('Error al agregar método de pago');
    }
  };

  const addService = async () => {
    try {
      const response = await authPost('/api/finance/django/services/', newService);
      
      if (response.ok) {
        const savedService = await response.json();
        setConfig(prev => ({
          ...prev,
          services: [...prev.services, savedService]
        }));
        setNewService({
          name: '',
          price: 0,
          duration: 60,
          category: '',
          description: '',
          isActive: true
        });
        setShowAddService(false);
        toast.success('Servicio agregado');
      } else {
        throw new Error('Failed to add service');
      }
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error('Error al agregar servicio');
    }
  };

  const deletePaymentMethod = async (id: string) => {
    try {
      const response = await authDelete(`/api/finance/django/payment-methods/${id}/`);
      
      if (response.ok) {
        setConfig(prev => ({
          ...prev,
          paymentMethods: prev.paymentMethods.filter(method => method.id !== id)
        }));
        toast.success('Método de pago eliminado');
      } else {
        throw new Error('Failed to delete payment method');
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Error al eliminar método de pago');
    }
  };

  const deleteService = async (id: string) => {
    try {
      const response = await authDelete(`/api/finance/django/services/${id}/`);
      
      if (response.ok) {
        setConfig(prev => ({
          ...prev,
          services: prev.services.filter(service => service.id !== id)
        }));
        toast.success('Servicio eliminado');
      } else {
        throw new Error('Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Error al eliminar servicio');
    }
  };

  const serviceCategories = [
    'Consulta General',
    'Especialidad',
    'Terapia',
    'Diagnóstico',
    'Procedimiento',
    'Otro'
  ];

  return (
    <div className="space-y-6">
      {/* Configuración General */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold">Configuración General de Finanzas</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moneda
            </label>
            <select
              value={config.currency}
              onChange={(e) => setConfig(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="MXN">Peso Mexicano (MXN)</option>
              <option value="USD">Dólar Estadounidense (USD)</option>
              <option value="EUR">Euro (EUR)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tasa de Impuesto (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={config.taxRate}
              onChange={(e) => setConfig(prev => ({ ...prev, taxRate: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="space-y-3 mt-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.requireInvoiceByDefault}
              onChange={(e) => setConfig(prev => ({ ...prev, requireInvoiceByDefault: e.target.checked }))}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">
              Solicitar factura por defecto
            </span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.autoGenerateReceipts}
              onChange={(e) => setConfig(prev => ({ ...prev, autoGenerateReceipts: e.target.checked }))}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">
              Generar recibos automáticamente
            </span>
          </label>
        </div>
      </div>

      {/* Métodos de Pago */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Métodos de Pago</h3>
          <Button
            onClick={() => setShowAddPaymentMethod(true)}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Agregar Método
          </Button>
        </div>

        <div className="space-y-2">
          {config.paymentMethods.map((method) => (
            <div key={method.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <div className="font-medium">{method.name}</div>
                <div className="text-sm text-gray-600">
                  Tipo: {method.type} • {method.fees ? `Comisión: ${method.fees}%` : 'Sin comisión'}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  method.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {method.isActive ? 'Activo' : 'Inactivo'}
                </span>
                <Button
                  onClick={() => deletePaymentMethod(method.id)}
                  size="sm"
                  variant="outline"
                  className="text-red-600"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Payment Method Modal */}
        {showAddPaymentMethod && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Agregar Método de Pago</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={newPaymentMethod.name}
                    onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Ej: Efectivo, Tarjeta VISA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={newPaymentMethod.type}
                    onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, type: e.target.value as PaymentMethod['type'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                    <option value="transfer">Transferencia</option>
                    <option value="check">Cheque</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comisión (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPaymentMethod.fees}
                    onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, fees: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={() => setShowAddPaymentMethod(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={addPaymentMethod}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Agregar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Servicios */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Servicios y Precios</h3>
          <Button
            onClick={() => setShowAddService(true)}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Agregar Servicio
          </Button>
        </div>

        <div className="space-y-2">
          {config.services.map((service) => (
            <div key={service.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <div className="font-medium">{service.name}</div>
                <div className="text-sm text-gray-600">
                  ${service.price} • {service.duration} min • {service.category}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  service.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {service.isActive ? 'Activo' : 'Inactivo'}
                </span>
                <Button
                  onClick={() => deleteService(service.id)}
                  size="sm"
                  variant="outline"
                  className="text-red-600"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Service Modal */}
        {showAddService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">Agregar Servicio</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Servicio</label>
                  <input
                    type="text"
                    value={newService.name}
                    onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Ej: Consulta General"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newService.price}
                      onChange={(e) => setNewService(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duración (min)</label>
                    <input
                      type="number"
                      min="1"
                      value={newService.duration}
                      onChange={(e) => setNewService(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    value={newService.category}
                    onChange={(e) => setNewService(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Seleccionar categoría</option>
                    {serviceCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={newService.description}
                    onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    rows={2}
                    placeholder="Descripción opcional del servicio"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={() => setShowAddService(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={addService}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Agregar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <Button
          onClick={saveConfig}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircleIcon className="h-4 w-4 mr-2" />
          Guardar Configuración
        </Button>
      </div>
    </div>
  );
}