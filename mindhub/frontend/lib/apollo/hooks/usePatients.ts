import { useQuery, useMutation, useApolloClient } from '@apollo/client'
import { 
  GET_PATIENTS, 
  GET_PATIENT_BY_ID, 
  GET_PATIENT_WITH_APPOINTMENTS,
  SEARCH_PATIENTS 
} from '../queries/expedix/patients'
import { 
  CREATE_PATIENT, 
  UPDATE_PATIENT, 
  UPDATE_PATIENT_BASIC_INFO,
  TOGGLE_PATIENT_STATUS,
  DELETE_PATIENT,
  UPDATE_PATIENT_NOTES,
  UPDATE_PATIENT_TAGS
} from '../mutations/expedix/patients'
import type {
  GetPatientsQuery,
  GetPatientsQueryVariables,
  GetPatientByIdQuery,
  GetPatientByIdQueryVariables,
  GetPatientWithAppointmentsQuery,
  GetPatientWithAppointmentsQueryVariables,
  SearchPatientsQuery,
  SearchPatientsQueryVariables,
  CreatePatientMutation,
  CreatePatientMutationVariables,
  UpdatePatientMutation,
  UpdatePatientMutationVariables,
  UpdatePatientBasicInfoMutation,
  UpdatePatientBasicInfoMutationVariables,
  TogglePatientStatusMutation,
  TogglePatientStatusMutationVariables,
  DeletePatientMutation,
  DeletePatientMutationVariables,
  UpdatePatientNotesMutation,
  UpdatePatientNotesMutationVariables,
  UpdatePatientTagsMutation,
  UpdatePatientTagsMutationVariables,
} from '../types/generated'
import { OrderByDirection } from '../types/generated'

// Hook para obtener lista de pacientes
export function usePatients(variables?: GetPatientsQueryVariables) {
  return useQuery<GetPatientsQuery, GetPatientsQueryVariables>(GET_PATIENTS, {
    variables: {
      first: 20,
      orderBy: [{ first_name: OrderByDirection.AscNullsFirst }],
      filter: { is_active: { eq: true } },
      ...variables,
    },
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  })
}

// Hook para obtener un paciente específico
export function usePatient(id: string) {
  return useQuery<GetPatientByIdQuery, GetPatientByIdQueryVariables>(GET_PATIENT_BY_ID, {
    variables: { id },
    skip: !id,
    errorPolicy: 'all',
  })
}

// Hook para obtener paciente con citas
export function usePatientWithAppointments(id: string) {
  return useQuery<GetPatientWithAppointmentsQuery, GetPatientWithAppointmentsQueryVariables>(
    GET_PATIENT_WITH_APPOINTMENTS, 
    {
      variables: { id },
      skip: !id,
      errorPolicy: 'all',
    }
  )
}

// Hook para buscar pacientes
export function useSearchPatients() {
  const client = useApolloClient()

  const searchPatients = async (searchText: string, first = 10) => {
    if (!searchText.trim()) return { data: null, loading: false, error: null }

    try {
      const result = await client.query<SearchPatientsQuery, SearchPatientsQueryVariables>({
        query: SEARCH_PATIENTS,
        variables: { 
          searchText: `%${searchText}%`,
          first 
        },
        fetchPolicy: 'cache-first',
      })
      
      return {
        data: result.data,
        loading: false,
        error: null,
      }
    } catch (error) {
      return {
        data: null,
        loading: false,
        error,
      }
    }
  }

  return { searchPatients }
}

// Hook para crear paciente
export function useCreatePatient() {
  const [createPatient, { data, loading, error }] = useMutation<
    CreatePatientMutation,
    CreatePatientMutationVariables
  >(CREATE_PATIENT, {
    errorPolicy: 'all',
    // Actualizar cache después de crear
    update(cache, { data }) {
      if (data?.insertIntopatientsCollection?.records) {
        // Invalidar queries relacionadas
        cache.evict({ fieldName: 'patientsCollection' })
        cache.gc()
      }
    },
  })

  return { createPatient, data, loading, error }
}

// Hook para actualizar paciente
export function useUpdatePatient() {
  const [updatePatient, { data, loading, error }] = useMutation<
    UpdatePatientMutation,
    UpdatePatientMutationVariables
  >(UPDATE_PATIENT, {
    errorPolicy: 'all',
    // Cache se actualiza automáticamente por ID
  })

  return { updatePatient, data, loading, error }
}

// Hook para actualizar información básica
export function useUpdatePatientBasicInfo() {
  const [updatePatientBasicInfo, { data, loading, error }] = useMutation<
    UpdatePatientBasicInfoMutation,
    UpdatePatientBasicInfoMutationVariables
  >(UPDATE_PATIENT_BASIC_INFO, {
    errorPolicy: 'all',
  })

  return { updatePatientBasicInfo, data, loading, error }
}

// Hook para cambiar estado activo/inactivo
export function useTogglePatientStatus() {
  const [togglePatientStatus, { data, loading, error }] = useMutation<
    TogglePatientStatusMutation,
    TogglePatientStatusMutationVariables
  >(TOGGLE_PATIENT_STATUS, {
    errorPolicy: 'all',
  })

  return { togglePatientStatus, data, loading, error }
}

// Hook para eliminar paciente (soft delete)
export function useDeletePatient() {
  const [deletePatient, { data, loading, error }] = useMutation<
    DeletePatientMutation,
    DeletePatientMutationVariables
  >(DELETE_PATIENT, {
    errorPolicy: 'all',
    update(cache, { data }) {
      if (data?.updatepatientsCollection?.records) {
        // Remover de listas de pacientes activos
        cache.evict({ fieldName: 'patientsCollection' })
        cache.gc()
      }
    },
  })

  return { deletePatient, data, loading, error }
}

// Hook para actualizar notas
export function useUpdatePatientNotes() {
  const [updatePatientNotes, { data, loading, error }] = useMutation<
    UpdatePatientNotesMutation,
    UpdatePatientNotesMutationVariables
  >(UPDATE_PATIENT_NOTES, {
    errorPolicy: 'all',
  })

  return { updatePatientNotes, data, loading, error }
}

// Hook para actualizar tags
export function useUpdatePatientTags() {
  const [updatePatientTags, { data, loading, error }] = useMutation<
    UpdatePatientTagsMutation,
    UpdatePatientTagsMutationVariables
  >(UPDATE_PATIENT_TAGS, {
    errorPolicy: 'all',
  })

  return { updatePatientTags, data, loading, error }
}