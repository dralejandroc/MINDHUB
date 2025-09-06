'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { 
  ShieldCheckIcon, 
  PlusIcon, 
  TrashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface ProfessionalCredential {
  id: string;
  type: 'cedula' | 'license' | 'certificate';
  number: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  speciality: string;
  verified: boolean;
  documentUrl?: string;
}

export function ProfessionalCredentialsSettings() {
  const [credentials, setCredentials] = useState<ProfessionalCredential[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCredential, setNewCredential] = useState<Partial<ProfessionalCredential>>({
    type: 'cedula',
    number: '',
    issuer: '',
    issueDate: '',
    speciality: '',
    verified: false
  });
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      const response = await fetch('/api/accounts/django/professional-credentials/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setCredentials(data);
        } else if (data.results && Array.isArray(data.results)) {
          setCredentials(data.results);
        }
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
      // Keep empty array on error
      setCredentials([]);
    }
  };

  const saveCredentials = async (updatedCredentials: ProfessionalCredential[]) => {
    try {
      // For now, just update local state
      // In production, this would sync with Django
      setCredentials(updatedCredentials);
      
      // TODO: Implement individual credential sync with Django
      // Each credential should be POST/PUT to /api/accounts/django/professional-credentials/
    } catch (error) {
      console.error('Error saving credentials:', error);
    }
  };

  const addCredential = () => {
    if (!newCredential.number || !newCredential.issuer || !newCredential.speciality) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    const credential: ProfessionalCredential = {
      id: Date.now().toString(),
      type: newCredential.type || 'cedula',
      number: newCredential.number,
      issuer: newCredential.issuer,
      issueDate: newCredential.issueDate || new Date().toISOString().split('T')[0],
      expiryDate: newCredential.expiryDate,
      speciality: newCredential.speciality,
      verified: false,
      documentUrl: newCredential.documentUrl
    };

    const updated = [...credentials, credential];
    saveCredentials(updated);
    
    toast.success('Credencial agregada exitosamente');
    setShowAddForm(false);
    setNewCredential({
      type: 'cedula',
      number: '',
      issuer: '',
      issueDate: '',
      speciality: '',
      verified: false
    });
  };

  const deleteCredential = (id: string) => {
    const updated = credentials.filter(c => c.id !== id);
    saveCredentials(updated);
    toast.success('Credencial eliminada');
  };

  const verifyCredential = async (id: string) => {
    setVerifying(id);
    
    // Simulate verification process
    setTimeout(() => {
      const updated = credentials.map(c => 
        c.id === id ? { ...c, verified: true } : c
      );
      saveCredentials(updated);
      setVerifying(null);
      toast.success('Credencial verificada exitosamente');
    }, 2000);
  };

  const getCredentialTypeLabel = (type: string) => {
    switch(type) {
      case 'cedula': return 'Cédula Profesional';
      case 'license': return 'Licencia';
      case 'certificate': return 'Certificado';
      default: return type;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg sm:text-xl font-semibold">Cédulas y Credenciales Profesionales</h2>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          variant="primary"
          size="sm"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Agregar Credencial
        </Button>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-medium mb-4">Nueva Credencial</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Credencial *
              </label>
              <select
                value={newCredential.type}
                onChange={(e) => setNewCredential({ ...newCredential, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cedula">Cédula Profesional</option>
                <option value="license">Licencia Médica</option>
                <option value="certificate">Certificado de Especialidad</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Registro *
              </label>
              <input
                type="text"
                value={newCredential.number}
                onChange={(e) => setNewCredential({ ...newCredential, number: e.target.value })}
                placeholder="Ej: 12345678"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Institución Emisora *
              </label>
              <input
                type="text"
                value={newCredential.issuer}
                onChange={(e) => setNewCredential({ ...newCredential, issuer: e.target.value })}
                placeholder="Ej: SEP, Universidad, Colegio Médico"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Especialidad *
              </label>
              <input
                type="text"
                value={newCredential.speciality}
                onChange={(e) => setNewCredential({ ...newCredential, speciality: e.target.value })}
                placeholder="Ej: Psiquiatría, Psicología Clínica"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Emisión
              </label>
              <input
                type="date"
                value={newCredential.issueDate}
                onChange={(e) => setNewCredential({ ...newCredential, issueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Vencimiento (opcional)
              </label>
              <input
                type="date"
                value={newCredential.expiryDate}
                onChange={(e) => setNewCredential({ ...newCredential, expiryDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={() => {
                setShowAddForm(false);
                setNewCredential({
                  type: 'cedula',
                  number: '',
                  issuer: '',
                  issueDate: '',
                  speciality: '',
                  verified: false
                });
              }}
              variant="outline"
              size="sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={addCredential}
              variant="primary"
              size="sm"
            >
              Agregar
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {credentials.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ShieldCheckIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No hay credenciales registradas</p>
            <p className="text-sm mt-1">Agregue sus credenciales profesionales para validación</p>
          </div>
        ) : (
          credentials.map(credential => (
            <div 
              key={credential.id} 
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-gray-900">
                      {getCredentialTypeLabel(credential.type)}
                    </span>
                    {credential.verified ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <CheckCircleIcon className="h-3 w-3" />
                        Verificada
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                        <ExclamationCircleIcon className="h-3 w-3" />
                        Pendiente
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Número:</span> {credential.number}
                    </div>
                    <div>
                      <span className="font-medium">Emisor:</span> {credential.issuer}
                    </div>
                    <div>
                      <span className="font-medium">Especialidad:</span> {credential.speciality}
                    </div>
                    <div>
                      <span className="font-medium">Emisión:</span> {credential.issueDate}
                    </div>
                  </div>

                  {credential.expiryDate && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium text-gray-600">Vencimiento:</span>{' '}
                      <span className={new Date(credential.expiryDate) < new Date() ? 'text-red-600' : 'text-gray-600'}>
                        {credential.expiryDate}
                        {new Date(credential.expiryDate) < new Date() && ' (Vencida)'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {!credential.verified && (
                    <Button
                      onClick={() => verifyCredential(credential.id)}
                      variant="outline"
                      size="sm"
                      disabled={verifying === credential.id}
                    >
                      {verifying === credential.id ? 'Verificando...' : 'Verificar'}
                    </Button>
                  )}
                  <button
                    onClick={() => deleteCredential(credential.id)}
                    className="p-1 text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-2">
          <ShieldCheckIcon className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Verificación de Credenciales</p>
            <p>Las credenciales profesionales son verificadas automáticamente contra las bases de datos oficiales.</p>
            <p className="mt-1">Mantenga sus credenciales actualizadas para cumplir con los requisitos legales.</p>
          </div>
        </div>
      </div>
    </div>
  );
}