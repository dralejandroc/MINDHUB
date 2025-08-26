'use client';

import { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  PlusIcon, 
  MagnifyingGlassIcon, 
  CalendarIcon, 
  DocumentTextIcon, 
  DocumentChartBarIcon,
  BookOpenIcon,
  ChevronDownIcon,
  Squares2X2Icon,
  ListBulletIcon,
  TagIcon,
  PhoneIcon,
  ClockIcon,
  HeartIcon,
  PencilSquareIcon,
  FunnelIcon,
  PresentationChartLineIcon,
  DocumentArrowDownIcon,
  ChatBubbleLeftEllipsisIcon,
  NewspaperIcon,
  CogIcon,
  ClipboardDocumentListIcon,
  FolderOpenIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useExpedixApi, type Patient } from '@/lib/api/expedix-client';
import { patientTagsApi, type PatientTag } from '@/lib/api/patient-tags-client';

interface PatientManagementAdvancedProps {
  onSelectPatient: (patient: Patient) => void;
  onNewPatient: () => void;
  onNewConsultation: (patient: Patient) => void;
  onClinicalAssessment: (patient: Patient) => void;
  onScheduleAppointment?: (patient: Patient) => void;
  onSettings?: () => void;
  onChangeView?: (view: 'cards' | 'timeline') => void;
}

type ViewMode = 'list' | 'cards';
type PatientStatus = 'active' | 'inactive';


interface EnhancedPatient extends Patient {
  tags: PatientTag[];
  consultationsCount: number;
  prescriptionsCount: number;
  lastConsultationDate?: string;
  followUpStartDate?: string;
  followUpStatus: PatientStatus;
  followUpDuration?: string;
  currentMedications: string[];
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
}

