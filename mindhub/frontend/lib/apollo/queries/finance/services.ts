import { gql } from '@apollo/client'

// Query para obtener todos los servicios financieros
export const GET_FINANCE_SERVICES = gql`
  query GetFinanceServices(
    $first: Int
    $after: Cursor
    $filter: finance_servicesFilter
    $orderBy: [finance_servicesOrderBy!]
  ) {
    finance_servicesCollection(
      first: $first
      after: $after
      filter: $filter
      orderBy: $orderBy
    ) {
      edges {
        node {
          id
          name
          description
          standard_price
          estimated_duration_minutes
          service_type
          category
          is_active
          requires_appointment
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

// Query para obtener servicio específico por ID
export const GET_FINANCE_SERVICE_BY_ID = gql`
  query GetFinanceServiceById($id: UUID!) {
    finance_servicesCollection(filter: { id: { eq: $id } }) {
      edges {
        node {
          id
          name
          description
          standard_price
          estimated_duration_minutes
          service_type
          category
          is_active
          requires_appointment
          clinic_id
          user_id
          created_at
          updated_at
        }
      }
    }
  }
`

// Query para obtener servicios activos (para selección rápida)
export const GET_ACTIVE_FINANCE_SERVICES = gql`
  query GetActiveFinanceServices($userId: UUID!, $isClinic: Boolean!) {
    finance_servicesCollection(
      filter: {
        and: [
          { is_active: { eq: true } }
          { 
            or: [
              { and: [{ clinic_id: { eq: $isClinic } }, { clinic_id: { eq: true } }] }
              { user_id: { eq: $userId } }
            ]
          }
        ]
      }
      orderBy: [{ name: AscNullsFirst }]
    ) {
      edges {
        node {
          id
          name
          description
          standard_price
          estimated_duration_minutes
          service_type
          category
          requires_appointment
        }
      }
    }
  }
`

// Query para obtener servicios por categoría
export const GET_FINANCE_SERVICES_BY_CATEGORY = gql`
  query GetFinanceServicesByCategory($category: String!, $userId: UUID!, $isClinic: Boolean!) {
    finance_servicesCollection(
      filter: {
        and: [
          { category: { eq: $category } }
          { 
            or: [
              { and: [{ clinic_id: { eq: $isClinic } }, { clinic_id: { eq: true } }] }
              { user_id: { eq: $userId } }
            ]
          }
          { is_active: { eq: true } }
        ]
      }
      orderBy: [{ name: AscNullsFirst }]
    ) {
      edges {
        node {
          id
          name
          description
          standard_price
          estimated_duration_minutes
          service_type
          requires_appointment
        }
      }
    }
  }
`

// Query para estadísticas de servicios
export const GET_FINANCE_SERVICES_STATS = gql`
  query GetFinanceServicesStats($userId: UUID!, $isClinic: Boolean!) {
    finance_servicesCollection(
      filter: { 
        or: [
          { and: [{ clinic_id: { eq: $isClinic } }, { clinic_id: { eq: true } }] }
          { user_id: { eq: $userId } }
        ]
      }
    ) {
      edges {
        node {
          id
          standard_price
          is_active
          service_type
          category
        }
      }
    }
  }
`