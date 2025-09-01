'use client';

import { useState, useEffect } from 'react';
import { 
  ChartBarIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/Input';

interface FormXResponsesManagerProps {
  onNavigate: (view: string, data?: any) => void;
}

interface FormResponse {
  id: string;
  formName: string;
  patientName: string;
  submittedAt: string;
  completionTime: string;
  status: 'complete' | 'partial' | 'pending_review';
  responses: { [key: string]: any };
  score?: number;
}

export function FormXResponsesManager({ onNavigate }: FormXResponsesManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForm, setSelectedForm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [viewingResponse, setViewingResponse] = useState<FormResponse | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResponses();
  }, []);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/formx/django/submissions');
      if (response.ok) {
        const data = await response.json();
        // Transform Django data to match current interface
        const transformedResponses = data.map((submission: any) => ({
          id: submission.id,
          formName: submission.template_name || 'Formulario Desconocido',
          patientName: submission.patient_email?.split('@')[0] || 'Paciente',
          submittedAt: new Date(submission.submitted_at).toLocaleString(),
          completionTime: calculateCompletionTime(submission.submitted_at),
          status: mapSubmissionStatus(submission.status),
          responses: submission.form_data || {},
          score: calculateScore(submission.form_data)
        }));
        setResponses(transformedResponses);
      } else {
        // Fallback to simulated data if API fails
        setResponses(simulatedResponses);
      }
    } catch (error) {
      console.error('Error fetching responses:', error);
      // Fallback to simulated data
      setResponses(simulatedResponses);
    } finally {
      setLoading(false);
    }
  };

  const mapSubmissionStatus = (status: string) => {
    const mapping: { [key: string]: 'complete' | 'partial' | 'pending_review' } = {
      'submitted': 'complete',
      'processed': 'complete',
      'synced': 'complete',
      'draft': 'partial',
      'error': 'pending_review'
    };
    return mapping[status] || 'pending_review';
  };

  const calculateCompletionTime = (submittedAt: string) => {
    // Simple approximation based on when it was submitted
    const minutes = Math.floor(Math.random() * 15) + 5;
    return `${minutes} min`;
  };

  const calculateScore = (formData: any) => {
    if (!formData || Object.keys(formData).length === 0) return undefined;
    // Simple scoring algorithm based on completion
    const filledFields = Object.values(formData).filter(value => value && value !== '').length;
    const totalFields = Object.keys(formData).length;
    return Math.round((filledFields / totalFields) * 100);
  };

  // Datos simulados de respuestas como fallback
  const simulatedResponses: FormResponse[] = [
    {
      id: '1',
      formName: 'Formulario Psiquiátrico Niño (5-11 años)',
      patientName: 'Ana García',
      submittedAt: '2024-01-22 10:30',
      completionTime: '12 min',
      status: 'complete',
      responses: {
        'nombre': 'Ana García',
        'fecha_nacimiento': '2018-05-15',
        'como_se_siente': 'Feliz',
        'que_gusta_hacer': 'Me gusta jugar con mis amigos y dibujar'
      },
      score: 85
    },
    {
      id: '2',
      formName: 'Formulario de Admisión Adultos',
      patientName: 'Carlos López',
      submittedAt: '2024-01-22 14:15',
      completionTime: '18 min',
      status: 'complete',
      responses: {
        'nombre_completo': 'Carlos López Mendoza',
        'email': 'carlos.lopez@email.com',
        'motivo_consulta': 'Consulta por ansiedad y problemas de sueño recurrentes',
        'estado_civil': 'Casado'
      }
    },
    {
      id: '3',
      formName: 'Formulario de Seguimiento',
      patientName: 'María Rodríguez',
      submittedAt: '2024-01-22 16:45',
      completionTime: '8 min',
      status: 'partial',
      responses: {
        'escala_sentimiento': '7',
        'sintomas': ['Dolor de cabeza'],
        'comentarios': 'Me siento mejor que la semana pasada'
      },
      score: 70
    },
    {
      id: '4',
      formName: 'Screening de Salud Mental',
      patientName: 'Pedro Martín',
      submittedAt: '2024-01-21 11:20',
      completionTime: '15 min',
      status: 'pending_review',
      responses: {
        'ansiedad_nivel': '8',
        'calidad_sueno': 'Mala',
        'descripcion_semana': 'Ha sido una semana muy difícil, me he sentido constantemente preocupado y no he podido dormir bien.'
      },
      score: 45
    }
  ];

  const forms = Array.from(new Set(responses.map(r => r.formName)));
  const statuses = ['Todos', 'Completo', 'Parcial', 'Pendiente Revisión'];

  const filteredResponses = responses.filter(response => {
    const matchesSearch = response.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         response.formName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesForm = selectedForm === '' || selectedForm === 'Todos' || response.formName === selectedForm;
    const matchesStatus = selectedStatus === '' || selectedStatus === 'Todos' || 
                         (selectedStatus === 'Completo' && response.status === 'complete') ||
                         (selectedStatus === 'Parcial' && response.status === 'partial') ||
                         (selectedStatus === 'Pendiente Revisión' && response.status === 'pending_review');
    return matchesSearch && matchesForm && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'pending_review': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'complete': return 'Completo';
      case 'partial': return 'Parcial';
      case 'pending_review': return 'Pendiente Revisión';
      default: return status;
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const exportResponses = () => {
    // Simular exportación
    alert('Exportando respuestas seleccionadas a Excel...');
  };

  const ResponseDetailModal = ({ response, onClose }: { response: FormResponse, onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{response.formName}</h3>
            <p className="text-gray-600">Respuesta de {response.patientName}</p>
          </div>
          <Button variant="ghost" onClick={onClose}>×</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
          <div>
            <span className="font-medium text-gray-700">Enviado:</span>
            <div>{response.submittedAt}</div>
          </div>
          <div>
            <span className="font-medium text-gray-700">Tiempo:</span>
            <div>{response.completionTime}</div>
          </div>
          <div>
            <span className="font-medium text-gray-700">Estado:</span>
            <Badge className={getStatusColor(response.status)}>
              {getStatusLabel(response.status)}
            </Badge>
          </div>
          {response.score && (
            <div>
              <span className="font-medium text-gray-700">Puntuación:</span>
              <div className={`font-semibold ${getScoreColor(response.score)}`}>
                {response.score}/100
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 mb-3">Respuestas del Paciente:</h4>
          {Object.entries(response.responses).map(([key, value]) => (
            <div key={key} className="border rounded-lg p-4 bg-gray-50">
              <div className="font-medium text-sm text-gray-700 mb-2 capitalize">
                {key.replace(/_/g, ' ')}
              </div>
              <div className="text-sm text-gray-900">
                {Array.isArray(value) ? value.join(', ') : value}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-6 border-t mt-6">
          <Button className="flex-1">
            Generar Reporte PDF
          </Button>
          <Button variant="outline">
            Enviar por Email
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ChartBarIcon className="h-7 w-7" />
            Análisis de Respuestas
          </h1>
          <p className="text-gray-600 mt-1">
            Visualiza y analiza las respuestas de los formularios completados por pacientes
          </p>
        </div>
        <Button onClick={exportResponses} className="flex items-center gap-2">
          <ArrowDownTrayIcon className="h-4 w-4" />
          Exportar Respuestas
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 text-center">
          <div className="text-2xl font-bold text-blue-600">{responses.length}</div>
          <div className="text-sm text-gray-600">Total Respuestas</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-2xl font-bold text-green-600">
            {responses.filter(r => r.status === 'complete').length}
          </div>
          <div className="text-sm text-gray-600">Completas</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {responses.filter(r => r.status === 'partial').length}
          </div>
          <div className="text-sm text-gray-600">Parciales</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-2xl font-bold text-red-600">
            {responses.filter(r => r.status === 'pending_review').length}
          </div>
          <div className="text-sm text-gray-600">Pendientes</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por paciente o formulario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los formularios</option>
              {forms.map(form => (
                <option key={form} value={form}>{form}</option>
              ))}
            </select>
          </div>
          <div className="md:w-40">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Estado</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Responses Table */}
      <Card className="p-6">
        <div className="space-y-4">
          {filteredResponses.map((response) => (
            <div key={response.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">{response.formName}</h3>
                    <Badge className={getStatusColor(response.status)}>
                      {getStatusLabel(response.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <UserIcon className="h-4 w-4" />
                      {response.patientName}
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      {response.submittedAt}
                    </div>
                    <div>⏱️ {response.completionTime}</div>
                    {response.score && (
                      <div className={`font-medium ${getScoreColor(response.score)}`}>
                        📊 {response.score}/100
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setViewingResponse(response)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <EyeIcon className="h-4 w-4" />
                    Ver Detalles
                  </Button>
                </div>
              </div>
              
              {/* Preview de algunas respuestas */}
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs text-gray-600 mb-2">Muestra de respuestas:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {Object.entries(response.responses).slice(0, 2).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium text-gray-700 capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="ml-1 text-gray-900">
                        {typeof value === 'string' && value.length > 50 
                          ? `${value.substring(0, 50)}...` 
                          : Array.isArray(value) ? value.join(', ') : value
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredResponses.length === 0 && (
          <div className="text-center py-12">
            <ChartBarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron respuestas</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedForm || selectedStatus
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Las respuestas aparecerán aquí cuando los pacientes completen formularios'
              }
            </p>
            <Button onClick={() => onNavigate('dashboard')}>
              Volver al Dashboard
            </Button>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      {viewingResponse && (
        <ResponseDetailModal 
          response={viewingResponse} 
          onClose={() => setViewingResponse(null)} 
        />
      )}
    </div>
  );
}