/**
 * Django Patient Adapter
 * Implementation of PatientRepository using Django REST API
 */

import { Patient, PatientStatus, EmergencyContact, InsuranceInfo, CheckInInfo } from '../entities/Patient';
import { PatientRepository, PatientSearchFilters } from '../repositories/PatientRepository';

interface DjangoPatientResponse {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  phone_number: string;
  email: string;
  medical_record_number: string;
  status: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  emergency_contact: {
    name: string;
    relation: string;
    phone_number: string;
    email?: string;
  };
  insurance_info?: {
    provider_name: string;
    policy_number: string;
    group_number?: string;
    status: string;
    expiration_date?: string;
    copay_amount?: number;
  };
  check_in_info?: {
    checked_in_at: string;
    checked_in_by: string;
    waiting_room_location?: string;
    estimated_wait_time?: number;
    special_needs?: string[];
  };
  preferred_language: string;
  has_special_needs: boolean;
  is_minor: boolean;
  notes: string;
  clinic_id?: string;
  workspace_id?: string;
  created_at: string;
  updated_at: string;
}

export class DjangoPatientAdapter implements PatientRepository {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(baseUrl: string = '/api/expedix/django') {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Django API request failed:', error);
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  private mapDjangoResponseToPatient(response: DjangoPatientResponse): Patient {
    return new Patient(
      response.id,
      response.first_name,
      response.last_name,
      new Date(response.date_of_birth),
      response.phone_number,
      response.email,
      response.medical_record_number,
      response.status as PatientStatus,
      response.address,
      response.city,
      response.state,
      response.zip_code,
      {
        name: response.emergency_contact.name,
        relation: response.emergency_contact.relation as any,
        phoneNumber: response.emergency_contact.phone_number,
        email: response.emergency_contact.email,
      },
      response.insurance_info ? {
        providerName: response.insurance_info.provider_name,
        policyNumber: response.insurance_info.policy_number,
        groupNumber: response.insurance_info.group_number,
        status: response.insurance_info.status as any,
        expirationDate: response.insurance_info.expiration_date 
          ? new Date(response.insurance_info.expiration_date) 
          : undefined,
        copayAmount: response.insurance_info.copay_amount,
      } : undefined,
      response.check_in_info ? {
        checkedInAt: new Date(response.check_in_info.checked_in_at),
        checkedInBy: response.check_in_info.checked_in_by,
        waitingRoomLocation: response.check_in_info.waiting_room_location,
        estimatedWaitTime: response.check_in_info.estimated_wait_time,
        specialNeeds: response.check_in_info.special_needs || [],
      } : undefined,
      response.preferred_language,
      response.has_special_needs,
      response.is_minor,
      response.notes,
      response.clinic_id,
      response.workspace_id,
      new Date(response.created_at),
      new Date(response.updated_at)
    );
  }

  private mapPatientToDjangoRequest(patient: Patient): any {
    return {
      id: patient.id,
      first_name: patient.firstName,
      last_name: patient.lastName,
      date_of_birth: patient.dateOfBirth.toISOString().split('T')[0],
      phone_number: patient.phoneNumber,
      email: patient.email,
      medical_record_number: patient.medicalRecordNumber,
      status: patient.status,
      address: patient.address,
      city: patient.city,
      state: patient.state,
      zip_code: patient.zipCode,
      emergency_contact: {
        name: patient.emergencyContact.name,
        relation: patient.emergencyContact.relation,
        phone_number: patient.emergencyContact.phoneNumber,
        email: patient.emergencyContact.email,
      },
      insurance_info: patient.insuranceInfo ? {
        provider_name: patient.insuranceInfo.providerName,
        policy_number: patient.insuranceInfo.policyNumber,
        group_number: patient.insuranceInfo.groupNumber,
        status: patient.insuranceInfo.status,
        expiration_date: patient.insuranceInfo.expirationDate?.toISOString().split('T')[0],
        copay_amount: patient.insuranceInfo.copayAmount,
      } : null,
      check_in_info: patient.checkInInfo ? {
        checked_in_at: patient.checkInInfo.checkedInAt.toISOString(),
        checked_in_by: patient.checkInInfo.checkedInBy,
        waiting_room_location: patient.checkInInfo.waitingRoomLocation,
        estimated_wait_time: patient.checkInInfo.estimatedWaitTime,
        special_needs: patient.checkInInfo.specialNeeds,
      } : null,
      preferred_language: patient.preferredLanguage,
      has_special_needs: patient.hasSpecialNeeds,
      is_minor: patient.isMinor,
      notes: patient.notes,
      clinic_id: patient.clinicId,
      workspace_id: patient.workspaceId,
    };
  }

