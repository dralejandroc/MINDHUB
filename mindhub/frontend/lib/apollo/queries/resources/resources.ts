import { gql } from '@apollo/client'

// Query para obtener todos los recursos médicos
export const GET_MEDICAL_RESOURCES = gql`
  query GetMedicalResources(
    $first: Int
    $after: Cursor
    $filter: medical_resourcesFilter
    $orderBy: [medical_resourcesOrderBy!]
  ) {
    medical_resourcesCollection(
      first: $first
      after: $after
      filter: $filter
      orderBy: $orderBy
    ) {
      edges {
        node {
          id
          title
          description
          file_path
          file_type
          file_size
          mime_type
          category
          tags
          is_public
          library_type
          owner_id
          clinic_id
          workspace_id
          upload_by
          view_count
          download_count
          send_count
          is_active
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

// Query para obtener recursos públicos (biblioteca global)
export const GET_PUBLIC_RESOURCES = gql`
  query GetPublicResources($category: String, $fileType: String, $searchText: String) {
    medical_resourcesCollection(
      filter: {
        and: [
          { is_public: { eq: true } }
          { is_active: { eq: true } }
          { category: { eq: $category } }
          { file_type: { eq: $fileType } }
          { title: { ilike: $searchText } }
        ]
      }
      orderBy: [{ title: AscNullsFirst }]
    ) {
      edges {
        node {
          id
          title
          description
          file_path
          file_type
          file_size
          mime_type
          category
          tags
          view_count
          download_count
          created_at
        }
      }
    }
  }
`

// Query para obtener recursos de usuario individual
export const GET_INDIVIDUAL_RESOURCES = gql`
  query GetIndividualResources($userId: UUID!, $category: String) {
    medical_resourcesCollection(
      filter: {
        and: [
          { owner_id: { eq: $userId } }
          { workspace_id: { is: "NOT_NULL" } }
          { category: { eq: $category } }
          { is_active: { eq: true } }
        ]
      }
      orderBy: [{ created_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          title
          description
          file_path
          file_type
          file_size
          mime_type
          category
          tags
          library_type
          view_count
          download_count
          send_count
          created_at
          updated_at
        }
      }
    }
  }
`

// Query para obtener recursos de clínica (compartidos)
export const GET_CLINIC_RESOURCES = gql`
  query GetClinicResources($clinicId: UUID!, $category: String) {
    medical_resourcesCollection(
      filter: {
        and: [
          { clinic_id: { eq: $clinicId } }
          { category: { eq: $category } }
          { is_active: { eq: true } }
        ]
      }
      orderBy: [{ created_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          title
          description
          file_path
          file_type
          file_size
          mime_type
          category
          tags
          library_type
          owner_id
          upload_by
          view_count
          download_count
          send_count
          created_at
          updated_at
        }
      }
    }
  }
`

// Query para buscar recursos por texto
export const SEARCH_RESOURCES = gql`
  query SearchResources(
    $searchText: String!
    $userId: UUID
    $clinicId: UUID
    $includePublic: Boolean = true
  ) {
    medical_resourcesCollection(
      filter: {
        and: [
          { is_active: { eq: true } }
          { title: { ilike: $searchText } }
          {
            or: [
              { is_public: { eq: $includePublic } }
              { owner_id: { eq: $userId } }
              { clinic_id: { eq: $clinicId } }
            ]
          }
        ]
      }
      orderBy: [{ title: AscNullsFirst }]
    ) {
      edges {
        node {
          id
          title
          description
          file_path
          file_type
          file_size
          category
          tags
          library_type
          is_public
          view_count
          created_at
        }
      }
    }
  }
`

// Query para obtener recurso específico por ID
export const GET_RESOURCE_BY_ID = gql`
  query GetResourceById($id: UUID!) {
    medical_resourcesCollection(filter: { id: { eq: $id } }) {
      edges {
        node {
          id
          title
          description
          file_path
          file_type
          file_size
          mime_type
          category
          tags
          is_public
          library_type
          owner_id
          clinic_id
          workspace_id
          upload_by
          view_count
          download_count
          send_count
          is_active
          created_at
          updated_at
        }
      }
    }
  }
`

// Query para estadísticas de recursos
export const GET_RESOURCES_STATS = gql`
  query GetResourcesStats($userId: UUID, $clinicId: UUID) {
    userResources: medical_resourcesCollection(
      filter: {
        and: [
          { owner_id: { eq: $userId } }
          { is_active: { eq: true } }
        ]
      }
    ) {
      edges {
        node {
          id
          file_size
          file_type
          category
        }
      }
    }
    
    clinicResources: medical_resourcesCollection(
      filter: {
        and: [
          { clinic_id: { eq: $clinicId } }
          { is_active: { eq: true } }
        ]
      }
    ) {
      edges {
        node {
          id
          file_size
          file_type
          category
        }
      }
    }
  }
`

// Query para obtener recursos por categoría
export const GET_RESOURCES_BY_CATEGORY = gql`
  query GetResourcesByCategory(
    $category: String!
    $userId: UUID
    $clinicId: UUID
    $includePublic: Boolean = true
  ) {
    medical_resourcesCollection(
      filter: {
        and: [
          { category: { eq: $category } }
          { is_active: { eq: true } }
          {
            or: [
              { is_public: { eq: $includePublic } }
              { owner_id: { eq: $userId } }
              { clinic_id: { eq: $clinicId } }
            ]
          }
        ]
      }
      orderBy: [{ title: AscNullsFirst }]
    ) {
      edges {
        node {
          id
          title
          description
          file_path
          file_type
          file_size
          category
          library_type
          is_public
          view_count
          download_count
          created_at
        }
      }
    }
  }
`