import { gql } from '@apollo/client'

export const GET_SETTINGS = gql`
  query GetSettings($filter: settingsFilter) {
    settingsCollection(filter: $filter) {
      edges {
        node {
          id
          setting_type
          setting_key
          value
          user_id
          clinic_id
          workspace_id
          created_at
          updated_at
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`

export const CREATE_SETTING = gql`
  mutation CreateSetting($objects: [settingsInsertInput!]!) {
    insertIntosettingsCollection(objects: $objects) {
      affectedCount
      records {
        id
        setting_type
        setting_key
        value
      }
    }
  }
`

export const UPDATE_SETTING = gql`
  mutation UpdateSetting($id: BigInt!, $set: settingsUpdateInput!) {
    updatesettingsCollection(filter: { id: { eq: $id } }, set: $set) {
      affectedCount
      records {
        id
        setting_type
        setting_key
        value
      }
    }
  }
`