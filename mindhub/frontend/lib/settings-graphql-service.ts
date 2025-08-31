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
  async getClinicConfiguration(clinicId?: string, workspaceId?: string): Promise<ClinicConfiguration> {
    try {
      console.log('⚙️ [Settings GraphQL] Fetching clinic configuration...')
      
      const result = await client.query({
        query: GET_CLINIC_CONFIGURATION,
        variables: { clinicId, workspaceId },
        fetchPolicy: 'network-only',
        errorPolicy: 'all'
      })

      const configData = result.data?.clinic_configurationsCollection?.edges?.[0]?.node
      
      if (configData) {
        console.log('✅ [Settings GraphQL] Configuration loaded successfully')
        return this.parseConfigurationData(configData)
      } else {
        console.log('⚠️ [Settings GraphQL] No configuration found, loading default...')
        return await this.getDefaultConfiguration()
      }

    } catch (error) {
      console.error('❌ [Settings GraphQL] Error fetching configuration:', error)
      throw error
    }
  }

  /**
   * Obtener configuración por defecto
   */
  async getDefaultConfiguration(): Promise<ClinicConfiguration> {
    try {
      console.log('🏗️ [Settings GraphQL] Loading default configuration...')
      
      const result = await client.query({
        query: GET_DEFAULT_CONFIGURATION,
        fetchPolicy: 'network-only'
      })

      const defaultConfig = result.data?.default_configurationsCollection?.edges?.[0]?.node
      
      if (defaultConfig) {
        return this.parseConfigurationData(defaultConfig)
      } else {
        // Return hardcoded fallback
        return this.getFallbackConfiguration()
      }

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
    clinicId?: string, 
    workspaceId?: string,
    userId?: string
  ): Promise<boolean> {
    try {
      console.log('💾 [Settings GraphQL] Saving clinic configuration...')
      
      const input = {
        clinic_id: clinicId,
        workspace_id: workspaceId,
        configuration_data: JSON.stringify(config),
        clinic_info: JSON.stringify(config.clinicInfo),
        print_configuration: JSON.stringify(config.printConfiguration),
        digital_signature: JSON.stringify(config.digitalSignature),
        medical_record_fields: JSON.stringify(config.medicalRecordFields),
        prescription_settings: JSON.stringify(config.prescriptionSettings),
        user_preferences: JSON.stringify(config.userPreferences),
        created_by: userId,
        is_active: true,
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
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      console.log('👤 [Settings GraphQL] Fetching user settings...')
      
      const result = await client.query({
        query: GET_USER_SETTINGS,
        variables: { userId },
        fetchPolicy: 'network-only'
      })

      const userData = result.data?.user_settingsCollection?.edges?.[0]?.node
      
      if (userData) {
        console.log('✅ [Settings GraphQL] User settings loaded')
        return {
          userId: userData.user_id,
          preferences: userData.preferences,
          theme: userData.theme || 'system',
          language: userData.language || 'es',
          dateFormat: userData.date_format || 'DD/MM/YYYY',
          timeFormat: userData.time_format || '24h',
          currency: userData.currency || 'MXN',
          timezone: userData.timezone || 'America/Mexico_City',
          defaultPage: userData.default_page || '/dashboard',
          notificationsEnabled: userData.notifications_enabled ?? true
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
        user_id: settings.userId,
        preferences: JSON.stringify(settings.preferences),
        theme: settings.theme,
        language: settings.language,
        date_format: settings.dateFormat,
        time_format: settings.timeFormat,
        currency: settings.currency,
        timezone: settings.timezone,
        default_page: settings.defaultPage,
        notifications_enabled: settings.notificationsEnabled,
        is_active: true,
        updated_at: new Date().toISOString()
      }

      const result = await client.mutate({
        mutation: UPSERT_USER_SETTINGS,
        variables: { input }
      })

      if (result.data?.insertIntouser_settingsCollection?.records?.length > 0) {
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
      // Try to parse the structured JSON fields first
      const clinicInfo = configData.clinic_info ? 
        JSON.parse(configData.clinic_info) : 
        JSON.parse(configData.configuration_data)?.clinicInfo || {}

      const printConfiguration = configData.print_configuration ?
        JSON.parse(configData.print_configuration) :
        JSON.parse(configData.configuration_data)?.printConfiguration || {}

      // Continue with other fields...
      return {
        clinicInfo,
        printConfiguration,
        digitalSignature: configData.digital_signature ? 
          JSON.parse(configData.digital_signature) :
          JSON.parse(configData.configuration_data)?.digitalSignature || {},
        medicalRecordFields: configData.medical_record_fields ?
          JSON.parse(configData.medical_record_fields) :
          JSON.parse(configData.configuration_data)?.medicalRecordFields || {},
        prescriptionSettings: configData.prescription_settings ?
          JSON.parse(configData.prescription_settings) :
          JSON.parse(configData.configuration_data)?.prescriptionSettings || {},
        userPreferences: configData.user_preferences ?
          JSON.parse(configData.user_preferences) :
          JSON.parse(configData.configuration_data)?.userPreferences || {}
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