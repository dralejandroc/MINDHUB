'use client';

import { useState, useEffect } from 'react';
import { 
  BanknotesIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'transfer' | 'check' | 'other';
  description: string;
  isActive: boolean;
  commission?: number; // Porcentaje de comisión
  fees?: number; // Comisiones fijas
  bankInfo?: {
    bank: string;
    account: string;
    clabe?: string;
  };
}

export default function PaymentMethodsManager() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [editingMethod, setEditingMethod] = useState<string | null>(null);
  const [showNewMethod, setShowNewMethod] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock data inicial
  useEffect(() => {
    const mockMethods: PaymentMethod[] = [
      {
        id: '1',
        name: 'Efectivo',
        type: 'cash',
        description: 'Pagos en efectivo directo',
        isActive: true,
        commission: 0,
        fees: 0
      },
      {
        id: '2',
        name: 'Terminal Bancaria',
        type: 'card',
        description: 'Tarjetas de débito y crédito',
        isActive: true,
        commission: 3.5,
        fees: 0
      },
      {
        id: '3',
        name: 'Transferencia BBVA',
        type: 'transfer',
        description: 'Transferencias bancarias electrónicas',
        isActive: true,
        commission: 0,
        fees: 0,
        bankInfo: {
          bank: 'BBVA Bancomer',
          account: '**** **** **** 1234',
          clabe: '012180001234567890'
        }
      },
      {
        id: '4',
        name: 'Cheques',
        type: 'check',
        description: 'Cheques personales y de empresa',
        isActive: false,
        commission: 0,
        fees: 15
      }
    ];
    setPaymentMethods(mockMethods);
  }, []);

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'cash': return BanknotesIcon;
      case 'card': return CreditCardIcon;
      case 'transfer': return CurrencyDollarIcon;
      case 'check': return DocumentTextIcon;
      default: return CurrencyDollarIcon;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const handleToggleActive = async (methodId: string) => {
    setLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPaymentMethods(prev => 
        prev.map(method => 
          method.id === methodId 
            ? { ...method, isActive: !method.isActive }
            : method
        )
      );
    } catch (error) {
      console.error('Error updating payment method:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (methodId: string) => {
    if (!confirm('¿Estás seguro de eliminar este método de pago?')) return;
    
    setLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
    } catch (error) {
      console.error('Error deleting payment method:', error);
    } finally {
      setLoading(false);
    }
  };

  const NewMethodForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      type: 'cash' as PaymentMethod['type'],
      description: '',
      commission: 0,
      fees: 0,
      bank: '',
      account: '',
      clabe: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      setLoading(true);
      try {
        // Simular API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const newMethod: PaymentMethod = {
          id: `method_${Date.now()}`,
          name: formData.name,
          type: formData.type,
          description: formData.description,
          isActive: true,
          commission: formData.commission,
          fees: formData.fees,
          ...(formData.type === 'transfer' && formData.bank && {
            bankInfo: {
              bank: formData.bank,
              account: formData.account,
              clabe: formData.clabe
            }
          })
        };
        
        setPaymentMethods(prev => [...prev, newMethod]);
        setShowNewMethod(false);
      } catch (error) {
        console.error('Error creating payment method:', error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <Card className="p-6 border-2 border-dashed border-gray-300">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Nuevo Método de Pago</h3>
            <button
              type="button"
              onClick={() => setShowNewMethod(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ej: Terminal BBVA"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as PaymentMethod['type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
                <option value="check">Cheque</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Descripción del método de pago"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comisión (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.commission}
                onChange={(e) => setFormData({ ...formData, commission: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0.0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comisión Fija ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.fees}
                onChange={(e) => setFormData({ ...formData, fees: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
              />
            </div>
          </div>
          
          {formData.type === 'transfer' && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
              <h4 className="text-sm font-medium text-blue-800">Información Bancaria</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banco
                </label>
                <input
                  type="text"
                  value={formData.bank}
                  onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ej: BBVA Bancomer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Cuenta
                </label>
                <input
                  type="text"
                  value={formData.account}
                  onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="**** **** **** 1234"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CLABE Interbancaria
                </label>
                <input
                  type="text"
                  value={formData.clabe}
                  onChange={(e) => setFormData({ ...formData, clabe: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="18 dígitos"
                  maxLength={18}
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewMethod(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creando...
                </>
              ) : (
                'Crear Método'
              )}
            </Button>
          </div>
        </form>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Métodos de Pago</h2>
          <p className="text-gray-600 mt-1">Configura los métodos de pago disponibles en tu práctica</p>
        </div>
        
        <Button
          onClick={() => setShowNewMethod(true)}
          className="bg-green-600 hover:bg-green-700 flex items-center space-x-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Nuevo Método</span>
        </Button>
      </div>

      {/* Formulario de nuevo método */}
      {showNewMethod && <NewMethodForm />}

      {/* Lista de métodos de pago */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {paymentMethods.map((method) => {
          const IconComponent = getMethodIcon(method.type);
          
          return (
            <Card key={method.id} className={`p-6 ${!method.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className={`p-2 rounded-lg mr-4 ${
                    method.isActive ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <IconComponent className={`h-6 w-6 ${
                      method.isActive ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-semibold text-gray-900">{method.name}</h3>
                      {method.isActive && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Activo
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mt-1">{method.description}</p>
                    
                    {/* Información de comisiones */}
                    <div className="mt-3 space-y-1">
                      {method.commission > 0 && (
                        <p className="text-xs text-gray-500">
                          Comisión: {method.commission}%
                        </p>
                      )}
                      {method.fees > 0 && (
                        <p className="text-xs text-gray-500">
                          Comisión fija: {formatCurrency(method.fees)}
                        </p>
                      )}
                    </div>
                    
                    {/* Información bancaria */}
                    {method.bankInfo && (
                      <div className="mt-3 bg-gray-50 p-3 rounded-md">
                        <p className="text-sm font-medium text-gray-700">{method.bankInfo.bank}</p>
                        <p className="text-xs text-gray-500">{method.bankInfo.account}</p>
                        {method.bankInfo.clabe && (
                          <p className="text-xs text-gray-500">CLABE: {method.bankInfo.clabe}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleActive(method.id)}
                    disabled={loading}
                    className={`p-2 rounded-md transition-colors ${
                      method.isActive 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    title={method.isActive ? 'Desactivar' : 'Activar'}
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => setEditingMethod(method.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md"
                    title="Editar"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(method.id)}
                    disabled={loading}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                    title="Eliminar"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {paymentMethods.length === 0 && (
        <Card className="p-12 text-center">
          <CreditCardIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay métodos de pago configurados</h3>
          <p className="text-gray-500 mb-4">Comienza agregando tu primer método de pago</p>
          <Button
            onClick={() => setShowNewMethod(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Agregar Método de Pago
          </Button>
        </Card>
      )}
    </div>
  );
}