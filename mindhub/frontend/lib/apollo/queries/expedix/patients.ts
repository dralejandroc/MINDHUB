import { gql } from '@apollo/client'

// Query para obtener todos los pacientes con paginación y filtros
export const GET_PATIENTS = gql`
  query GetPatients(
    $first: Int
    $after: Cursor
    $filter: patientsFilter
    $orderBy: [patientsOrderBy!]
  ) {
    patientsCollection(
      first: $first
      after: $after
      filter: $filter
      orderBy: $orderBy
    ) {
      edges {
        node {
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
          updated_at
          clinic_id
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

// Query para obtener un paciente específico por ID
export const GET_PATIENT_BY_ID = gql`
  query GetPatientById($id: UUID!) {
    patientsCollection(filter: { id: { eq: $id } }) {
      edges {
        node {
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
          created_at
          updated_at
          clinic_id
        }
      }
    }
  }
`

// Query para obtener paciente con sus citas relacionadas
export const GET_PATIENT_WITH_APPOINTMENTS = gql`
  query GetPatientWithAppointments($id: UUID!) {
    patientsCollection(filter: { id: { eq: $id } }) {
      edges {
        node {
          id
          first_name
          last_name
          paternal_last_name
          maternal_last_name
          email
          phone
          appointmentsCollection {
            edges {
              node {
                id
                appointment_date
                status
                notes
                created_at
              }
            }
          }
        }
      }
    }
  }
`

// Query para búsqueda de pacientes por texto
export const SEARCH_PATIENTS = gql`
  query SearchPatients($searchText: String!, $first: Int) {
    patientsCollection(
      first: $first
      filter: {
        or: [
          { first_name: { ilike: $searchText } }
          { last_name: { ilike: $searchText } }
          { paternal_last_name: { ilike: $searchText } }
          { maternal_last_name: { ilike: $searchText } }
          { email: { ilike: $searchText } }
          { phone: { ilike: $searchText } }
        ]
      }
      orderBy: [{ first_name: AscNullsFirst }]
    ) {
      edges {
        node {
          id
          first_name
          last_name
          paternal_last_name
          maternal_last_name
          email
          phone
          date_of_birth
          gender
          is_active
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