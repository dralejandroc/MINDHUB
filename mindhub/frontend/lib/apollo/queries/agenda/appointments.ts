import { gql } from '@apollo/client'

// Query para obtener todas las citas con paginación y filtros
export const GET_APPOINTMENTS = gql`
  query GetAppointments(
    $first: Int
    $after: Cursor
    $filter: appointmentsFilter
    $orderBy: [appointmentsOrderBy!]
  ) {
    appointmentsCollection(
      first: $first
      after: $after
      filter: $filter
      orderBy: $orderBy
    ) {
      edges {
        node {
          id
          patient_id
          professional_id
          clinic_id
          user_id
          appointment_date
          start_time
          end_time
          appointment_type
          status
          reason
          notes
          internal_notes
          created_at
          updated_at
          is_recurring
          recurring_pattern
          reminder_sent
          reminder_date
          confirmation_sent
          confirmation_date
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`

// Query para obtener cita específica por ID
export const GET_APPOINTMENT_BY_ID = gql`
  query GetAppointmentById($id: UUID!) {
    appointmentsCollection(filter: { id: { eq: $id } }) {
      edges {
        node {
          id
          patient_id
          professional_id
          clinic_id
          user_id
          appointment_date
          start_time
          end_time
          appointment_type
          status
          reason
          notes
          internal_notes
          created_at
          updated_at
          is_recurring
          recurring_pattern
          reminder_sent
          reminder_date
          confirmation_sent
          confirmation_date
        }
      }
    }
  }
`

// Query para obtener citas con información del paciente
export const GET_APPOINTMENTS_WITH_PATIENT = gql`
  query GetAppointmentsWithPatient(
    $first: Int
    $filter: appointmentsFilter
    $orderBy: [appointmentsOrderBy!]
  ) {
    appointmentsCollection(
      first: $first
      filter: $filter
      orderBy: $orderBy
    ) {
      edges {
        node {
          id
          appointment_date
          start_time
          end_time
          status
          appointment_type
          reason
          notes
          patients {
            id
            first_name
            last_name
            paternal_last_name
            maternal_last_name
            email
            phone
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`

// Query para vista calendario - obtener citas por rango de fechas
export const GET_APPOINTMENTS_BY_DATE_RANGE = gql`
  query GetAppointmentsByDateRange(
    $startDate: Date!
    $endDate: Date!
    $userId: UUID!
    $isClinic: Boolean!
    $professionalId: UUID
  ) {
    appointmentsCollection(
      filter: {
        and: [
          { appointment_date: { gte: $startDate } }
          { appointment_date: { lte: $endDate } }
          { 
            or: [
              { and: [{ clinic_id: { eq: $isClinic } }, { clinic_id: { eq: true } }] }
              { user_id: { eq: $userId } }
            ]
          }
          { professional_id: { eq: $professionalId } }
        ]
      }
      orderBy: [{ appointment_date: AscNullsFirst }, { start_time: AscNullsFirst }]
    ) {
      edges {
        node {
          id
          patient_id
          appointment_date
          start_time
          end_time
          status
          appointment_type
          reason
          notes
        }
      }
    }
  }
`

// Query para obtener citas del día actual
export const GET_TODAY_APPOINTMENTS = gql`
  query GetTodayAppointments($date: Date!, $userId: UUID!, $isClinic: Boolean!) {
    appointmentsCollection(
      filter: {
        and: [
          { appointment_date: { eq: $date } }
          { 
            or: [
              { and: [{ clinic_id: { eq: $isClinic } }, { clinic_id: { eq: true } }] }
              { user_id: { eq: $userId } }
            ]
          }
        ]
      }
      orderBy: [{ start_time: AscNullsFirst }]
    ) {
      edges {
        node {
          id
          patient_id
          start_time
          end_time
          status
          appointment_type
          reason
          notes
          patients {
            id
            first_name
            last_name
            paternal_last_name
            phone
          }
        }
      }
    }
  }
`

// Query para buscar citas por paciente
export const GET_APPOINTMENTS_BY_PATIENT = gql`
  query GetAppointmentsByPatient($patientId: UUID!, $first: Int) {
    appointmentsCollection(
      filter: { patient_id: { eq: $patientId } }
      orderBy: [{ appointment_date: DescNullsLast }]
      first: $first
    ) {
      edges {
        node {
          id
          appointment_date
          start_time
          end_time
          status
          appointment_type
          reason
          notes
          created_at
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`

// Query para estadísticas diarias
export const GET_DAILY_APPOINTMENT_STATS = gql`
  query GetDailyAppointmentStats($date: Date!, $userId: UUID!, $isClinic: Boolean!) {
    appointmentsCollection(
      filter: {
        and: [
          { appointment_date: { eq: $date } }
          { 
            or: [
              { and: [{ clinic_id: { eq: $isClinic } }, { clinic_id: { eq: true } }] }
              { user_id: { eq: $userId } }
            ]
          }
        ]
      }
    ) {
      edges {
        node {
          id
          status
          appointment_type
        }
      }
    }
  }
`