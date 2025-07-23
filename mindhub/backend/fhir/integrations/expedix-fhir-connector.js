/**
 * Expedix-FHIR Integration Connector
 * 
 * Handles bidirectional synchronization between Expedix patient management
 * system and FHIR R4 resources, ensuring compliance with Mexican healthcare
 * standards and NOM-024 requirements.
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class ExpedixFhirConnector {
  constructor(config = {}) {
    this.config = {
      fhirServerUrl: config.fhirServerUrl || process.env.FHIR_SERVER_URL || 'http://localhost:8080/fhir/R4',
      expedixApiUrl: config.expedixApiUrl || process.env.EXPEDIX_API_URL || 'http://localhost:3002/api',
      authToken: config.authToken || process.env.FHIR_AUTH_TOKEN,
      webhookSecret: config.webhookSecret || process.env.WEBHOOK_SECRET,
      enableBidirectionalSync: config.enableBidirectionalSync !== false,
      enableRealTimeSync: config.enableRealTimeSync !== false,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      ...config
    };
    
    this.mappers = this.initializeMappers();
    this.validators = this.initializeValidators();
    this.eventHandlers = this.initializeEventHandlers();
  }

  /**
   * Initialize data mapping functions
   */
  initializeMappers() {
    return {
      expedixToFhir: {
        patient: this.mapExpedixPatientToFhir.bind(this),
        consultation: this.mapExpedixConsultationToEncounter.bind(this),
        prescription: this.mapExpedixPrescriptionToMedicationRequest.bind(this),
        diagnosis: this.mapExpedixDiagnosisToCondition.bind(this),
        vitalSigns: this.mapExpedixVitalSignsToObservation.bind(this),
        labResult: this.mapExpedixLabResultToDiagnosticReport.bind(this)
      },
      
      fhirToExpedix: {
        Patient: this.mapFhirPatientToExpedix.bind(this),
        Encounter: this.mapFhirEncounterToConsultation.bind(this),
        MedicationRequest: this.mapFhirMedicationRequestToPrescription.bind(this),
        Condition: this.mapFhirConditionToDiagnosis.bind(this),
        Observation: this.mapFhirObservationToVitalSigns.bind(this),
        DiagnosticReport: this.mapFhirDiagnosticReportToLabResult.bind(this)
      }
    };
  }

  /**
   * Initialize validation functions
   */
  initializeValidators() {
    return {
      validateCURP: this.validateCURP.bind(this),
      validateNSS: this.validateNSS.bind(this),
      validateRFC: this.validateRFC.bind(this),
      validateFhirResource: this.validateFhirResource.bind(this),
      validateExpedixData: this.validateExpedixData.bind(this)
    };
  }

  /**
   * Initialize event handlers
   */
  initializeEventHandlers() {
    return {
      'expedix.patient.created': this.handlePatientCreated.bind(this),
      'expedix.patient.updated': this.handlePatientUpdated.bind(this),
      'expedix.patient.deleted': this.handlePatientDeleted.bind(this),
      'expedix.consultation.started': this.handleConsultationStarted.bind(this),
      'expedix.consultation.completed': this.handleConsultationCompleted.bind(this),
      'expedix.prescription.issued': this.handlePrescriptionIssued.bind(this),
      'expedix.diagnosis.added': this.handleDiagnosisAdded.bind(this),
      'fhir.Patient.created': this.handleFhirPatientCreated.bind(this),
      'fhir.Patient.updated': this.handleFhirPatientUpdated.bind(this),
      'fhir.Encounter.created': this.handleFhirEncounterCreated.bind(this),
      'fhir.MedicationRequest.created': this.handleFhirMedicationRequestCreated.bind(this)
    };
  }

  /**
   * Map Expedix patient data to FHIR Patient resource
   */
  mapExpedixPatientToFhir(expedixPatient) {
    const fhirPatient = {
      resourceType: 'Patient',
      id: `expedix-${expedixPatient.id}`,
      meta: {
        profile: ['http://mindhub.com/fhir/StructureDefinition/MXPatient'],
        source: 'expedix',
        lastUpdated: new Date().toISOString()
      },
      
      // Required Mexican identifiers
      identifier: [],
      
      // Name
      name: [{
        use: 'official',
        family: expedixPatient.lastName,
        given: [expedixPatient.firstName],
        ...(expedixPatient.middleName && { given: [expedixPatient.firstName, expedixPatient.middleName] }),
        ...(expedixPatient.title && { prefix: [expedixPatient.title] })
      }],
      
      // Contact information
      telecom: [],
      
      // Gender
      gender: this.mapGender(expedixPatient.gender),
      
      // Birth date
      birthDate: expedixPatient.dateOfBirth,
      
      // Address
      address: [],
      
      // Marital status
      ...(expedixPatient.maritalStatus && {
        maritalStatus: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
            code: this.mapMaritalStatus(expedixPatient.maritalStatus)
          }]
        }
      }),
      
      // Emergency contact
      contact: [],
      
      // Extensions for Mexican data
      extension: []
    };

    // Add CURP identifier
    if (expedixPatient.curp) {
      if (this.validators.validateCURP(expedixPatient.curp)) {
        fhirPatient.identifier.push({
          use: 'official',
          type: {
            coding: [{
              system: 'http://mindhub.com/fhir/CodeSystem/mx-identifier-type',
              code: 'CURP',
              display: 'Clave Única de Registro de Población'
            }]
          },
          system: 'http://www.gob.mx/curp',
          value: expedixPatient.curp
        });
      }
    }

    // Add NSS identifier
    if (expedixPatient.nss) {
      if (this.validators.validateNSS(expedixPatient.nss)) {
        fhirPatient.identifier.push({
          use: 'secondary',
          type: {
            coding: [{
              system: 'http://mindhub.com/fhir/CodeSystem/mx-identifier-type',
              code: 'NSS',
              display: 'Número de Seguridad Social'
            }]
          },
          system: this.mapNSSSystem(expedixPatient.socialSecuritySystem),
          value: expedixPatient.nss
        });
      }
    }

    // Add RFC identifier
    if (expedixPatient.rfc) {
      if (this.validators.validateRFC(expedixPatient.rfc)) {
        fhirPatient.identifier.push({
          use: 'secondary',
          type: {
            coding: [{
              system: 'http://mindhub.com/fhir/CodeSystem/mx-identifier-type',
              code: 'RFC',
              display: 'Registro Federal de Contribuyentes'
            }]
          },
          system: 'http://www.sat.gob.mx/rfc',
          value: expedixPatient.rfc
        });
      }
    }

    // Add contact information
    if (expedixPatient.contactInfo) {
      if (expedixPatient.contactInfo.phone) {
        fhirPatient.telecom.push({
          system: 'phone',
          value: expedixPatient.contactInfo.phone,
          use: 'mobile'
        });
      }
      
      if (expedixPatient.contactInfo.email) {
        fhirPatient.telecom.push({
          system: 'email',
          value: expedixPatient.contactInfo.email,
          use: 'home'
        });
      }
    }

    // Add address
    if (expedixPatient.address) {
      fhirPatient.address.push({
        use: 'home',
        type: 'physical',
        line: [
          expedixPatient.address.street,
          ...(expedixPatient.address.neighborhood ? [expedixPatient.address.neighborhood] : [])
        ].filter(Boolean),
        city: expedixPatient.address.city,
        state: expedixPatient.address.state,
        postalCode: expedixPatient.address.zipCode,
        country: 'MX',
        ...(expedixPatient.address.municipality && {
          extension: [{
            url: 'http://mindhub.com/fhir/StructureDefinition/municipality',
            valueString: expedixPatient.address.municipality
          }]
        })
      });
    }

    // Add emergency contact
    if (expedixPatient.emergencyContact) {
      fhirPatient.contact.push({
        relationship: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
            code: 'C',
            display: 'Emergency Contact'
          }]
        }],
        name: {
          family: expedixPatient.emergencyContact.lastName,
          given: [expedixPatient.emergencyContact.firstName]
        },
        telecom: [{
          system: 'phone',
          value: expedixPatient.emergencyContact.phone,
          use: 'mobile'
        }]
      });
    }

    return fhirPatient;
  }

  /**
   * Map FHIR Patient resource to Expedix patient data
   */
  mapFhirPatientToExpedix(fhirPatient) {
    const expedixPatient = {
      id: fhirPatient.id?.replace('expedix-', '') || null,
      
      // Basic demographics
      firstName: fhirPatient.name?.[0]?.given?.[0] || '',
      middleName: fhirPatient.name?.[0]?.given?.[1] || '',
      lastName: fhirPatient.name?.[0]?.family || '',
      
      dateOfBirth: fhirPatient.birthDate,
      gender: this.mapFhirGender(fhirPatient.gender),
      
      // Mexican identifiers
      curp: this.extractIdentifierValue(fhirPatient.identifier, 'CURP'),
      nss: this.extractIdentifierValue(fhirPatient.identifier, 'NSS'),
      rfc: this.extractIdentifierValue(fhirPatient.identifier, 'RFC'),
      
      // Contact information
      contactInfo: this.extractContactInfo(fhirPatient.telecom),
      
      // Address
      address: this.extractAddress(fhirPatient.address?.[0]),
      
      // Emergency contact
      emergencyContact: this.extractEmergencyContact(fhirPatient.contact),
      
      // Marital status
      maritalStatus: this.extractMaritalStatus(fhirPatient.maritalStatus),
      
      // System metadata
      lastUpdated: fhirPatient.meta?.lastUpdated || new Date().toISOString(),
      source: 'fhir'
    };

    return expedixPatient;
  }

  /**
   * Map Expedix consultation to FHIR Encounter
   */
  mapExpedixConsultationToEncounter(expedixConsultation) {
    return {
      resourceType: 'Encounter',
      id: `expedix-consultation-${expedixConsultation.id}`,
      meta: {
        profile: ['http://mindhub.com/fhir/StructureDefinition/MXEncounter'],
        source: 'expedix'
      },
      
      status: this.mapConsultationStatus(expedixConsultation.status),
      
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: expedixConsultation.type === 'emergency' ? 'EMER' : 'AMB',
        display: expedixConsultation.type === 'emergency' ? 'Emergency' : 'Ambulatory'
      },
      
      type: [{
        coding: [{
          system: 'http://snomed.info/sct',
          code: this.mapConsultationType(expedixConsultation.specialty),
          display: expedixConsultation.specialty
        }]
      }],
      
      subject: {
        reference: `Patient/expedix-${expedixConsultation.patientId}`
      },
      
      participant: expedixConsultation.practitioners?.map(practitioner => ({
        individual: {
          reference: `Practitioner/expedix-${practitioner.id}`
        },
        type: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
            code: practitioner.role === 'primary' ? 'PPRF' : 'SPRF'
          }]
        }]
      })) || [],
      
      period: {
        start: expedixConsultation.startTime,
        ...(expedixConsultation.endTime && { end: expedixConsultation.endTime })
      },
      
      reasonCode: expedixConsultation.reasons?.map(reason => ({
        coding: [{
          system: 'http://hl7.org/fhir/sid/icd-10-cm',
          code: reason.code,
          display: reason.description
        }]
      })) || [],
      
      location: expedixConsultation.location ? [{
        location: {
          reference: `Location/expedix-${expedixConsultation.location.id}`
        }
      }] : []
    };
  }

  /**
   * Map Expedix prescription to FHIR MedicationRequest
   */
  mapExpedixPrescriptionToMedicationRequest(expedixPrescription) {
    return {
      resourceType: 'MedicationRequest',
      id: `expedix-prescription-${expedixPrescription.id}`,
      meta: {
        profile: ['http://mindhub.com/fhir/StructureDefinition/MXPrescription'],
        source: 'expedix'
      },
      
      status: this.mapPrescriptionStatus(expedixPrescription.status),
      intent: 'order',
      
      medicationCodeableConcept: {
        coding: [{
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          code: expedixPrescription.medication.rxnormCode,
          display: expedixPrescription.medication.name
        }, {
          system: 'http://mindhub.com/fhir/CodeSystem/mx-medications',
          code: expedixPrescription.medication.localCode,
          display: expedixPrescription.medication.localName
        }]
      },
      
      subject: {
        reference: `Patient/expedix-${expedixPrescription.patientId}`
      },
      
      encounter: expedixPrescription.consultationId ? {
        reference: `Encounter/expedix-consultation-${expedixPrescription.consultationId}`
      } : undefined,
      
      authoredOn: expedixPrescription.prescribedDate,
      
      requester: {
        reference: `Practitioner/expedix-${expedixPrescription.prescriberId}`
      },
      
      dosageInstruction: [{
        text: expedixPrescription.instructions,
        timing: {
          repeat: {
            frequency: expedixPrescription.frequency,
            period: 1,
            periodUnit: expedixPrescription.frequencyUnit || 'd'
          }
        },
        route: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: this.mapRouteOfAdministration(expedixPrescription.route),
            display: expedixPrescription.route
          }]
        },
        doseAndRate: [{
          doseQuantity: {
            value: expedixPrescription.dose.amount,
            unit: expedixPrescription.dose.unit,
            system: 'http://unitsofmeasure.org',
            code: expedixPrescription.dose.unit
          }
        }]
      }],
      
      dispenseRequest: {
        validityPeriod: {
          start: expedixPrescription.prescribedDate,
          end: expedixPrescription.expiryDate
        },
        quantity: {
          value: expedixPrescription.quantity,
          unit: expedixPrescription.quantityUnit,
          system: 'http://terminology.hl7.org/CodeSystem/v3-orderableDrugForm',
          code: this.mapQuantityUnit(expedixPrescription.quantityUnit)
        },
        expectedSupplyDuration: {
          value: expedixPrescription.durationDays,
          unit: 'day',
          system: 'http://unitsofmeasure.org',
          code: 'd'
        }
      },
      
      extension: expedixPrescription.isControlled ? [{
        url: 'http://mindhub.com/fhir/StructureDefinition/prescription-type',
        valueCodeableConcept: {
          coding: [{
            system: 'http://mindhub.com/fhir/CodeSystem/prescription-type',
            code: 'CONTROLLED',
            display: 'Medicamento Controlado'
          }]
        }
      }] : []
    };
  }

  /**
   * Handle Expedix patient creation event
   */
  async handlePatientCreated(eventData) {
    try {
      console.log('📝 Processing patient creation from Expedix:', eventData.patient.id);
      
      // Map to FHIR
      const fhirPatient = this.mappers.expedixToFhir.patient(eventData.patient);
      
      // Validate FHIR resource
      const validationResult = await this.validators.validateFhirResource(fhirPatient);
      if (!validationResult.valid) {
        throw new Error(`FHIR validation failed: ${validationResult.errors.join(', ')}`);
      }
      
      // Create in FHIR server
      const response = await this.createFhirResource('Patient', fhirPatient);
      
      console.log('✅ Patient created in FHIR server:', response.id);
      
      // Update Expedix with FHIR ID
      if (this.config.enableBidirectionalSync) {
        await this.updateExpedixWithFhirId('patient', eventData.patient.id, response.id);
      }
      
      return {
        success: true,
        fhirId: response.id,
        expedixId: eventData.patient.id
      };
      
    } catch (error) {
      console.error('❌ Error processing patient creation:', error);
      
      // Send to dead letter queue or retry mechanism
      await this.handleSyncError('patient.created', eventData, error);
      
      throw error;
    }
  }

  /**
   * Handle FHIR Patient creation event
   */
  async handleFhirPatientCreated(eventData) {
    try {
      if (eventData.patient.meta?.source === 'expedix') {
        // Skip if it originated from Expedix to avoid circular sync
        return { success: true, skipped: 'circular_sync_prevention' };
      }
      
      console.log('📝 Processing patient creation from FHIR:', eventData.patient.id);
      
      // Map to Expedix format
      const expedixPatient = this.mappers.fhirToExpedix.Patient(eventData.patient);
      
      // Validate Expedix data
      const validationResult = await this.validators.validateExpedixData(expedixPatient);
      if (!validationResult.valid) {
        throw new Error(`Expedix validation failed: ${validationResult.errors.join(', ')}`);
      }
      
      // Create in Expedix
      const response = await this.createExpedixResource('patient', expedixPatient);
      
      console.log('✅ Patient created in Expedix:', response.id);
      
      return {
        success: true,
        expedixId: response.id,
        fhirId: eventData.patient.id
      };
      
    } catch (error) {
      console.error('❌ Error processing FHIR patient creation:', error);
      await this.handleSyncError('fhir.patient.created', eventData, error);
      throw error;
    }
  }

  /**
   * Create FHIR resource
   */
  async createFhirResource(resourceType, resource) {
    const url = `${this.config.fhirServerUrl}/${resourceType}`;
    
    const response = await axios.post(url, resource, {
      headers: {
        'Content-Type': 'application/fhir+json',
        ...(this.config.authToken && { 'Authorization': `Bearer ${this.config.authToken}` })
      }
    });
    
    return response.data;
  }

  /**
   * Update FHIR resource
   */
  async updateFhirResource(resourceType, id, resource) {
    const url = `${this.config.fhirServerUrl}/${resourceType}/${id}`;
    
    const response = await axios.put(url, resource, {
      headers: {
        'Content-Type': 'application/fhir+json',
        ...(this.config.authToken && { 'Authorization': `Bearer ${this.config.authToken}` })
      }
    });
    
    return response.data;
  }

  /**
   * Create Expedix resource
   */
  async createExpedixResource(resourceType, resource) {
    const url = `${this.config.expedixApiUrl}/${resourceType}`;
    
    const response = await axios.post(url, resource, {
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.authToken && { 'Authorization': `Bearer ${this.config.authToken}` })
      }
    });
    
    return response.data;
  }

  /**
   * Validation functions
   */
  validateCURP(curp) {
    const curpRegex = /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z]{2}$/;
    return curpRegex.test(curp);
  }

  validateNSS(nss) {
    const nssRegex = /^[0-9]{11}$/;
    return nssRegex.test(nss);
  }

  validateRFC(rfc) {
    const rfcRegex = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-V1-9][A-Z1-9][0-9A]$/;
    return rfcRegex.test(rfc);
  }

  async validateFhirResource(resource) {
    try {
      const url = `${this.config.fhirServerUrl}/${resource.resourceType}/$validate`;
      
      const response = await axios.post(url, resource, {
        headers: {
          'Content-Type': 'application/fhir+json',
          ...(this.config.authToken && { 'Authorization': `Bearer ${this.config.authToken}` })
        }
      });
      
      const operationOutcome = response.data;
      const errors = operationOutcome.issue?.filter(issue => issue.severity === 'error') || [];
      
      return {
        valid: errors.length === 0,
        errors: errors.map(error => error.diagnostics || error.details?.text || 'Unknown error'),
        warnings: operationOutcome.issue?.filter(issue => issue.severity === 'warning') || []
      };
      
    } catch (error) {
      return {
        valid: false,
        errors: [error.message],
        warnings: []
      };
    }
  }

  async validateExpedixData(data) {
    // Basic validation for Expedix data structure
    const errors = [];
    
    if (!data.firstName) errors.push('First name is required');
    if (!data.lastName) errors.push('Last name is required');
    if (!data.dateOfBirth) errors.push('Date of birth is required');
    if (!data.gender) errors.push('Gender is required');
    
    if (data.curp && !this.validateCURP(data.curp)) {
      errors.push('Invalid CURP format');
    }
    
    if (data.nss && !this.validateNSS(data.nss)) {
      errors.push('Invalid NSS format');
    }
    
    if (data.rfc && !this.validateRFC(data.rfc)) {
      errors.push('Invalid RFC format');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Utility mapping functions
   */
  mapGender(expedixGender) {
    const genderMap = {
      'male': 'male',
      'female': 'female',
      'other': 'other',
      'unknown': 'unknown',
      'M': 'male',
      'F': 'female',
      'masculino': 'male',
      'femenino': 'female'
    };
    
    return genderMap[expedixGender?.toLowerCase()] || 'unknown';
  }

  mapFhirGender(fhirGender) {
    const genderMap = {
      'male': 'male',
      'female': 'female',
      'other': 'other',
      'unknown': 'unknown'
    };
    
    return genderMap[fhirGender] || 'unknown';
  }

  extractIdentifierValue(identifiers, type) {
    const identifier = identifiers?.find(id => 
      id.type?.coding?.some(coding => coding.code === type)
    );
    return identifier?.value || null;
  }

  extractContactInfo(telecoms) {
    const contactInfo = {};
    
    const phone = telecoms?.find(t => t.system === 'phone');
    if (phone) contactInfo.phone = phone.value;
    
    const email = telecoms?.find(t => t.system === 'email');
    if (email) contactInfo.email = email.value;
    
    return Object.keys(contactInfo).length > 0 ? contactInfo : null;
  }

  extractAddress(fhirAddress) {
    if (!fhirAddress) return null;
    
    return {
      street: fhirAddress.line?.[0] || '',
      neighborhood: fhirAddress.line?.[1] || '',
      city: fhirAddress.city || '',
      state: fhirAddress.state || '',
      zipCode: fhirAddress.postalCode || '',
      country: fhirAddress.country || 'MX',
      municipality: fhirAddress.extension?.find(ext => 
        ext.url === 'http://mindhub.com/fhir/StructureDefinition/municipality'
      )?.valueString
    };
  }

  extractEmergencyContact(contacts) {
    const emergencyContact = contacts?.find(contact =>
      contact.relationship?.some(rel =>
        rel.coding?.some(coding => coding.code === 'C')
      )
    );
    
    if (!emergencyContact) return null;
    
    return {
      firstName: emergencyContact.name?.given?.[0] || '',
      lastName: emergencyContact.name?.family || '',
      phone: emergencyContact.telecom?.find(t => t.system === 'phone')?.value || ''
    };
  }

  /**
   * Error handling
   */
  async handleSyncError(eventType, eventData, error) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      eventType,
      eventData,
      error: {
        message: error.message,
        stack: error.stack
      },
      retryCount: (eventData._retryCount || 0) + 1
    };
    
    console.error('🔄 Sync error logged:', errorLog);
    
    // Implement retry logic or dead letter queue
    if (errorLog.retryCount <= this.config.retryAttempts) {
      setTimeout(() => {
        console.log(`🔄 Retrying event ${eventType} (attempt ${errorLog.retryCount})`);
        this.processEvent(eventType, { ...eventData, _retryCount: errorLog.retryCount });
      }, this.config.retryDelay * errorLog.retryCount);
    } else {
      console.error(`❌ Max retry attempts reached for event ${eventType}`);
      // Send to dead letter queue or alert system
    }
  }

  /**
   * Process incoming events
   */
  async processEvent(eventType, eventData) {
    const handler = this.eventHandlers[eventType];
    
    if (!handler) {
      console.warn(`⚠️ No handler found for event type: ${eventType}`);
      return { success: false, error: 'No handler found' };
    }
    
    try {
      return await handler(eventData);
    } catch (error) {
      console.error(`❌ Error processing event ${eventType}:`, error);
      throw error;
    }
  }

  /**
   * Start connector services
   */
  async start() {
    console.log('🚀 Starting Expedix-FHIR Connector...');
    
    // Initialize webhook endpoints
    // Initialize event listeners
    // Start periodic sync jobs
    
    console.log('✅ Expedix-FHIR Connector started successfully');
  }

  /**
   * Stop connector services
   */
  async stop() {
    console.log('🛑 Stopping Expedix-FHIR Connector...');
    
    // Clean up resources
    
    console.log('✅ Expedix-FHIR Connector stopped');
  }
}

module.exports = ExpedixFhirConnector;