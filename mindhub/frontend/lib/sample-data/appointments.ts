/**
 * Sample appointment data for demo purposes
 * Provides realistic clinic appointments with proper start/end times
 */

export interface SampleAppointment {
  id: string;
  patient_id: string;
  appointment_date: string;
  appointment_time: string;
  duration: number;
  appointment_type: string;
  status: 'scheduled' | 'confirmed' | 'confirmed-no-deposit' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  reason?: string;
  patients: {
    id: string;
    first_name: string;
    last_name: string;
    paternal_last_name: string;
    email: string;
    phone: string;
  };
}

// Generate dates for the next 30 days
function getNextDays(count: number): string[] {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

// Sample patients
const samplePatients = [
  { id: '1', first_name: 'María', last_name: 'González', paternal_last_name: 'Rodríguez', email: 'maria.gonzalez@email.com', phone: '555-0101' },
  { id: '2', first_name: 'Carlos', last_name: 'Martínez', paternal_last_name: 'López', email: 'carlos.martinez@email.com', phone: '555-0102' },
  { id: '3', first_name: 'Ana', last_name: 'Fernández', paternal_last_name: 'García', email: 'ana.fernandez@email.com', phone: '555-0103' },
  { id: '4', first_name: 'Luis', last_name: 'Ramírez', paternal_last_name: 'Hernández', email: 'luis.ramirez@email.com', phone: '555-0104' },
  { id: '5', first_name: 'Carmen', last_name: 'Torres', paternal_last_name: 'Jiménez', email: 'carmen.torres@email.com', phone: '555-0105' },
  { id: '6', first_name: 'Roberto', last_name: 'Vargas', paternal_last_name: 'Morales', email: 'roberto.vargas@email.com', phone: '555-0106' },
  { id: '7', first_name: 'Elena', last_name: 'Ruiz', paternal_last_name: 'Castillo', email: 'elena.ruiz@email.com', phone: '555-0107' },
  { id: '8', first_name: 'David', last_name: 'Moreno', paternal_last_name: 'Delgado', email: 'david.moreno@email.com', phone: '555-0108' }
];

// Type definitions for weighted random selection
interface AppointmentType {
  name: string;
  duration: number;
  weight: number;
}

interface StatusOption {
  status: 'scheduled' | 'confirmed' | 'confirmed-no-deposit' | 'completed' | 'cancelled' | 'no-show';
  weight: number;
}

// Appointment types with realistic consultation patterns
const appointmentTypes: AppointmentType[] = [
  { name: 'Primera consulta', duration: 60, weight: 0.2 },
  { name: 'Consulta subsecuente', duration: 60, weight: 0.5 },
  { name: 'Consulta breve', duration: 30, weight: 0.15 },
  { name: 'Videoconsulta', duration: 45, weight: 0.1 },
  { name: 'Consulta de urgencia', duration: 90, weight: 0.05 }
];

// Time slots for appointments (8 AM to 8 PM)
const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

// Status distribution for realistic clinic patterns
const statusOptions: StatusOption[] = [
  { status: 'scheduled', weight: 0.3 },
  { status: 'confirmed', weight: 0.4 },
  { status: 'confirmed-no-deposit', weight: 0.15 },
  { status: 'completed', weight: 0.1 },
  { status: 'cancelled', weight: 0.04 },
  { status: 'no-show', weight: 0.01 }
];

function weightedRandom<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item as T;
    }
  }
  
  return items[0] as T;
}

export function generateSampleAppointments(): SampleAppointment[] {
  const appointments: SampleAppointment[] = [];
  const dates = getNextDays(30);
  let appointmentId = 1;

  dates.forEach((date, dateIndex) => {
    // Skip weekends for most appointments
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    
    // Reduce appointments on weekends
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const appointmentCount = isWeekend ? 
      Math.floor(Math.random() * 3) : // 0-2 appointments on weekends
      Math.floor(Math.random() * 6) + 2; // 2-7 appointments on weekdays

    // Generate appointments for this date
    const usedTimeSlots = new Set<string>();
    
    for (let i = 0; i < appointmentCount; i++) {
      // Select available time slot
      const availableSlots = timeSlots.filter(slot => !usedTimeSlots.has(slot));
      if (availableSlots.length === 0) break;
      
      const timeSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
      usedTimeSlots.add(timeSlot);
      
      // Select appointment type and patient
      const appointmentType = weightedRandom(appointmentTypes);
      const patient = samplePatients[Math.floor(Math.random() * samplePatients.length)];
      const status = weightedRandom(statusOptions);
      
      // Generate realistic notes
      const reasonOptions = [
        'Seguimiento de tratamiento',
        'Evaluación inicial',
        'Control mensual',
        'Revisión de medicamentos',
        'Consulta de rutina',
        'Segunda opinión',
        'Consulta familiar',
        'Urgencia médica'
      ];
      
      const appointment: SampleAppointment = {
        id: appointmentId.toString(),
        patient_id: patient.id,
        appointment_date: date,
        appointment_time: timeSlot,
        duration: appointmentType.duration,
        appointment_type: appointmentType.name,
        status: status.status,
        notes: `${reasonOptions[Math.floor(Math.random() * reasonOptions.length)]}`,
        reason: `Motivo: ${appointmentType.name.toLowerCase()}`,
        patients: patient
      };
      
      appointments.push(appointment);
      appointmentId++;
    }
  });

  return appointments.sort((a, b) => {
    // Sort by date and time
    const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
    const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
    return dateA.getTime() - dateB.getTime();
  });
}

// Generate consistent sample data
export const sampleAppointmentData = generateSampleAppointments();

// Helper function to get appointments for a specific date
export function getAppointmentsForDate(date: string): SampleAppointment[] {
  return sampleAppointmentData.filter(apt => apt.appointment_date === date);
}

// Helper function to get today's appointments
export function getTodaysAppointments(): SampleAppointment[] {
  const today = new Date().toISOString().split('T')[0];
  return getAppointmentsForDate(today);
}

// Helper function to get this week's appointments
export function getWeekAppointments(): SampleAppointment[] {
  const today = new Date();
  const weekStart = new Date(today);
  const day = weekStart.getDay();
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  weekStart.setDate(diff);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const startDate = weekStart.toISOString().split('T')[0];
  const endDate = weekEnd.toISOString().split('T')[0];
  
  return sampleAppointmentData.filter(apt => 
    apt.appointment_date >= startDate && apt.appointment_date <= endDate
  );
}