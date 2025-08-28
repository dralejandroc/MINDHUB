/**
 * DjangoPatientRepository
 * Infrastructure adapter that implements the PatientRepository interface
 * Connects to Django backend via API
 */

import { 
  PatientRepository, 
  PatientFilters, 
  CreatePatientData, 
  UpdatePatientData,
  PatientStats
} from '../repositories/PatientRepository';
import { 
  Patient, 
  Gender, 
  BloodType, 
  MaritalStatus, 
  PatientCategory,
  EmergencyContact,
  PatientConsent
} from '../entities/Patient';
import { authGet, authPost, authPut, authDelete } from '@/lib/api/auth-fetch';

export class DjangoPatientRepository implements PatientRepository {
  private baseUrl = '/api/expedix/patients';

  /**
   * Transform Django API response to domain entity
   */
  private toDomainEntity(data: any): Patient {
    // Parse emergency contact
    const emergencyContact: EmergencyContact | undefined = (
      data.emergency_contact_name || 
      data.emergency_contact_phone || 
      data.emergency_contact_relationship
    ) ? {
      name: data.emergency_contact_name || '',
      phone: data.emergency_contact_phone || '',
      relationship: data.emergency_contact_relationship || ''
    } : undefined;

    // Parse consent data
    const consent: PatientConsent = {
      toTreatment: data.consent_to_treatment || false,
      toDataProcessing: data.consent_to_data_processing || false,
      consentDate: data.consent_date ? new Date(data.consent_date) : undefined
    };

    return new Patient(
      data.id,
      data.medical_record_number || `MR-${data.id}`,
      data.first_name,
      data.last_name || '',
      data.paternal_last_name,
      data.maternal_last_name,
      data.date_of_birth ? new Date(data.date_of_birth) : undefined,
      (data.gender as Gender) || undefined,
      data.email,
      data.phone,
      data.address,
      data.city,
      data.state,
      data.postal_code,
      data.country,
      data.curp,
      data.rfc,
      (data.blood_type as BloodType) || undefined,
      data.allergies || [],
      data.chronic_conditions || [],
      data.current_medications || [],
      emergencyContact,
      consent,
      (data.patient_category as PatientCategory) || 'primera_vez',
      data.is_active !== false, // Default to true if not specified
      data.created_by || '',
      data.clinic_id,
      data.workspace_id,
      data.assigned_professional_id,
      data.notes,
      data.tags || [],
      (data.marital_status as MaritalStatus) || undefined,
      data.occupation,
      data.education_level,
      data.insurance_provider,
      data.insurance_number,
      data.created_at ? new Date(data.created_at) : undefined,
      data.updated_at ? new Date(data.updated_at) : undefined
    );
  }

  /**
   * Transform domain entity to API request format
   */
  private toApiFormat(data: CreatePatientData | UpdatePatientData): any {
    const apiData: any = {
      first_name: data.firstName,
      last_name: data.lastName,
      paternal_last_name: data.paternalLastName,
      maternal_last_name: data.maternalLastName,
      date_of_birth: data.dateOfBirth?.toISOString().split('T')[0],
      gender: data.gender,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      postal_code: data.postalCode,
      country: data.country,
      curp: data.curp,
      rfc: data.rfc,
      blood_type: data.bloodType,
      allergies: data.allergies,
      chronic_conditions: data.chronicConditions,
      current_medications: data.currentMedications,
      patient_category: data.patientCategory,
      assigned_professional_id: data.assignedProfessionalId,
      notes: data.notes,
      tags: data.tags,
      marital_status: data.maritalStatus,
      occupation: data.occupation,
      education_level: data.educationLevel,
      insurance_provider: data.insuranceProvider,
      insurance_number: data.insuranceNumber
    };

    // Handle emergency contact fields
    if ('emergencyContactName' in data) {
      apiData.emergency_contact_name = data.emergencyContactName;
      apiData.emergency_contact_phone = data.emergencyContactPhone;
      apiData.emergency_contact_relationship = data.emergencyContactRelationship;
    }

    // Handle consent fields
    if ('consentToTreatment' in data) {
      apiData.consent_to_treatment = data.consentToTreatment;
      apiData.consent_to_data_processing = data.consentToDataProcessing;
    }

    // Handle tenant fields
    if ('clinicId' in data) {
      apiData.clinic_id = data.clinicId;
      apiData.workspace_id = data.workspaceId;
    }

    // Handle active status for updates
    if ('isActive' in data) {
      apiData.is_active = data.isActive;
    }

    return apiData;
  }

