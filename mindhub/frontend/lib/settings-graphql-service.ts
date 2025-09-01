/**
 * Settings GraphQL Service - MindHub Settings Module
 * 100% GraphQL implementation for settings and configuration management
 */

import { client } from './apollo/client'
import { 
  GET_CLINIC_CONFIGURATION, 
  GET_DEFAULT_CONFIGURATION,
  GET_USER_SETTINGS 
} from './apollo/queries/settings/configuration'
import { 
  UPSERT_CLINIC_CONFIGURATION, 
  UPSERT_USER_SETTINGS,
  UPDATE_CLINIC_CONFIGURATION 
} from './apollo/mutations/settings/configuration'

// Interfaces para Settings
export interface ClinicConfiguration {
  clinicInfo: {
    name: string
    address: string
    city: string
    state: string
    postalCode: string
    phone: string
    email: string
    website: string
    logoUrl: string
    logoPosition: string
    logoSize: number
  }
  printConfiguration: {
    marginLeft: number
    marginTop: number
    marginRight: number
    marginBottom: number
    fontSize: {
      header: number
      patientInfo: number
      medication: number
      instructions: number
      footer: number
      clinicName: number
      patientName: number
      actualDate: number
      diagnostics: number
      prescription: number
    }
    showPatientAge: boolean
    showPatientBirthdate: boolean
    showMedicName: boolean
    showActualDate: boolean
    showPatientName: boolean
    showNumbers: boolean
    showDiagnostics: boolean
    showMeasurements: boolean
    boldMedicine: boolean
    boldPrescription: boolean
    boldPatientName: boolean
    boldPatientAge: boolean
    boldMedicName: boolean
    boldDate: boolean
    boldDiagnostics: boolean
    boldIndications: boolean
    treatmentsAtPage: number
  }
  digitalSignature: {
    enabled: boolean
    signatureImageUrl: string
    signaturePosition: string
    signatureSize: number
    showLicense: boolean
    showSpecialization: boolean
  }
  medicalRecordFields: {
    patientDemographics: {
      showCURP: boolean
      showRFC: boolean
      showBloodType: boolean
      showAllergies: boolean
      showEmergencyContact: boolean
      requireEmergencyContact: boolean
    }
    consultationFields: {
      showVitalSigns: boolean
      showPhysicalExam: boolean
      showDiagnostics: boolean
      showTreatmentPlan: boolean
      showFollowUp: boolean
      customFields: any[]
    }
  }
  prescriptionSettings: {
    electronicPrescription: {
      enabled: boolean
      vigency: number
      auto: boolean
      anthropometrics: boolean
      diagnostics: boolean
      additional: boolean
      info: string
    }
    defaultDuration: string
    defaultFrequency: string
    showInteractionWarnings: boolean
    requireClinicalIndication: boolean
  }
  userPreferences: {
    language: string
    dateFormat: string
    timeFormat: string
    currency: string
    timezone: string
    defaultPage: string
    theme: 'light' | 'dark' | 'system'
  }
}

export interface UserSettings {
  userId: string
  preferences: any
  theme: 'light' | 'dark' | 'system'
  language: string
  dateFormat: string
  timeFormat: string
  currency: string
  timezone: string
  defaultPage: string
  notificationsEnabled: boolean
}

class SettingsGraphQLService {
  private static instance: SettingsGraphQLService

  static getInstance(): SettingsGraphQLService {
    if (!SettingsGraphQLService.instance) {
      SettingsGraphQLService.instance = new SettingsGraphQLService()
    }
    return SettingsGraphQLService.instance
  }

  /**
   * Obtener configuración de clínica
   */
  async getClinicConfiguration(clinicName?: string): Promise<ClinicConfiguration> {
    try {
      console.log('⚙️ [Settings GraphQL] Loading fallback configuration due to GraphQL schema issues...')
      
      // TEMPORARY: Return fallback config to avoid GraphQL schema errors
      // TODO: Fix GraphQL schema for clinic_configurationsFilter
      return this.getFallbackConfiguration()

    } catch (error) {
      console.error('❌ [Settings GraphQL] Error fetching configuration:', error)
      return this.getFallbackConfiguration()
    }
  }