  private buildQueryParams(filters?: PatientSearchFilters): string {
    if (!filters) return '';

    const params = new URLSearchParams();

    if (filters.clinicId) params.append('clinic_id', filters.clinicId);
    if (filters.workspaceId) params.append('workspace_id', filters.workspaceId);
    if (filters.status) params.append('status', filters.status);
    if (filters.includeInactive !== undefined) {
      params.append('include_inactive', filters.includeInactive.toString());
    }
    if (filters.hasSpecialNeeds !== undefined) {
      params.append('has_special_needs', filters.hasSpecialNeeds.toString());
    }
    if (filters.isMinor !== undefined) {
      params.append('is_minor', filters.isMinor.toString());
    }
    if (filters.insuranceStatus) {
      params.append('insurance_status', filters.insuranceStatus);
    }

    return params.toString() ? `?${params.toString()}` : '';
  }

  async findById(id: string): Promise<Patient | undefined> {
    try {
      const response = await this.makeRequest(`/patients/${id}/`);
      return this.mapDjangoResponseToPatient(response);
    } catch (error) {
      if (error.message.includes('404')) {
        return undefined;
      }
      throw error;
    }
  }

  async search(searchTerm: string, filters?: PatientSearchFilters): Promise<Patient[]> {
    const queryParams = this.buildQueryParams(filters);
    const searchParams = new URLSearchParams(queryParams);
    searchParams.append('search', searchTerm);

    const response = await this.makeRequest(`/patients/search/?${searchParams.toString()}`);
    return response.results.map((item: DjangoPatientResponse) => 
      this.mapDjangoResponseToPatient(item)
    );
  }

  async findByStatus(status: PatientStatus, filters?: PatientSearchFilters): Promise<Patient[]> {
    const queryParams = this.buildQueryParams({ ...filters, status });
    const response = await this.makeRequest(`/patients/${queryParams}`);
    return response.results.map((item: DjangoPatientResponse) => 
      this.mapDjangoResponseToPatient(item)
    );
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    filters?: PatientSearchFilters
  ): Promise<Patient[]> {
    const queryParams = this.buildQueryParams(filters);
    const params = new URLSearchParams(queryParams);
    params.append('start_date', startDate.toISOString().split('T')[0]);
    params.append('end_date', endDate.toISOString().split('T')[0]);

    const response = await this.makeRequest(`/patients/?${params.toString()}`);
    return response.results.map((item: DjangoPatientResponse) => 
      this.mapDjangoResponseToPatient(item)
    );
  }

  async findWithSpecialNeeds(filters?: PatientSearchFilters): Promise<Patient[]> {
    return this.findByStatus('waiting', { ...filters, hasSpecialNeeds: true });
  }

  async findMinorPatients(filters?: PatientSearchFilters): Promise<Patient[]> {
    const queryParams = this.buildQueryParams({ ...filters, isMinor: true });
    const response = await this.makeRequest(`/patients/${queryParams}`);
    return response.results.map((item: DjangoPatientResponse) => 
      this.mapDjangoResponseToPatient(item)
    );
  }

  async findWithInsuranceIssues(filters?: PatientSearchFilters): Promise<Patient[]> {
    return this.findByStatus('waiting', { ...filters, insuranceStatus: 'expired' });
  }

  async findByPhoneNumber(phoneNumber: string, filters?: PatientSearchFilters): Promise<Patient[]> {
    const queryParams = this.buildQueryParams(filters);
    const params = new URLSearchParams(queryParams);
    params.append('phone_number', phoneNumber);

    const response = await this.makeRequest(`/patients/?${params.toString()}`);
    return response.results.map((item: DjangoPatientResponse) => 
      this.mapDjangoResponseToPatient(item)
    );
  }

  async findByEmail(email: string, filters?: PatientSearchFilters): Promise<Patient[]> {
    const queryParams = this.buildQueryParams(filters);
    const params = new URLSearchParams(queryParams);
    params.append('email', email);

    const response = await this.makeRequest(`/patients/?${params.toString()}`);
    return response.results.map((item: DjangoPatientResponse) => 
      this.mapDjangoResponseToPatient(item)
    );
  }

