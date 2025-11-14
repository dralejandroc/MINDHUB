import { gql } from '@apollo/client'

export const GET_DYNAMIC_FORMS = gql`
  query GetDynamicForms($filter: dynamic_formsFilter, $first: Int) {
    dynamic_formsCollection(filter: $filter, first: $first) {
      edges {
        node {
          id
          title
          description
          form_structure
          form_type
          status
          created_by
          clinic_id
          user_id
          created_at
          updated_at
          is_public
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`

export const CREATE_DYNAMIC_FORM = gql`
  mutation CreateDynamicForm($objects: [dynamic_formsInsertInput!]!) {
    insertIntodynamic_formsCollection(objects: $objects) {
      affectedCount
      records {
        id
        title
        description
        status
      }
    }
  }
`

export const GET_FORM_RESPONSES = gql`
  query GetFormResponses($filter: form_responsesFilter, $first: Int) {
    form_responsesCollection(filter: $filter, first: $first) {
      edges {
        node {
          id
          form_id
          patient_id
          responses
          status
          submitted_at
          created_at
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`