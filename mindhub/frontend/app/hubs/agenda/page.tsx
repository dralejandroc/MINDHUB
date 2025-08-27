'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { WeeklyView } from '@/components/agenda-v2/views/WeeklyView';
import { DailyView } from '@/components/agenda-v2/views/DailyView';
import { MonthlyView } from '@/components/agenda-v2/views/MonthlyView';
import { ClinicGlobalView } from '@/components/agenda-v2/views/ClinicGlobalView';
import { ReceptionView } from '@/components/agenda-v2/views/ReceptionView';
import { AppointmentContextMenu } from '@/components/agenda-v2/shared/AppointmentContextMenu';
import { AppointmentData } from '@/components/agenda-v2/shared/AppointmentCard';
import { ScheduleConfig } from '@/components/agenda-v2/shared/TimeSlotGrid';
import NewAppointmentModal from '@/components/agenda/NewAppointmentModal';
import NewPatientModal from '@/components/expedix/NewPatientModal';
import { 
  CalendarIcon, 
  PlusIcon,
  CalendarDaysIcon,
  ClockIcon,
  BuildingOfficeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { authGet, authPost, authPut, authDelete } from '@/lib/api/auth-fetch';
import { useRouter } from 'next/navigation';

type ViewType = 'week' | 'day' | 'month' | 'clinic-global' | 'reception';

export default function AgendaV2Page() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<ViewType>('week');
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [licenseType, setLicenseType] = useState<'clinic' | 'individual'>('individual');
  const [lastRefresh, setLastRefresh] = useState<Date | undefined>(undefined);
  
  // Selected slot state for pre-filling modal
  const [selectedSlot, setSelectedSlot] = useState<{
    date: Date;
    time: string;
  } | null>(null);
  
  // Context menu state
  const [contextMenuData, setContextMenuData] = useState<{
    appointment: AppointmentData;
    position: { x: number; y: number };
  } | null>(null);

  // Schedule configuration
  const scheduleConfig: ScheduleConfig = {
    startHour: 8,
    endHour: 20,
    slotDuration: 30,
    breakDuration: 0,
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
    blockedSlots: []
  };

  // Professional data for clinic view (mock for now)
  const professionals = [
    {
      id: '1',
      name: 'Dr. García',
      specialization: 'Psiquiatría',
      color: '#3B82F6',
      isActive: true,
      scheduleConfig
    },
    {
      id: '2',
      name: 'Dra. López',
      specialization: 'Psicología',
      color: '#10B981',
      isActive: true,
      scheduleConfig
    }
  ];

  // Initialize dates on client side to avoid hydration issues
  useEffect(() => {
    setCurrentDate(new Date());
    setLastRefresh(new Date());
  }, []);

  // Load appointments
  useEffect(() => {
    if (currentDate) {
      loadAppointments();
      checkLicenseType();
    }
  }, [currentDate, currentView]);

  const checkLicenseType = async () => {
    try {
      const response = await authGet('/api/expedix/clinic-configuration');
      if (response.ok) {
        const data = await response.json();
        setLicenseType(data.license_type || 'individual');
      }
    } catch (error) {
      console.error('Error checking license type:', error);
    }
  };

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const response = await authGet('/api/expedix/agenda/appointments');
      if (response.ok) {
        const data = await response.json();
        // Transform API data to AppointmentData format with proper date/time handling
        const transformedAppointments: AppointmentData[] = (data.data || []).map((apt: any) => {
          console.log('[loadAppointments] Processing appointment:', apt);
          
          // Safely combine appointment_date with start_time/end_time
          const appointmentDate = apt.appointment_date || apt.date;
          const startTime = apt.start_time || '00:00';
          const endTime = apt.end_time || '01:00';
          
          // Create proper datetime by combining date + time
          const createDateTime = (dateStr: string, timeStr: string): Date => {
            try {
              if (!dateStr || !timeStr) {
                console.warn('[loadAppointments] Missing date/time:', { dateStr, timeStr });
                return new Date();
              }
              
              // Parse date and time components
              const date = new Date(dateStr);
              const [hours, minutes] = timeStr.split(':').map(Number);
              
              // Validate time components
              if (isNaN(hours) || isNaN(minutes)) {
                console.warn('[loadAppointments] Invalid time format:', timeStr);
                return date;
              }
              
              // Set time on the date
              date.setHours(hours, minutes, 0, 0);
              
              return date;
            } catch (error) {
              console.error('[loadAppointments] Date creation error:', error, { dateStr, timeStr });
              return new Date();
            }
          };
          
          const startDateTime = createDateTime(appointmentDate, startTime);
          const endDateTime = createDateTime(appointmentDate, endTime);
          
          return {
            id: apt.id,
            patientId: apt.patient_id,
            patientName: apt.patients?.first_name 
              ? `${apt.patients.first_name} ${apt.patients.paternal_last_name || ''}`.trim()
              : 'Paciente',
            startTime: startDateTime,
            endTime: endDateTime,
            duration: Math.round((endDateTime.getTime() - startDateTime.getTime()) / 60000) || 60, // Calculate duration from times
            type: apt.appointment_type || 'Consulta',
            status: apt.status || 'scheduled',
            hasDeposit: apt.has_deposit || false,
            paymentStatus: apt.payment_status,
            notes: apt.notes || apt.reason || '',
            consultationType: apt.consultation_type || 'presencial',
            location: apt.location,
            patientInfo: {
              phone: apt.patients?.phone || apt.patient_phone,
              email: apt.patients?.email || apt.patient_email,
              dateOfBirth: apt.patient_dob,
              lastVisit: apt.last_visit ? new Date(apt.last_visit) : undefined
            }
          };
        });
        setAppointments(transformedAppointments);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error('Error al cargar las citas');
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  // Event handlers
  const handleAppointmentClick = (appointment: AppointmentData) => {
    // Show context menu
    setContextMenuData({
      appointment,
      position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    });
  };

  const handleTimeSlotClick = (date: Date, hour: number, minute: number) => {
    // Format the time as HH:MM
    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // Set selected slot for pre-filling modal
    setSelectedSlot({ date, time });
    
    // Open new appointment modal with preselected time
    setShowNewAppointment(true);
  };

  const handleRefresh = () => {
    loadAppointments();
  };

  const handleSettings = () => {
    router.push('/hubs/agenda/settings');
  };

  // Handler for new patient modal
  const handleOpenNewPatientModal = (event: any) => {
    const { fromAgenda, callback } = event.detail;
    if (fromAgenda) {
      setShowNewPatientModal(true);
      // Store callback for later use
      (window as any).newPatientCallback = callback;
    }
  };

  // Setup event listener for new patient modal
  useEffect(() => {
    window.addEventListener('openNewPatientModal', handleOpenNewPatientModal as any);
    return () => {
      window.removeEventListener('openNewPatientModal', handleOpenNewPatientModal as any);
    };
  }, []);

  const handleSearch = (query: string) => {
    // Implement search functionality
    console.log('Search:', query);
  };

  // Context menu actions
  const handleStartConsultation = (appointmentId: string) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (appointment) {
      router.push(`/hubs/expedix?patient=${appointment.patientId}&consultation=start`);
    }
  };

  const handleConfirm = async (appointmentId: string, withDeposit: boolean) => {
    try {
      const response = await authPut(`/api/expedix/agenda/appointments/${appointmentId}/status`, {
        status: 'confirmed',
        has_deposit: withDeposit
      });
      if (response.ok) {
        toast.success('Cita confirmada');
        loadAppointments();
      }
    } catch (error) {
      toast.error('Error al confirmar la cita');
    }
  };

  const handleCancel = async (appointmentId: string, reason?: string) => {
    try {
      const response = await authPut(`/api/expedix/agenda/appointments/${appointmentId}/status`, {
        status: 'cancelled',
        cancellation_reason: reason
      });
      if (response.ok) {
        toast.success('Cita cancelada');
        loadAppointments();
      }
    } catch (error) {
      toast.error('Error al cancelar la cita');
    }
  };

  const handleReschedule = (appointmentId: string) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (appointment) {
      // Open appointment modal in edit mode
      setShowNewAppointment(true);
    }
  };

  const handleGoToRecord = (patientId: string) => {
    router.push(`/hubs/expedix?patient=${patientId}`);
  };

  const handleViewTimeline = (patientId: string) => {
    router.push(`/hubs/expedix?patient=${patientId}&view=timeline`);
  };

  const handleSendForm = (patientId: string) => {
    router.push(`/hubs/formx?action=send&patient=${patientId}`);
  };

  const handleSendResource = (patientId: string) => {
    router.push(`/hubs/resources?action=send&patient=${patientId}`);
  };

  const handleSendScale = (patientId: string) => {
    router.push(`/hubs/clinimetrix?action=send&patient=${patientId}`);
  };

  const handleAddComment = async (appointmentId: string) => {
    const comment = prompt('Agregar comentario:');
    if (comment) {
      try {
        const response = await authPut(`/api/expedix/agenda/appointments/${appointmentId}`, {
          notes: comment
        });
        if (response.ok) {
          toast.success('Comentario agregado');
          loadAppointments();
        }
      } catch (error) {
        toast.error('Error al agregar comentario');
      }
    }
  };

  // Calculate today stats (avoiding hydration issues)
  const todayStats = currentDate ? {
    totalAppointments: appointments.filter(a => 
      a.startTime.toDateString() === currentDate.toDateString()
    ).length,
    confirmed: appointments.filter(a => 
      a.startTime.toDateString() === currentDate.toDateString() && a.status === 'confirmed'
    ).length,
    pending: appointments.filter(a => 
      a.startTime.toDateString() === currentDate.toDateString() && a.status === 'scheduled'
    ).length,
    completed: appointments.filter(a => 
      a.startTime.toDateString() === currentDate.toDateString() && a.status === 'completed'
    ).length
  } : {
    totalAppointments: 0,
    confirmed: 0,
    pending: 0,
    completed: 0
  };

  const canSwitchToClinicViews = licenseType === 'clinic';

  // Prevent hydration issues by waiting for client initialization
  if (!currentDate) {
    return (
      <div className="flex flex-col bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-50">
      <PageHeader
        title="Agenda"
        description="Gestión de citas y horarios"
        icon={CalendarIcon}
      />

      <div className="flex flex-col">
        {/* Render appropriate view based on currentView */}
        {currentView === 'week' && (
          <WeeklyView
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            appointments={appointments}
            scheduleConfig={scheduleConfig}
            licenseType={licenseType}
            canSwitchToClinicViews={canSwitchToClinicViews}
            onNewAppointment={() => setShowNewAppointment(true)}
            onRefresh={handleRefresh}
            onSearch={handleSearch}
            onViewChange={setCurrentView}
            onSettings={handleSettings}
            todayStats={todayStats}
            isLoading={loading}
            lastRefresh={lastRefresh}
            onAppointmentClick={handleAppointmentClick}
            onTimeSlotClick={handleTimeSlotClick}
          />
        )}

        {currentView === 'day' && (
          <DailyView
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            appointments={appointments}
            scheduleConfig={scheduleConfig}
            licenseType={licenseType}
            canSwitchToClinicViews={canSwitchToClinicViews}
            onNewAppointment={() => setShowNewAppointment(true)}
            onRefresh={handleRefresh}
            onSearch={handleSearch}
            onViewChange={setCurrentView}
            onSettings={handleSettings}
            todayStats={todayStats}
            isLoading={loading}
            lastRefresh={lastRefresh}
            onAppointmentClick={handleAppointmentClick}
            onTimeSlotClick={handleTimeSlotClick}
            onStartConsultation={handleStartConsultation}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            onReschedule={handleReschedule}
            onGoToRecord={handleGoToRecord}
            onViewTimeline={handleViewTimeline}
            onSendForm={handleSendForm}
            onSendResource={handleSendResource}
            onSendScale={handleSendScale}
            onAddComment={handleAddComment}
          />
        )}

        {currentView === 'month' && (
          <MonthlyView
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            appointments={appointments}
            scheduleConfig={scheduleConfig}
            licenseType={licenseType}
            canSwitchToClinicViews={canSwitchToClinicViews}
            onNewAppointment={() => setShowNewAppointment(true)}
            onRefresh={handleRefresh}
            onSearch={handleSearch}
            onViewChange={setCurrentView}
            todayStats={todayStats}
            isLoading={loading}
            lastRefresh={lastRefresh}
            onDayClick={(date) => {
              setCurrentDate(date);
              setCurrentView('day');
            }}
            onAppointmentClick={handleAppointmentClick}
            onSettings={handleSettings}
          />
        )}

        {currentView === 'clinic-global' && licenseType === 'clinic' && (
          <ClinicGlobalView
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            appointments={appointments}
            professionals={professionals}
            licenseType="clinic"
            onNewAppointment={() => setShowNewAppointment(true)}
            onRefresh={handleRefresh}
            onSearch={handleSearch}
            onSettings={handleSettings}
            todayStats={todayStats}
            isLoading={loading}
            lastRefresh={lastRefresh}
            onAppointmentClick={handleAppointmentClick}
            onTimeSlotClick={(professionalId, date, hour, minute) => {
              console.log('New appointment for professional:', professionalId);
              setShowNewAppointment(true);
            }}
            onStartConsultation={handleStartConsultation}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            onReschedule={handleReschedule}
            onGoToRecord={handleGoToRecord}
            onViewTimeline={handleViewTimeline}
            onSendForm={handleSendForm}
            onSendResource={handleSendResource}
            onSendScale={handleSendScale}
            onAddComment={handleAddComment}
          />
        )}

        {currentView === 'reception' && licenseType === 'clinic' && (
          <ReceptionView
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            appointments={appointments}
            scheduleConfig={scheduleConfig}
            licenseType="clinic"
            onNewAppointment={() => setShowNewAppointment(true)}
            onRefresh={handleRefresh}
            onSearch={handleSearch}
            onSettings={handleSettings}
            todayStats={todayStats}
            isLoading={loading}
            lastRefresh={lastRefresh}
            onReschedule={handleReschedule}
            onConfirmAppointment={handleConfirm}
            onCancelAppointment={handleCancel}
          />
        )}
      </div>

      {/* Context Menu */}
      {contextMenuData && (
        <AppointmentContextMenu
          appointment={contextMenuData.appointment}
          isVisible={true}
          position={contextMenuData.position}
          onClose={() => setContextMenuData(null)}
          onStartConsultation={handleStartConsultation}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onReschedule={handleReschedule}
          onGoToRecord={handleGoToRecord}
          onViewTimeline={handleViewTimeline}
          onSendForm={handleSendForm}
          onSendResource={handleSendResource}
          onSendScale={handleSendScale}
          onAddComment={handleAddComment}
          licenseType={licenseType}
        />
      )}

      {/* New Appointment Modal */}
      {showNewAppointment && (
        <NewAppointmentModal
          selectedDate={selectedSlot?.date || currentDate || new Date()}
          selectedTime={selectedSlot?.time}
          onClose={() => {
            setShowNewAppointment(false);
            setSelectedSlot(null); // Clear selected slot when closing
          }}
          onSave={async (appointmentData: any) => {
            try {
              // Map frontend field names to API field names
              const apiData = {
                patient_id: appointmentData.patientId,
                appointment_date: appointmentData.date,
                appointment_time: appointmentData.time,
                duration: appointmentData.duration || 60,
                appointment_type: appointmentData.type,
                notes: appointmentData.notes || '',
                status: 'scheduled'
              };
              
              console.log('[Agenda] Saving appointment:', apiData);
              
              // Create appointment in database
              const response = await authPost('/api/expedix/agenda/appointments', apiData);
              
              if (response.ok) {
                const result = await response.json();
                console.log('[Agenda] Appointment created:', result);
                
                // Create pending charge in Finance system if appointment has a price
                if (appointmentData.createPendingCharge && appointmentData.price > 0) {
                  try {
                    const financeData = {
                      patient_id: appointmentData.patientId,
                      appointment_id: result.data?.id,
                      service_name: appointmentData.serviceName || appointmentData.type,
                      amount: appointmentData.price,
                      currency: 'MXN',
                      status: 'pending',
                      payment_method: 'pending',
                      transaction_date: new Date().toISOString(),
                      notes: `Cobro pendiente por cita: ${appointmentData.type} - ${appointmentData.date} ${appointmentData.time}`,
                      created_by_appointment: true
                    };
                    
                    console.log('[Agenda] Creating pending charge in Finance:', financeData);
                    
                    const financeResponse = await authPost('/api/finance/income', financeData);
                    
                    if (financeResponse.ok) {
                      console.log('[Agenda] Pending charge created successfully');
                      toast.success('Cita creada y cobro pendiente registrado');
                    } else {
                      console.warn('[Agenda] Failed to create pending charge, but appointment was created');
                      toast.success('Cita creada exitosamente (sin cobro pendiente)');
                    }
                  } catch (financeError) {
                    console.error('[Agenda] Error creating pending charge:', financeError);
                    toast.success('Cita creada exitosamente (sin cobro pendiente)');
                  }
                } else {
                  toast.success('Cita creada exitosamente');
                }
                
                await loadAppointments(); // Reload appointments to show the new one
                setShowNewAppointment(false);
                setSelectedSlot(null); // Clear selected slot after successful save
              } else {
                const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
                toast.error('Error al crear la cita: ' + (errorData.error || errorData.message || 'Error desconocido'));
                console.error('Error creating appointment:', response.status, errorData);
              }
            } catch (error) {
              console.error('Error saving appointment:', error);
              toast.error('Error al guardar la cita');
            }
          }}
        />
      )}

      {/* New Patient Modal */}
      <NewPatientModal
        isOpen={showNewPatientModal}
        onClose={() => setShowNewPatientModal(false)}
        onSuccess={(patient) => {
          // Call the stored callback with the new patient data
          if ((window as any).newPatientCallback) {
            (window as any).newPatientCallback(patient);
            (window as any).newPatientCallback = null;
          }
          setShowNewPatientModal(false);
        }}
      />
    </div>
  );
}