import { gql } from '@apollo/client'

// Query para obtener plantillas de documentos
export const GET_DOCUMENT_TEMPLATES = gql`
  query GetDocumentTemplates(
    $first: Int
    $after: Cursor
    $filter: document_templatesFilter
    $orderBy: [document_templatesOrderBy!]
  ) {
    document_templatesCollection(
      first: $first
      after: $after
      filter: $filter
      orderBy: $orderBy
    ) {
      edges {
        node {
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

// Query para obtener plantilla de documento específica
export const GET_DOCUMENT_TEMPLATE_BY_ID = gql`
  query GetDocumentTemplateById($id: UUID!) {
    document_templatesCollection(filter: { id: { eq: $id } }) {
      edges {
        node {
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
  }
`

// Query para obtener documentos activos por tipo
export const GET_ACTIVE_DOCUMENT_TEMPLATES = gql`
  query GetActiveDocumentTemplates($documentType: String) {
    document_templatesCollection(
      filter: {
        and: [
          { is_active: { eq: true } }
          { document_type: { eq: $documentType } }
        ]
      }
      orderBy: [{ is_default: DescNullsLast }, { name: AscNullsFirst }]
    ) {
      edges {
        node {
          id
          name
          document_type
          description
          template_content
          auto_fill_fields
          requires_signature
          is_default
          email_subject
          email_body
        }
      }
    }
  }
`

// Query para buscar plantillas de documentos
export const SEARCH_DOCUMENT_TEMPLATES = gql`
  query SearchDocumentTemplates(
    $searchText: String!
    $documentType: String
    $createdBy: UUID
  ) {
    document_templatesCollection(
      filter: {
        and: [
          { is_active: { eq: true } }
          { name: { ilike: $searchText } }
          { document_type: { eq: $documentType } }
          { created_by: { eq: $createdBy } }
        ]
      }
      orderBy: [{ name: AscNullsFirst }]
    ) {
      edges {
        node {
          id
          name
          document_type
          description
          template_content
          requires_signature
          is_default
          created_at
        }
      }
    }
  }
`

// Query para documentos por defecto
export const GET_DEFAULT_DOCUMENT_TEMPLATES = gql`
  query GetDefaultDocumentTemplates {
    document_templatesCollection(
      filter: {
        and: [
          { is_active: { eq: true } }
          { is_default: { eq: true } }
        ]
      }
      orderBy: [{ document_type: AscNullsFirst }]
    ) {
      edges {
        node {
          id
          name
          document_type
          description
          template_content
          auto_fill_fields
          requires_signature
          email_subject
          email_body
        }
      }
    }
  }
`