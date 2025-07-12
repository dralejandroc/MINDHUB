'use client';

import { useState, useEffect } from 'react';
import { UserGroupIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface Patient {
  id: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  birth_date: string;
  age: number;
  gender: 'masculine' | 'feminine';
  email: string;
  cell_phone: string;
  created_at: string;
  updated_at: string;
}

interface PatientManagementProps {
  onSelectPatient: (patient: Patient) => void;
  onNewPatient: () => void;
  onNewConsultation: (patient: Patient) => void;
  onClinicalAssessment: (patient: Patient) => void;
}

export default function PatientManagement({
  onSelectPatient,
  onNewPatient,
  onNewConsultation,
  onClinicalAssessment
}: PatientManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch patients from API
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const url = searchTerm 
        ? `http://localhost:8080/api/expedix/patients?search=${encodeURIComponent(searchTerm)}`
        : 'http://localhost:8080/api/expedix/patients';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }

      const data = await response.json();
      setPatients(data.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients');
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchPatients();
  }, []);

  // Refetch when search term changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPatients();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  if (loading && patients.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Cargando pacientes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <Button onClick={fetchPatients} variant="outline">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Pacientes</h1>
          <p className="text-gray-600">Gestión integral de expedientes electrónicos</p>
        </div>
        <Button onClick={onNewPatient} className="bg-blue-600 hover:bg-blue-700">
          <PlusIcon className="h-5 w-5 mr-2" />
          Nuevo Paciente
        </Button>
      </div>

      {/* Search */}
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {loading && searchTerm && (
            <LoadingSpinner size="sm" />
          )}
        </div>
      </Card>

      {/* Patient List */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Lista de Pacientes</h2>
        </div>
        
        {patients.length === 0 ? (
          <div className="text-center py-12">
            <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
            </p>
            <Button onClick={onNewPatient} variant="outline">
              Agregar primer paciente
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {patients.map((patient) => (
              <div key={patient.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {patient.first_name.charAt(0)}{patient.paternal_last_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {patient.first_name} {patient.paternal_last_name} {patient.maternal_last_name}
                      </h3>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>{patient.age} años | {patient.cell_phone}</p>
                        <p>Email: {patient.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => onSelectPatient(patient)}
                      variant="outline"
                      size="sm"
                    >
                      📋 Ver Expediente
                    </Button>
                    <Button
                      onClick={() => onNewConsultation(patient)}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      🩺 Nueva Consulta + Receta
                    </Button>
                    <Button
                      onClick={() => onClinicalAssessment(patient)}
                      className="bg-purple-600 hover:bg-purple-700"
                      size="sm"
                    >
                      📋 Evaluación PHQ-9
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{patients.length}</div>
          <div className="text-sm text-gray-600">Pacientes Totales</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">0</div>
          <div className="text-sm text-gray-600">Consultas Hoy</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">0</div>
          <div className="text-sm text-gray-600">Evaluaciones Pendientes</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">0</div>
          <div className="text-sm text-gray-600">Recetas Emitidas</div>
        </Card>
      </div>
    </div>
  );
}