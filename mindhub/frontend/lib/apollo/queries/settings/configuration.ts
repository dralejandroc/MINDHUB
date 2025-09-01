import { gql } from '@apollo/client'

// Query para obtener configuración de clínica/usuario
export const GET_CLINIC_CONFIGURATION = gql`
  query GetClinicConfiguration($clinicName: String) {
    clinic_configurationsCollection(
      filter: {
        clinic_name: { eq: $clinicName }
      }
      first: 1
      orderBy: [{ updated_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          clinic_name
          address
          email
          phone
          tax_id
          logo_url
          settings
          created_at
          updated_at
        }
      }
    }
  }
`

// Query para obtener configuración por defecto
export const GET_DEFAULT_CONFIGURATION = gql`
  query GetDefaultConfiguration {
    clinic_configurationsCollection(
      first: 1
      orderBy: [{ created_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          clinic_name
          address
          email
          phone
          tax_id
          logo_url
          settings
          created_at
          updated_at
        }
      }
    }
  }
`

// Query para obtener todas las configuraciones disponibles
export const GET_ALL_CONFIGURATIONS = gql`
  query GetAllConfigurations {
    clinic_configurationsCollection(
      orderBy: [{ updated_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          clinic_name
          address
          email
          phone
          tax_id
          logo_url
          settings
          created_at
          updated_at
        }
      }
    }
  }
`

// Query simplificada para configuraciones de usuario (usando clinic_configurations)
export const GET_USER_SETTINGS = gql`
  query GetUserSettings {
    clinic_configurationsCollection(
      first: 1
      orderBy: [{ updated_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          clinic_name
          settings
          created_at
          updated_at
        }
      }
    }
  }
`

// Query para validar configuración
export const VALIDATE_CONFIGURATION = gql`
  query ValidateConfiguration($configData: JSON!) {
    # Esta query podría usar una función Supabase para validar la configuración
    # Por ahora retornamos la data tal como está
    __typename
  }
`