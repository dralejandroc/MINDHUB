import { gql } from '@apollo/client'

// Mutation para crear plantilla de formulario
export const CREATE_FORM_TEMPLATE = gql`
  mutation CreateFormTemplate($input: form_templatesInsertInput!) {
    insertIntoform_templatesCollection(objects: [$input]) {
      records {
        id
        name
        form_type
        description
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
      }
    }
  }
`

// Mutation para actualizar plantilla de formulario
export const UPDATE_FORM_TEMPLATE = gql`
  mutation UpdateFormTemplate($id: UUID!, $input: form_templatesUpdateInput!) {
    updateform_templatesCollection(
      filter: { id: { eq: $id } }
      set: $input
    ) {
      records {
        id
        name
        form_type
        description
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
        updated_at
      }
    }
  }
`

// Mutation para eliminar plantilla de formulario
export const DELETE_FORM_TEMPLATE = gql`
  mutation DeleteFormTemplate($id: UUID!) {
    updateform_templatesCollection(
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

// Mutation para crear campo de formulario
export const CREATE_FORM_FIELD = gql`
  mutation CreateFormField($input: form_fieldsInsertInput!) {
    insertIntoform_fieldsCollection(objects: [$input]) {
      records {
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
`

// Mutation para actualizar campo de formulario
export const UPDATE_FORM_FIELD = gql`
  mutation UpdateFormField($id: UUID!, $input: form_fieldsUpdateInput!) {
    updateform_fieldsCollection(
      filter: { id: { eq: $id } }
      set: $input
    ) {
      records {
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
`

// Mutation para eliminar campo de formulario
export const DELETE_FORM_FIELD = gql`
  mutation DeleteFormField($id: UUID!) {
    deleteFromform_fieldsCollection(
      filter: { id: { eq: $id } }
    ) {
      records {
        id
        field_name
      }
    }
  }
`

// Mutation para crear envío de formulario
export const CREATE_FORM_SUBMISSION = gql`
  mutation CreateFormSubmission($input: form_submissionsInsertInput!) {
    insertIntoform_submissionsCollection(objects: [$input]) {
      records {
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
      }
    }
  }
`

// Mutation para actualizar envío de formulario
export const UPDATE_FORM_SUBMISSION = gql`
  mutation UpdateFormSubmission($id: UUID!, $input: form_submissionsUpdateInput!) {
    updateform_submissionsCollection(
      filter: { id: { eq: $id } }
      set: $input
    ) {
      records {
        id
        template_id
        patient_id
        form_data
        status
        is_processed
        synced_to_expedix
        expedix_sync_date
        processing_notes
        error_message
      }
    }
  }
`

// Mutation para marcar envío como procesado
export const MARK_SUBMISSION_AS_PROCESSED = gql`
  mutation MarkSubmissionAsProcessed($id: UUID!, $notes: String) {
    updateform_submissionsCollection(
      filter: { id: { eq: $id } }
      set: { 
        status: "processed"
        is_processed: true
        processing_notes: $notes
      }
    ) {
      records {
        id
        status
        is_processed
        processing_notes
      }
    }
  }
`

// Mutation para marcar como sincronizado con Expedix
export const MARK_SUBMISSION_AS_SYNCED = gql`
  mutation MarkSubmissionAsSynced($id: UUID!) {
    updateform_submissionsCollection(
      filter: { id: { eq: $id } }
      set: { 
        status: "synced"
        synced_to_expedix: true
        expedix_sync_date: "now()"
      }
    ) {
      records {
        id
        status
        synced_to_expedix
        expedix_sync_date
      }
    }
  }
`

// Mutation para marcar envío con error
export const MARK_SUBMISSION_WITH_ERROR = gql`
  mutation MarkSubmissionWithError($id: UUID!, $errorMessage: String!) {
    updateform_submissionsCollection(
      filter: { id: { eq: $id } }
      set: { 
        status: "error"
        error_message: $errorMessage
      }
    ) {
      records {
        id
        status
        error_message
      }
    }
  }
`

// Mutation para clonar plantilla de formulario
export const CLONE_FORM_TEMPLATE = gql`
  mutation CloneFormTemplate(
    $originalId: UUID!
    $newName: String!
    $createdBy: UUID!
  ) {
    insertIntoform_templatesCollection(objects: [{
      name: $newName
      created_by: $createdBy
      is_active: true
      is_default: false
    }]) {
      records {
        id
        name
        form_type
        created_at
      }
    }
  }
`

// Mutation para actualizar orden de campos
export const UPDATE_FIELD_ORDER = gql`
  mutation UpdateFieldOrder($updates: [form_fieldsUpdateInput!]!) {
    updateform_fieldsCollection(
      set: { order: $order }
    ) {
      records {
        id
        field_name
        order
      }
    }
  }
`

// Mutation para duplicar campo
export const DUPLICATE_FORM_FIELD = gql`
  mutation DuplicateFormField(
    $templateId: UUID!
    $fieldName: String!
    $label: String!
    $fieldType: String!
    $order: Int!
  ) {
    insertIntoform_fieldsCollection(objects: [{
      template_id: $templateId
      field_name: $fieldName
      field_type: $fieldType
      label: $label
      order: $order
      required: false
    }]) {
      records {
        id
        field_name
        field_type
        label
        order
      }
    }
  }
`

// Mutation para envío masivo de formularios
export const BULK_CREATE_FORM_SUBMISSIONS = gql`
  mutation BulkCreateFormSubmissions($inputs: [form_submissionsInsertInput!]!) {
    insertIntoform_submissionsCollection(objects: $inputs) {
      records {
        id
        template_id
        patient_id
        patient_email
        access_token
        status
        submitted_at
      }
    }
  }
`