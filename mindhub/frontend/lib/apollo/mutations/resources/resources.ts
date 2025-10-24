import { gql } from '@apollo/client'

// Mutation para crear un nuevo recurso médico
export const CREATE_MEDICAL_RESOURCE = gql`
  mutation CreateMedicalResource($input: medical_resourcesInsertInput!) {
    insertIntomedical_resourcesCollection(objects: [$input]) {
      records {
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
        user_id
        upload_by
        is_active
        created_at
        updated_at
      }
    }
  }
`

// Mutation para actualizar un recurso médico
export const UPDATE_MEDICAL_RESOURCE = gql`
  mutation UpdateMedicalResource($id: UUID!, $input: medical_resourcesUpdateInput!) {
    updatemedical_resourcesCollection(
      filter: { id: { eq: $id } }
      set: $input
    ) {
      records {
        id
        title
        description
        category
        tags
        is_public
        library_type
        updated_at
      }
    }
  }
`

// Mutation para eliminar recurso (soft delete)
export const DELETE_MEDICAL_RESOURCE = gql`
  mutation DeleteMedicalResource($id: UUID!) {
    updatemedical_resourcesCollection(
      filter: { id: { eq: $id } }
      set: { is_active: false }
    ) {
      records {
        id
        title
        is_active
        updated_at
      }
    }
  }
`

// Mutation para incrementar contador de vista
export const INCREMENT_RESOURCE_VIEW_COUNT = gql`
  mutation IncrementResourceViewCount($id: UUID!) {
    updatemedical_resourcesCollection(
      filter: { id: { eq: $id } }
      set: { view_count: { increment: 1 } }
    ) {
      records {
        id
        view_count
      }
    }
  }
`

// Mutation para incrementar contador de descarga
export const INCREMENT_RESOURCE_DOWNLOAD_COUNT = gql`
  mutation IncrementResourceDownloadCount($id: UUID!) {
    updatemedical_resourcesCollection(
      filter: { id: { eq: $id } }
      set: { download_count: { increment: 1 } }
    ) {
      records {
        id
        download_count
      }
    }
  }
`

// Mutation para incrementar contador de envío
export const INCREMENT_RESOURCE_SEND_COUNT = gql`
  mutation IncrementResourceSendCount($id: UUID!) {
    updatemedical_resourcesCollection(
      filter: { id: { eq: $id } }
      set: { send_count: { increment: 1 } }
    ) {
      records {
        id
        send_count
      }
    }
  }
`

// Mutation para actualizar tags de un recurso
export const UPDATE_RESOURCE_TAGS = gql`
  mutation UpdateResourceTags($id: UUID!, $tags: [String]!) {
    updatemedical_resourcesCollection(
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

// Mutation para cambiar visibilidad de recurso
export const TOGGLE_RESOURCE_VISIBILITY = gql`
  mutation ToggleResourceVisibility($id: UUID!, $isPublic: Boolean!) {
    updatemedical_resourcesCollection(
      filter: { id: { eq: $id } }
      set: { is_public: $isPublic }
    ) {
      records {
        id
        title
        is_public
        updated_at
      }
    }
  }
`

// Mutation para mover recurso entre bibliotecas
export const MOVE_RESOURCE_TO_LIBRARY = gql`
  mutation MoveResourceToLibrary(
    $id: UUID!
    $libraryType: String!
    $clinicId: UUID
    $workspaceId: UUID
  ) {
    updatemedical_resourcesCollection(
      filter: { id: { eq: $id } }
      set: { 
        library_type: $libraryType
        clinic_id: $clinicId
        workspace_id: $workspaceId
      }
    ) {
      records {
        id
        title
        library_type
        clinic_id
        user_id
        updated_at
      }
    }
  }
`

// Mutation para actualizar categoría de múltiples recursos
export const BULK_UPDATE_RESOURCE_CATEGORY = gql`
  mutation BulkUpdateResourceCategory($resourceIds: [UUID!]!, $category: String!) {
    updatemedical_resourcesCollection(
      filter: { id: { in: $resourceIds } }
      set: { category: $category }
    ) {
      records {
        id
        title
        category
        updated_at
      }
    }
  }
`

// Mutation para duplicar recurso a otra biblioteca
export const DUPLICATE_RESOURCE_TO_LIBRARY = gql`
  mutation DuplicateResourceToLibrary(
    $originalId: UUID!
    $title: String!
    $libraryType: String!
    $clinicId: UUID
    $workspaceId: UUID
    $ownerId: UUID!
    $uploadBy: UUID!
  ) {
    insertIntomedical_resourcesCollection(objects: [{
      title: $title
      library_type: $libraryType
      clinic_id: $clinicId
      workspace_id: $workspaceId
      owner_id: $ownerId
      upload_by: $uploadBy
      is_active: true
    }]) {
      records {
        id
        title
        library_type
        clinic_id
        user_id
        created_at
      }
    }
  }
`