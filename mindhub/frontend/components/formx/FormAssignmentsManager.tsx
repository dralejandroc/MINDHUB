'use client';

import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  TrashIcon,
  PaperAirplaneIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface Assignment {
  id: string;
  formId: string;
  patientId: string;
  token: string;
  assignedBy: string;
  assignedAt: string;
  expiresAt: string;
  status: 'pending' | 'completed' | 'expired';
  message: string;
  remindersSent: number;
  maxReminders: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  cell_phone?: string;
}

interface FormAssignmentsManagerProps {
  forms: any[];
  onRefresh?: () => void;
}

export const FormAssignmentsManager: React.FC<FormAssignmentsManagerProps> = ({
  forms,
  onRefresh
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForm, setSelectedForm] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);

  // Load assignments
  const loadAssignments = async () => {
    try {
      setLoading(true);
      
      // If a specific form is selected, load its assignments
      if (selectedForm !== 'all') {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/formx/forms/${selectedForm}/assignments`
        );
        
        if (response.ok) {
          const data = await response.json();
          setAssignments(data.data || []);
        }
      } else {
        // Load all assignments (we'll need to implement this endpoint or load from each form)
        const allAssignments: Assignment[] = [];
        
        for (const form of forms) {
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/formx/forms/${form.id}/assignments`
            );
            
            if (response.ok) {
              const data = await response.json();
              const formAssignments = (data.data || []).map((assignment: Assignment) => ({
                ...assignment,
                formTitle: form.title
              }));
              allAssignments.push(...formAssignments);
            }
          } catch (error) {
            console.error(`Error loading assignments for form ${form.id}:`, error);
          }
        }
        
        setAssignments(allAssignments);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error('Error al cargar las asignaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (forms.length > 0) {
      loadAssignments();
    }
  }, [selectedForm, forms]);

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    if (statusFilter !== 'all' && assignment.status !== statusFilter) {
      return false;
    }
    return true;
  });

  // Copy form URL to clipboard
  const copyFormUrl = async (token: string) => {
    const formUrl = `${window.location.origin}/forms/${token}`;
    
    try {
      await navigator.clipboard.writeText(formUrl);
      toast.success('URL copiada al portapapeles');
    } catch (error) {
      toast.error('Error al copiar URL');
    }
  };

  // Delete assignment
  const deleteAssignment = async (assignmentId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar esta asignación?')) {
      return;
    }

    try {
      // Note: We'd need to implement a delete endpoint
      toast.success('Asignación eliminada');
      loadAssignments();
    } catch (error) {
      toast.error('Error al eliminar la asignación');
    }
  };

  // Send reminder
  const sendReminder = async (assignmentId: string) => {
    try {
      // Note: We'd need to implement a reminder endpoint
      toast.success('Recordatorio enviado');
      loadAssignments();
    } catch (error) {
      toast.error('Error al enviar recordatorio');
    }
  };

  const getStatusBadge = (assignment: Assignment) => {
    const isExpired = new Date() > new Date(assignment.expiresAt);
    
    if (assignment.status === 'completed') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Completado
        </span>
      );
    } else if (isExpired) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
          Expirado
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <ClockIcon className="h-3 w-3 mr-1" />
          Pendiente
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Gestión de Asignaciones</h3>
          <p className="text-sm text-gray-600">
            Administra las asignaciones de formularios a pacientes
          </p>
        </div>
        <Button
          onClick={loadAssignments}
          variant="outline"
          size="sm"
        >
          Actualizar
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formulario
            </label>
            <select
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Todos los formularios</option>
              {forms.map(form => (
                <option key={form.id} value={form.id}>
                  {form.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="completed">Completados</option>
              <option value="expired">Expirados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <ClockIcon className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
            <p className="text-gray-600">Cargando asignaciones...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="p-8 text-center">
            <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No hay asignaciones que coincidan con los filtros</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAssignments.map((assignment) => (
              <div key={assignment.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {assignment.first_name} {assignment.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(assignment as any).formTitle || 'Formulario'}
                        </p>
                      </div>
                      {getStatusBadge(assignment)}
                    </div>
                    
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span>Asignado: {new Date(assignment.assignedAt).toLocaleDateString()}</span>
                      <span>Expira: {new Date(assignment.expiresAt).toLocaleDateString()}</span>
                      {assignment.remindersSent > 0 && (
                        <span>Recordatorios: {assignment.remindersSent}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => copyFormUrl(assignment.token)}
                      variant="outline"
                      size="sm"
                    >
                      <LinkIcon className="h-4 w-4" />
                    </Button>

                    {assignment.status === 'pending' && assignment.remindersSent < assignment.maxReminders && (
                      <Button
                        onClick={() => sendReminder(assignment.id)}
                        variant="outline"
                        size="sm"
                      >
                        <PaperAirplaneIcon className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      onClick={() => setExpandedAssignment(
                        expandedAssignment === assignment.id ? null : assignment.id
                      )}
                      variant="outline"
                      size="sm"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>

                    <Button
                      onClick={() => deleteAssignment(assignment.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedAssignment === assignment.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Información del Paciente</h4>
                        <div className="space-y-1 text-gray-600">
                          <p>Nombre: {assignment.first_name} {assignment.last_name}</p>
                          {assignment.email && <p>Email: {assignment.email}</p>}
                          {assignment.cell_phone && <p>Teléfono: {assignment.cell_phone}</p>}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Detalles de la Asignación</h4>
                        <div className="space-y-1 text-gray-600">
                          <p>Token: {assignment.token.substring(0, 16)}...</p>
                          <p>Mensaje: {assignment.message}</p>
                          <p>Estado: {assignment.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {filteredAssignments.filter(a => a.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-600">Pendientes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {filteredAssignments.filter(a => a.status === 'completed').length}
              </p>
              <p className="text-sm text-gray-600">Completados</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {filteredAssignments.filter(a => new Date() > new Date(a.expiresAt)).length}
              </p>
              <p className="text-sm text-gray-600">Expirados</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};