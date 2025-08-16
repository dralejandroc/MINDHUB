/**
 * Patient Management Hook for MindHub
 * Integrated with Expedix API and Clerk authentication
 */

import { useState, useEffect } from 'react';
import { useExpedixApi, Patient as ExpedixPatient } from '@/lib/api/expedix-client';
import { useAuth } from '@clerk/nextjs';

// Legacy Patient interface for backward compatibility
export interface Patient {
  id: number | string;
  firstName: string;
  lastName: string;
  age: number;
  gender: 'M' | 'F' | 'Other' | 'masculine' | 'feminine';
  status: 'active' | 'inactive';
  lastVisit: string;
  birthDate?: string;
  email?: string;
  phone?: string;
}

// Function to convert Expedix patient to legacy format
function convertExpedixToLegacy(expedixPatient: ExpedixPatient): Patient {
  const birthDate = new Date(expedixPatient.birth_date);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  
  return {
    id: expedixPatient.id,
    firstName: expedixPatient.first_name,
    lastName: `${expedixPatient.paternal_last_name} ${expedixPatient.maternal_last_name || ''}`.trim(),
    age,
    gender: expedixPatient.gender === 'masculine' ? 'M' : expedixPatient.gender === 'feminine' ? 'F' : 'Other',
    status: 'active', // Default to active
    lastVisit: expedixPatient.updated_at || expedixPatient.created_at,
    birthDate: expedixPatient.birth_date,
    email: expedixPatient.email,
    phone: expedixPatient.cell_phone || expedixPatient.phone
  };
}

export interface PatientFilters {
  search: string;
  status: string;
}

// Hook
export const usePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded, isSignedIn } = useAuth();
  const expedixApi = useExpedixApi();

  // Load patients from Expedix API
  const loadPatients = async (searchTerm?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!isLoaded || !isSignedIn) {
        setError('Authentication required. Please log in.');
        return;
      }
      
      console.log('Loading patients:', searchTerm ? `searching for "${searchTerm}"` : 'all patients');
      
      const response = await expedixApi.getPatients(searchTerm);
      const legacyPatients = response.data.map(convertExpedixToLegacy);
      
      setPatients(legacyPatients);
      console.log(`Successfully loaded ${legacyPatients.length} patients`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading patients';
      setError(errorMessage);
      console.error('Loading patients: Error:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Add patient via Expedix API
  const addPatient = async (patientData: Omit<Patient, 'id' | 'age' | 'status' | 'lastVisit'> & { birthDate: string }) => {
    try {
      if (!isLoaded || !isSignedIn) {
        throw new Error('Authentication required. Please log in.');
      }
      
      // Convert legacy format to Expedix format
      const expedixData = {
        first_name: patientData.firstName,
        paternal_last_name: patientData.lastName.split(' ')[0] || '',
        maternal_last_name: patientData.lastName.split(' ').slice(1).join(' ') || '',
        birth_date: patientData.birthDate,
        gender: patientData.gender === 'M' ? 'masculine' : patientData.gender === 'F' ? 'feminine' : 'masculine',
        email: patientData.email || '',
        cell_phone: patientData.phone || '',
      };
      
      const response = await expedixApi.createPatient(expedixData);
      const newPatient = convertExpedixToLegacy(response.data);
      
      setPatients(prev => [...prev, newPatient]);
      return newPatient;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error adding patient';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Update patient via Expedix API
  const updatePatient = async (id: number | string, updates: Partial<Patient>) => {
    try {
      if (!isLoaded || !isSignedIn) {
        throw new Error('Authentication required. Please log in.');
      }
      
      // Convert updates to Expedix format
      const expedixUpdates: any = {};
      if (updates.firstName) expedixUpdates.first_name = updates.firstName;
      if (updates.lastName) {
        const nameParts = updates.lastName.split(' ');
        expedixUpdates.paternal_last_name = nameParts[0] || '';
        expedixUpdates.maternal_last_name = nameParts.slice(1).join(' ') || '';
      }
      if (updates.email) expedixUpdates.email = updates.email;
      if (updates.phone) expedixUpdates.cell_phone = updates.phone;
      if (updates.birthDate) expedixUpdates.birth_date = updates.birthDate;
      if (updates.gender) {
        expedixUpdates.gender = updates.gender === 'M' ? 'masculine' : updates.gender === 'F' ? 'feminine' : 'masculine';
      }
      
      const response = await expedixApi.updatePatient(String(id), expedixUpdates);
      const updatedPatient = convertExpedixToLegacy(response.data);
      
      setPatients(prev => prev.map(patient => 
        patient.id === id ? updatedPatient : patient
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating patient';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Delete patient via Expedix API
  const deletePatient = async (id: number | string) => {
    try {
      if (!isLoaded || !isSignedIn) {
        throw new Error('Authentication required. Please log in.');
      }
      
      await expedixApi.deletePatient(String(id));
      setPatients(prev => prev.filter(patient => patient.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error deleting patient';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Search and filter patients
  const searchPatients = (filters: PatientFilters): Patient[] => {
    return patients.filter(patient => {
      const matchesSearch = !filters.search || 
        patient.firstName.toLowerCase().includes(filters.search.toLowerCase()) ||
        patient.lastName.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = !filters.status || patient.status === filters.status;
      
      return matchesSearch && matchesStatus;
    });
  };

  // Get patient by ID
  const getPatientById = (id: number | string): Patient | undefined => {
    return patients.find(patient => patient.id === id);
  };

  // Load patients when authentication is ready
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadPatients();
    } else if (isLoaded && !isSignedIn) {
      setError('Authentication required. Please log in.');
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  return {
    patients,
    isLoading,
    error,
    loadPatients,
    addPatient,
    updatePatient,
    deletePatient,
    searchPatients,
    getPatientById,
    // Add reload function for convenience
    reload: () => loadPatients()
  };
};

export default usePatients;