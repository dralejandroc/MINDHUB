import { gql } from '@apollo/client'

// Mutation para crear una nueva evaluación
export const CREATE_ASSESSMENT = gql`
  mutation CreateAssessment($input: assessmentsInsertInput!) {
    insertIntoassessmentsCollection(objects: [$input]) {
      records {
        id
        patient_id
        scale_id
        created_by
        evaluator
        mode
        instructions
        status
        total_items
        assessment_reason
        clinical_context
        expires_at
        created_at
        updated_at
        
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
`

// Mutation para iniciar una evaluación
export const START_ASSESSMENT = gql`
  mutation StartAssessment($id: UUID!) {
    updateassessmentsCollection(
      filter: { id: { eq: $id } }
      set: { 
        status: "in_progress"
        started_at: "now()"
        current_item: 0
      }
    ) {
      records {
        id
        status
        started_at
        current_item
        expires_at
      }
    }
  }
`

// Mutation para completar una evaluación
export const COMPLETE_ASSESSMENT = gql`
  mutation CompleteAssessment($id: UUID!, $duration: Float) {
    updateassessmentsCollection(
      filter: { id: { eq: $id } }
      set: { 
        status: "completed"
        completed_at: "now()"
        duration_minutes: $duration
        current_item: total_items
      }
    ) {
      records {
        id
        status
        completed_at
        duration_minutes
        current_item
        total_items
      }
    }
  }
`

// Mutation para actualizar progreso de evaluación
export const UPDATE_ASSESSMENT_PROGRESS = gql`
  mutation UpdateAssessmentProgress(
    $id: UUID!
    $currentItem: Int!
    $sessionData: JSON
    $responseTimeData: [Float]
  ) {
    updateassessmentsCollection(
      filter: { id: { eq: $id } }
      set: { 
        current_item: $currentItem
        session_data: $sessionData
        response_time_data: $responseTimeData
        updated_at: "now()"
      }
    ) {
      records {
        id
        current_item
        total_items
        session_data
        response_time_data
        updated_at
      }
    }
  }
`

// Mutation para guardar respuesta de evaluación
export const CREATE_ASSESSMENT_RESPONSE = gql`
  mutation CreateAssessmentResponse($input: assessment_responsesInsertInput!) {
    insertIntoassessment_responsesCollection(objects: [$input]) {
      records {
        id
        assessment_id
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
`

// Mutation para actualizar respuesta existente
export const UPDATE_ASSESSMENT_RESPONSE = gql`
  mutation UpdateAssessmentResponse($id: UUID!, $input: assessment_responsesUpdateInput!) {
    updateassessment_responsesCollection(
      filter: { id: { eq: $id } }
      set: $input
    ) {
      records {
        id
        assessment_id
        item_number
        response_value
        response_label
        raw_score
        response_time_seconds
        is_valid
        quality_flags
        notes
      }
    }
  }
`

// Mutation para crear resultado de puntuación
export const CREATE_SCORING_RESULT = gql`
  mutation CreateScoringResult($input: scoring_resultsInsertInput!) {
    insertIntoscoring_resultsCollection(objects: [$input]) {
      records {
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
`

// Mutation para actualizar múltiples resultados de puntuación
export const BULK_CREATE_SCORING_RESULTS = gql`
  mutation BulkCreateScoringResults($inputs: [scoring_resultsInsertInput!]!) {
    insertIntoscoring_resultsCollection(objects: $inputs) {
      records {
        id
        assessment_id
        subscale_name
        raw_score
        standardized_score
        percentile
        classification
        severity_level
        interpretation
        clinical_recommendations
        calculated_at
      }
    }
  }
`

// Mutation para cancelar evaluación
export const CANCEL_ASSESSMENT = gql`
  mutation CancelAssessment($id: UUID!, $reason: String) {
    updateassessmentsCollection(
      filter: { id: { eq: $id } }
      set: { 
        status: "cancelled"
        validity_notes: $reason
        updated_at: "now()"
      }
    ) {
      records {
        id
        status
        validity_notes
        updated_at
      }
    }
  }
`