export default function PatientManagementAdvanced({
  onSelectPatient,
  onNewPatient,
  onNewConsultation,
  onClinicalAssessment,
  onScheduleAppointment,
  onSettings,
  onChangeView
}: PatientManagementAdvancedProps) {
  // Use the authenticated Expedix API hook
  const expedixApi = useExpedixApi();
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<EnhancedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<PatientStatus | 'all'>('all');
  const [availableTags, setAvailableTags] = useState<PatientTag[]>([]);
  const [showTagManager, setShowTagManager] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Fetch patients with enhanced data
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await expedixApi.getPatients(searchTerm || undefined);
      
      // Enhance patient data with additional information
      // PERFORMANCE FIX: Use pre-calculated counts from backend instead of N+1 queries
      const enhancedPatients: EnhancedPatient[] = response.data.map((patient) => {
        try {
          // Use pre-calculated counts from the patient object instead of individual API calls
          const consultationsCount = patient.consultations_count || 0;
          const prescriptionsCount = patient.prescriptions?.length || 0;
          const lastConsultationDate = patient.appointments?.[0]?.appointment_date;
            
            // Calculate follow-up status and duration
            const followUpStartDate = patient.appointments?.[patient.appointments.length - 1]?.appointment_date;
            const followUpStatus = calculateFollowUpStatus(lastConsultationDate);
            const followUpDuration = calculateFollowUpDuration(followUpStartDate, lastConsultationDate, followUpStatus);
            
            // Get current medications
            const currentMedications = patient.prescriptions
              ?.filter(p => p.status === 'active')
              ?.map(p => p.medications?.[0]?.name)
              ?.filter(Boolean) || [];

            // Calculate risk level based on various factors
            const riskLevel = calculateRiskLevel(patient, consultationsCount, lastConsultationDate);

            // Generate patient tags synchronously (performance optimization)
            const tags = generatePatientTagsSync(patient, riskLevel);

            return {
              ...patient,
              tags,
              consultationsCount,
              prescriptionsCount,
              lastConsultationDate,
              followUpStartDate,
              followUpStatus,
              followUpDuration,
              currentMedications,
              riskLevel
            } as EnhancedPatient;
          } catch (err) {
            console.error(`Error enhancing patient ${patient.id}:`, err);
            return {
              ...patient,
              tags: [],
              consultationsCount: 0,
              prescriptionsCount: 0,
              followUpStatus: 'inactive' as PatientStatus,
              currentMedications: [],
              riskLevel: 'low' as const
            } as EnhancedPatient;
          }
        });

      setPatients(enhancedPatients);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients');
      console.error('❌ Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate follow-up status
  const calculateFollowUpStatus = (lastConsultationDate?: string): PatientStatus => {
    if (!lastConsultationDate) return 'inactive';
    
    const lastDate = new Date(lastConsultationDate);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Inactive after 365 days (1 year) without consultation
    return daysDiff > 365 ? 'inactive' : 'active';
  };

  // Calculate follow-up duration
  const calculateFollowUpDuration = (startDate?: string, endDate?: string, status?: PatientStatus): string => {
    if (!startDate) return 'Sin seguimiento';
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} días`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'mes' : 'meses'}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return `${years} ${years === 1 ? 'año' : 'años'}${remainingMonths > 0 ? ` ${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}` : ''}`;
    }
  };

  // Calculate risk level based on patient data
  const calculateRiskLevel = (patient: Patient, consultationsCount: number, lastConsultationDate?: string): 'low' | 'moderate' | 'high' | 'critical' => {
    let riskScore = 0;
    
    // Age factor
    if (patient.age >= 65) riskScore += 2;
    else if (patient.age >= 50) riskScore += 1;
    
    // Consultation frequency
    if (consultationsCount === 0) riskScore += 3;
    else if (consultationsCount < 3) riskScore += 2;
    else if (consultationsCount < 6) riskScore += 1;
    
    // Time since last consultation
    if (lastConsultationDate) {
      const daysSinceLastConsultation = Math.floor(
        (new Date().getTime() - new Date(lastConsultationDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastConsultation > 180) riskScore += 2;
      else if (daysSinceLastConsultation > 90) riskScore += 1;
    } else {
      riskScore += 3;
    }
    
    if (riskScore >= 6) return 'critical';
    if (riskScore >= 4) return 'high';
    if (riskScore >= 2) return 'moderate';
    return 'low';
  };

  // Generate tags synchronously for performance (avoids async map issues)
  const generatePatientTagsSync = (patient: Patient, riskLevel: string): PatientTag[] => {
    // Generate default tags based on patient data (synchronous version)
    const defaultTags = patientTagsApi.getDefaultTags();
    const patientTags: PatientTag[] = [];
    
    // Add status tag
    const statusTag = defaultTags.find(tag => tag.id === 'status-active');
    if (statusTag) patientTags.push(statusTag);
    
    // Add age group tag
    let ageTagId = 'age-adult';
    if (patient.age < 18) ageTagId = 'age-child';
    else if (patient.age < 25) ageTagId = 'age-adolescent';
    else if (patient.age >= 65) ageTagId = 'age-senior';
    
    const ageTag = defaultTags.find(tag => tag.id === ageTagId);
    if (ageTag) patientTags.push(ageTag);
    
    // Add risk level tag
    const riskTag = defaultTags.find(tag => tag.id === `risk-${riskLevel}`);
    if (riskTag) patientTags.push(riskTag);
    
    return patientTags;
  };

  // Generate tags based on patient data using API (async version for when needed)
  const generatePatientTags = async (patient: Patient, riskLevel: string): Promise<PatientTag[]> => {
    try {
      // Try to get existing patient tags first
      const existingTags = await patientTagsApi.getPatientTags(patient.id);
      if (existingTags.data.tags.length > 0) {
        return existingTags.data.tags;
      }
    } catch (error) {
      console.log('No existing tags found, generating defaults');
    }
    
    // Fall back to synchronous generation
    return generatePatientTagsSync(patient, riskLevel);
  };

  useEffect(() => {
    fetchPatients();
  }, [searchTerm]);

  // Filter patients based on search, tags, and status
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = !searchTerm || 
      `${patient.first_name} ${patient.paternal_last_name} ${patient.maternal_last_name}`
        .toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.cell_phone?.includes(searchTerm) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tagName => 
        patient.tags.some(tag => tag.name === tagName)
      );
    
    const matchesStatus = statusFilter === 'all' || patient.followUpStatus === statusFilter;
    
    return matchesSearch && matchesTags && matchesStatus;
  });

  // Patient actions dropdown
  const PatientActionsDropdown = ({ patient }: { patient: EnhancedPatient }) => {
    const isOpen = openDropdown === patient.id;
    
    const actions = [
      {
        icon: CalendarIcon,
        label: 'Agendar Cita',
        color: 'text-blue-600',
        bgColor: 'hover:bg-blue-50',
        onClick: () => {
          // Navigate to agenda with patient pre-selected
          window.location.href = `/hubs/agenda?patient=${patient.id}&action=schedule`;
        }
      },
      {
        icon: DocumentTextIcon,
        label: 'Nueva Receta',
        color: 'text-green-600',
        bgColor: 'hover:bg-green-50',
        onClick: () => {
          onNewConsultation(patient);
        }
      },
      {
        icon: DocumentChartBarIcon,
        label: 'Realizar Escala',
        color: 'text-purple-600',
        bgColor: 'hover:bg-purple-50',
        onClick: () => {
          onClinicalAssessment(patient);
        }
      },
      {
        icon: BookOpenIcon,
        label: 'Nuevo Recurso',
        color: 'text-orange-600',
        bgColor: 'hover:bg-orange-50',
        onClick: () => {
          // Navigate to resources with patient pre-selected
          window.location.href = `/hubs/resources?patient=${patient.id}&action=send`;
        }
      },
      {
        icon: DocumentTextIcon,
        label: 'Nueva Consulta',
        color: 'text-indigo-600',
        bgColor: 'hover:bg-indigo-50',
        onClick: () => {
          onNewConsultation(patient);
        }
      },
      {
        icon: ChatBubbleLeftEllipsisIcon,
        label: 'Registrar Anotación',
        color: 'text-gray-600',
        bgColor: 'hover:bg-gray-50',
        onClick: () => {
          // Navigate to timeline annotation
          window.location.href = `/hubs/expedix?patient=${patient.id}&action=annotation`;
        }
      }
    ];

    return (
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(isOpen ? null : patient.id)}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Acciones
          <ChevronDownIcon className="w-4 h-4 ml-2" />
        </button>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setOpenDropdown(null)}
            />
            <div className="absolute right-0 z-20 w-56 mt-2 origin-top-right bg-white border border-gray-200 rounded-md shadow-lg">
              <div className="py-1">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      action.onClick();
                      setOpenDropdown(null);
                    }}
                    className={`flex items-center w-full px-4 py-2 text-sm ${action.color} ${action.bgColor} transition-colors`}
                  >
                    <action.icon className="w-4 h-4 mr-3" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Tag component
  const TagComponent = ({ tag }: { tag: PatientTag }) => (
    <span
      className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full"
      style={{
        backgroundColor: tag.color,
        color: tag.textColor || '#FFFFFF'
      }}
    >
      {tag.name}
    </span>
  );

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
    <div className="space-y-4">
      {/* View Controls */}
      {onChangeView && (
        <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-700">Vista de Lista</h3>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onChangeView('cards')}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              <Squares2X2Icon className="h-4 w-4 mr-1" />
              Cambiar a Tarjetas
            </button>
            <button
              onClick={() => onChangeView('timeline')}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors"
            >
              <ClockIcon className="h-4 w-4 mr-1" />
              Ver Timeline
            </button>
          </div>
        </div>
      )}
      
      {/* Patient List/Cards */}
      {filteredPatients.length === 0 ? (
        <div className="text-center py-12">
          <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || selectedTags.length > 0 ? 'Sin resultados' : 'Sin pacientes registrados'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedTags.length > 0
              ? 'No se encontraron pacientes que coincidan con los filtros aplicados.'
              : 'Comienza agregando tu primer paciente al sistema.'
            }
          </p>
          <Button onClick={onNewPatient} className="bg-blue-600 hover:bg-blue-700 text-white">
            <PlusIcon className="w-4 h-4 mr-2" />
            Agregar Paciente
          </Button>
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-4">Paciente</div>
              <div className="col-span-3">Tags</div>
              <div className="col-span-3">Estadísticas</div>
              <div className="col-span-2">Acciones</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {filteredPatients.map((patient) => (
              <div key={patient.id} className="px-4 py-3 hover:bg-gray-50 transition-colors duration-150">
                <div className="grid grid-cols-12 gap-3 items-center">
                  {/* Patient Info - Optimized to use more space */}
                  <div className="col-span-4">
                    <div className="flex items-center">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold mr-3 flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))' }}
                      >
                        {patient.first_name.charAt(0)}{patient.paternal_last_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => onSelectPatient(patient)}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors block truncate"
                        >
                          {patient.first_name} {patient.paternal_last_name} {patient.maternal_last_name}
                        </button>
                        <div className="flex flex-wrap items-center gap-x-2 text-xs text-gray-500 mt-0.5">
                          <span className="whitespace-nowrap">{patient.age} años</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline">{patient.gender === 'masculine' ? 'M' : 'F'}</span>
                          <span className="hidden md:inline">•</span>
                          <span className="truncate hidden md:inline">{patient.cell_phone || 'Sin teléfono'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tags - More space for tags */}
                  <div className="col-span-3">
                    <div className="flex flex-wrap gap-1">
                      {patient.tags.slice(0, 4).map((tag) => (
                        <TagComponent key={tag.id} tag={tag} />
                      ))}
                      {patient.tags.length > 4 && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                          +{patient.tags.length - 4}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Statistics - Compact */}
                  <div className="col-span-3">
                    <div className="flex items-center space-x-4 text-xs">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-1" />
                        <span>{patient.consultationsCount} consultas</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                        <span>{patient.prescriptionsCount} recetas</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions - Tag style buttons */}
                  <div className="col-span-2">
                    <div className="flex items-center space-x-1 flex-wrap">
                      <button
                        onClick={() => onSelectPatient(patient)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-full transition-colors duration-200"
                      >
                        <FolderOpenIcon className="h-3 w-3 sm:mr-0.5" />
                        <span className="hidden sm:inline">Ver</span>
                      </button>
                      <button
                        onClick={() => onNewConsultation(patient)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-green-500 hover:bg-green-600 rounded-full transition-colors duration-200"
                      >
                        <DocumentTextIcon className="h-3 w-3 sm:mr-0.5" />
                        <span className="hidden sm:inline">Nueva</span>
                      </button>
                      {onScheduleAppointment && (
                        <button
                          onClick={() => onScheduleAppointment(patient)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-full transition-colors duration-200"
                        >
                          <CalendarIcon className="h-3 w-3 sm:mr-0.5" />
                          <span className="hidden sm:inline">Cita</span>
                        </button>
                      )}
                      <button
                        onClick={() => onClinicalAssessment(patient)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-full transition-colors duration-200"
                      >
                        <DocumentChartBarIcon className="h-3 w-3 sm:mr-0.5" />
                        <span className="hidden sm:inline">Eval</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-lg transition-shadow duration-200">
              {/* Card Header */}
              <div className="p-6 pb-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold mr-4"
                      style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))' }}
                    >
                      {patient.first_name.charAt(0)}{patient.paternal_last_name.charAt(0)}
                    </div>
                    <div>
                      <button
                        onClick={() => onSelectPatient(patient)}
                        className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {patient.first_name} {patient.paternal_last_name}
                      </button>
                      <div className="text-sm text-gray-500">
                        {patient.age} • {patient.gender === 'masculine' ? 'M' : 'F'}
                      </div>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    patient.riskLevel === 'low' ? 'bg-green-400' :
                    patient.riskLevel === 'moderate' ? 'bg-yellow-400' :
                    patient.riskLevel === 'high' ? 'bg-red-400' : 'bg-red-600'
                  }`} />
                </div>
              </div>

              {/* Tags */}
              <div className="px-6 py-3">
                <div className="flex flex-wrap gap-2">
                  {patient.tags.map((tag) => (
                    <TagComponent key={tag.id} tag={tag} />
                  ))}
                </div>
              </div>

              {/* Patient Details */}
              <div className="px-6 py-3 bg-gray-50 space-y-2">
                {/* Statistics - Compact */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-1" />
                      <span>{patient.consultationsCount}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                      <span>{patient.prescriptionsCount}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      patient.followUpStatus === 'active' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <span className="text-xs text-gray-600">
                      {patient.followUpDuration}
                    </span>
                  </div>
                </div>

                {/* Contact and Medications - Compact */}
                <div className="pt-2 border-t border-gray-200 space-y-1">
                  <div className="flex items-center text-xs text-gray-600">
                    <PhoneIcon className="w-3 h-3 mr-1" />
                    <span className="truncate">{patient.cell_phone}</span>
                  </div>
                  {patient.email && (
                    <div className="text-xs text-gray-600 truncate">
                      {patient.email}
                    </div>
                  )}
                  {patient.currentMedications.length > 0 && (
                    <div className="text-xs text-gray-600">
                      💊 {patient.currentMedications.slice(0, 1).join(', ')}
                      {patient.currentMedications.length > 1 && ` +${patient.currentMedications.length - 1}`}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Actions - Compact */}
              <div className="px-6 py-3 border-t border-gray-200">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onSelectPatient(patient)}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-full transition-colors duration-200"
                  >
                    <FolderOpenIcon className="h-3 w-3 mr-0.5" />
                    Ver
                  </button>
                  <button
                    onClick={() => onNewConsultation(patient)}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-green-500 hover:bg-green-600 rounded-full transition-colors duration-200"
                  >
                    <DocumentTextIcon className="h-3 w-3 mr-0.5" />
                    Nueva
                  </button>
                  <button
                    onClick={() => onClinicalAssessment(patient)}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-full transition-colors duration-200"
                  >
                    <DocumentChartBarIcon className="h-3 w-3 mr-0.5" />
                    Eval
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}