  async findByMedicalRecordNumber(
    medicalRecordNumber: string,
    filters?: PatientSearchFilters
  ): Promise<Patient | null> {
    const queryParams = this.buildQueryParams(filters);
    const params = new URLSearchParams(queryParams);
    params.append('medical_record_number', medicalRecordNumber);

    try {
      const response = await this.makeRequest(`/patients/?${params.toString()}`);
      if (response.results && response.results.length > 0) {
        return this.mapDjangoResponseToPatient(response.results[0]);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async findWaitingPatients(filters?: PatientSearchFilters): Promise<Patient[]> {
    return this.findByStatus('waiting', filters);
  }

  async findPatientsWithExcessiveWaitTime(
    maxWaitTimeMinutes: number,
    filters?: PatientSearchFilters
  ): Promise<Patient[]> {
    const queryParams = this.buildQueryParams(filters);
    const params = new URLSearchParams(queryParams);
    params.append('max_wait_time', maxWaitTimeMinutes.toString());

    const response = await this.makeRequest(`/patients/excessive-wait/?${params.toString()}`);
    return response.results.map((item: DjangoPatientResponse) => 
      this.mapDjangoResponseToPatient(item)
    );
  }

  async create(patient: Patient): Promise<Patient> {
    const patientData = this.mapPatientToDjangoRequest(patient);
    const response = await this.makeRequest('/patients/', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
    return this.mapDjangoResponseToPatient(response);
  }

  async update(patient: Patient): Promise<Patient> {
    const patientData = this.mapPatientToDjangoRequest(patient);
    const response = await this.makeRequest(`/patients/${patient.id}/`, {
      method: 'PUT',
      body: JSON.stringify(patientData),
    });
    return this.mapDjangoResponseToPatient(response);
  }

  async delete(id: string): Promise<void> {
    await this.makeRequest(`/patients/${id}/`, {
      method: 'DELETE',
    });
  }

  async existsByMedicalRecordNumber(
    medicalRecordNumber: string,
    excludeId?: string
  ): Promise<boolean> {
    const params = new URLSearchParams();
    params.append('medical_record_number', medicalRecordNumber);
    if (excludeId) params.append('exclude_id', excludeId);

    try {
      const response = await this.makeRequest(`/patients/exists/?${params.toString()}`);
      return response.exists;
    } catch (error) {
      return false;
    }
  }

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const params = new URLSearchParams();
    params.append('email', email);
    if (excludeId) params.append('exclude_id', excludeId);

    try {
      const response = await this.makeRequest(`/patients/exists/?${params.toString()}`);
      return response.exists;
    } catch (error) {
      return false;
    }
  }

  async existsByPhoneNumber(phoneNumber: string, excludeId?: string): Promise<boolean> {
    const params = new URLSearchParams();
    params.append('phone_number', phoneNumber);
    if (excludeId) params.append('exclude_id', excludeId);

    try {
      const response = await this.makeRequest(`/patients/exists/?${params.toString()}`);
      return response.exists;
    } catch (error) {
      return false;
    }
  }

  async getStatistics(filters?: PatientSearchFilters): Promise<{
    totalPatients: number;
    activePatients: number;
    waitingPatients: number;
    minorPatients: number;
    specialNeedsPatients: number;
    averageAge: number;
    insuranceDistribution: { [status: string]: number };
    statusDistribution: { [status: string]: number };
  }> {
    const queryParams = this.buildQueryParams(filters);
    const response = await this.makeRequest(`/patients/statistics/${queryParams}`);
    return response;
  }

  async findRecentlyActive(
    limit: number,
    filters?: PatientSearchFilters
  ): Promise<Patient[]> {
    const queryParams = this.buildQueryParams(filters);
    const params = new URLSearchParams(queryParams);
    params.append('limit', limit.toString());
    params.append('order_by', '-updated_at');

    const response = await this.makeRequest(`/patients/?${params.toString()}`);
    return response.results.map((item: DjangoPatientResponse) => 
      this.mapDjangoResponseToPatient(item)
    );
  }

  async findRequiringAttention(filters?: PatientSearchFilters): Promise<Patient[]> {
    const queryParams = this.buildQueryParams(filters);
    const response = await this.makeRequest(`/patients/requiring-attention/${queryParams}`);
    return response.results.map((item: DjangoPatientResponse) => 
      this.mapDjangoResponseToPatient(item)
    );
  }

  async bulkUpdateStatus(
    patientIds: string[],
    status: PatientStatus,
    updatedBy: string,
    reason?: string
  ): Promise<Patient[]> {
    const response = await this.makeRequest('/patients/bulk-update-status/', {
      method: 'POST',
      body: JSON.stringify({
        patient_ids: patientIds,
        status,
        updated_by: updatedBy,
        reason,
      }),
    });

    return response.results.map((item: DjangoPatientResponse) => 
      this.mapDjangoResponseToPatient(item)
    );
  }

  async getVisitHistory(
    patientId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    visitCount: number;
    lastVisit: Date | null;
    averageWaitTime: number;
    noShowCount: number;
    completedVisits: number;
  }> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate.toISOString().split('T')[0]);
    if (endDate) params.append('end_date', endDate.toISOString().split('T')[0]);

    const response = await this.makeRequest(
      `/patients/${patientId}/visit-history/?${params.toString()}`
    );

    return {
      visitCount: response.visit_count,
      lastVisit: response.last_visit ? new Date(response.last_visit) : null,
      averageWaitTime: response.average_wait_time,
      noShowCount: response.no_show_count,
      completedVisits: response.completed_visits,
    };
  }
}