// Mutation para marcar evaluación como inválida
export const INVALIDATE_ASSESSMENT = gql`
  mutation InvalidateAssessment($id: UUID!, $reason: String!) {
    updateassessmentsCollection(
      filter: { id: { eq: $id } }
      set: { 
        is_valid: false
        validity_notes: $reason
        updated_at: "now()"
      }
    ) {
      records {
        id
        is_valid
        validity_notes
        updated_at
      }
    }
  }
`

// Mutation para revalidar evaluación
export const REVALIDATE_ASSESSMENT = gql`
  mutation RevalidateAssessment($id: UUID!, $notes: String) {
    updateassessmentsCollection(
      filter: { id: { eq: $id } }
      set: { 
        is_valid: true
        validity_notes: $notes
        updated_at: "now()"
      }
    ) {
      records {
        id
        is_valid
        validity_notes
        updated_at
      }
    }
  }
`

// Mutation para actualizar contexto clínico
export const UPDATE_ASSESSMENT_CLINICAL_CONTEXT = gql`
  mutation UpdateAssessmentClinicalContext(
    $id: UUID!
    $assessmentReason: String
    $clinicalContext: String
  ) {
    updateassessmentsCollection(
      filter: { id: { eq: $id } }
      set: { 
        assessment_reason: $assessmentReason
        clinical_context: $clinicalContext
        updated_at: "now()"
      }
    ) {
      records {
        id
        assessment_reason
        clinical_context
        updated_at
      }
    }
  }
`

// Mutation para programar evaluación
export const CREATE_SCHEDULED_ASSESSMENT = gql`
  mutation CreateScheduledAssessment($input: scheduled_assessmentsInsertInput!) {
    insertIntoscheduled_assessmentsCollection(objects: [$input]) {
      records {
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
          administration_time
        }
      }
    }
  }
`

// Mutation para actualizar evaluación programada
export const UPDATE_SCHEDULED_ASSESSMENT = gql`
  mutation UpdateScheduledAssessment($id: UUID!, $input: scheduled_assessmentsUpdateInput!) {
    updatescheduled_assessmentsCollection(
      filter: { id: { eq: $id } }
      set: $input
    ) {
      records {
        id
        patient_id
        scale_id
        scheduled_for
        status
        priority
        assessment_reason
        notes
        reminder_settings
        updated_at
      }
    }
  }
`

// Mutation para ejecutar evaluación programada
export const EXECUTE_SCHEDULED_ASSESSMENT = gql`
  mutation ExecuteScheduledAssessment($scheduledId: UUID!, $assessmentInput: assessmentsInsertInput!) {
    # Crear la evaluación real
    createAssessment: insertIntoassessmentsCollection(objects: [$assessmentInput]) {
      records {
        id
        patient_id
        scale_id
        status
        created_at
      }
    }
    
    # Marcar la programada como ejecutada
    updateScheduled: updatescheduled_assessmentsCollection(
      filter: { id: { eq: $scheduledId } }
      set: { 
        status: "executed"
        executed_at: "now()"
      }
    ) {
      records {
        id
        status
        executed_at
      }
    }
  }
`

// Mutation para cancelar evaluación programada
export const CANCEL_SCHEDULED_ASSESSMENT = gql`
  mutation CancelScheduledAssessment($id: UUID!, $reason: String) {
    updatescheduled_assessmentsCollection(
      filter: { id: { eq: $id } }
      set: { 
        status: "cancelled"
        notes: $reason
        is_active: false
        updated_at: "now()"
      }
    ) {
      records {
        id
        status
        notes
        is_active
        updated_at
      }
    }
  }
`

// Mutation para crear recordatorio de evaluación
export const CREATE_ASSESSMENT_REMINDER = gql`
  mutation CreateAssessmentReminder($input: assessment_remindersInsertInput!) {
    insertIntoassessment_remindersCollection(objects: [$input]) {
      records {
        id
        assessment_id
        scheduled_assessment_id
        reminder_type
        scheduled_for
        message_template
        recipient_email
        recipient_phone
        status
        sent_at
        created_at
      }
    }
  }
`

// Mutation para marcar recordatorio como enviado
export const MARK_REMINDER_SENT = gql`
  mutation MarkReminderSent($id: UUID!) {
    updateassessment_remindersCollection(
      filter: { id: { eq: $id } }
      set: { 
        status: "sent"
        sent_at: "now()"
      }
    ) {
      records {
        id
        status
        sent_at
      }
    }
  }
`