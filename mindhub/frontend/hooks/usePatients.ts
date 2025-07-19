/**
 * Patient Management Hook for MindHub
 * Migrated from XAMPP app.js patient management functions
 */

import { useState, useEffect } from 'react';

// Types
export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  status: 'active' | 'inactive';
  lastVisit: string;
  birthDate?: string;
  email?: string;
  phone?: string;
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

  // Mock data (migrated from XAMPP version)
  const mockPatients: Patient[] = [
    {
      id: 1,
      firstName: 'Juan',
      lastName: 'Pérez',
      age: 14,
      gender: 'M',
      status: 'active',
      lastVisit: '2024-01-10'
    },
    {
      id: 2,
      firstName: 'María',
      lastName: 'González',
      age: 16,
      gender: 'F',
      status: 'active',
      lastVisit: '2024-01-08'
    },
    {
      id: 3,
      firstName: 'Carlos',
      lastName: 'López',
      age: 12,
      gender: 'M',
      status: 'inactive',
      lastVisit: '2023-12-15'
    }
  ];

  // Load patients
  const loadPatients = async () => {
    try {
      setIsLoading(true);
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      setPatients(mockPatients);
      setError(null);
    } catch (err) {
      setError('Error loading patients');
      console.error('Error loading patients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Add patient
  const addPatient = async (patientData: Omit<Patient, 'id' | 'age' | 'status' | 'lastVisit'> & { birthDate: string }) => {
    try {
      // Calculate age
      const birthDate = new Date(patientData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      // Generate ID (in real app, this would come from server)
      const newId = Math.max(...patients.map(p => p.id), 0) + 1;
      
      const newPatient: Patient = {
        ...patientData,
        id: newId,
        age,
        status: 'active',
        lastVisit: today.toISOString().split('T')[0]
      };

      setPatients(prev => [...prev, newPatient]);
      return newPatient;
    } catch (err) {
      setError('Error adding patient');
      throw err;
    }
  };

  // Update patient
  const updatePatient = async (id: number, updates: Partial<Patient>) => {
    try {
      setPatients(prev => prev.map(patient => 
        patient.id === id ? { ...patient, ...updates } : patient
      ));
    } catch (err) {
      setError('Error updating patient');
      throw err;
    }
  };

  // Delete patient
  const deletePatient = async (id: number) => {
    try {
      setPatients(prev => prev.filter(patient => patient.id !== id));
    } catch (err) {
      setError('Error deleting patient');
      throw err;
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
  const getPatientById = (id: number): Patient | undefined => {
    return patients.find(patient => patient.id === id);
  };

  // Load patients on mount
  useEffect(() => {
    loadPatients();
  }, []);

  return {
    patients,
    isLoading,
    error,
    loadPatients,
    addPatient,
    updatePatient,
    deletePatient,
    searchPatients,
    getPatientById
  };
};

export default usePatients;