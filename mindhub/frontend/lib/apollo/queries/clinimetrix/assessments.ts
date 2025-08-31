import { gql } from '@apollo/client'

// Query para obtener todas las evaluaciones
export const GET_ASSESSMENTS = gql`
  query GetAssessments(
    $first: Int
    $after: Cursor
    $filter: assessmentsFilter
    $orderBy: [assessmentsOrderBy!]
  ) {
    assessmentsCollection(
      first: $first
      after: $after
      filter: $filter
      orderBy: $orderBy
    ) {
      edges {
        node {
          id
          patient_id
          scale_id
          created_by
          evaluator
          mode
          instructions
          status
          started_at
          completed_at
          expires_at
          duration_minutes
          current_item
          total_items
          session_data
          ip_address
          user_agent
          response_time_data
          is_valid
          validity_notes
          assessment_reason
          clinical_context
          created_at
          updated_at
          
          # Relaciones
          patients {
            id
            first_name
            last_name
            medical_record
            age
            gender
          }
          
          psychometric_scales {
            id
            name
            abbreviation
            category
            version
            language
            target_age_min
            target_age_max
            administration_time
            scoring_system
          }
          
          # Respuestas y resultados
          assessment_responsesCollection {
            edges {
              node {
                id
                item_number
                section_id
                response_value
                response_label
                raw_score
                response_time_seconds
                timestamp
                is_valid
                quality_flags
              }
            }
          }
          
          scoring_resultsCollection {
            edges {
              node {
                id
                subscale_name
                raw_score
                standardized_score
                percentile
                classification
                severity_level
                confidence_interval_lower
                confidence_interval_upper
                interpretation
                clinical_recommendations
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

// Query para obtener evaluación específica con todos los detalles
export const GET_ASSESSMENT_BY_ID = gql`
  query GetAssessmentById($id: UUID!) {
    assessmentsCollection(filter: { id: { eq: $id } }) {
      edges {
        node {
          id
          patient_id
          scale_id
          created_by
          evaluator
          mode
          instructions
          status
          started_at
          completed_at
          expires_at
          duration_minutes
          current_item
          total_items
          session_data
          response_time_data
          is_valid
          validity_notes
          assessment_reason
          clinical_context
          created_at
          updated_at
          
          patients {
            id
            first_name
            last_name
            paternal_last_name
            maternal_last_name
            medical_record
            age
            gender
            date_of_birth
            diagnosis
            medications
            medical_history
          }
          
          psychometric_scales {
            id
            name
            abbreviation
            description
            category
            version
            language
            target_age_min
            target_age_max
            administration_time
            scoring_system
            subscales
            scoring_instructions
            interpretation_guide
            clinical_cutoffs
            normative_data
          }
          
          assessment_responsesCollection(
            orderBy: [{ item_number: AscNullsFirst }]
          ) {
            edges {
              node {
                id
                item_number
                section_id
                response_value
                response_label
                raw_score
                response_time_seconds
                timestamp
                is_valid
                quality_flags
                notes
              }
            }
          }
          
          scoring_resultsCollection {
            edges {
              node {
                id
                subscale_name
                raw_score
                standardized_score
                percentile
                t_score
                z_score
                classification
                severity_level
                confidence_interval_lower
                confidence_interval_upper
                interpretation
                clinical_recommendations
                normative_reference
                calculated_at
              }
            }
          }
        }
      }
    }
  }
