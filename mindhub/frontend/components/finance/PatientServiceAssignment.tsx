'use client';

import { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  TrashIcon,
  CalculatorIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

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

interface PatientService {
  id: string;
  serviceId: string;
  patientId: string;
  customPrice?: number;
  notes?: string;
  isActive: boolean;
  service: Service;
}

interface PatientDiscount {
  id: string;
  discountPlanId: string;
  patientId: string;
  customValue?: number;
  notes?: string;
  validUntil?: string;
  isActive: boolean;
  discountPlan: DiscountPlan;
}

interface PriceCalculation {
  serviceId: string;
  serviceName: string;
  basePrice: number;
  finalPrice: number;
  totalDiscount: number;
  appliedDiscounts: Array<{
    id: string;
    name: string;
    type: string;
    value: number;
    amount: number;
  }>;
  currency: string;
}

interface PatientServiceAssignmentProps {
  patientId: string;
  patientName: string;
  onClose?: () => void;
}

export default function PatientServiceAssignment({ patientId, patientName, onClose }: PatientServiceAssignmentProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'discounts'>('services');
  
  // Available services and discounts
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [availableDiscounts, setAvailableDiscounts] = useState<DiscountPlan[]>([]);
  
  // Patient assignments
  const [patientServices, setPatientServices] = useState<PatientService[]>([]);
  const [patientDiscounts, setPatientDiscounts] = useState<PatientDiscount[]>([]);
  
  // Price calculations
  const [priceCalculations, setPriceCalculations] = useState<Record<string, PriceCalculation>>({});
  
  // Form states
  const [selectedService, setSelectedService] = useState('');
  const [serviceCustomPrice, setServiceCustomPrice] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');
  
  const [selectedDiscount, setSelectedDiscount] = useState('');
  const [discountCustomValue, setDiscountCustomValue] = useState('');
  const [discountValidUntil, setDiscountValidUntil] = useState('');
  const [discountNotes, setDiscountNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [patientId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadConfiguration(),
        loadPatientAssignments()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/finance/config');
      const data = await response.json();
      
      if (data.success && data.data) {
        setAvailableServices(data.data.services || []);
        setAvailableDiscounts(data.data.discountPlans || []);
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  };

  const loadPatientAssignments = async () => {
    try {
      const [servicesRes, discountsRes] = await Promise.all([
        fetch(`/api/finance/patients/${patientId}/services`),
        fetch(`/api/finance/patients/${patientId}/discounts`)
      ]);

      const servicesData = await servicesRes.json();
      const discountsData = await discountsRes.json();

      if (servicesData.success) {
        setPatientServices(servicesData.data || []);
        // Calculate prices for each service
        for (const ps of servicesData.data || []) {
          await calculateServicePrice(ps.serviceId);
        }
      }

      if (discountsData.success) {
        setPatientDiscounts(discountsData.data || []);
      }
    } catch (error) {
      console.error('Error loading patient assignments:', error);
    }
  };

  const calculateServicePrice = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/finance/config/patients/${patientId}/services/${serviceId}/price`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setPriceCalculations(prev => ({
          ...prev,
          [serviceId]: data.data
        }));
      }
    } catch (error) {
      console.error('Error calculating price:', error);
    }
  };

  const assignService = async () => {
    if (!selectedService) {
      alert('Por favor selecciona un servicio');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/finance/config/patients/${patientId}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: selectedService,
          customPrice: serviceCustomPrice ? parseFloat(serviceCustomPrice) : undefined,
          notes: serviceNotes
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await loadPatientAssignments();
        setSelectedService('');
        setServiceCustomPrice('');
        setServiceNotes('');
        alert('Servicio asignado exitosamente');
      } else {
        alert('Error al asignar servicio: ' + data.error);
      }
    } catch (error) {
      console.error('Error assigning service:', error);
      alert('Error al asignar servicio');
    } finally {
      setLoading(false);
    }
  };

  const assignDiscount = async () => {
    if (!selectedDiscount) {
      alert('Por favor selecciona un descuento');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/finance/config/patients/${patientId}/discounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discountPlanId: selectedDiscount,
          customValue: discountCustomValue ? parseFloat(discountCustomValue) : undefined,
          validUntil: discountValidUntil || undefined,
          notes: discountNotes
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await loadPatientAssignments();
        setSelectedDiscount('');
        setDiscountCustomValue('');
        setDiscountValidUntil('');
        setDiscountNotes('');
        alert('Descuento asignado exitosamente');
      } else {
        alert('Error al asignar descuento: ' + data.error);
      }
    } catch (error) {
      console.error('Error assigning discount:', error);
      alert('Error al asignar descuento');
    } finally {
      setLoading(false);
    }
  };

  const removeService = async (assignmentId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/finance/patients/services/${assignmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadPatientAssignments();
        alert('Servicio eliminado exitosamente');
      } else {
        const data = await response.json();
        alert('Error al eliminar servicio: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error removing service:', error);
      alert('Error al eliminar servicio');
    } finally {
      setLoading(false);
    }
  };

  const removeDiscount = async (assignmentId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este descuento?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/finance/patients/discounts/${assignmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadPatientAssignments();
        alert('Descuento eliminado exitosamente');
      } else {
        const data = await response.json();
        alert('Error al eliminar descuento: ' + (data.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error removing discount:', error);
      alert('Error al eliminar descuento');
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
    { id: 'services', name: 'Servicios', icon: CurrencyDollarIcon },
    { id: 'discounts', name: 'Descuentos', icon: TagIcon }
  ];

  if (loading && patientServices.length === 0 && patientDiscounts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" />
        <span className="ml-3 text-gray-600">Cargando información...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Asignación de Servicios y Descuentos</h3>
          <p className="text-gray-600">Paciente: <span className="font-medium">{patientName}</span></p>
        </div>
        {onClose && (
          <Button onClick={onClose} variant="outline" size="sm">
            <XCircleIcon className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
        )}
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

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          {/* Assigned Services */}
          <Card className="p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Servicios Asignados</h4>
            
            {patientServices.length > 0 ? (
              <div className="space-y-4">
                {patientServices.map((ps) => {
                  const calculation = priceCalculations[ps.serviceId];
                  return (
                    <div key={ps.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{ps.service.name}</h5>
                          <p className="text-sm text-gray-600 mt-1">{ps.service.description}</p>
                          
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Precio Base:</span>
                              <span className="font-medium">{formatCurrency(ps.service.basePrice)}</span>
                            </div>
                            
                            {ps.customPrice && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Precio Personalizado:</span>
                                <span className="font-medium text-blue-600">{formatCurrency(ps.customPrice)}</span>
                              </div>
                            )}
                            
                            {calculation && calculation.totalDiscount > 0 && (
                              <>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-500">Descuentos Aplicados:</span>
                                  <span className="font-medium text-green-600">-{formatCurrency(calculation.totalDiscount)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm border-t pt-2">
                                  <span className="font-medium text-gray-700">Precio Final:</span>
                                  <span className="font-bold text-lg text-green-600">{formatCurrency(calculation.finalPrice)}</span>
                                </div>
                              </>
                            )}
                          </div>
                          
                          {ps.notes && (
                            <p className="mt-2 text-sm text-gray-500 italic">Notas: {ps.notes}</p>
                          )}
                        </div>
                        
                        <div className="ml-4 flex flex-col space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => calculateServicePrice(ps.serviceId)}
                          >
                            <CalculatorIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => removeService(ps.id)}
                            disabled={loading}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No hay servicios asignados</p>
            )}
          </Card>

          {/* Add New Service */}
          <Card className="p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Asignar Nuevo Servicio</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Servicio *
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="">Seleccionar servicio...</option>
                  {availableServices.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {formatCurrency(service.basePrice)} ({getCategoryLabel(service.category)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Personalizado (Opcional)
                </label>
                <input
                  type="number"
                  placeholder="Dejar vacío para usar precio base"
                  value={serviceCustomPrice}
                  onChange={(e) => setServiceCustomPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Notas adicionales..."
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={assignService}
                  disabled={loading || !selectedService}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <PlusIcon className="h-4 w-4 mr-2" />
                  )}
                  Asignar Servicio
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Discounts Tab */}
      {activeTab === 'discounts' && (
        <div className="space-y-6">
          {/* Assigned Discounts */}
          <Card className="p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Descuentos Asignados</h4>
            
            {patientDiscounts.length > 0 ? (
              <div className="space-y-4">
                {patientDiscounts.map((pd) => (
                  <div key={pd.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{pd.discountPlan.name}</h5>
                        <p className="text-sm text-gray-600 mt-1">{pd.discountPlan.description}</p>
                        
                        <div className="mt-3 flex items-center space-x-4 text-sm">
                          <span className="inline-flex items-center">
                            <TagIcon className="h-4 w-4 mr-1 text-purple-500" />
                            {getDiscountTypeLabel(pd.discountPlan.discountType)}
                          </span>
                          
                          <span className="font-medium text-purple-600">
                            {pd.discountPlan.discountType === 'percentage'
                              ? `${pd.customValue || pd.discountPlan.discountValue}%`
                              : formatCurrency(pd.customValue || pd.discountPlan.discountValue)
                            }
                          </span>
                          
                          {pd.validUntil && (
                            <span className="text-gray-500">
                              Válido hasta: {new Date(pd.validUntil).toLocaleDateString('es-MX')}
                            </span>
                          )}
                        </div>
                        
                        {pd.notes && (
                          <p className="mt-2 text-sm text-gray-500 italic">Notas: {pd.notes}</p>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 ml-4"
                        onClick={() => removeDiscount(pd.id)}
                        disabled={loading}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No hay descuentos asignados</p>
            )}
          </Card>

          {/* Add New Discount */}
          <Card className="p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Asignar Nuevo Descuento</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan de Descuento *
                </label>
                <select
                  value={selectedDiscount}
                  onChange={(e) => setSelectedDiscount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="">Seleccionar descuento...</option>
                  {availableDiscounts.map((discount) => (
                    <option key={discount.id} value={discount.id}>
                      {discount.name} - {
                        discount.discountType === 'percentage'
                          ? `${discount.discountValue}%`
                          : formatCurrency(discount.discountValue)
                      } ({getDiscountTypeLabel(discount.discountType)})
                    </option>
                  ))}
                </select>
              </div>

              {selectedDiscount && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor Personalizado (Opcional)
                    </label>
                    <input
                      type="number"
                      placeholder="Dejar vacío para usar valor por defecto"
                      value={discountCustomValue}
                      onChange={(e) => setDiscountCustomValue(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Válido Hasta (Opcional)
                    </label>
                    <input
                      type="date"
                      value={discountValidUntil}
                      onChange={(e) => setDiscountValidUntil(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Notas adicionales..."
                      value={discountNotes}
                      onChange={(e) => setDiscountNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={assignDiscount}
                  disabled={loading || !selectedDiscount}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <PlusIcon className="h-4 w-4 mr-2" />
                  )}
                  Asignar Descuento
                </Button>
              </div>
            </div>
          </Card>

          {/* Info Card */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Información sobre descuentos:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Los descuentos se aplican automáticamente a todos los servicios del paciente</li>
                  <li>Los descuentos de porcentaje se calculan sobre el precio base o personalizado</li>
                  <li>Los descuentos de monto fijo se restan del total</li>
                  <li>Los precios personalizados reemplazan completamente el precio base</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}