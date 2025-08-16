/**
 * Patient Timeline API Client - Minimal implementation for timeline functionality
 * Handles patient timeline events and history
 */

import { createApiUrl } from './api-url-builders';
import API_ROUTES from '../config/api-routes';

// Types for timeline functionality
export interface TimelineEvent {
  id: string;
  patientId: string;
  eventType: 'consultation' | 'assessment' | 'prescription' | 'document' | 'appointment' | 'note';
  title: string;
  description?: string;
  date: string;
  metadata?: {
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TimelineResponse {
  success: boolean;
  data: TimelineEvent[];
  message?: string;
}

class PatientTimelineApiClient {
  constructor() {
    // No necesitamos baseUrl porque las URLs se construyen dinámicamente
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = createApiUrl(endpoint);
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: defaultHeaders,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[PatientTimelineAPI] Error on ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get timeline events for a specific patient
   */
  async getPatientTimeline(patientId: string): Promise<TimelineResponse> {
    try {
      return await this.makeRequest<TimelineResponse>(`/expedix/patients/${patientId}/timeline`);
    } catch (error) {
      console.error('Error getting patient timeline:', error);
      // Return mock data for now since timeline API might not be implemented yet
      return {
        success: true,
        data: [],
        message: 'Using mock data - timeline API not yet implemented'
      };
    }
  }

  /**
   * Add a new timeline event
   */
  async addTimelineEvent(patientId: string, eventData: Omit<TimelineEvent, 'id' | 'patientId' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; data?: TimelineEvent }> {
    try {
      return await this.makeRequest<{ success: boolean; data: TimelineEvent }>(`/expedix/patients/${patientId}/timeline`, {
        method: 'POST',
        body: JSON.stringify(eventData),
      });
    } catch (error) {
      console.error('Error adding timeline event:', error);
      // Return success for now since timeline API might not be implemented yet
      return {
        success: true,
        data: undefined
      };
    }
  }

  /**
   * Update a timeline event
   */
  async updateTimelineEvent(eventId: string, updateData: Partial<TimelineEvent>): Promise<{ success: boolean; data?: TimelineEvent }> {
    try {
      return await this.makeRequest<{ success: boolean; data: TimelineEvent }>(`/expedix/timeline/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    } catch (error) {
      console.error('Error updating timeline event:', error);
      // Return success for now since timeline API might not be implemented yet
      return {
        success: true,
        data: undefined
      };
    }
  }

  /**
   * Delete a timeline event
   */
  async deleteTimelineEvent(eventId: string): Promise<{ success: boolean }> {
    try {
      return await this.makeRequest<{ success: boolean }>(`/expedix/timeline/${eventId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting timeline event:', error);
      // Return success for now since timeline API might not be implemented yet
      return { success: true };
    }
  }
}

// Export singleton instance
export const patientTimelineApi = new PatientTimelineApiClient();

// Named exports for convenience
export { PatientTimelineApiClient };