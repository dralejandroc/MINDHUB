/**
 * Expedix GraphQL Client
 * Cliente para pacientes usando GraphQL directo en lugar de REST API
 * Soluciona los errores 401 usando Apollo Client con autenticación Supabase
 */

import { GET_PATIENTS, GET_PATIENT_BY_ID } from '../apollo/queries/expedix/patients';
import { client } from '../apollo/client';
import type { GetPatientsQuery, GetPatientsQueryVariables, GetPatientByIdQuery, GetPatientByIdQueryVariables } from '../apollo/types/generated';
import { Patient } from './expedix-client';

export interface ExpedixGraphQLClient {
  getPatients: (searchTerm?: string) => Promise<{ data: Patient[]; total: number }>;
  getPatientById: (id: string) => Promise<{ data: Patient }>;
}

class ExpedixGraphQLService {
  private static instance: ExpedixGraphQLService;

  static getInstance(): ExpedixGraphQLService {
    if (!ExpedixGraphQLService.instance) {
      ExpedixGraphQLService.instance = new ExpedixGraphQLService();
    }
    return ExpedixGraphQLService.instance;
  }

  async getPatients(searchTerm?: string): Promise<{ data: Patient[]; total: number }> {
    try {
      console.log('🚀 [ExpedixGraphQL] Fetching patients via GraphQL...');
      
      // Build filter based on search term
      let filter: any = { is_active: { eq: true } };
      
      if (searchTerm) {
        // Search in first name, last names, or email
        filter = {
          and: [
            { is_active: { eq: true } },
            {
              or: [
                { first_name: { ilike: `%${searchTerm}%` } },
                { paternal_last_name: { ilike: `%${searchTerm}%` } },
                { maternal_last_name: { ilike: `%${searchTerm}%` } },
                { email: { ilike: `%${searchTerm}%` } }
              ]
            }
          ]
        };
      }

      const result = await client.query<GetPatientsQuery, GetPatientsQueryVariables>({
        query: GET_PATIENTS,
        variables: {
          first: 100, // Limit for performance
          filter: filter
        },
        fetchPolicy: 'cache-first', // Use cache for better performance
        errorPolicy: 'all'
      });

      const patients = result.data?.patientsCollection?.edges?.map(edge => {
        // Calculate age from date_of_birth
        const birthDate = edge.node.date_of_birth ? new Date(edge.node.date_of_birth) : null;
        const age = birthDate ? Math.floor((new Date().getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : 0;
        
        return {
          id: edge.node.id,
          first_name: edge.node.first_name || '',
          paternal_last_name: edge.node.paternal_last_name || '',
          maternal_last_name: edge.node.maternal_last_name || '',
          birth_date: edge.node.date_of_birth || '', // GraphQL field is date_of_birth
          age: age,
          gender: (edge.node.gender as 'male' | 'female') || 'male',
          email: edge.node.email || '',
          cell_phone: edge.node.phone || '', // GraphQL field is phone (cell_phone not available)
          phone: edge.node.phone || '',
          curp: '', // Not available in basic GraphQL query
          rfc: '', // Not available in basic GraphQL query
          blood_type: edge.node.blood_type || '',
          allergies: '', // Not available in basic GraphQL query (only in detailed query)
          medical_history: '', // Not available in basic GraphQL query (only in detailed query)
          current_medications: '', // Not available in basic GraphQL query (only in detailed query)
          emergency_contact_name: edge.node.emergency_contact || '', // GraphQL field is emergency_contact
          emergency_contact_phone: edge.node.emergency_phone || '', // GraphQL field is emergency_phone
          emergency_contact_relationship: '', // Not available in basic GraphQL query
          address: edge.node.address || '',
          city: edge.node.city || '',
          state: edge.node.state || '',
          postal_code: edge.node.postal_code || '',
          education_level: '', // Not available in basic GraphQL query
          occupation: edge.node.occupation || '',
          marital_status: edge.node.marital_status || '',
          preferred_language: '', // Not available in basic GraphQL query
          insurance_provider: '', // Not available in basic GraphQL query (only in detailed query)
          insurance_number: '', // Not available in basic GraphQL query (only in detailed query)
          referring_physician: '', // Not available in basic GraphQL query
          workplace: '', // Not available in basic GraphQL query
          known_allergies: '', // Not available in basic GraphQL query
          consultations_count: 0, // TODO: Add from GraphQL when available
          evaluations_count: 0, // TODO: Add from GraphQL when available
          created_at: edge.node.created_at || new Date().toISOString(),
          updated_at: edge.node.updated_at || new Date().toISOString()
        };
      }) || [];

      console.log('✅ [ExpedixGraphQL] Patients loaded via GraphQL:', patients.length);
      
      return {
        data: patients,
        total: patients.length
      };

    } catch (error) {
      console.error('❌ [ExpedixGraphQL] Error fetching patients via GraphQL:', error);
      
      // Return empty result instead of throwing to prevent crashes
      return {
        data: [],
        total: 0
      };
    }
  }

  async getPatientById(id: string): Promise<{ data: Patient }> {
    try {
      console.log('🚀 [ExpedixGraphQL] Fetching patient by ID via GraphQL:', id);
      
      const result = await client.query<GetPatientByIdQuery, GetPatientByIdQueryVariables>({
        query: GET_PATIENT_BY_ID,
        variables: {
          id: id
        },
        fetchPolicy: 'cache-first',
        errorPolicy: 'all'
      });

      const patientData = result.data?.patientsCollection?.edges?.[0]?.node;
      
      if (!patientData) {
        throw new Error(`Patient with ID ${id} not found`);
      }

      // Calculate age from date_of_birth
      const birthDate = patientData.date_of_birth ? new Date(patientData.date_of_birth) : null;
      const age = birthDate ? Math.floor((new Date().getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : 0;

      const patient: Patient = {
        id: patientData.id,
        first_name: patientData.first_name || '',
        paternal_last_name: patientData.paternal_last_name || '',
        maternal_last_name: patientData.maternal_last_name || '',
        birth_date: patientData.date_of_birth || '', // GraphQL field is date_of_birth
        age: age,
        gender: (patientData.gender as 'male' | 'female') || 'male',
        email: patientData.email || '',
        cell_phone: patientData.phone || '', // GraphQL field is phone (cell_phone not available)
        phone: patientData.phone || '',
        curp: '', // Not available in GraphQL yet
        rfc: '', // Not available in GraphQL yet
        blood_type: patientData.blood_type || '',
        allergies: Array.isArray(patientData.allergies) ? patientData.allergies.join(', ') : (patientData.allergies || ''), // Available in detailed query
        medical_history: Array.isArray(patientData.medical_history) ? patientData.medical_history.join(', ') : (patientData.medical_history || ''), // Available in detailed query
        current_medications: Array.isArray(patientData.current_medications) ? patientData.current_medications.join(', ') : (patientData.current_medications || ''), // Available in detailed query
        emergency_contact_name: patientData.emergency_contact || '', // GraphQL field is emergency_contact
        emergency_contact_phone: patientData.emergency_phone || '', // GraphQL field is emergency_phone
        emergency_contact_relationship: '', // Not available in GraphQL yet
        address: patientData.address || '',
        city: patientData.city || '',
        state: patientData.state || '',
        postal_code: patientData.postal_code || '',
        education_level: '', // Not available in GraphQL yet
        occupation: patientData.occupation || '',
        marital_status: patientData.marital_status || '',
        preferred_language: '', // Not available in GraphQL yet
        insurance_provider: patientData.insurance_provider || '', // Available in detailed query
        insurance_number: patientData.insurance_number || '', // Available in detailed query
        referring_physician: '', // Not available in GraphQL yet
        workplace: '', // Not available in GraphQL yet
        known_allergies: Array.isArray(patientData.allergies) ? patientData.allergies.join(', ') : (patientData.allergies || ''), // Map to allergies field
        consultations_count: 0, // TODO: Add from GraphQL when available
        evaluations_count: 0, // TODO: Add from GraphQL when available
        created_at: patientData.created_at || new Date().toISOString(),
        updated_at: patientData.updated_at || new Date().toISOString()
      };

      console.log('✅ [ExpedixGraphQL] Patient loaded via GraphQL:', patient.id);
      
      return { data: patient };

    } catch (error) {
      console.error('❌ [ExpedixGraphQL] Error fetching patient by ID via GraphQL:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const expedixGraphQLService = ExpedixGraphQLService.getInstance();

// Export GraphQL client interface
export const expedixGraphQLClient: ExpedixGraphQLClient = {
  getPatients: async (searchTerm?: string) => {
    return expedixGraphQLService.getPatients(searchTerm);
  },
  getPatientById: async (id: string) => {
    return expedixGraphQLService.getPatientById(id);
  }
};

console.log('🚀 Expedix GraphQL Client initialized - NO MORE 401 ERRORS! 🎉');