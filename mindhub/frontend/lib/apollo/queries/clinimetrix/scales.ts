import { gql } from '@apollo/client'

// Query para obtener todas las escalas psicométricas
export const GET_PSYCHOMETRIC_SCALES = gql`
  query GetPsychometricScales(
    $first: Int
    $after: Cursor
    $filter: psychometric_scalesFilter
    $orderBy: [psychometric_scalesOrderBy!]
  ) {
    psychometric_scalesCollection(
      first: $first
      after: $after
      filter: $filter
      orderBy: $orderBy
    ) {
      edges {
        node {
          id
          scale_name
          abbreviation
          description
          category
          subcategory
          version
          language
          authors
          publication_year
          target_age_min
          target_age_max
          gender_specific
          administration_time
          item_count
          response_format
          scoring_system
          subscales
          scoring_instructions
          interpretation_guide
          clinical_cutoffs
          normative_data
          reliability_data
          validity_data
          is_active
          is_featured
          difficulty_level
          requires_training
          certification_required
          copyright_info
          available_languages
          digital_version_available
          adaptive_testing
          short_form_available
          parent_version_available
          self_report_available
          interview_format_available
          created_at
          updated_at
          
          # Contadores relacionados
          total_assessments: assessmentsCollection(first: 1000) {
            edges {
              node {
                id
              }
            }
          }
          
          total_items: scale_itemsCollection(first: 1000) {
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

// Query para obtener escala específica con todos los ítems
export const GET_SCALE_WITH_ITEMS = gql`
  query GetScaleWithItems($id: UUID!) {
    psychometric_scalesCollection(filter: { id: { eq: $id } }) {
      edges {
        node {
          id
          name
          abbreviation
          description
          category
          subcategory
          version
          language
          authors
          publication_year
          target_age_min
          target_age_max
          administration_time
          item_count
          response_format
          scoring_system
          subscales
          scoring_instructions
          interpretation_guide
          clinical_cutoffs
          normative_data
          reliability_data
          validity_data
          requires_training
          certification_required
          
          # Ítems de la escala ordenados
          scale_items: scale_itemsCollection(
            orderBy: [{ item_number: AscNullsFirst }]
          ) {
            edges {
              node {
                id
                item_number
                section_id
                section_name
                item_text
                item_type
                response_options
                scoring_key
                reverse_scored
                subscale_membership
                item_difficulty
                item_discrimination
                content_domain
                cognitive_load
                reading_level
                is_active
                special_instructions
                skip_logic
                validation_rules
                localization_notes
              }
            }
          }
        }
      }
    }
  }
