'use client';

import { useState, useEffect } from 'react';
import { 
  CogIcon,
  CurrencyDollarIcon,
  TagIcon,
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface FinanceConfig {
  id: string;
  clinicId?: string;
  isAutomatic: boolean;
  defaultCurrency: string;
  taxRate?: number;
  invoicePrefix?: string;
  invoiceCounter: number;
  paymentTerms?: string;
  notes?: string;
  isActive: boolean;
  services: Service[];
  discountPlans: DiscountPlan[];
}

interface Service {
  id: string;
  name: string;
  description?: string;
  code?: string;
  basePrice: number;
  currency: string;
  duration?: number;
  category: string;
  isActive: boolean;
}

interface DiscountPlan {
  id: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount' | 'custom_price';
  discountValue: number;
  currency: string;
  isActive: boolean;
  validUntil?: string;
}

export default function FinanceConfiguration() {
  const [config, setConfig] = useState<FinanceConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'services' | 'discounts'>('general');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingDiscount, setEditingDiscount] = useState<DiscountPlan | null>(null);
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);
  const [showNewDiscountForm, setShowNewDiscountForm] = useState(false);

  // Form states
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    code: '',
    basePrice: '',
    duration: '',
    category: 'consultation'
  });

  const [newDiscount, setNewDiscount] = useState({
    name: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed_amount' | 'custom_price',
    discountValue: '',
    validUntil: ''
  });

  const [generalConfig, setGeneralConfig] = useState({
    isAutomatic: false,
    defaultCurrency: 'MXN',
    taxRate: '',
    invoicePrefix: '',
    paymentTerms: '',
    notes: ''
  });

  useEffect(() => {
    loadConfiguration();
  }, []);

  useEffect(() => {
    if (config) {
      setGeneralConfig({
        isAutomatic: config.isAutomatic,
        defaultCurrency: config.defaultCurrency,
        taxRate: config.taxRate?.toString() || '',
        invoicePrefix: config.invoicePrefix || '',
        paymentTerms: config.paymentTerms || '',
        notes: config.notes || ''
      });
    }
  }, [config]);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/finance/config');
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.data);
      }
    } catch (error) {
      console.error('Error loading finance configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateGeneralConfig = async () => {
    if (!config) return;

    try {
      setLoading(true);
      const response = await fetch('/api/finance/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: config.id,
          isAutomatic: generalConfig.isAutomatic,
          defaultCurrency: generalConfig.defaultCurrency,
          taxRate: generalConfig.taxRate ? parseFloat(generalConfig.taxRate) : null,
          invoicePrefix: generalConfig.invoicePrefix,
          paymentTerms: generalConfig.paymentTerms,
          notes: generalConfig.notes
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setConfig(data.data);
        alert('Configuración actualizada exitosamente');
      } else {
        alert('Error al actualizar configuración: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating configuration:', error);
      alert('Error al actualizar configuración');
    } finally {
      setLoading(false);
    }
  };

  const createService = async () => {
    if (!config || !newService.name || !newService.basePrice) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/finance/config/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configId: config.id,
          ...newService,
          basePrice: parseFloat(newService.basePrice),
          duration: newService.duration ? parseInt(newService.duration) : null
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await loadConfiguration(); // Reload to get updated data
        setShowNewServiceForm(false);
        setNewService({
          name: '',
          description: '',
          code: '',
          basePrice: '',
          duration: '',
          category: 'consultation'
        });
        alert('Servicio creado exitosamente');
      } else {
        alert('Error al crear servicio: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating service:', error);
      alert('Error al crear servicio');
    } finally {
      setLoading(false);
    }
  };

  const createDiscount = async () => {
    if (!config || !newDiscount.name || !newDiscount.discountValue) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/finance/config/discount-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configId: config.id,
          ...newDiscount,
          discountValue: parseFloat(newDiscount.discountValue),
          validUntil: newDiscount.validUntil || null
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await loadConfiguration(); // Reload to get updated data
        setShowNewDiscountForm(false);
        setNewDiscount({
          name: '',
          description: '',
          discountType: 'percentage',
          discountValue: '',
          validUntil: ''
        });
        alert('Plan de descuento creado exitosamente');
      } else {
        alert('Error al crear plan de descuento: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating discount plan:', error);
      alert('Error al crear plan de descuento');
    } finally {
      setLoading(false);
    }
  };

  const updateService = async (serviceId: string, updates: Partial<Service>) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/finance/config/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      
      if (data.success) {
        await loadConfiguration();
        setEditingService(null);
        alert('Servicio actualizado exitosamente');
      } else {
        alert('Error al actualizar servicio: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating service:', error);
      alert('Error al actualizar servicio');
    } finally {
      setLoading(false);
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/finance/config/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadConfiguration();
        alert('Servicio eliminado exitosamente');
      } else {
        const data = await response.json();
        alert('Error al eliminar servicio: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Error al eliminar servicio');
    } finally {
      setLoading(false);
    }
  };

  const updateDiscount = async (discountId: string, updates: Partial<DiscountPlan>) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/finance/config/discount-plans/${discountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      
      if (data.success) {
        await loadConfiguration();
        setEditingDiscount(null);
        alert('Plan de descuento actualizado exitosamente');
      } else {
        alert('Error al actualizar plan de descuento: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating discount plan:', error);
      alert('Error al actualizar plan de descuento');
    } finally {
      setLoading(false);
    }
  };

  const deleteDiscount = async (discountId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este plan de descuento?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/finance/config/discount-plans/${discountId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadConfiguration();
        alert('Plan de descuento eliminado exitosamente');
      } else {
        const data = await response.json();
        alert('Error al eliminar plan de descuento: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error deleting discount plan:', error);
      alert('Error al eliminar plan de descuento');
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

  const getCategoryLabel = (category: string) => {
    const labels = {
      consultation: 'Consulta',
      therapy: 'Terapia',
      evaluation: 'Evaluación',
      other: 'Otro'
    };
    return (labels as any)[category] || category;
  };

  const getDiscountTypeLabel = (type: string) => {
    const labels = {
      percentage: 'Porcentaje',
      fixed_amount: 'Monto Fijo',
      custom_price: 'Precio Personalizado'
    };
    return (labels as any)[type] || type;
  };

  const tabs = [
    { id: 'general', name: 'General', icon: CogIcon },
    { id: 'services', name: 'Servicios', icon: CurrencyDollarIcon },
    { id: 'discounts', name: 'Descuentos', icon: TagIcon }
  ];

  if (loading && !config) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" />
        <span className="ml-3 text-gray-600">Cargando configuración...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuración Finance</h2>
          <p className="text-gray-600">Gestiona servicios, precios y descuentos</p>
        </div>
        <Button onClick={loadConfiguration} variant="outline" disabled={loading}>
          {loading ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <ArrowPathIcon className="h-4 w-4 mr-2" />
          )}
          Actualizar
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* General Configuration */}
      {activeTab === 'general' && (
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración General</h3>
              
              {/* Automatic/Manual Toggle */}
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                <div>
                  <h4 className="font-medium text-blue-900">Modo de Operación</h4>
                  <p className="text-sm text-blue-700">
                    {generalConfig.isAutomatic 
                      ? 'Los ingresos se registran automáticamente al completar consultas'
                      : 'Los ingresos se registran manualmente'
                    }
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">Manual</span>
                  <button
                    onClick={() => setGeneralConfig(prev => ({ ...prev, isAutomatic: !prev.isAutomatic }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      generalConfig.isAutomatic ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        generalConfig.isAutomatic ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-600">Automático</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moneda por Defecto
                  </label>
                  <select
                    value={generalConfig.defaultCurrency}
                    onChange={(e) => setGeneralConfig(prev => ({ ...prev, defaultCurrency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MXN">MXN - Peso Mexicano</option>
                    <option value="USD">USD - Dólar Americano</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>

                {/* Tax Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tasa de Impuesto (%)
                  </label>
                  <Input
                    type="number"
                    placeholder="16"
                    value={generalConfig.taxRate}
                    onChange={(e) => setGeneralConfig(prev => ({ ...prev, taxRate: e.target.value }))}
                  />
                </div>

                {/* Invoice Prefix */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prefijo de Facturas
                  </label>
                  <Input
                    type="text"
                    placeholder="INV"
                    value={generalConfig.invoicePrefix}
                    onChange={(e) => setGeneralConfig(prev => ({ ...prev, invoicePrefix: e.target.value }))}
                  />
                </div>

                {/* Payment Terms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Términos de Pago
                  </label>
                  <Input
                    type="text"
                    placeholder="Pago inmediato"
                    value={generalConfig.paymentTerms}
                    onChange={(e) => setGeneralConfig(prev => ({ ...prev, paymentTerms: e.target.value }))}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Adicionales
                </label>
                <textarea
                  rows={3}
                  placeholder="Información adicional sobre la configuración financiera..."
                  value={generalConfig.notes}
                  onChange={(e) => setGeneralConfig(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={updateGeneralConfig} disabled={loading}>
                  {loading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                  )}
                  Guardar Configuración
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Services Management */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          {/* Services List */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Servicios</h3>
              <Button 
                onClick={() => setShowNewServiceForm(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nuevo Servicio
              </Button>
            </div>

            {config?.services && config.services.length > 0 ? (
              <div className="space-y-4">
                {config.services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-gray-900">{service.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          service.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {service.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{service.description || 'Sin descripción'}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Código: {service.code || 'N/A'}</span>
                        <span>Categoría: {getCategoryLabel(service.category)}</span>
                        {service.duration && <span>Duración: {service.duration} min</span>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold text-green-600 text-lg">
                          {formatCurrency(service.basePrice)}
                        </div>
                        <div className="text-xs text-gray-500">{service.currency}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditingService(service);
                            setShowNewServiceForm(true);
                            setNewService({
                              name: service.name,
                              description: service.description || '',
                              code: service.code || '',
                              basePrice: service.basePrice.toString(),
                              duration: service.duration?.toString() || '',
                              category: service.category
                            });
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => deleteService(service.id)}
                          disabled={loading}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CurrencyDollarIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No hay servicios configurados</p>
                <Button onClick={() => setShowNewServiceForm(true)} className="mt-4">
                  Crear Primer Servicio
                </Button>
              </div>
            )}
          </Card>

          {/* New/Edit Service Form */}
          {showNewServiceForm && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
                </h3>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowNewServiceForm(false);
                    setEditingService(null);
                    setNewService({
                      name: '',
                      description: '',
                      code: '',
                      basePrice: '',
                      duration: '',
                      category: 'consultation'
                    });
                  }}
                >
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Servicio *
                  </label>
                  <Input
                    type="text"
                    placeholder="Consulta General"
                    value={newService.name}
                    onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código del Servicio
                  </label>
                  <Input
                    type="text"
                    placeholder="CONS-GEN"
                    value={newService.code}
                    onChange={(e) => setNewService(prev => ({ ...prev, code: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Base *
                  </label>
                  <Input
                    type="number"
                    placeholder="800.00"
                    value={newService.basePrice}
                    onChange={(e) => setNewService(prev => ({ ...prev, basePrice: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duración (minutos)
                  </label>
                  <Input
                    type="number"
                    placeholder="60"
                    value={newService.duration}
                    onChange={(e) => setNewService(prev => ({ ...prev, duration: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    value={newService.category}
                    onChange={(e) => setNewService(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="consultation">Consulta</option>
                    <option value="therapy">Terapia</option>
                    <option value="evaluation">Evaluación</option>
                    <option value="other">Otro</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  placeholder="Descripción del servicio..."
                  value={newService.description}
                  onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end mt-6">
                <Button 
                  onClick={() => {
                    if (editingService) {
                      updateService(editingService.id, {
                        ...newService,
                        basePrice: parseFloat(newService.basePrice),
                        duration: newService.duration ? parseInt(newService.duration) : undefined
                      });
                    } else {
                      createService();
                    }
                  }} 
                  disabled={loading || !newService.name || !newService.basePrice}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                  )}
                  {editingService ? 'Actualizar Servicio' : 'Crear Servicio'}
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Discounts Management */}
      {activeTab === 'discounts' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Planes de Descuento</h3>
              <Button 
                onClick={() => setShowNewDiscountForm(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nuevo Descuento
              </Button>
            </div>

            {config?.discountPlans && config.discountPlans.length > 0 ? (
              <div className="space-y-4">
                {config.discountPlans.map((discount) => (
                  <div key={discount.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-gray-900">{discount.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          discount.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {discount.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{discount.description || 'Sin descripción'}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Tipo: {getDiscountTypeLabel(discount.discountType)}</span>
                        {discount.validUntil && (
                          <span>Válido hasta: {new Date(discount.validUntil).toLocaleDateString('es-MX')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold text-purple-600 text-lg">
                          {discount.discountType === 'percentage' 
                            ? `${discount.discountValue}%`
                            : formatCurrency(discount.discountValue)
                          }
                        </div>
                        <div className="text-xs text-gray-500">{getDiscountTypeLabel(discount.discountType)}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditingDiscount(discount);
                            setShowNewDiscountForm(true);
                            setNewDiscount({
                              name: discount.name,
                              description: discount.description || '',
                              discountType: discount.discountType,
                              discountValue: discount.discountValue.toString(),
                              validUntil: discount.validUntil ? new Date(discount.validUntil).toISOString().split('T')[0] : ''
                            });
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => deleteDiscount(discount.id)}
                          disabled={loading}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TagIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No hay planes de descuento configurados</p>
                <Button onClick={() => setShowNewDiscountForm(true)} className="mt-4">
                  Crear Primer Descuento
                </Button>
              </div>
            )}
          </Card>

          {/* New/Edit Discount Form */}
          {showNewDiscountForm && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingDiscount ? 'Editar Plan de Descuento' : 'Nuevo Plan de Descuento'}
                </h3>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowNewDiscountForm(false);
                    setEditingDiscount(null);
                    setNewDiscount({
                      name: '',
                      description: '',
                      discountType: 'percentage',
                      discountValue: '',
                      validUntil: ''
                    });
                  }}
                >
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Plan *
                  </label>
                  <Input
                    type="text"
                    placeholder="Descuento Estudiantes"
                    value={newDiscount.name}
                    onChange={(e) => setNewDiscount(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Descuento *
                  </label>
                  <select
                    value={newDiscount.discountType}
                    onChange={(e) => setNewDiscount(prev => ({ ...prev, discountType: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="percentage">Porcentaje</option>
                    <option value="fixed_amount">Monto Fijo</option>
                    <option value="custom_price">Precio Personalizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {newDiscount.discountType === 'percentage' ? 'Porcentaje de Descuento (%) *' : 'Valor del Descuento *'}
                  </label>
                  <Input
                    type="number"
                    placeholder={newDiscount.discountType === 'percentage' ? '15' : '100.00'}
                    value={newDiscount.discountValue}
                    onChange={(e) => setNewDiscount(prev => ({ ...prev, discountValue: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Válido Hasta (Opcional)
                  </label>
                  <Input
                    type="date"
                    value={newDiscount.validUntil}
                    onChange={(e) => setNewDiscount(prev => ({ ...prev, validUntil: e.target.value }))}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  rows={3}
                  placeholder="Descripción del plan de descuento..."
                  value={newDiscount.description}
                  onChange={(e) => setNewDiscount(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end mt-6">
                <Button 
                  onClick={() => {
                    if (editingDiscount) {
                      updateDiscount(editingDiscount.id, {
                        ...newDiscount,
                        discountValue: parseFloat(newDiscount.discountValue),
                        validUntil: newDiscount.validUntil || undefined
                      });
                    } else {
                      createDiscount();
                    }
                  }} 
                  disabled={loading || !newDiscount.name || !newDiscount.discountValue}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                  )}
                  {editingDiscount ? 'Actualizar Plan' : 'Crear Plan'}
                </Button>
              </div>
            </Card>
          )}

          {/* Information Card */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Información sobre Descuentos</h4>
                <div className="mt-2 text-sm text-blue-700 space-y-1">
                  <p><strong>Porcentaje:</strong> Descuento del X% sobre el precio base</p>
                  <p><strong>Monto Fijo:</strong> Resta una cantidad fija del precio</p>
                  <p><strong>Precio Personalizado:</strong> Establece un precio específico para el servicio</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}