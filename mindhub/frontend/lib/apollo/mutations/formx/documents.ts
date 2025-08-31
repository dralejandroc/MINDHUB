import { gql } from '@apollo/client'

// Mutation para crear plantilla de documento
export const CREATE_DOCUMENT_TEMPLATE = gql`
  mutation CreateDocumentTemplate($input: document_templatesInsertInput!) {
    insertIntodocument_templatesCollection(objects: [$input]) {
      records {
        id
        name
        document_type
        description
        template_content
        auto_fill_fields
        requires_signature
        is_active
        is_default
        email_subject
        email_body
        created_by
        created_at
        updated_at
      }
    }
  }
`

// Mutation para actualizar plantilla de documento
export const UPDATE_DOCUMENT_TEMPLATE = gql`
  mutation UpdateDocumentTemplate($id: UUID!, $input: document_templatesUpdateInput!) {
    updatedocument_templatesCollection(
      filter: { id: { eq: $id } }
      set: $input
    ) {
      records {
        id
        name
        document_type
        description
        template_content
        auto_fill_fields
        requires_signature
        is_active
        is_default
        email_subject
        email_body
        updated_at
      }
    }
  }
`

// Mutation para eliminar plantilla de documento
export const DELETE_DOCUMENT_TEMPLATE = gql`
  mutation DeleteDocumentTemplate($id: UUID!) {
    updatedocument_templatesCollection(
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

// Mutation para marcar como plantilla por defecto
export const SET_DEFAULT_DOCUMENT_TEMPLATE = gql`
  mutation SetDefaultDocumentTemplate($id: UUID!, $documentType: String!) {
    # Primero quitar el default de otras plantillas del mismo tipo
    removeDefault: updatedocument_templatesCollection(
      filter: { 
        and: [
          { document_type: { eq: $documentType } }
          { is_default: { eq: true } }
        ]
      }
      set: { is_default: false }
    ) {
      records {
        id
        is_default
      }
    }
    
    # Luego marcar la nueva como default
    setDefault: updatedocument_templatesCollection(
      filter: { id: { eq: $id } }
      set: { is_default: true }
    ) {
      records {
        id
        name
        is_default
        updated_at
      }
    }
  }
`

// Mutation para clonar plantilla de documento
export const CLONE_DOCUMENT_TEMPLATE = gql`
  mutation CloneDocumentTemplate(
    $originalId: UUID!
    $newName: String!
    $createdBy: UUID!
    $templateContent: String!
    $documentType: String!
  ) {
    insertIntodocument_templatesCollection(objects: [{
      name: $newName
      document_type: $documentType
      template_content: $templateContent
      created_by: $createdBy
      is_active: true
      is_default: false
    }]) {
      records {
        id
        name
        document_type
        created_at
      }
    }
  }
`

// Mutation para actualizar contenido de plantilla
export const UPDATE_DOCUMENT_TEMPLATE_CONTENT = gql`
  mutation UpdateDocumentTemplateContent($id: UUID!, $templateContent: String!) {
    updatedocument_templatesCollection(
      filter: { id: { eq: $id } }
      set: { 
        template_content: $templateContent
        updated_at: "now()"
      }
    ) {
      records {
        id
        template_content
        updated_at
      }
    }
  }
`

// Mutation para actualizar campos auto-llenables
export const UPDATE_DOCUMENT_AUTO_FILL_FIELDS = gql`
  mutation UpdateDocumentAutoFillFields($id: UUID!, $autoFillFields: [String]!) {
    updatedocument_templatesCollection(
      filter: { id: { eq: $id } }
      set: { 
        auto_fill_fields: $autoFillFields
        updated_at: "now()"
      }
    ) {
      records {
        id
        auto_fill_fields
        updated_at
      }
    }
  }
`

// Mutation para actualizar configuración de email
export const UPDATE_DOCUMENT_EMAIL_CONFIG = gql`
  mutation UpdateDocumentEmailConfig(
    $id: UUID!
    $emailSubject: String
    $emailBody: String
  ) {
    updatedocument_templatesCollection(
      filter: { id: { eq: $id } }
      set: { 
        email_subject: $emailSubject
        email_body: $emailBody
        updated_at: "now()"
      }
    ) {
      records {
        id
        email_subject
        email_body
        updated_at
      }
    }
  }
`

// Mutation para activar/desactivar plantilla
export const TOGGLE_DOCUMENT_TEMPLATE_STATUS = gql`
  mutation ToggleDocumentTemplateStatus($id: UUID!, $isActive: Boolean!) {
    updatedocument_templatesCollection(
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