`

// Query para obtener escalas activas por categoría
export const GET_ACTIVE_SCALES_BY_CATEGORY = gql`
  query GetActiveScalesByCategory($category: String!, $language: String = "es") {
    psychometric_scalesCollection(
      filter: {
        and: [
          { is_active: { eq: true } }
          { category: { eq: $category } }
          { language: { eq: $language } }
        ]
      }
      orderBy: [{ is_featured: DescNullsLast }, { name: AscNullsFirst }]
    ) {
      edges {
        node {
          id
          name
          abbreviation
          description
          subcategory
          version
          target_age_min
          target_age_max
          administration_time
          item_count
          difficulty_level
          requires_training
          is_featured
          digital_version_available
          short_form_available
          
          total_assessments: assessmentsCollection(
            filter: { status: { eq: "completed" } }
            first: 1000
          ) {
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

// Query para escalas destacadas
export const GET_FEATURED_SCALES = gql`
  query GetFeaturedScales($language: String = "es", $first: Int = 10) {
    psychometric_scalesCollection(
      filter: {
        and: [
          { is_active: { eq: true } }
          { is_featured: { eq: true } }
          { language: { eq: $language } }
        ]
      }
      orderBy: [{ name: AscNullsFirst }]
      first: $first
    ) {
      edges {
        node {
          id
          name
          abbreviation
          description
          category
          subcategory
          target_age_min
          target_age_max
          administration_time
          item_count
          difficulty_level
          digital_version_available
          
          total_assessments: assessmentsCollection(first: 1000) {
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

// Query para buscar escalas
export const SEARCH_SCALES = gql`
  query SearchScales(
    $searchText: String!
    $category: String
    $language: String = "es"
    $targetAge: Int
  ) {
    psychometric_scalesCollection(
      filter: {
        and: [
          { is_active: { eq: true } }
          { language: { eq: $language } }
          { category: { eq: $category } }
          { target_age_min: { lte: $targetAge } }
          { target_age_max: { gte: $targetAge } }
          {
            or: [
              { name: { ilike: $searchText } }
              { abbreviation: { ilike: $searchText } }
              { description: { ilike: $searchText } }
              { subcategory: { ilike: $searchText } }
            ]
          }
        ]
      }
      orderBy: [{ name: AscNullsFirst }]
    ) {
      edges {
        node {
          id
          name
          abbreviation
          description
          category
          subcategory
          target_age_min
          target_age_max
          administration_time
          item_count
          difficulty_level
          requires_training
          is_featured
        }
      }
    }
  }
`

// Query para obtener ítems de escala
export const GET_SCALE_ITEMS = gql`
  query GetScaleItems($scaleId: UUID!, $sectionId: String) {
    scale_itemsCollection(
      filter: {
        and: [
          { scale_id: { eq: $scaleId } }
          { section_id: { eq: $sectionId } }
          { is_active: { eq: true } }
        ]
      }
      orderBy: [{ item_number: AscNullsFirst }]
    ) {
      edges {
        node {
          id
          scale_id
          item_number
          section_id
          section_name
          item_text
          item_type
          response_options
          scoring_key
          reverse_scored
          subscale_membership
          item_difficulty
          content_domain
          is_active
          special_instructions
          skip_logic
          validation_rules
        }
      }
    }
  }
`

// Query para estadísticas de escalas
export const GET_SCALE_STATISTICS = gql`
  query GetScaleStatistics(
    $scaleId: UUID
    $startDate: Date
    $endDate: Date
  ) {
    # Uso de la escala
    scaleUsage: assessmentsCollection(
      filter: {
        and: [
          { scale_id: { eq: $scaleId } }
          { created_at: { gte: $startDate } }
          { created_at: { lte: $endDate } }
        ]
      }
    ) {
      edges {
        node {
          id
          status
          duration_minutes
          is_valid
          created_at
          mode
          
          patients {
            age
            gender
          }
          
          scoring_resultsCollection(first: 5) {
            edges {
              node {
                raw_score
                standardized_score
                percentile
                classification
                severity_level
              }
            }
          }
        }
      }
    }
    
    # Estadísticas por categoría
    categoryStats: psychometric_scalesCollection(
      filter: { is_active: { eq: true } }
    ) {
      edges {
        node {
          id
          category
          subcategory
          assessments_count: assessmentsCollection(
            filter: {
              and: [
                { created_at: { gte: $startDate } }
                { created_at: { lte: $endDate } }
                { status: { eq: "completed" } }
              ]
            }
            first: 1000
          ) {
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

// Query para escalas por edad y género
export const GET_SCALES_BY_DEMOGRAPHICS = gql`
  query GetScalesByDemographics(
    $age: Int!
    $gender: String
    $category: String
    $language: String = "es"
  ) {
    psychometric_scalesCollection(
      filter: {
        and: [
          { is_active: { eq: true } }
          { language: { eq: $language } }
          { category: { eq: $category } }
          { target_age_min: { lte: $age } }
          { target_age_max: { gte: $age } }
          {
            or: [
              { gender_specific: { eq: false } }
              { gender_specific: { eq: $gender } }
            ]
          }
        ]
      }
      orderBy: [{ is_featured: DescNullsLast }, { name: AscNullsFirst }]
    ) {
      edges {
        node {
          id
          name
          abbreviation
          description
          subcategory
          target_age_min
          target_age_max
          gender_specific
          administration_time
          item_count
          difficulty_level
          requires_training
          is_featured
          digital_version_available
          short_form_available
          parent_version_available
          self_report_available
          interview_format_available
        }
      }
    }
  }
`

// Query para obtener versiones disponibles de una escala
export const GET_SCALE_VERSIONS = gql`
  query GetScaleVersions($abbreviation: String!) {
    psychometric_scalesCollection(
      filter: {
        and: [
          { abbreviation: { eq: $abbreviation } }
          { is_active: { eq: true } }
        ]
      }
      orderBy: [{ version: DescNullsLast }]
    ) {
      edges {
        node {
          id
          name
          version
          language
          publication_year
          description
          item_count
          administration_time
          available_languages
          digital_version_available
          short_form_available
          parent_version_available
          self_report_available
          interview_format_available
        }
      }
    }
  }
`