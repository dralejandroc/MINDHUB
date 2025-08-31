import { gql } from '@apollo/client'

// Query para obtener todos los ingresos
export const GET_FINANCE_INCOME = gql`
  query GetFinanceIncome(
    $first: Int
    $after: Cursor
    $filter: finance_incomeFilter
    $orderBy: [finance_incomeOrderBy!]
  ) {
    finance_incomeCollection(
      first: $first
      after: $after
      filter: $filter
      orderBy: $orderBy
    ) {
      edges {
        node {
          id
          amount
          payment_method
          payment_date
          description
          service_id
          patient_id
          appointment_id
          status
          invoice_number
          notes
          clinic_id
          workspace_id
          recorded_by
          created_at
          updated_at
          finance_services {
            id
            name
            price
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

// Query para obtener ingresos por rango de fechas
export const GET_FINANCE_INCOME_BY_DATE_RANGE = gql`
  query GetFinanceIncomeByDateRange(
    $startDate: Date!
    $endDate: Date!
    $clinicId: UUID
    $workspaceId: UUID
  ) {
    finance_incomeCollection(
      filter: {
        and: [
          { payment_date: { gte: $startDate } }
          { payment_date: { lte: $endDate } }
          { clinic_id: { eq: $clinicId } }
          { workspace_id: { eq: $workspaceId } }
        ]
      }
      orderBy: [{ payment_date: DescNullsLast }]
    ) {
      edges {
        node {
          id
          amount
          payment_method
          payment_date
          description
          status
          invoice_number
          finance_services {
            name
          }
        }
      }
    }
  }
`

// Query para obtener ingresos del día actual
export const GET_TODAY_FINANCE_INCOME = gql`
  query GetTodayFinanceIncome($date: Date!, $clinicId: UUID) {
    finance_incomeCollection(
      filter: {
        and: [
          { payment_date: { eq: $date } }
          { clinic_id: { eq: $clinicId } }
        ]
      }
      orderBy: [{ created_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          amount
          payment_method
          payment_date
          description
          status
          invoice_number
          finance_services {
            name
          }
        }
      }
    }
  }
`

// Query para estadísticas de ingresos
export const GET_FINANCE_INCOME_STATS = gql`
  query GetFinanceIncomeStats(
    $startDate: Date!
    $endDate: Date!
    $clinicId: UUID
  ) {
    finance_incomeCollection(
      filter: {
        and: [
          { payment_date: { gte: $startDate } }
          { payment_date: { lte: $endDate } }
          { clinic_id: { eq: $clinicId } }
          { status: { neq: "cancelled" } }
        ]
      }
    ) {
      edges {
        node {
          id
          amount
          payment_method
          status
          finance_services {
            service_type
            category
          }
        }
      }
    }
  }
`

// Query para ingresos por paciente
export const GET_FINANCE_INCOME_BY_PATIENT = gql`
  query GetFinanceIncomeByPatient($patientId: UUID!, $first: Int) {
    finance_incomeCollection(
      filter: { patient_id: { eq: $patientId } }
      orderBy: [{ payment_date: DescNullsLast }]
      first: $first
    ) {
      edges {
        node {
          id
          amount
          payment_method
          payment_date
          description
          status
          invoice_number
          finance_services {
            name
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

// Query para ingresos pendientes
export const GET_PENDING_FINANCE_INCOME = gql`
  query GetPendingFinanceIncome($clinicId: UUID) {
    finance_incomeCollection(
      filter: {
        and: [
          { clinic_id: { eq: $clinicId } }
          { status: { eq: "pending" } }
        ]
      }
      orderBy: [{ payment_date: AscNullsFirst }]
    ) {
      edges {
        node {
          id
          amount
          payment_date
          description
          patient_id
          appointment_id
          finance_services {
            name
          }
        }
      }
    }
  }
`