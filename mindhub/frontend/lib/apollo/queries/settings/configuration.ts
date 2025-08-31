import { gql } from '@apollo/client'

// Query para obtener configuración de clínica/usuario
export const GET_CLINIC_CONFIGURATION = gql`
  query GetClinicConfiguration($clinicId: UUID, $workspaceId: UUID) {
    clinic_configurationsCollection(
      filter: {
        or: [
          { clinic_id: { eq: $clinicId } }
          { workspace_id: { eq: $workspaceId } }
        ]
      }
      first: 1
      orderBy: [{ updated_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          clinic_id
          workspace_id
          configuration_data
          clinic_info
          print_configuration
          digital_signature
          medical_record_fields
          prescription_settings
          user_preferences
          is_active
          created_at
          updated_at
          created_by
        }
      }
    }
  }
`

// Query para obtener configuración por defecto
export const GET_DEFAULT_CONFIGURATION = gql`
  query GetDefaultConfiguration {
    default_configurationsCollection(
      filter: { is_active: { eq: true } }
      first: 1
      orderBy: [{ created_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          configuration_type
          configuration_data
          clinic_info
          print_configuration
          digital_signature
          medical_record_fields
          prescription_settings
          user_preferences
          description
          is_active
        }
      }
    }
  }
`

// Query para obtener todas las configuraciones disponibles
export const GET_ALL_CONFIGURATIONS = gql`
  query GetAllConfigurations($clinicId: UUID, $workspaceId: UUID) {
    clinic_configurationsCollection(
      filter: {
        and: [
          { is_active: { eq: true } }
          {
            or: [
              { clinic_id: { eq: $clinicId } }
              { workspace_id: { eq: $workspaceId } }
            ]
          }
        ]
      }
      orderBy: [{ updated_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          clinic_id
          workspace_id
          configuration_data
          clinic_info
          print_configuration
          digital_signature
          medical_record_fields
          prescription_settings
          user_preferences
          is_active
          created_at
          updated_at
          created_by
        }
      }
    }
  }
`

// Query para obtener configuraciones de usuario específico
export const GET_USER_SETTINGS = gql`
  query GetUserSettings($userId: UUID!) {
    user_settingsCollection(
      filter: { user_id: { eq: $userId } }
      first: 1
      orderBy: [{ updated_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          user_id
          preferences
          theme
          language
          date_format
          time_format
          currency
          timezone
          default_page
          notifications_enabled
          is_active
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