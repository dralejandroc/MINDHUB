import { gql } from '@apollo/client'

// Mutation para registrar un nuevo ingreso
export const CREATE_FINANCE_INCOME = gql`
  mutation CreateFinanceIncome($input: finance_incomeInsertInput!) {
    insertIntofinance_incomeCollection(objects: [$input]) {
      records {
        id
        amount
        payment_method
        payment_date
        description
        service_id
        patient_id
        appointment_id
        status
        invoice_number
        notes
        clinic_id
        user_id
        recorded_by
        created_at
        updated_at
      }
    }
  }
`

// Mutation para actualizar un ingreso
export const UPDATE_FINANCE_INCOME = gql`
  mutation UpdateFinanceIncome($id: UUID!, $input: finance_incomeUpdateInput!) {
    updatefinance_incomeCollection(
      filter: { id: { eq: $id } }
      set: $input
    ) {
      records {
        id
        amount
        payment_method
        payment_date
        description
        service_id
        patient_id
        status
        invoice_number
        notes
        updated_at
      }
    }
  }
`

// Mutation para cambiar estado de un ingreso
export const UPDATE_FINANCE_INCOME_STATUS = gql`
  mutation UpdateFinanceIncomeStatus($id: UUID!, $status: String!) {
    updatefinance_incomeCollection(
      filter: { id: { eq: $id } }
      set: { status: $status }
    ) {
      records {
        id
        amount
        status
        payment_date
        updated_at
      }
    }
  }
`

// Mutation para procesar pago automático desde cita
export const PROCESS_APPOINTMENT_PAYMENT = gql`
  mutation ProcessAppointmentPayment(
    $appointmentId: UUID!
    $serviceId: UUID!
    $amount: BigFloat!
    $paymentMethod: String!
    $clinicId: UUID
    $workspaceId: UUID
    $recordedBy: UUID!
  ) {
    insertIntofinance_incomeCollection(objects: [{
      appointment_id: $appointmentId
      service_id: $serviceId
      amount: $amount
      payment_method: $paymentMethod
      payment_date: "now()"
      status: "completed"
      description: "Pago automático por cita"
      clinic_id: $clinicId
      workspace_id: $workspaceId
      recorded_by: $recordedBy
    }]) {
      records {
        id
        amount
        payment_method
        payment_date
        status
        appointment_id
        service_id
      }
    }
  }
`

// Mutation para cancelar ingreso
export const CANCEL_FINANCE_INCOME = gql`
  mutation CancelFinanceIncome($id: UUID!, $reason: String) {
    updatefinance_incomeCollection(
      filter: { id: { eq: $id } }
      set: { 
        status: "cancelled"
        notes: $reason
      }
    ) {
      records {
        id
        status
        notes
        updated_at
      }
    }
  }
`

// Mutation para registrar reembolso
export const CREATE_REFUND = gql`
  mutation CreateRefund(
    $originalIncomeId: UUID!
    $refundAmount: BigFloat!
    $reason: String!
    $clinicId: UUID
    $workspaceId: UUID
    $recordedBy: UUID!
  ) {
    insertIntofinance_incomeCollection(objects: [{
      amount: $refundAmount
      payment_method: "refund"
      payment_date: "now()"
      status: "refunded"
      description: $reason
      notes: $originalIncomeId
      clinic_id: $clinicId
      workspace_id: $workspaceId
      recorded_by: $recordedBy
    }]) {
      records {
        id
        amount
        payment_method
        status
        description
        created_at
      }
    }
  }
`

// Mutation para actualizar notas de un ingreso
export const UPDATE_FINANCE_INCOME_NOTES = gql`
  mutation UpdateFinanceIncomeNotes($id: UUID!, $notes: String!) {
    updatefinance_incomeCollection(
      filter: { id: { eq: $id } }
      set: { notes: $notes }
    ) {
      records {
        id
        notes
        updated_at
      }
    }
  }
`