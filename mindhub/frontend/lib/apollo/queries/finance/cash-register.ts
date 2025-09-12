import { gql } from '@apollo/client'

// Query para obtener cortes de caja
export const GET_CASH_REGISTER_CUTS = gql`
  query GetCashRegisterCuts(
    $first: Int
    $after: Cursor
    $filter: finance_cash_register_cutsFilter
    $orderBy: [finance_cash_register_cutsOrderBy!]
  ) {
    finance_cash_register_cutsCollection(
      first: $first
      after: $after
      filter: $filter
      orderBy: $orderBy
    ) {
      edges {
        node {
          id
          cut_date
          opening_amount
          closing_amount
          total_income
          total_cash_payments
          total_card_payments
          total_transfers
          notes
          status
          performed_by
          clinic_id
          user_id
          created_at
          updated_at
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

// Query para obtener el último corte de caja
export const GET_LATEST_CASH_REGISTER_CUT = gql`
  query GetLatestCashRegisterCut($userId: UUID!, $isClinic: Boolean!) {
    finance_cash_register_cutsCollection(
      filter: {
        or: [
          { and: [{ clinic_id: { eq: $isClinic } }, { clinic_id: { eq: true } }] }
          { user_id: { eq: $userId } }
        ]
      }
      orderBy: [{ cut_date: DescNullsLast }]
      first: 1
    ) {
      edges {
        node {
          id
          cut_date
          opening_amount
          closing_amount
          total_income
          total_cash_payments
          total_card_payments
          total_transfers
          notes
          status
          performed_by
        }
      }
    }
  }
`

// Query para obtener cortes de caja por rango de fechas
export const GET_CASH_REGISTER_CUTS_BY_DATE_RANGE = gql`
  query GetCashRegisterCutsByDateRange(
    $startDate: Date!
    $endDate: Date!
    $userId: UUID!
    $isClinic: Boolean!
  ) {
    finance_cash_register_cutsCollection(
      filter: {
        and: [
          { cut_date: { gte: $startDate } }
          { cut_date: { lte: $endDate } }
          { 
            or: [
              { and: [{ clinic_id: { eq: $isClinic } }, { clinic_id: { eq: true } }] }
              { user_id: { eq: $userId } }
            ]
          }
        ]
      }
      orderBy: [{ cut_date: DescNullsLast }]
    ) {
      edges {
        node {
          id
          cut_date
          opening_amount
          closing_amount
          total_income
          total_cash_payments
          total_card_payments
          total_transfers
          status
        }
      }
    }
  }
`

// Query para estadísticas de caja del día actual
export const GET_TODAY_CASH_STATS = gql`
  query GetTodayCashStats($date: Date!, $userId: UUID!, $isClinic: Boolean!) {
    # Ingresos del día
    todayIncome: finance_incomeCollection(
      filter: {
        and: [
          { payment_date: { eq: $date } }
          { 
            or: [
              { and: [{ clinic_id: { eq: $isClinic } }, { clinic_id: { eq: true } }] }
              { user_id: { eq: $userId } }
            ]
          }
          { status: { neq: "cancelled" } }
        ]
      }
    ) {
      edges {
        node {
          id
          amount
          payment_method
        }
      }
    }
    
    # Último corte de caja
    latestCut: finance_cash_register_cutsCollection(
      filter: { 
        or: [
          { and: [{ clinic_id: { eq: $isClinic } }, { clinic_id: { eq: true } }] }
          { user_id: { eq: $userId } }
        ]
      }
      orderBy: [{ cut_date: DescNullsLast }]
      first: 1
    ) {
      edges {
        node {
          id
          cut_date
          closing_amount
          status
        }
      }
    }
  }
`

// Query para resumen de caja pendiente
export const GET_PENDING_CASH_SUMMARY = gql`
  query GetPendingCashSummary($userId: UUID!, $isClinic: Boolean!, $lastCutDate: DateTime) {
    finance_incomeCollection(
      filter: {
        and: [
          { 
            or: [
              { and: [{ clinic_id: { eq: $isClinic } }, { clinic_id: { eq: true } }] }
              { user_id: { eq: $userId } }
            ]
          }
          { created_at: { gte: $lastCutDate } }
          { status: { neq: "cancelled" } }
        ]
      }
    ) {
      edges {
        node {
          id
          amount
          payment_method
          payment_date
        }
      }
    }
  }
`