  async findById(id: string): Promise<Patient | null> {
    try {
      const response = await authGet(`${this.baseUrl}/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Failed to fetch patient: ${response.statusText}`);
      }

      const data = await response.json();
      return this.toDomainEntity(data.data || data);
    } catch (error) {
      console.error('Error fetching patient by ID:', error);
      throw error;
    }
  }

  async findByMedicalRecordNumber(recordNumber: string): Promise<Patient | null> {
    try {
      const params = new URLSearchParams({ medical_record_number: recordNumber });
      const response = await authGet(`${this.baseUrl}?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch patient: ${response.statusText}`);
      }

      const data = await response.json();
      const patients = data.data || data.patients || [];
      
      return patients.length > 0 ? this.toDomainEntity(patients[0]) : null;
    } catch (error) {
      console.error('Error fetching patient by medical record number:', error);
      throw error;
    }
  }

  async findAll(filters?: PatientFilters): Promise<Patient[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        if (filters.name) params.append('name', filters.name);
        if (filters.email) params.append('email', filters.email);
        if (filters.phone) params.append('phone', filters.phone);
        if (filters.medicalRecordNumber) params.append('medical_record_number', filters.medicalRecordNumber);
        if (filters.assignedProfessionalId) params.append('assigned_professional_id', filters.assignedProfessionalId);
        if (filters.patientCategory) params.append('patient_category', filters.patientCategory);
        if (filters.isActive !== undefined) params.append('is_active', filters.isActive.toString());
        if (filters.clinicId) params.append('clinic_id', filters.clinicId);
        if (filters.workspaceId) params.append('workspace_id', filters.workspaceId);
        if (filters.hasAllergies !== undefined) params.append('has_allergies', filters.hasAllergies.toString());
        if (filters.hasChronicConditions !== undefined) params.append('has_chronic_conditions', filters.hasChronicConditions.toString());
        if (filters.tags && filters.tags.length > 0) {
          filters.tags.forEach(tag => params.append('tags', tag));
        }
        if (filters.ageRange) {
          params.append('age_min', filters.ageRange.min.toString());
          params.append('age_max', filters.ageRange.max.toString());
        }
        if (filters.createdAfter) {
          params.append('created_after', filters.createdAfter.toISOString().split('T')[0]);
        }
        if (filters.createdBefore) {
          params.append('created_before', filters.createdBefore.toISOString().split('T')[0]);
        }
      }

      const url = params.toString() ? `${this.baseUrl}?${params}` : this.baseUrl;
      const response = await authGet(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch patients: ${response.statusText}`);
      }

      const data = await response.json();
      const patients = data.data || data.patients || [];
      
      return patients.map((patient: any) => this.toDomainEntity(patient));
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  }

  async search(query: string, filters?: PatientFilters): Promise<Patient[]> {
    try {
      const params = new URLSearchParams({ q: query });
      
      // Add filters if provided
      if (filters) {
        if (filters.clinicId) params.append('clinic_id', filters.clinicId);
        if (filters.workspaceId) params.append('workspace_id', filters.workspaceId);
        if (filters.isActive !== undefined) params.append('is_active', filters.isActive.toString());
      }

      const response = await authGet(`${this.baseUrl}/search?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to search patients: ${response.statusText}`);
      }

      const data = await response.json();
      const patients = data.data || data.patients || [];
      
      return patients.map((patient: any) => this.toDomainEntity(patient));
    } catch (error) {
      console.error('Error searching patients:', error);
      throw error;
    }
  }

  async findByProfessional(professionalId: string): Promise<Patient[]> {
    return this.findAll({ assignedProfessionalId: professionalId });
  }

  async create(data: CreatePatientData): Promise<Patient> {
    try {
      const response = await authPost(this.baseUrl, this.toApiFormat(data));

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to create patient: ${response.statusText}`);
      }

      const responseData = await response.json();
      return this.toDomainEntity(responseData.data || responseData);
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  }

  async update(id: string, data: UpdatePatientData): Promise<Patient> {
    try {
      const response = await authPut(`${this.baseUrl}/${id}`, this.toApiFormat(data));

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to update patient: ${response.statusText}`);
      }

      const responseData = await response.json();
      return this.toDomainEntity(responseData.data || responseData);
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const response = await authDelete(`${this.baseUrl}/${id}`);

      if (!response.ok) {
        throw new Error(`Failed to delete patient: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw error;
    }
  }

  async archive(id: string): Promise<Patient> {
    return this.update(id, { isActive: false });
  }

  async restore(id: string): Promise<Patient> {
    return this.update(id, { isActive: true });
  }

  async createMultiple(patients: CreatePatientData[]): Promise<Patient[]> {
    try {
      const response = await authPost(`${this.baseUrl}/bulk`, {
        patients: patients.map(p => this.toApiFormat(p))
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to create patients: ${response.statusText}`);
      }

      const responseData = await response.json();
      const createdPatients = responseData.data || responseData.patients || [];
      
      return createdPatients.map((patient: any) => this.toDomainEntity(patient));
    } catch (error) {
      console.error('Error creating multiple patients:', error);
      throw error;
    }
  }

  async updateMultiple(updates: { id: string; data: UpdatePatientData }[]): Promise<Patient[]> {
    try {
      const response = await authPut(`${this.baseUrl}/bulk`, {
        updates: updates.map(u => ({ id: u.id, data: this.toApiFormat(u.data) }))
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to update patients: ${response.statusText}`);
      }

      const responseData = await response.json();
      const updatedPatients = responseData.data || responseData.patients || [];
      
      return updatedPatients.map((patient: any) => this.toDomainEntity(patient));
    } catch (error) {
      console.error('Error updating multiple patients:', error);
      throw error;
    }
  }

  async addTag(id: string, tag: string): Promise<Patient> {
    try {
      const response = await authPost(`${this.baseUrl}/${id}/tags`, { tag });

      if (!response.ok) {
        throw new Error(`Failed to add tag: ${response.statusText}`);
      }

      const responseData = await response.json();
      return this.toDomainEntity(responseData.data || responseData);
    } catch (error) {
      console.error('Error adding tag:', error);
      throw error;
    }
  }

  async removeTag(id: string, tag: string): Promise<Patient> {
    try {
      const response = await authDelete(`${this.baseUrl}/${id}/tags/${encodeURIComponent(tag)}`);

      if (!response.ok) {
        throw new Error(`Failed to remove tag: ${response.statusText}`);
      }

      const responseData = await response.json();
      return this.toDomainEntity(responseData.data || responseData);
    } catch (error) {
      console.error('Error removing tag:', error);
      throw error;
    }
  }

  async findByTags(tags: string[]): Promise<Patient[]> {
    return this.findAll({ tags });
  }

  async getStats(clinicId?: string, workspaceId?: string): Promise<PatientStats> {
    try {
      const params = new URLSearchParams();
      if (clinicId) params.append('clinic_id', clinicId);
      if (workspaceId) params.append('workspace_id', workspaceId);

      const url = params.toString() ? `${this.baseUrl}/stats?${params}` : `${this.baseUrl}/stats`;
      const response = await authGet(url);

      if (!response.ok) {
        throw new Error(`Failed to get patient stats: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Error getting patient stats:', error);
      throw error;
    }
  }

  async getRecentPatients(limit: number, clinicId?: string, workspaceId?: string): Promise<Patient[]> {
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (clinicId) params.append('clinic_id', clinicId);
      if (workspaceId) params.append('workspace_id', workspaceId);

      const response = await authGet(`${this.baseUrl}/recent?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to get recent patients: ${response.statusText}`);
      }

      const data = await response.json();
      const patients = data.data || data.patients || [];
      
      return patients.map((patient: any) => this.toDomainEntity(patient));
    } catch (error) {
      console.error('Error getting recent patients:', error);
      throw error;
    }
  }

  async validateMedicalRecordNumber(recordNumber: string, excludeId?: string): Promise<boolean> {
    try {
      const params = new URLSearchParams({ 
        medical_record_number: recordNumber,
        exclude_id: excludeId || ''
      });

      const response = await authGet(`${this.baseUrl}/validate/medical-record-number?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to validate medical record number: ${response.statusText}`);
      }

      const data = await response.json();
      return data.isUnique || false;
    } catch (error) {
      console.error('Error validating medical record number:', error);
      throw error;
    }
  }

  async validateEmail(email: string, excludeId?: string): Promise<boolean> {
    try {
      const params = new URLSearchParams({ 
        email,
        exclude_id: excludeId || ''
      });

      const response = await authGet(`${this.baseUrl}/validate/email?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to validate email: ${response.statusText}`);
      }

      const data = await response.json();
      return data.isUnique || false;
    } catch (error) {
      console.error('Error validating email:', error);
      throw error;
    }
  }
}