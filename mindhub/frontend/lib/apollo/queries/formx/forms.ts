import { gql } from '@apollo/client'

// Query para obtener todas las plantillas de formulario
export const GET_FORM_TEMPLATES = gql`
  query GetFormTemplates(
    $first: Int
    $after: Cursor
    $filter: dynamic_formsFilter
    $orderBy: [dynamic_formsOrderBy!]
  ) {
    dynamic_formsCollection(
      first: $first
      after: $after
      filter: $filter
      orderBy: $orderBy
    ) {
      edges {
        node {
          id
          form_name
          category
          form_description
          integration_type
          is_default
          is_active
          requires_auth
          mobile_optimized
          auto_sync_expedix
          expedix_mapping
          email_template
          success_message
          redirect_url
          created_by
          created_at
          updated_at
          # Computed fields from relations
          total_fields: form_fieldsCollection(first: 1000) {
            edges {
              node {
                id
              }
            }
          }
          total_submissions: form_submissionsCollection(first: 1000) {
            edges {
              node {
                id
              }
            }
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

// Query para obtener plantilla específica con campos
export const GET_FORM_TEMPLATE_WITH_FIELDS = gql`
  query GetFormTemplateWithFields($id: UUID!) {
    dynamic_formsCollection(filter: { id: { eq: $id } }) {
      edges {
        node {
          id
          form_name
          category
          form_description
          integration_type
          is_default
          is_active
          requires_auth
          mobile_optimized
          auto_sync_expedix
          expedix_mapping
          email_template
          success_message
          redirect_url
          created_by
          created_at
          updated_at
          
          # Campos del formulario ordenados
          form_fields: form_fieldsCollection(
            orderBy: [{ order: AscNullsFirst }]
            first: 100
          ) {
            edges {
              node {
                id
                field_name
                field_type
                label
                help_text
                placeholder
                required
                min_length
                max_length
                min_value
                max_value
                order
                css_classes
                choices
                show_conditions
                validation_rules
                expedix_field
              }
            }
          }
        }
      }
    }
  }
`

// Query para obtener formularios activos por tipo
export const GET_ACTIVE_FORM_TEMPLATES = gql`
  query GetActiveFormTemplates(
    $formType: String
    $integrationType: String
  ) {
    dynamic_formsCollection(
      filter: {
        and: [
          { is_active: { eq: true } }
          { form_type: { eq: $formType } }
          { integration_type: { eq: $integrationType } }
        ]
      }
      orderBy: [{ is_default: DescNullsLast }, { name: AscNullsFirst }]
    ) {
      edges {
        node {
          id
          form_name
          category
          form_description
          integration_type
          is_default
          requires_auth
          mobile_optimized
          total_fields: form_fieldsCollection(first: 1000) {
            edges {
              node {
                id
              }
            }
          }
        }
      }
    }
  }
`

// Query para obtener envíos de formularios
export const GET_FORM_SUBMISSIONS = gql`
  query GetFormSubmissions(
    $first: Int
    $after: Cursor
    $filter: form_submissionsFilter
    $orderBy: [form_submissionsOrderBy!]
  ) {
    form_submissionsCollection(
      first: $first
      after: $after
      filter: $filter
      orderBy: $orderBy
    ) {
      edges {
        node {
          id
          template_id
          patient_id
          patient_email
          access_token
          form_data
          submitted_at
          ip_address
          user_agent
          device_type
          status
          is_processed
          synced_to_expedix
          expedix_sync_date
          processing_notes
          error_message
          
          # Relación con template
          form_templates {
            id
            form_name
            form_type
            integration_type
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

// Query para obtener envíos por paciente
export const GET_FORM_SUBMISSIONS_BY_PATIENT = gql`
  query GetFormSubmissionsByPatient(
    $patientId: String!
    $first: Int
  ) {
    form_submissionsCollection(
      filter: { patient_id: { eq: $patientId } }
      orderBy: [{ submitted_at: DescNullsLast }]
      first: $first
    ) {
      edges {
        node {
          id
          template_id
          form_data
          submitted_at
          status
          is_processed
          synced_to_expedix
          
          form_templates {
            id
            form_name
            form_type
            description
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

// Query para obtener envío específico por token
export const GET_FORM_SUBMISSION_BY_TOKEN = gql`
  query GetFormSubmissionByToken($token: String!) {
    form_submissionsCollection(
      filter: { access_token: { eq: $token } }
    ) {
      edges {
        node {
          id
          template_id
          patient_id
          patient_email
          form_data
          submitted_at
          status
          is_processed
          
          form_templates {
            id
            form_name
            form_type
            description
            requires_auth
            mobile_optimized
            success_message
            redirect_url
            
            form_fields: form_fieldsCollection(
              orderBy: [{ order: AscNullsFirst }]
            ) {
              edges {
                node {
                  id
                  field_name
                  field_type
                  label
                  help_text
                  placeholder
                  required
                  min_length
                  max_length
                  min_value
                  max_value
                  choices
                  show_conditions
                  validation_rules
                }
              }
            }
          }
        }
      }
    }
  }
`

// Query para estadísticas de formularios
export const GET_FORM_STATISTICS = gql`
  query GetFormStatistics(
    $startDate: Date
    $endDate: Date
    $createdBy: UUID
  ) {
    # Total templates
    totalTemplates: dynamic_formsCollection(
      filter: { created_by: { eq: $createdBy } }
    ) {
      edges {
        node {
          id
          form_type
          is_active
        }
      }
    }
    
    # Recent submissions
    recentSubmissions: form_submissionsCollection(
      filter: {
        and: [
          { submitted_at: { gte: $startDate } }
          { submitted_at: { lte: $endDate } }
        ]
      }
      orderBy: [{ submitted_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          status
          is_processed
          synced_to_expedix
          submitted_at
          form_templates {
            form_type
            integration_type
          }
        }
      }
    }
  }
`

// Query para obtener campos de formulario
export const GET_FORM_FIELDS = gql`
  query GetFormFields($templateId: UUID!) {
    form_fieldsCollection(
      filter: { template_id: { eq: $templateId } }
      orderBy: [{ order: AscNullsFirst }]
    ) {
      edges {
        node {
          id
          template_id
          field_name
          field_type
          label
          help_text
          placeholder
          required
          min_length
          max_length
          min_value
          max_value
          order
          css_classes
          choices
          show_conditions
          validation_rules
          expedix_field
        }
      }
    }
  }
`

// Query para buscar formularios
export const SEARCH_FORM_TEMPLATES = gql`
  query SearchFormTemplates(
    $searchText: String!
    $formType: String
    $createdBy: UUID
  ) {
    dynamic_formsCollection(
      filter: {
        and: [
          { is_active: { eq: true } }
          { name: { ilike: $searchText } }
          { form_type: { eq: $formType } }
          { created_by: { eq: $createdBy } }
        ]
      }
      orderBy: [{ name: AscNullsFirst }]
    ) {
      edges {
        node {
          id
          form_name
          category
          form_description
          integration_type
          is_default
          created_at
          total_fields: form_fieldsCollection(first: 1000) {
            edges {
              node {
                id
              }
            }
          }
          total_submissions: form_submissionsCollection(first: 1000) {
            edges {
              node {
                id
              }
            }
          }
        }
      }
    }
  }
`