'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/providers/AuthProvider';
import { 
  UserIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ClipboardDocumentListIcon,
  PhoneIcon,
  EnvelopeIcon,
  TagIcon,
  ViewColumnsIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { authGet, authPost } from '@/lib/api/auth-fetch';

interface Patient {
  id: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  cell_phone: string;
  email: string;
  integration_level: 'none' | 'basic' | 'complete';
  created_at: string;
}

interface QuickStats {
  todayAppointments: number;
  todayPayments: number;
  pendingPayments: number;
  totalPatients: number;
  newPatientsWeek: number;
}

interface PrescriptionFollowUp {
  patientId: string;
  patientName: string;
  medication: string;
  medicationType: 'grupo_ii' | 'grupo_iii';
  lastDelivery: string;
  notes?: string;
}

function FrontDeskContent() {
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<QuickStats>({
    todayAppointments: 0,
    todayPayments: 0,
    pendingPayments: 0,
    totalPatients: 0,
    newPatientsWeek: 0
  });

  // Modals
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showQuickPayModal, setShowQuickPayModal] = useState(false);
  const [showPatientSearchModal, setShowPatientSearchModal] = useState(false);

  // Prescription follow-up data
  const [selectedMedication, setSelectedMedication] = useState<'grupo_ii' | 'grupo_iii'>('grupo_ii');
  const [prescriptionNotes, setPrescriptionNotes] = useState('');

  useEffect(() => {
    if (user && session && !authLoading) {
      loadDashboardData();
    }
  }, [user, session, authLoading]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load today's stats
      const statsResponse = await authGet('/api/frontdesk/stats/today');
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data.results || data.data || stats);
      }

      // Load recent patients for quick access
      const patientsResponse = await authGet('/api/expedix/django/patients?limit=20');
      if (patientsResponse.ok) {
        const data = await patientsResponse.json();
        setPatients(data.results || data.data || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSearch = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setPatients([]);
      return;
    }

    try {
      setLoading(true);
      const response = await authGet(`/api/expedix/django/patients/search?q=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setPatients(data.results || data.data || []);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      toast.error('Error al buscar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAppointment = (patient?: Patient) => {
    if (patient) {
      router.push(`/hubs/agenda?patient=${patient.id}&action=schedule`);
    } else {
      router.push('/hubs/agenda?action=new');
    }
  };

  const handleQuickPayment = (patient?: Patient) => {
    setSelectedPatient(patient || null);
    setShowQuickPayModal(true);
  };

  const handlePrescriptionFollowUp = async () => {
    if (!selectedPatient) return;

    try {
      const followUpData: PrescriptionFollowUp = {
        patientId: selectedPatient.id,
        patientName: `${selectedPatient.first_name} ${selectedPatient.paternal_last_name}`,
        medication: selectedMedication === 'grupo_ii' ? 'Medicamento Grupo II' : 'Medicamento Grupo III',
        medicationType: selectedMedication,
        lastDelivery: new Date().toISOString(),
        notes: prescriptionNotes
      };

      const response = await authPost('/api/expedix/django/prescription-followup', followUpData);
      
      if (response.ok) {
        toast.success('Entrega de receta registrada exitosamente');
        setShowPrescriptionModal(false);
        setPrescriptionNotes('');
        setSelectedPatient(null);
      } else {
        toast.error('Error al registrar la entrega de receta');
      }
    } catch (error) {
      console.error('Error registering prescription follow-up:', error);
      toast.error('Error al registrar la entrega');
    }
  };

  const getPatientFullName = (patient: Patient) => {
    return `${patient.first_name} ${patient.paternal_last_name} ${patient.maternal_last_name || ''}`.trim();
  };

  const getIntegrationLevelBadge = (level: string) => {
    const badges = {
      'none': { color: 'bg-red-100 text-red-800', text: 'Sin integrar' },
      'basic': { color: 'bg-yellow-100 text-yellow-800', text: 'Básico' },
      'complete': { color: 'bg-green-100 text-green-800', text: 'Completo' }
    };
    const badge = badges[level as keyof typeof badges] || badges.none;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const filteredPatients = patients.filter(patient => 
    getPatientFullName(patient).toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.cell_phone.includes(searchTerm) ||
    (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if user is not authenticated
  if (!user || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ClipboardDocumentListIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600 mb-4">Necesitas iniciar sesión para acceder al FrontDesk</p>
          <Link href="/auth/sign-in">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Iniciar Sesión
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <PageHeader
        title="FrontDesk - Dashboard Secretaria"
        description="Gestión rápida de citas, cobros, pacientes y seguimientos"
        icon={ViewColumnsIcon}
        iconColor="text-blue-600"
        actions={
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <ClockIcon className="h-4 w-4 inline mr-1" />
              {new Date().toLocaleDateString('es-MX', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <Link href="/hubs">
              <Button variant="outline">
                <HomeIcon className="h-4 w-4 mr-2" />
                Dashboard Principal
              </Button>
            </Link>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Citas Hoy</p>
                <p className="text-2xl font-bold text-blue-600">{stats.todayAppointments}</p>
              </div>
              <CalendarDaysIcon className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cobros Hoy</p>
                <p className="text-2xl font-bold text-green-600">{stats.todayPayments}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingPayments}</p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-orange-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pacientes</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalPatients}</p>
              </div>
              <UsersIcon className="h-8 w-8 text-purple-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Nuevos (Semana)</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.newPatientsWeek}</p>
              </div>
              <PlusIcon className="h-8 w-8 text-indigo-500" />
            </div>
          </Card>
        </div>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <Button 
            onClick={() => handleQuickAppointment()}
            className="bg-purple-600 hover:bg-purple-700 text-white p-4 flex flex-col items-center justify-center h-20"
          >
            <CalendarDaysIcon className="h-6 w-6 mb-1" />
            <span className="text-sm">Nueva Cita</span>
          </Button>

          <Button 
            onClick={() => setShowNewPatientModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 flex flex-col items-center justify-center h-20"
          >
            <UserIcon className="h-6 w-6 mb-1" />
            <span className="text-sm">Nuevo Paciente</span>
          </Button>

          <Button 
            onClick={() => handleQuickPayment()}
            className="bg-green-600 hover:bg-green-700 text-white p-4 flex flex-col items-center justify-center h-20"
          >
            <CurrencyDollarIcon className="h-6 w-6 mb-1" />
            <span className="text-sm">Cobro Rápido</span>
          </Button>

          <Button 
            onClick={() => setShowPrescriptionModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white p-4 flex flex-col items-center justify-center h-20"
          >
            <DocumentTextIcon className="h-6 w-6 mb-1" />
            <span className="text-sm">Entrega Receta</span>
          </Button>

          <Button 
            onClick={() => setShowPatientSearchModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 flex flex-col items-center justify-center h-20"
          >
            <MagnifyingGlassIcon className="h-6 w-6 mb-1" />
            <span className="text-sm">Buscar Paciente</span>
          </Button>

          <Link href="/hubs/resources">
            <Button 
              className="bg-pink-600 hover:bg-pink-700 text-white p-4 flex flex-col items-center justify-center h-20 w-full"
            >
              <DocumentTextIcon className="h-6 w-6 mb-1" />
              <span className="text-sm">Recursos</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Search & Quick Actions */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Búsqueda Rápida de Pacientes</h3>
                <Button 
                  onClick={() => setShowPatientSearchModal(true)}
                  variant="outline" 
                  size="sm"
                >
                  <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
                  Búsqueda Avanzada
                </Button>
              </div>

              <div className="relative mb-4">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, teléfono o email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    handlePatientSearch(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredPatients.map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{getPatientFullName(patient)}</div>
                        <div className="text-sm text-gray-600 flex items-center space-x-2">
                          <PhoneIcon className="h-4 w-4" />
                          <span>{patient.cell_phone}</span>
                          {patient.email && (
                            <>
                              <EnvelopeIcon className="h-4 w-4" />
                              <span>{patient.email}</span>
                            </>
                          )}
                        </div>
                        <div className="mt-1">
                          {getIntegrationLevelBadge(patient.integration_level)}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleQuickAppointment(patient)}
                        size="sm"
                        variant="outline"
                      >
                        <CalendarDaysIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleQuickPayment(patient)}
                        size="sm"
                        variant="outline"
                      >
                        <CurrencyDollarIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowPrescriptionModal(true);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <DocumentTextIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredPatients.length === 0 && searchTerm && (
                <div className="text-center py-8">
                  <UsersIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No se encontraron pacientes con "{searchTerm}"</p>
                </div>
              )}
            </Card>
          </div>

          {/* Quick Links & Timeline */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Accesos Directos</h3>
              <div className="space-y-3">
                <Link href="/hubs/expedix" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
                    Gestión de Expedientes
                  </Button>
                </Link>
                <Link href="/hubs/agenda" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarDaysIcon className="h-4 w-4 mr-2" />
                    Agenda Completa
                  </Button>
                </Link>
                <Link href="/hubs/finance" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                    Sistema de Cobros
                  </Button>
                </Link>
                <Link href="/hubs/clinimetrix" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <StarIcon className="h-4 w-4 mr-2" />
                    Evaluaciones Clínicas
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notas Rápidas</h3>
              <textarea
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notas rápidas para el día..."
              />
              <Button size="sm" className="mt-2 w-full">Guardar Nota</Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Prescription Follow-up Modal */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Entrega de Receta de Seguimiento</h3>
            
            {selectedPatient && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-900">{getPatientFullName(selectedPatient)}</p>
                <p className="text-sm text-blue-700">{selectedPatient.cell_phone}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Medicamento Controlado
                </label>
                <select
                  value={selectedMedication}
                  onChange={(e) => setSelectedMedication(e.target.value as 'grupo_ii' | 'grupo_iii')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="grupo_ii">Grupo II - Controlados</option>
                  <option value="grupo_iii">Grupo III - Psicotrópicos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas Adicionales
                </label>
                <textarea
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Notas sobre la entrega de receta..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => {
                  setShowPrescriptionModal(false);
                  setSelectedPatient(null);
                  setPrescriptionNotes('');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handlePrescriptionFollowUp}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                Registrar Entrega
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FrontDeskPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <div className="text-center">
          <p className="text-gray-900 font-medium">Cargando FrontDesk...</p>
        </div>
      </div>
    }>
      <FrontDeskContent />
    </Suspense>
  );
}