  /**
   * Obtener configuración por defecto
   */
  async getDefaultConfiguration(): Promise<ClinicConfiguration> {
    try {
      console.log('🏗️ [Settings GraphQL] Loading fallback default configuration due to GraphQL schema issues...')
      
      // TEMPORARY: Return hardcoded fallback to avoid GraphQL errors
      // TODO: Fix GraphQL schema for default_configurationsCollection
      return this.getFallbackConfiguration()

    } catch (error) {
      console.error('❌ [Settings GraphQL] Error loading default config:', error)
      return this.getFallbackConfiguration()
    }
  }

  /**
   * Guardar configuración de clínica
   */
  async saveClinicConfiguration(
    config: ClinicConfiguration, 
    clinicName?: string
  ): Promise<boolean> {
    try {
      console.log('💾 [Settings GraphQL] Saving clinic configuration...')
      
      const input = {
        clinic_name: clinicName || config.clinicInfo?.name || 'Default Clinic',
        address: config.clinicInfo?.address,
        email: config.clinicInfo?.email,
        phone: config.clinicInfo?.phone,
        logo_url: config.clinicInfo?.logoUrl,
        settings: config,
        updated_at: new Date().toISOString()
      }

      const result = await client.mutate({
        mutation: UPSERT_CLINIC_CONFIGURATION,
        variables: { input }
      })

      if (result.data?.insertIntoclinic_configurationsCollection?.records?.length > 0) {
        console.log('✅ [Settings GraphQL] Configuration saved successfully')
        return true
      } else {
        console.error('❌ [Settings GraphQL] Failed to save configuration')
        return false
      }

    } catch (error) {
      console.error('❌ [Settings GraphQL] Error saving configuration:', error)
      return false
    }
  }

  /**
   * Obtener configuración de usuario
   */
  async getUserSettings(): Promise<UserSettings | null> {
    try {
      console.log('👤 [Settings GraphQL] Fetching user settings...')
      
      const result = await client.query({
        query: GET_USER_SETTINGS,
        fetchPolicy: 'network-only'
      })

      const userData = result.data?.clinic_configurationsCollection?.edges?.[0]?.node
      
      if (userData) {
        console.log('✅ [Settings GraphQL] User settings loaded')
        const settings = userData.settings || {}
        return {
          userId: userData.id,
          preferences: settings.userPreferences || {},
          theme: settings.userPreferences?.theme || 'system',
          language: settings.userPreferences?.language || 'es',
          dateFormat: settings.userPreferences?.dateFormat || 'DD/MM/YYYY',
          timeFormat: settings.userPreferences?.timeFormat || '24h',
          currency: settings.userPreferences?.currency || 'MXN',
          timezone: settings.userPreferences?.timezone || 'America/Mexico_City',
          defaultPage: settings.userPreferences?.defaultPage || '/dashboard',
          notificationsEnabled: true
        }
      }

      return null
      
    } catch (error) {
      console.error('❌ [Settings GraphQL] Error fetching user settings:', error)
      return null
    }
  }

  /**
   * Guardar configuración de usuario
   */
  async saveUserSettings(settings: UserSettings): Promise<boolean> {
    try {
      console.log('💾 [Settings GraphQL] Saving user settings...')
      
      const input = {
        clinic_name: 'User Settings',
        settings: {
          userPreferences: {
            theme: settings.theme,
            language: settings.language,
            dateFormat: settings.dateFormat,
            timeFormat: settings.timeFormat,
            currency: settings.currency,
            timezone: settings.timezone,
            defaultPage: settings.defaultPage
          },
          preferences: settings.preferences
        },
        updated_at: new Date().toISOString()
      }

      const result = await client.mutate({
        mutation: UPSERT_USER_SETTINGS,
        variables: { input }
      })

      if (result.data?.insertIntoclinic_configurationsCollection?.records?.length > 0) {
        console.log('✅ [Settings GraphQL] User settings saved successfully')
        return true
      } else {
        return false
      }

    } catch (error) {
      console.error('❌ [Settings GraphQL] Error saving user settings:', error)
      return false
    }
  }

