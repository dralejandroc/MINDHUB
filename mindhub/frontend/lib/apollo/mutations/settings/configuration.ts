import { gql } from '@apollo/client'

// Mutation para crear/actualizar configuración de clínica
export const UPSERT_CLINIC_CONFIGURATION = gql`
  mutation UpsertClinicConfiguration($input: clinic_configurationsInsertInput!) {
    insertIntoclinic_configurationsCollection(
      objects: [$input]
      onConflict: {
        constraint: clinic_configurations_clinic_id_workspace_id_key
        updateColumns: [
          configuration_data, clinic_info, print_configuration,
          digital_signature, medical_record_fields, prescription_settings,
          user_preferences, updated_at
        ]
      }
    ) {
      records {
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
`

// Mutation para actualizar configuración existente
export const UPDATE_CLINIC_CONFIGURATION = gql`
  mutation UpdateClinicConfiguration($id: UUID!, $input: clinic_configurationsUpdateInput!) {
    updateclinic_configurationsCollection(
      filter: { id: { eq: $id } }
      set: $input
    ) {
      records {
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
        updated_at
      }
    }
  }
`

// Mutation para crear nueva configuración
export const CREATE_CLINIC_CONFIGURATION = gql`
  mutation CreateClinicConfiguration($input: clinic_configurationsInsertInput!) {
    insertIntoclinic_configurationsCollection(objects: [$input]) {
      records {
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
`

// Mutation para configuración de usuario
export const UPSERT_USER_SETTINGS = gql`
  mutation UpsertUserSettings($input: user_settingsInsertInput!) {
    insertIntouser_settingsCollection(
      objects: [$input]
      onConflict: {
        constraint: user_settings_user_id_key
        updateColumns: [
          preferences, theme, language, date_format, time_format,
          currency, timezone, default_page, notifications_enabled, updated_at
        ]
      }
    ) {
      records {
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
        updated_at
      }
    }
  }
`

// Mutation para eliminar configuración (soft delete)
export const DELETE_CLINIC_CONFIGURATION = gql`
  mutation DeleteClinicConfiguration($id: UUID!) {
    updateclinic_configurationsCollection(
      filter: { id: { eq: $id } }
      set: { 
        is_active: false
        updated_at: "now()" 
      }
    ) {
      records {
        id
        is_active
        updated_at
      }
    }
  }
`

// Mutation para activar configuración
export const ACTIVATE_CLINIC_CONFIGURATION = gql`
  mutation ActivateClinicConfiguration($id: UUID!) {
    updateclinic_configurationsCollection(
      filter: { id: { eq: $id } }
      set: { 
        is_active: true
        updated_at: "now()" 
      }
    ) {
      records {
        id
        is_active
        updated_at
      }
    }
  }
`

// Mutation para duplicar configuración
export const DUPLICATE_CLINIC_CONFIGURATION = gql`
  mutation DuplicateClinicConfiguration(
    $sourceId: UUID!
    $newClinicId: UUID
    $newWorkspaceId: UUID
    $createdBy: UUID!
  ) {
    # Esta mutation requeriría una función personalizada en Supabase
    # Por ahora, se implementaría en el frontend copiando los datos
    __typename
  }
`