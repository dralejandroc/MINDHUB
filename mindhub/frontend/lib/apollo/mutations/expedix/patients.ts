import { gql } from '@apollo/client'

// Mutation para crear un nuevo paciente
export const CREATE_PATIENT = gql`
  mutation CreatePatient($input: patientsInsertInput!) {
    insertIntopatientsCollection(objects: [$input]) {
      records {
        id
        first_name
        last_name
        paternal_last_name
        maternal_last_name
        email
        phone
        date_of_birth
        gender
        blood_type
        emergency_contact
        emergency_phone
        address
        city
        state
        postal_code
        occupation
        marital_status
        is_active
        created_at
        clinic_id
      }
    }
  }
`

// Mutation para actualizar un paciente existente
export const UPDATE_PATIENT = gql`
  mutation UpdatePatient($id: UUID!, $input: patientsUpdateInput!) {
    updatepatientsCollection(
      filter: { id: { eq: $id } }
      set: $input
    ) {
      records {
        id
        first_name
        last_name
        paternal_last_name
        maternal_last_name
        email
        phone
        date_of_birth
        gender
        blood_type
        emergency_contact
        emergency_phone
        address
        city
        state
        postal_code
        occupation
        marital_status
        medical_history
        current_medications
        allergies
        chronic_conditions
        insurance_provider
        insurance_number
        is_active
        notes
        tags
        updated_at
        clinic_id
      }
    }
  }
`

// Mutation para actualizar información básica de paciente (campos simples)
export const UPDATE_PATIENT_BASIC_INFO = gql`
  mutation UpdatePatientBasicInfo($id: UUID!, $input: patientsUpdateInput!) {
    updatepatientsCollection(
      filter: { id: { eq: $id } }
      set: $input
    ) {
      records {
        id
        first_name
        last_name
        paternal_last_name
        maternal_last_name
        email
        phone
        date_of_birth
        gender
        blood_type
        address
        city
        state
        postal_code
        occupation
        marital_status
        updated_at
      }
    }
  }
`

// Mutation para activar/desactivar un paciente
export const TOGGLE_PATIENT_STATUS = gql`
  mutation TogglePatientStatus($id: UUID!, $isActive: Boolean!) {
    updatepatientsCollection(
      filter: { id: { eq: $id } }
      set: { is_active: $isActive }
    ) {
      records {
        id
        first_name
        last_name
        is_active
        updated_at
      }
    }
  }
`

// Mutation para eliminar un paciente (soft delete)
export const DELETE_PATIENT = gql`
  mutation DeletePatient($id: UUID!) {
    updatepatientsCollection(
      filter: { id: { eq: $id } }
      set: { is_active: false }
    ) {
      records {
        id
        first_name
        last_name
        is_active
        updated_at
      }
    }
  }
`

// Mutation para actualizar solo notas del paciente
export const UPDATE_PATIENT_NOTES = gql`
  mutation UpdatePatientNotes($id: UUID!, $notes: String!) {
    updatepatientsCollection(
      filter: { id: { eq: $id } }
      set: { notes: $notes }
    ) {
      records {
        id
        notes
        updated_at
      }
    }
  }
`

// Mutation para actualizar tags del paciente  
export const UPDATE_PATIENT_TAGS = gql`
  mutation UpdatePatientTags($id: UUID!, $tags: [String]!) {
    updatepatientsCollection(
      filter: { id: { eq: $id } }
      set: { tags: $tags }
    ) {
      records {
        id
        tags
        updated_at
      }
    }
  }
`