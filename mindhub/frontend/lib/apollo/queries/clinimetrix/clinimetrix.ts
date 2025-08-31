import { gql } from '@apollo/client'

export const GET_CLINIMETRIX_ASSESSMENTS = gql`
  query GetClinimetrixAssessments($filter: clinimetrix_assessmentsFilter, $first: Int) {
    clinimetrix_assessmentsCollection(filter: $filter, first: $first) {
      edges {
        node {
          id
          scale_id
          patient_id
          responses
          raw_score
          interpreted_score
          clinical_interpretation
          completed_at
          administered_by
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

export const CREATE_CLINIMETRIX_ASSESSMENT = gql`
  mutation CreateClinimetrixAssessment($objects: [clinimetrix_assessmentsInsertInput!]!) {
    insertIntoclinimetrix_assessmentsCollection(objects: $objects) {
      affectedCount
      records {
        id
        scale_id
        patient_id
        raw_score
        interpreted_score
      }
    }
  }
`

export const GET_CLINIMETRIX_SCALES = gql`
  query GetClinimetrixScales($filter: clinimetrix_scalesFilter, $first: Int) {
    clinimetrix_scalesCollection(filter: $filter, first: $first) {
      edges {
        node {
          id
          name
          abbreviation
          category
          description
          version
          questions
          scoring_rules
          metadata
          is_active
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