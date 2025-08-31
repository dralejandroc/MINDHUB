/**
 * Agenda Settings Hybrid Service - Django + GraphQL
 * Maintains ALL Django functionality while adding GraphQL support
 * NEVER removes existing functionality - only enhances it
 */

import { client } from './apollo/client'
import { GET_SETTINGS } from './apollo/queries/settings/settings'

export interface ScheduleSettings {
  workingHours: {
    start: string;
    end: string;
  };
  lunchBreak: {
    enabled: boolean;
    start: string;
    end: string;
  };
  workingDays: string[];
  defaultAppointmentDuration: number;
  consultationTypes: Array<{
    id: string;
    name: string;
    duration: number;
    price: number;
    color: string;
  }>;
  blockedDates: string[];
  maxDailyAppointments: number;
  bufferTime: number;
}

class AgendaSettingsHybridService {
  private static instance: AgendaSettingsHybridService

  static getInstance(): AgendaSettingsHybridService {
    if (!AgendaSettingsHybridService.instance) {
      AgendaSettingsHybridService.instance = new AgendaSettingsHybridService()
    }
    return AgendaSettingsHybridService.instance
  }

  /**
   * ✅ HYBRID: Get schedule settings via Django API (MANTENER FUNCIONALIDAD EXISTENTE)
   * + GraphQL como fallback
   */
  async getScheduleSettings(): Promise<ScheduleSettings | null> {
    try {
      console.log('📅 [Agenda Settings Hybrid] Getting schedule settings - Django PRIMARY, GraphQL fallback')
      
      // 🔄 PRIMARY: Try Django API first (mantener funcionalidad existente)
      try {
        const response = await fetch('/api/expedix/schedule-config')
        if (response.ok) {
          const data = await response.json()
          console.log('✅ [Agenda Settings Hybrid] Schedule settings loaded via Django API')
          return data.success && data.data ? data.data : this.getFallbackSettings()
        }
      } catch (djangoError) {
        console.warn('⚠️ [Agenda Settings Hybrid] Django API failed, trying GraphQL:', djangoError)
      }

      // 🔄 FALLBACK: Try GraphQL if Django fails
      try {
        const result = await client.query({
          query: GET_SETTINGS,
          variables: { 
            filter: { 
              setting_type: { eq: 'agenda_schedule' } 
            }
          },
          fetchPolicy: 'network-only'
        })

        const settings = result.data?.settingsCollection?.edges?.[0]?.node
        if (settings && settings.value) {
          const parsedSettings = JSON.parse(settings.value)
          console.log('✅ [Agenda Settings Hybrid] Schedule settings loaded via GraphQL')
          return this.transformGraphQLToSettings(parsedSettings)
        }

        console.log('⚠️ [Agenda Settings Hybrid] No settings found, using fallback')
        return this.getFallbackSettings()

      } catch (graphqlError) {
        console.error('❌ [Agenda Settings Hybrid] Both Django and GraphQL failed:', graphqlError)
        return this.getFallbackSettings()
      }

    } catch (error) {
      console.error('❌ [Agenda Settings Hybrid] Critical error in getScheduleSettings:', error)
      return this.getFallbackSettings()
    }
  }

  /**
   * ✅ DJANGO ONLY: Save settings via Django API (MANTENER FUNCIONALIDAD COMPLETA)
   */
  async saveScheduleSettings(settings: ScheduleSettings): Promise<boolean> {
    try {
      console.log('💾 [Agenda Settings Hybrid] Saving schedule settings via Django API (full functionality)')

      const response = await fetch('/api/expedix/schedule-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      const data = await response.json()
      console.log('📡 [Agenda Settings Hybrid] Save response:', data)

      if (response.ok && data.success) {
        console.log('✅ [Agenda Settings Hybrid] Schedule settings saved successfully via Django')
        return true
      } else {
        console.error('❌ [Agenda Settings Hybrid] Save failed:', data)
        return false
      }

    } catch (error) {
      console.error('❌ [Agenda Settings Hybrid] Save error:', error)
      return false
    }
  }

  /**
   * Transform GraphQL settings data to expected format
   */
  private transformGraphQLToSettings(graphqlData: any): ScheduleSettings {
    return {
      workingHours: graphqlData.workingHours || {
        start: '08:00',
        end: '20:00'
      },
      lunchBreak: graphqlData.lunchBreak || {
        enabled: true,
        start: '14:00',
        end: '15:00'
      },
      workingDays: graphqlData.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      defaultAppointmentDuration: graphqlData.defaultAppointmentDuration || 60,
      consultationTypes: graphqlData.consultationTypes || this.getFallbackConsultationTypes(),
      blockedDates: graphqlData.blockedDates || [],
      maxDailyAppointments: graphqlData.maxDailyAppointments || 20,
      bufferTime: graphqlData.bufferTime || 15
    }
  }

  /**
   * Fallback settings when all else fails
   */
  private getFallbackSettings(): ScheduleSettings {
    return {
      workingHours: {
        start: '08:00',
        end: '20:00'
      },
      lunchBreak: {
        enabled: true,
        start: '14:00',
        end: '15:00'
      },
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      defaultAppointmentDuration: 60,
      consultationTypes: this.getFallbackConsultationTypes(),
      blockedDates: [],
      maxDailyAppointments: 20,
      bufferTime: 15
    }
  }

  /**
   * Fallback consultation types
   */
  private getFallbackConsultationTypes() {
    return [
      { id: '1', name: 'Consulta inicial', duration: 90, price: 1500, color: 'bg-blue-500' },
      { id: '2', name: 'Seguimiento', duration: 60, price: 1200, color: 'bg-green-500' },
      { id: '3', name: 'Evaluación psicológica', duration: 120, price: 2000, color: 'bg-purple-500' },
      { id: '4', name: 'Terapia individual', duration: 60, price: 1000, color: 'bg-orange-500' },
      { id: '5', name: 'Control de medicación', duration: 30, price: 800, color: 'bg-red-500' }
    ]
  }
}

export const agendaSettingsHybridService = AgendaSettingsHybridService.getInstance()

console.log('🔄 Agenda Settings Hybrid Service initialized - Django PRIMARY + GraphQL fallback!')

export default agendaSettingsHybridService