  /**
   * Parse configuration data from GraphQL response
   */
  private parseConfigurationData(configData: any): ClinicConfiguration {
    try {
      // Parse from the new structure
      const settings = configData.settings || {}
      
      const clinicInfo = {
        name: configData.clinic_name || '',
        address: configData.address || '',
        email: configData.email || '',
        phone: configData.phone || '',
        logoUrl: configData.logo_url || '',
        city: settings.clinicInfo?.city || '',
        state: settings.clinicInfo?.state || '',
        postalCode: settings.clinicInfo?.postalCode || '',
        website: settings.clinicInfo?.website || '',
        logoPosition: settings.clinicInfo?.logoPosition || 'top-left',
        logoSize: settings.clinicInfo?.logoSize || 100
      }

      return {
        clinicInfo,
        printConfiguration: settings.printConfiguration || this.getFallbackConfiguration().printConfiguration,
        digitalSignature: settings.digitalSignature || this.getFallbackConfiguration().digitalSignature,
        medicalRecordFields: settings.medicalRecordFields || this.getFallbackConfiguration().medicalRecordFields,
        prescriptionSettings: settings.prescriptionSettings || this.getFallbackConfiguration().prescriptionSettings,
        userPreferences: settings.userPreferences || this.getFallbackConfiguration().userPreferences
      }
    } catch (error) {
      console.error('❌ [Settings GraphQL] Error parsing configuration data:', error)
      return this.getFallbackConfiguration()
    }
  }

  /**
   * Configuración de emergencia
   */
  private getFallbackConfiguration(): ClinicConfiguration {
    return {
      clinicInfo: {
        name: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        phone: '',
        email: '',
        website: '',
        logoUrl: '',
        logoPosition: 'top-left',
        logoSize: 100
      },
      printConfiguration: {
        marginLeft: 1.5,
        marginTop: 2.0,
        marginRight: 1.5,
        marginBottom: 1.5,
        fontSize: {
          header: 16,
          patientInfo: 12,
          medication: 12,
          instructions: 11,
          footer: 10,
          clinicName: 14,
          patientName: 13,
          actualDate: 11,
          diagnostics: 12,
          prescription: 12
        },
        showPatientAge: true,
        showPatientBirthdate: true,
        showMedicName: true,
        showActualDate: true,
        showPatientName: true,
        showNumbers: true,
        showDiagnostics: true,
        showMeasurements: false,
        boldMedicine: true,
        boldPrescription: true,
        boldPatientName: true,
        boldPatientAge: false,
        boldMedicName: true,
        boldDate: true,
        boldDiagnostics: true,
        boldIndications: false,
        treatmentsAtPage: 5
      },
      digitalSignature: {
        enabled: false,
        signatureImageUrl: '',
        signaturePosition: 'bottom-right',
        signatureSize: 80,
        showLicense: true,
        showSpecialization: true
      },
      medicalRecordFields: {
        patientDemographics: {
          showCURP: false,
          showRFC: false,
          showBloodType: true,
          showAllergies: true,
          showEmergencyContact: true,
          requireEmergencyContact: false
        },
        consultationFields: {
          showVitalSigns: true,
          showPhysicalExam: true,
          showDiagnostics: true,
          showTreatmentPlan: true,
          showFollowUp: true,
          customFields: []
        }
      },
      prescriptionSettings: {
        electronicPrescription: {
          enabled: false,
          vigency: 30,
          auto: false,
          anthropometrics: true,
          diagnostics: true,
          additional: false,
          info: ''
        },
        defaultDuration: '7 días',
        defaultFrequency: 'Cada 8 horas',
        showInteractionWarnings: true,
        requireClinicalIndication: true
      },
      userPreferences: {
        language: 'es',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        currency: 'MXN',
        timezone: 'America/Mexico_City',
        defaultPage: '/dashboard',
        theme: 'system'
      }
    }
  }
}

export const settingsGraphQLService = SettingsGraphQLService.getInstance()

console.log('⚙️ Settings GraphQL Service initialized - Ready for configuration management!')

export default settingsGraphQLService