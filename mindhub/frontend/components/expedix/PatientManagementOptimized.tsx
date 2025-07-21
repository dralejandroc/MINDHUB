'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  PlusIcon, 
  MagnifyingGlassIcon, 
  CalendarIcon, 
  ClipboardDocumentListIcon, 
  BookOpenIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { 
  Button, 
  Input, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Loading, 
  Modal 
} from '@/components/shared';
import { cn, formatDate, getInitials, isTabletDevice } from '@/lib/utils';
import { getHubColor } from '@/lib/design-system';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  lastVisit?: string;
  nextAppointment?: string;
  status: 'active' | 'inactive' | 'pending';
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalRecord?: {
    allergies: string[];
    medications: string[];
    conditions: string[];
  };
}

interface PatientManagementOptimizedProps {
  onSelectPatient?: (patient: Patient) => void;
  onNewPatient?: () => void;
  onNewConsultation?: (patient: Patient) => void;
  onClinicalAssessment?: (patient: Patient) => void;
}

const PatientManagementOptimized: React.FC<PatientManagementOptimizedProps> = ({
  onSelectPatient,
  onNewPatient,
  onNewConsultation,
  onClinicalAssessment
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock data for demonstration
  const mockPatients: Patient[] = [
    {
      id: '1',
      name: 'María González Rodríguez',
      email: 'maria.gonzalez@email.com',
      phone: '+52 55 1234 5678',
      dateOfBirth: '1985-03-15',
      lastVisit: '2024-01-10',
      nextAppointment: '2024-01-25',
      status: 'active',
      address: 'Av. Reforma 123, Col. Centro, CDMX',
      emergencyContact: {
        name: 'Carlos González',
        phone: '+52 55 8765 4321',
        relationship: 'Esposo'
      },
      medicalRecord: {
        allergies: ['Polen', 'Mariscos'],
        medications: ['Sertralina 50mg'],
        conditions: ['Ansiedad generalizada']
      }
    },
    {
      id: '2',
      name: 'Juan Carlos Mendoza',
      email: 'juan.mendoza@email.com',
      phone: '+52 55 2345 6789',
      dateOfBirth: '1978-11-22',
      lastVisit: '2024-01-12',
      status: 'active',
      address: 'Calle Insurgentes 456, Col. Roma, CDMX',
      emergencyContact: {
        name: 'Ana Mendoza',
        phone: '+52 55 9876 5432',
        relationship: 'Hermana'
      },
      medicalRecord: {
        allergies: [],
        medications: ['Fluoxetina 20mg'],
        conditions: ['Depresión mayor']
      }
    },
    {
      id: '3',
      name: 'Ana Patricia López',
      email: 'ana.lopez@email.com',
      phone: '+52 55 3456 7890',
      dateOfBirth: '1992-07-08',
      lastVisit: '2024-01-08',
      nextAppointment: '2024-01-30',
      status: 'pending',
      address: 'Blvd. Ávila Camacho 789, Naucalpan, Edo. Méx.',
      emergencyContact: {
        name: 'Roberto López',
        phone: '+52 55 5432 1098',
        relationship: 'Padre'
      },
      medicalRecord: {
        allergies: ['Penicilina'],
        medications: [],
        conditions: ['Trastorno bipolar']
      }
    }
  ];

  useEffect(() => {
    const checkDevice = () => {
      setIsTablet(isTabletDevice());
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPatients(mockPatients);
      setLoading(false);
    };

    loadPatients();
  }, []);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientDetails(true);
    onSelectPatient?.(patient);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'pending':
        return 'Pendiente';
      case 'inactive':
        return 'Inactivo';
      default:
        return 'Desconocido';
    }
  };

  const PatientCard: React.FC<{ patient: Patient }> = ({ patient }) => (
    <Card
      interactive
      touchOptimized={isTablet}
      className={cn(
        'transition-all duration-200 hover:shadow-lg',
        isTablet && 'min-h-[200px]'
      )}
      onClick={() => handlePatientClick(patient)}
    >
      <CardContent className="p-0">
        <div className={cn('p-4', isTablet && 'p-6')}>
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={cn(
                'rounded-full bg-gradient-to-br from-expedix-400 to-expedix-600 flex items-center justify-center text-white font-semibold',
                isTablet ? 'h-12 w-12 text-base' : 'h-10 w-10 text-sm'
              )}>
                {getInitials(patient.name)}
              </div>
              <div>
                <h3 className={cn(
                  'font-semibold text-gray-900',
                  isTablet ? 'text-lg' : 'text-base'
                )}>
                  {patient.name}
                </h3>
                <p className={cn(
                  'text-gray-600',
                  isTablet ? 'text-sm' : 'text-xs'
                )}>
                  ID: {patient.id}
                </p>
              </div>
            </div>
            
            <span className={cn(
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
              getStatusColor(patient.status)
            )}>
              {getStatusLabel(patient.status)}
            </span>
          </div>

          {/* Contact Info */}
          <div className={cn('space-y-2', isTablet ? 'text-sm' : 'text-xs')}>
            <div className="flex items-center text-gray-600">
              <EnvelopeIcon className={cn('flex-shrink-0 mr-2', isTablet ? 'h-4 w-4' : 'h-3 w-3')} />
              <span className="truncate">{patient.email}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <PhoneIcon className={cn('flex-shrink-0 mr-2', isTablet ? 'h-4 w-4' : 'h-3 w-3')} />
              <span>{patient.phone}</span>
            </div>
          </div>

          {/* Last Visit / Next Appointment */}
          <div className={cn('mt-4 pt-3 border-t border-gray-100', isTablet ? 'text-sm' : 'text-xs')}>
            {patient.lastVisit && (
              <div className="flex items-center text-gray-500 mb-1">
                <ClockIcon className={cn('flex-shrink-0 mr-2', isTablet ? 'h-4 w-4' : 'h-3 w-3')} />
                <span>Última visita: {formatDate(patient.lastVisit)}</span>
              </div>
            )}
            {patient.nextAppointment && (
              <div className="flex items-center text-expedix-600 font-medium">
                <CalendarIcon className={cn('flex-shrink-0 mr-2', isTablet ? 'h-4 w-4' : 'h-3 w-3')} />
                <span>Próxima cita: {formatDate(patient.nextAppointment)}</span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className={cn('mt-4 flex space-x-2', isTablet && 'space-x-3')}>
            <Button
              size={isTablet ? "md" : "sm"}
              variant="outline"
              touchOptimized={isTablet}
              onClick={(e) => {
                e.stopPropagation();
                onNewConsultation?.(patient);
              }}
              className="flex-1"
            >
              <ClipboardDocumentListIcon className={cn('mr-1', isTablet ? 'h-4 w-4' : 'h-3 w-3')} />
              Consulta
            </Button>
            <Button
              size={isTablet ? "md" : "sm"}
              variant="outline"
              touchOptimized={isTablet}
              onClick={(e) => {
                e.stopPropagation();
                // Handle resources
              }}
              className="flex-1"
            >
              <BookOpenIcon className={cn('mr-1', isTablet ? 'h-4 w-4' : 'h-3 w-3')} />
              Recursos
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const PatientListItem: React.FC<{ patient: Patient }> = ({ patient }) => (
    <Card
      interactive
      touchOptimized={isTablet}
      className="hover:shadow-md transition-all duration-200"
      onClick={() => handlePatientClick(patient)}
    >
      <CardContent className="p-0">
        <div className={cn('p-4 flex items-center justify-between', isTablet && 'p-6')}>
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className={cn(
              'rounded-full bg-gradient-to-br from-expedix-400 to-expedix-600 flex items-center justify-center text-white font-semibold flex-shrink-0',
              isTablet ? 'h-12 w-12 text-base' : 'h-10 w-10 text-sm'
            )}>
              {getInitials(patient.name)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-1">
                <h3 className={cn(
                  'font-semibold text-gray-900 truncate',
                  isTablet ? 'text-lg' : 'text-base'
                )}>
                  {patient.name}
                </h3>
                <span className={cn(
                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                  getStatusColor(patient.status)
                )}>
                  {getStatusLabel(patient.status)}
                </span>
              </div>
              
              <div className={cn('flex items-center space-x-4 text-gray-600', isTablet ? 'text-sm' : 'text-xs')}>
                <span className="flex items-center">
                  <EnvelopeIcon className="h-3 w-3 mr-1" />
                  {patient.email}
                </span>
                <span className="flex items-center">
                  <PhoneIcon className="h-3 w-3 mr-1" />
                  {patient.phone}
                </span>
                {patient.nextAppointment && (
                  <span className="flex items-center text-expedix-600 font-medium">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {formatDate(patient.nextAppointment)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={cn('flex space-x-2 ml-4', isTablet && 'space-x-3')}>
            <Button
              size={isTablet ? "md" : "sm"}
              variant="outline"
              touchOptimized={isTablet}
              onClick={(e) => {
                e.stopPropagation();
                onNewConsultation?.(patient);
              }}
            >
              <ClipboardDocumentListIcon className={cn('mr-1', isTablet ? 'h-4 w-4' : 'h-3 w-3')} />
              Consulta
            </Button>
            <Button
              size={isTablet ? "md" : "sm"}
              variant="outline"
              touchOptimized={isTablet}
              onClick={(e) => {
                e.stopPropagation();
                // Handle resources
              }}
            >
              <BookOpenIcon className={cn('mr-1', isTablet ? 'h-4 w-4' : 'h-3 w-3')} />
              Recursos
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="h-96">
        <Loading variant="spinner" size="lg" text="Cargando pacientes..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className={cn(
            'font-bold text-gray-900',
            isTablet ? 'text-3xl' : 'text-2xl'
          )}>
            Gestión de Pacientes
          </h1>
          <p className={cn(
            'text-gray-600 mt-1',
            isTablet ? 'text-lg' : 'text-base'
          )}>
            Administra y da seguimiento a tus pacientes
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Button
            variant="outline"
            touchOptimized={isTablet}
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? 'Vista Lista' : 'Vista Tarjetas'}
          </Button>
          <Button
            variant="primary"
            touchOptimized={isTablet}
            onClick={onNewPatient}
            icon={<PlusIcon className="h-5 w-5" />}
          >
            Nuevo Paciente
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent>
          <Input
            placeholder="Buscar pacientes por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
            touchOptimized={isTablet}
            fullWidth
          />
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="text-center">
            <div className={cn('text-2xl font-bold text-expedix-600', isTablet && 'text-3xl')}>
              {filteredPatients.length}
            </div>
            <div className={cn('text-gray-600', isTablet ? 'text-base' : 'text-sm')}>
              Pacientes
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <div className={cn('text-2xl font-bold text-blue-600', isTablet && 'text-3xl')}>
              {filteredPatients.filter(p => p.nextAppointment).length}
            </div>
            <div className={cn('text-gray-600', isTablet ? 'text-base' : 'text-sm')}>
              Citas Programadas
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <div className={cn('text-2xl font-bold text-green-600', isTablet && 'text-3xl')}>
              {filteredPatients.filter(p => p.status === 'active').length}
            </div>
            <div className={cn('text-gray-600', isTablet ? 'text-base' : 'text-sm')}>
              Activos
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <div className={cn('text-2xl font-bold text-yellow-600', isTablet && 'text-3xl')}>
              {filteredPatients.filter(p => p.status === 'pending').length}
            </div>
            <div className={cn('text-gray-600', isTablet ? 'text-base' : 'text-sm')}>
              Pendientes
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patients List/Grid */}
      <div>
        {filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className={cn('font-medium text-gray-900 mb-2', isTablet ? 'text-xl' : 'text-lg')}>
                No se encontraron pacientes
              </h3>
              <p className={cn('text-gray-500', isTablet ? 'text-base' : 'text-sm')}>
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Comienza agregando tu primer paciente'
                }
              </p>
              {!searchTerm && (
                <Button
                  variant="primary"
                  className="mt-4"
                  touchOptimized={isTablet}
                  onClick={onNewPatient}
                  icon={<PlusIcon className="h-5 w-5" />}
                >
                  Agregar Paciente
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className={cn(
            viewMode === 'grid' 
              ? `grid gap-4 ${isTablet ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`
              : 'space-y-3'
          )}>
            {filteredPatients.map((patient) => 
              viewMode === 'grid' 
                ? <PatientCard key={patient.id} patient={patient} />
                : <PatientListItem key={patient.id} patient={patient} />
            )}
          </div>
        )}
      </div>

      {/* Patient Details Modal */}
      <Modal
        isOpen={showPatientDetails}
        onClose={() => setShowPatientDetails(false)}
        title={selectedPatient ? `Detalles de ${selectedPatient.name}` : ''}
        size={isTablet ? 'xl' : 'lg'}
      >
        {selectedPatient && (
          <div className="space-y-6">
            {/* Patient Info */}
            <div className="flex items-start space-x-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-expedix-400 to-expedix-600 flex items-center justify-center text-white font-bold text-xl">
                {getInitials(selectedPatient.name)}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">{selectedPatient.name}</h3>
                <p className="text-gray-600">ID: {selectedPatient.id}</p>
                <span className={cn(
                  'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border mt-2',
                  getStatusColor(selectedPatient.status)
                )}>
                  {getStatusLabel(selectedPatient.status)}
                </span>
              </div>
            </div>

            {/* Contact & Personal Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card variant="outlined">
                <CardHeader>
                  <CardTitle>Información de Contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    <span>{selectedPatient.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <span>{selectedPatient.phone}</span>
                  </div>
                  {selectedPatient.address && (
                    <div className="flex items-start space-x-3">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                      <span>{selectedPatient.address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Fecha de Nacimiento:</span>
                    <p className="font-medium">{formatDate(selectedPatient.dateOfBirth)}</p>
                  </div>
                  {selectedPatient.lastVisit && (
                    <div>
                      <span className="text-sm text-gray-600">Última Visita:</span>
                      <p className="font-medium">{formatDate(selectedPatient.lastVisit)}</p>
                    </div>
                  )}
                  {selectedPatient.nextAppointment && (
                    <div>
                      <span className="text-sm text-gray-600">Próxima Cita:</span>
                      <p className="font-medium text-expedix-600">{formatDate(selectedPatient.nextAppointment)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Emergency Contact */}
            {selectedPatient.emergencyContact && (
              <Card variant="outlined">
                <CardHeader>
                  <CardTitle>Contacto de Emergencia</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Nombre:</span>
                      <p className="font-medium">{selectedPatient.emergencyContact.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Teléfono:</span>
                      <p className="font-medium">{selectedPatient.emergencyContact.phone}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Relación:</span>
                      <p className="font-medium">{selectedPatient.emergencyContact.relationship}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Medical Record */}
            {selectedPatient.medicalRecord && (
              <Card variant="outlined">
                <CardHeader>
                  <CardTitle>Resumen Médico</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-600 font-medium">Alergias:</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selectedPatient.medicalRecord.allergies.length > 0 ? (
                        selectedPatient.medicalRecord.allergies.map((allergy, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {allergy}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">Sin alergias conocidas</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-600 font-medium">Medicamentos:</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selectedPatient.medicalRecord.medications.length > 0 ? (
                        selectedPatient.medicalRecord.medications.map((medication, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {medication}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">Sin medicamentos actuales</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-600 font-medium">Condiciones:</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selectedPatient.medicalRecord.conditions.length > 0 ? (
                        selectedPatient.medicalRecord.conditions.map((condition, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {condition}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">Sin condiciones diagnosticadas</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-4 border-t">
              <Button
                variant="primary"
                fullWidth
                touchOptimized={isTablet}
                onClick={() => onNewConsultation?.(selectedPatient)}
                icon={<ClipboardDocumentListIcon className="h-5 w-5" />}
              >
                Nueva Consulta
              </Button>
              <Button
                variant="outline"
                fullWidth
                touchOptimized={isTablet}
                onClick={() => onClinicalAssessment?.(selectedPatient)}
                icon={<ClipboardDocumentListIcon className="h-5 w-5" />}
              >
                Evaluación Clínica
              </Button>
              <Button
                variant="outline"
                fullWidth
                touchOptimized={isTablet}
                icon={<BookOpenIcon className="h-5 w-5" />}
              >
                Enviar Recursos
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PatientManagementOptimized;