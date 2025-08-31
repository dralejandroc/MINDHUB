import { useQuery, useApolloClient } from '@apollo/client'
import { 
  GET_APPOINTMENTS,
  GET_APPOINTMENT_BY_ID, 
  GET_APPOINTMENTS_WITH_PATIENT,
  GET_APPOINTMENTS_BY_DATE_RANGE,
  GET_TODAY_APPOINTMENTS,
  GET_APPOINTMENTS_BY_PATIENT,
  GET_DAILY_APPOINTMENT_STATS
} from '../queries/agenda/appointments'
import type {
  GetAppointmentsQuery,
  GetAppointmentsQueryVariables,
  GetAppointmentByIdQuery,
  GetAppointmentByIdQueryVariables,
  GetAppointmentsWithPatientQuery,
  GetAppointmentsWithPatientQueryVariables,
  GetAppointmentsByDateRangeQuery,
  GetAppointmentsByDateRangeQueryVariables,
  GetTodayAppointmentsQuery,
  GetTodayAppointmentsQueryVariables,
  GetAppointmentsByPatientQuery,
  GetAppointmentsByPatientQueryVariables,
  GetDailyAppointmentStatsQuery,
  GetDailyAppointmentStatsQueryVariables,
} from '../types/generated'
import { OrderByDirection } from '../types/generated'

// Hook para obtener lista de citas
export function useAppointments(variables?: GetAppointmentsQueryVariables) {
  return useQuery<GetAppointmentsQuery, GetAppointmentsQueryVariables>(GET_APPOINTMENTS, {
    variables: {
      first: 20,
      orderBy: [{ appointment_date: OrderByDirection.AscNullsFirst }],
      ...variables,
    },
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  })
}

// Hook para obtener una cita específica
export function useAppointment(id: string) {
  return useQuery<GetAppointmentByIdQuery, GetAppointmentByIdQueryVariables>(
    GET_APPOINTMENT_BY_ID, 
    {
      variables: { id },
      skip: !id,
      errorPolicy: 'all',
    }
  )
}

// Hook para obtener citas con información del paciente
export function useAppointmentsWithPatient(variables?: GetAppointmentsWithPatientQueryVariables) {
  return useQuery<GetAppointmentsWithPatientQuery, GetAppointmentsWithPatientQueryVariables>(
    GET_APPOINTMENTS_WITH_PATIENT,
    {
      variables: {
        first: 50,
        orderBy: [{ appointment_date: OrderByDirection.AscNullsFirst }],
        ...variables,
      },
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    }
  )
}

// Hook para vista calendario - citas por rango de fechas
export function useAppointmentsByDateRange(
  startDate: string,
  endDate: string,
  clinicId?: string,
  professionalId?: string
) {
  return useQuery<GetAppointmentsByDateRangeQuery, GetAppointmentsByDateRangeQueryVariables>(
    GET_APPOINTMENTS_BY_DATE_RANGE,
    {
      variables: {
        startDate,
        endDate,
        clinicId,
        professionalId,
      },
      skip: !startDate || !endDate,
      errorPolicy: 'all',
      // Refrescar cada 5 minutos para calendario en vivo
      pollInterval: 5 * 60 * 1000,
    }
  )
}

// Hook para citas del día actual
export function useTodayAppointments(clinicId?: string) {
  const today = new Date().toISOString().split('T')[0]
  
  return useQuery<GetTodayAppointmentsQuery, GetTodayAppointmentsQueryVariables>(
    GET_TODAY_APPOINTMENTS,
    {
      variables: {
        date: today,
        clinicId,
      },
      errorPolicy: 'all',
      // Refrescar cada 2 minutos para dashboard en vivo
      pollInterval: 2 * 60 * 1000,
    }
  )
}

// Hook para obtener citas de un paciente específico
export function usePatientAppointments(patientId: string, first = 10) {
  return useQuery<GetAppointmentsByPatientQuery, GetAppointmentsByPatientQueryVariables>(
    GET_APPOINTMENTS_BY_PATIENT,
    {
      variables: {
        patientId,
        first,
      },
      skip: !patientId,
      errorPolicy: 'all',
    }
  )
}

// Hook para estadísticas diarias
export function useDailyAppointmentStats(clinicId?: string, date?: string) {
  const targetDate = date || new Date().toISOString().split('T')[0]
  
  return useQuery<GetDailyAppointmentStatsQuery, GetDailyAppointmentStatsQueryVariables>(
    GET_DAILY_APPOINTMENT_STATS,
    {
      variables: {
        date: targetDate,
        clinicId,
      },
      errorPolicy: 'all',
      // Refrescar cada 10 minutos para stats
      pollInterval: 10 * 60 * 1000,
    }
  )
}

// Hook para búsqueda avanzada de citas
export function useSearchAppointments() {
  const client = useApolloClient()

  const searchAppointments = async (searchParams: {
    patientName?: string
    date?: string
    status?: string
    serviceType?: string
    clinicId?: string
    first?: number
  }) => {
    
    // Construir filtros dinámicos
    const filters: any = {
      and: []
    }

    if (searchParams.date) {
      filters.and.push({ appointment_date: { eq: searchParams.date } })
    }

    if (searchParams.status) {
      filters.and.push({ status: { eq: searchParams.status } })
    }

    if (searchParams.serviceType) {
      filters.and.push({ service_type: { eq: searchParams.serviceType } })
    }

    if (searchParams.clinicId) {
      filters.and.push({ clinic_id: { eq: searchParams.clinicId } })
    }

    try {
      const result = await client.query<GetAppointmentsQuery, GetAppointmentsQueryVariables>({
        query: GET_APPOINTMENTS,
        variables: {
          first: searchParams.first || 20,
          filter: filters.and.length > 0 ? filters : undefined,
          orderBy: [{ appointment_date: OrderByDirection.AscNullsFirst }],
        },
        fetchPolicy: 'cache-first',
      })

      return {
        data: result.data,
        loading: false,
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        loading: false,
        error,
      }
    }
  }

  return { searchAppointments }
}

// Hook para obtener disponibilidad (slots libres)
export function useAvailabilitySlots() {
  const client = useApolloClient()

  const getAvailableSlots = async (date: string, professionalId?: string, clinicId?: string) => {
    try {
      // Obtener citas existentes para el día
      const result = await client.query<GetAppointmentsByDateRangeQuery, GetAppointmentsByDateRangeQueryVariables>({
        query: GET_APPOINTMENTS_BY_DATE_RANGE,
        variables: {
          startDate: date,
          endDate: date,
          professionalId,
          clinicId,
        },
        fetchPolicy: 'network-only', // Siempre obtener data fresca
      })

      // Procesar slots disponibles (esto se puede mejorar con lógica de negocio)
      const existingAppointments = result.data?.appointmentsCollection?.edges || []
      
      return {
        existingAppointments,
        availableSlots: [], // Aquí se calcularían los slots disponibles
        loading: false,
        error: null,
      }
    } catch (error) {
      return {
        existingAppointments: [],
        availableSlots: [],
        loading: false,
        error,
      }
    }
  }

  return { getAvailableSlots }
}