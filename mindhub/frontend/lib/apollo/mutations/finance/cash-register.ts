import { gql } from '@apollo/client'

// Mutation para crear un nuevo corte de caja
export const CREATE_CASH_REGISTER_CUT = gql`
  mutation CreateCashRegisterCut($input: finance_cash_register_cutsInsertInput!) {
    insertIntofinance_cash_register_cutsCollection(objects: [$input]) {
      records {
        id
        cut_date
        opening_amount
        closing_amount
        total_income
        total_cash_payments
        total_card_payments
        total_transfers
        notes
        status
        performed_by
        clinic_id
        user_id
        created_at
        updated_at
      }
    }
  }
`

// Mutation para actualizar un corte de caja
export const UPDATE_CASH_REGISTER_CUT = gql`
  mutation UpdateCashRegisterCut($id: UUID!, $input: finance_cash_register_cutsUpdateInput!) {
    updatefinance_cash_register_cutsCollection(
      filter: { id: { eq: $id } }
      set: $input
    ) {
      records {
        id
        cut_date
        opening_amount
        closing_amount
        total_income
        total_cash_payments
        total_card_payments
        total_transfers
        notes
        status
        updated_at
      }
    }
  }
`

// Mutation para cerrar corte de caja automáticamente
export const PROCESS_AUTOMATIC_CASH_CUT = gql`
  mutation ProcessAutomaticCashCut(
    $userId: UUID!
    $isClinic: Boolean!
    $performedBy: UUID!
    $openingAmount: BigFloat!
    $closingAmount: BigFloat!
    $startDate: DateTime!
    $endDate: DateTime!
  ) {
    insertIntofinance_cash_register_cutsCollection(objects: [{
      clinic_id: $isClinic
      user_id: $userId
      performed_by: $performedBy
      cut_date: $endDate
      opening_amount: $openingAmount
      closing_amount: $closingAmount
      status: "completed"
      notes: "Corte automático generado"
    }]) {
      records {
        id
        cut_date
        opening_amount
        closing_amount
        total_income
        total_cash_payments
        total_card_payments
        total_transfers
        status
        created_at
      }
    }
  }
`

// Mutation para finalizar corte de caja
export const FINALIZE_CASH_REGISTER_CUT = gql`
  mutation FinalizeCashRegisterCut($id: UUID!, $closingAmount: BigFloat!, $notes: String) {
    updatefinance_cash_register_cutsCollection(
      filter: { id: { eq: $id } }
      set: { 
        closing_amount: $closingAmount
        notes: $notes
        status: "completed"
      }
    ) {
      records {
        id
        closing_amount
        notes
        status
        updated_at
      }
    }
  }
`

// Mutation para cancelar corte de caja
export const CANCEL_CASH_REGISTER_CUT = gql`
  mutation CancelCashRegisterCut($id: UUID!, $reason: String) {
    updatefinance_cash_register_cutsCollection(
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

// Mutation para reabrir corte de caja
export const REOPEN_CASH_REGISTER_CUT = gql`
  mutation ReopenCashRegisterCut($id: UUID!, $reason: String) {
    updatefinance_cash_register_cutsCollection(
      filter: { id: { eq: $id } }
      set: { 
        status: "reopened"
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