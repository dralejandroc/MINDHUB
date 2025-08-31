import { gql } from '@apollo/client'

// Mutation para crear un nuevo servicio financiero
export const CREATE_FINANCE_SERVICE = gql`
  mutation CreateFinanceService($input: finance_servicesInsertInput!) {
    insertIntofinance_servicesCollection(objects: [$input]) {
      records {
        id
        name
        description
        price
        duration_minutes
        service_type
        category
        is_active
        requires_appointment
        clinic_id
        workspace_id
        created_at
        updated_at
      }
    }
  }
`

// Mutation para actualizar un servicio financiero
export const UPDATE_FINANCE_SERVICE = gql`
  mutation UpdateFinanceService($id: UUID!, $input: finance_servicesUpdateInput!) {
    updatefinance_servicesCollection(
      filter: { id: { eq: $id } }
      set: $input
    ) {
      records {
        id
        name
        description
        price
        duration_minutes
        service_type
        category
        is_active
        requires_appointment
        updated_at
      }
    }
  }
`

// Mutation para activar/desactivar un servicio
export const TOGGLE_FINANCE_SERVICE_STATUS = gql`
  mutation ToggleFinanceServiceStatus($id: UUID!, $isActive: Boolean!) {
    updatefinance_servicesCollection(
      filter: { id: { eq: $id } }
      set: { is_active: $isActive }
    ) {
      records {
        id
        name
        is_active
        updated_at
      }
    }
  }
`

// Mutation para actualizar precio de servicio
export const UPDATE_FINANCE_SERVICE_PRICE = gql`
  mutation UpdateFinanceServicePrice($id: UUID!, $price: BigFloat!) {
    updatefinance_servicesCollection(
      filter: { id: { eq: $id } }
      set: { price: $price }
    ) {
      records {
        id
        name
        price
        updated_at
      }
    }
  }
`

// Mutation para eliminar servicio financiero (soft delete)
export const DELETE_FINANCE_SERVICE = gql`
  mutation DeleteFinanceService($id: UUID!) {
    updatefinance_servicesCollection(
      filter: { id: { eq: $id } }
      set: { is_active: false }
    ) {
      records {
        id
        name
        is_active
        updated_at
      }
    }
  }
`

// Mutation para actualizar categoría de múltiples servicios
export const BULK_UPDATE_SERVICE_CATEGORY = gql`
  mutation BulkUpdateServiceCategory($serviceIds: [UUID!]!, $category: String!) {
    updatefinance_servicesCollection(
      filter: { id: { in: $serviceIds } }
      set: { category: $category }
    ) {
      records {
        id
        name
        category
        updated_at
      }
    }
  }
`