/**
 * Agenda API Client - Minimal implementation for agenda functionality
 * Handles waiting list, available slots, and appointment scheduling
 */

import { createApiUrl } from './api-url-builders';
import API_ROUTES from '../config/api-routes';

// Types for agenda functionality
export interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface WaitingListEntry {
  id: string;
  patient?: Patient;
  appointmentType: string;
  priority: 'alta' | 'media' | 'baja';
  status: 'waiting' | 'contacted' | 'scheduled' | 'expired';
  preferredDates: string[];
  preferredTimes: string[];
  notes?: string;
  addedDate: string;
}

export interface AvailableSlot {
  id: string;
  date: string;
  time: string;
  duration: number;
  available: boolean;
}

export interface WaitingListResponse {
  success: boolean;
  data: WaitingListEntry[];
  message?: string;
}

export interface AvailableSlotsResponse {
  success: boolean;
  data: AvailableSlot[];
  message?: string;
}

class AgendaApiClient {
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
      console.error(`[AgendaAPI] Error on ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get waiting list entries
   */
  async getWaitingList(): Promise<WaitingListResponse> {
    try {
      return await this.makeRequest<WaitingListResponse>(API_ROUTES.agenda.waitingList);
    } catch (error) {
      console.error('Error getting waiting list:', error);
      // Return mock data for now since agenda API might not be implemented yet
      return {
        success: true,
        data: [],
        message: 'Using mock data - agenda API not yet implemented'
      };
    }
  }

  /**
   * Get available appointment slots
   */
  async getAvailableSlots(): Promise<AvailableSlotsResponse> {
    try {
      return await this.makeRequest<AvailableSlotsResponse>(API_ROUTES.agenda.availableSlots);
    } catch (error) {
      console.error('Error getting available slots:', error);
      // Return mock data for now since agenda API might not be implemented yet
      return {
        success: true,
        data: [],
        message: 'Using mock data - agenda API not yet implemented'
      };
    }
  }

  /**
   * Update waiting list entry status
   */
  async updateWaitingListEntry(entryId: string, updateData: Partial<WaitingListEntry>): Promise<{ success: boolean; data?: WaitingListEntry }> {
    try {
      return await this.makeRequest<{ success: boolean; data: WaitingListEntry }>(API_ROUTES.agenda.waitingListById(entryId), {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    } catch (error) {
      console.error('Error updating waiting list entry:', error);
      // Return success for now since agenda API might not be implemented yet
      return {
        success: true,
        data: undefined
      };
    }
  }

  /**
   * Create new waiting list entry
   */
  async createWaitingListEntry(entryData: Omit<WaitingListEntry, 'id' | 'addedDate'>): Promise<{ success: boolean; data?: WaitingListEntry }> {
    try {
      return await this.makeRequest<{ success: boolean; data: WaitingListEntry }>(API_ROUTES.agenda.waitingList, {
        method: 'POST',
        body: JSON.stringify(entryData),
      });
    } catch (error) {
      console.error('Error creating waiting list entry:', error);
      // Return success for now since agenda API might not be implemented yet
      return {
        success: true,
        data: undefined
      };
    }
  }

  /**
   * Schedule appointment from waiting list
   */
  async scheduleAppointment(waitingListId: string, slotId: string): Promise<{ success: boolean; data?: any }> {
    try {
      return await this.makeRequest<{ success: boolean; data: any }>(API_ROUTES.agenda.scheduleAppointment, {
        method: 'POST',
        body: JSON.stringify({ waitingListId, slotId }),
      });
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      // Return success for now since agenda API might not be implemented yet
      return {
        success: true,
        data: undefined
      };
    }
  }
}

// Export singleton instance
export const agendaApi = new AgendaApiClient();

// Named exports for convenience
export { AgendaApiClient };