`

// Query para obtener evaluaciones por paciente
export const GET_ASSESSMENTS_BY_PATIENT = gql`
  query GetAssessmentsByPatient(
    $patientId: UUID!
    $first: Int
    $status: String
  ) {
    assessmentsCollection(
      filter: {
        and: [
          { patient_id: { eq: $patientId } }
          { status: { eq: $status } }
        ]
      }
      orderBy: [{ created_at: DescNullsLast }]
      first: $first
    ) {
      edges {
        node {
          id
          scale_id
          status
          started_at
          completed_at
          duration_minutes
          current_item
          total_items
          is_valid
          assessment_reason
          clinical_context
          created_at
          
          psychometric_scales {
            id
            name
            abbreviation
            category
            administration_time
          }
          
          scoring_resultsCollection(first: 5) {
            edges {
              node {
                id
                subscale_name
                standardized_score
                percentile
                classification
                severity_level
                interpretation
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

// Query para obtener evaluaciones en progreso
export const GET_IN_PROGRESS_ASSESSMENTS = gql`
  query GetInProgressAssessments($evaluatorId: UUID) {
    assessmentsCollection(
      filter: {
        and: [
          { status: { eq: "in_progress" } }
          { evaluator: { eq: $evaluatorId } }
        ]
      }
      orderBy: [{ started_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          patient_id
          scale_id
          started_at
          current_item
          total_items
          expires_at
          
          patients {
            id
            first_name
            last_name
            medical_record
          }
          
          psychometric_scales {
            id
            name
            abbreviation
            administration_time
          }
        }
      }
    }
  }
`

// Query para estadísticas de evaluaciones
export const GET_ASSESSMENT_STATISTICS = gql`
  query GetAssessmentStatistics(
    $startDate: Date
    $endDate: Date
    $evaluatorId: UUID
    $patientId: UUID
  ) {
    # Total evaluaciones
    totalAssessments: assessmentsCollection(
      filter: {
        and: [
          { created_at: { gte: $startDate } }
          { created_at: { lte: $endDate } }
          { evaluator: { eq: $evaluatorId } }
          { patient_id: { eq: $patientId } }
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
          psychometric_scales {
            category
          }
        }
      }
    }
    
    # Evaluaciones completadas
    completedAssessments: assessmentsCollection(
      filter: {
        and: [
          { status: { eq: "completed" } }
          { completed_at: { gte: $startDate } }
          { completed_at: { lte: $endDate } }
          { evaluator: { eq: $evaluatorId } }
        ]
      }
    ) {
      edges {
        node {
          id
          duration_minutes
          is_valid
          psychometric_scales {
            category
          }
        }
      }
    }
  }
`

// Query para buscar evaluaciones
export const SEARCH_ASSESSMENTS = gql`
  query SearchAssessments(
    $patientName: String
    $scaleName: String
    $status: String
    $evaluatorId: UUID
    $startDate: Date
    $endDate: Date
  ) {
    assessmentsCollection(
      filter: {
        and: [
          { status: { eq: $status } }
          { evaluator: { eq: $evaluatorId } }
          { created_at: { gte: $startDate } }
          { created_at: { lte: $endDate } }
        ]
      }
      orderBy: [{ created_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          patient_id
          scale_id
          status
          started_at
          completed_at
          duration_minutes
          is_valid
          assessment_reason
          created_at
          
          patients {
            id
            first_name
            last_name
            medical_record
          }
          
          psychometric_scales {
            id
            name
            abbreviation
            category
          }
          
          scoring_resultsCollection(first: 3) {
            edges {
              node {
                subscale_name
                standardized_score
                classification
                severity_level
              }
            }
          }
        }
      }
    }
  }
`

// Query para evaluaciones programadas
export const GET_SCHEDULED_ASSESSMENTS = gql`
  query GetScheduledAssessments(
    $patientId: UUID
    $evaluatorId: UUID
    $startDate: Date
    $endDate: Date
  ) {
    scheduled_assessmentsCollection(
      filter: {
        and: [
          { patient_id: { eq: $patientId } }
          { evaluator: { eq: $evaluatorId } }
          { scheduled_for: { gte: $startDate } }
          { scheduled_for: { lte: $endDate } }
          { is_active: { eq: true } }
        ]
      }
      orderBy: [{ scheduled_for: AscNullsFirst }]
    ) {
      edges {
        node {
          id
          patient_id
          scale_id
          evaluator
          scheduled_for
          scheduled_by
          status
          priority
          assessment_reason
          notes
          reminder_settings
          created_at
          
          patients {
            id
            first_name
            last_name
            email
            phone
          }
          
          psychometric_scales {
            id
            name
            abbreviation
            category
            administration_time
          }
        }
      }
    }
  }
`

// Query para resultados de evaluación
export const GET_ASSESSMENT_RESULTS = gql`
  query GetAssessmentResults($assessmentId: UUID!) {
    scoring_resultsCollection(
      filter: { assessment_id: { eq: $assessmentId } }
      orderBy: [{ subscale_name: AscNullsFirst }]
    ) {
      edges {
        node {
          id
          assessment_id
          subscale_name
          raw_score
          standardized_score
          percentile
          t_score
          z_score
          classification
          severity_level
          confidence_interval_lower
          confidence_interval_upper
          interpretation
          clinical_recommendations
          normative_reference
          calculated_at
          is_valid
        }
      }
    }
  }
`