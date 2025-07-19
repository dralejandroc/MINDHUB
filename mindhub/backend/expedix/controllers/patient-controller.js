/**
 * Patient Controller for Expedix Hub
 * 
 * Business logic for patient data management with healthcare compliance
 * and privacy protection implementing NOM-024-SSA3-2010 requirements
 */

const { logger } = require('../../shared/config/storage');
const AuditLogger = require('../../shared/utils/audit-logger');
const { getPrismaClient, executeQuery, executeTransaction } = require('../../shared/config/prisma');

class PatientController {
  constructor() {
    this.auditLogger = new AuditLogger();
    this.prisma = getPrismaClient();
  }

  /**
   * Search patients with privacy-compliant filtering
   */
  async searchPatients(criteria, userContext) {
    try {
      const { 
        search, 
        category, 
        isActive = true,
        includeInactive = false,
        dateFrom,
        dateTo,
        gender,
        ageMin,
        ageMax,
        page = 1,
        limit = 20
      } = criteria;

      const skip = (page - 1) * limit;
      
      // Build where clause with role-based restrictions
      const where = this.buildSearchCriteria(criteria, userContext);

      // Execute search with appropriate data projection
      const [patients, totalCount] = await executeTransaction([
        (prisma) => prisma.patient.findMany({
          where,
          select: this.getPatientProjection(userContext.role),
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        (prisma) => prisma.patient.count({ where })
      ], 'searchPatients');

      // Log search for compliance
      await this.auditLogger.logDataAccess(
        userContext.userId,
        'PATIENT_SEARCH',
        {
          criteria: { search: !!search, category, gender },
          resultCount: patients.length,
          userRole: userContext.role
        }
      );

      return {
        success: true,
        data: patients,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      };

    } catch (error) {
      logger.error('Patient search failed', {
        error: error.message,
        userId: userContext.userId
      });
      throw error;
    }
  }

  /**
   * Get patient details with access control
   */
  async getPatientDetails(patientId, userContext, options = {}) {
    try {
      const { 
        includeHistory = false,
        includeConsultations = false,
        includePrescriptions = false,
        includeAssessments = false
      } = options;

      // Check patient access permissions
      const hasAccess = await this.checkPatientAccess(patientId, userContext);
      if (!hasAccess) {
        throw new Error('Access denied to patient data');
      }

      // Build include clause based on permissions and options
      const include = this.buildIncludeClause(userContext.role, options);

      const patient = await executeQuery(
        (prisma) => prisma.patient.findUnique({
          where: { id: patientId },
          include
        }),
        `getPatientDetails(${patientId})`
      );

      if (!patient) {
        throw new Error('Patient not found');
      }

      // Apply data masking based on role
      const maskedPatient = this.applyDataMasking(patient, userContext.role);

      // Log access for compliance
      await this.auditLogger.logDataAccess(
        userContext.userId,
        'PATIENT_VIEW',
        {
          patientId,
          dataCategories: Object.keys(include),
          userRole: userContext.role
        }
      );

      return {
        success: true,
        data: maskedPatient
      };

    } catch (error) {
      logger.error('Failed to get patient details', {
        error: error.message,
        patientId,
        userId: userContext.userId
      });
      throw error;
    }
  }

  /**
   * Create new patient record with validation
   */
  async createPatient(patientData, userContext) {
    try {
      // Validate required fields
      this.validatePatientData(patientData);

      // Check for duplicates
      const duplicate = await this.checkDuplicatePatient(patientData);
      if (duplicate) {
        throw new Error('Patient with similar details already exists');
      }

      // Generate unique identifiers
      const medicalRecordNumber = await this.generateMedicalRecordNumber();
      const patientCode = this.generatePatientCode(patientData);

      // Create patient with audit trail
      const patient = await executeTransaction([
        async (prisma) => {
          const newPatient = await prisma.patient.create({
            data: {
              ...patientData,
              medicalRecordNumber,
              patientCode,
              createdBy: userContext.userId,
              isActive: true,
              consentStatus: {
                treatment: patientData.consentToTreatment || false,
                dataProcessing: patientData.consentToDataProcessing || false,
                consentDate: new Date()
              }
            },
            include: {
              creator: {
                select: { id: true, name: true, email: true }
              }
            }
          });

          // Create initial medical history entry
          await prisma.medicalHistory.create({
            data: {
              patientId: newPatient.id,
              entryType: 'initial_registration',
              entryDate: new Date(),
              notes: 'Patient registered in system',
              createdBy: userContext.userId
            }
          });

          return newPatient;
        }
      ], 'createPatient');

      // Log creation for compliance
      await this.auditLogger.logDataModification(
        userContext.userId,
        'PATIENT_CREATE',
        {
          patientId: patient.id,
          medicalRecordNumber: patient.medicalRecordNumber,
          action: 'create'
        }
      );

      return {
        success: true,
        data: patient,
        message: 'Patient created successfully'
      };

    } catch (error) {
      logger.error('Failed to create patient', {
        error: error.message,
        userId: userContext.userId
      });
      throw error;
    }
  }

  /**
   * Update patient data with change tracking
   */
  async updatePatient(patientId, updateData, userContext) {
    try {
      // Check update permissions
      const hasAccess = await this.checkPatientAccess(patientId, userContext, 'write');
      if (!hasAccess) {
        throw new Error('Access denied to update patient data');
      }

      // Get current patient data for comparison
      const currentPatient = await executeQuery(
        (prisma) => prisma.patient.findUnique({
          where: { id: patientId }
        }),
        `getCurrentPatient(${patientId})`
      );

      if (!currentPatient) {
        throw new Error('Patient not found');
      }

      // Track changes for audit
      const changes = this.trackChanges(currentPatient, updateData);

      // Update patient with audit trail
      const updatedPatient = await executeTransaction([
        async (prisma) => {
          // Update patient
          const patient = await prisma.patient.update({
            where: { id: patientId },
            data: {
              ...updateData,
              updatedAt: new Date()
            },
            include: {
              creator: {
                select: { id: true, name: true, email: true }
              }
            }
          });

          // Create audit log entry
          await prisma.auditLog.create({
            data: {
              entityType: 'patient',
              entityId: patientId,
              action: 'update',
              changes: JSON.stringify(changes),
              userId: userContext.userId,
              timestamp: new Date()
            }
          });

          return patient;
        }
      ], 'updatePatient');

      // Log update for compliance
      await this.auditLogger.logDataModification(
        userContext.userId,
        'PATIENT_UPDATE',
        {
          patientId,
          medicalRecordNumber: currentPatient.medicalRecordNumber,
          changes: Object.keys(changes),
          action: 'update'
        }
      );

      return {
        success: true,
        data: updatedPatient,
        message: 'Patient updated successfully'
      };

    } catch (error) {
      logger.error('Failed to update patient', {
        error: error.message,
        patientId,
        userId: userContext.userId
      });
      throw error;
    }
  }

  /**
   * Archive (soft delete) patient with reason tracking
   */
  async archivePatient(patientId, reason, userContext) {
    try {
      // Check archive permissions
      if (!['psychiatrist', 'admin'].includes(userContext.role)) {
        throw new Error('Insufficient permissions to archive patient');
      }

      const patient = await executeQuery(
        (prisma) => prisma.patient.findUnique({
          where: { id: patientId },
          select: { id: true, medicalRecordNumber: true, isActive: true }
        }),
        `checkPatient(${patientId})`
      );

      if (!patient) {
        throw new Error('Patient not found');
      }

      if (!patient.isActive) {
        throw new Error('Patient is already archived');
      }

      // Archive patient with audit trail
      await executeTransaction([
        async (prisma) => {
          // Update patient status
          await prisma.patient.update({
            where: { id: patientId },
            data: { 
              isActive: false,
              archivedAt: new Date(),
              archivedBy: userContext.userId,
              archiveReason: reason
            }
          });

          // Create archive record
          await prisma.patientArchive.create({
            data: {
              patientId,
              archivedBy: userContext.userId,
              reason,
              archiveDate: new Date()
            }
          });
        }
      ], 'archivePatient');

      // Log archive for compliance
      await this.auditLogger.logDataModification(
        userContext.userId,
        'PATIENT_ARCHIVE',
        {
          patientId,
          medicalRecordNumber: patient.medicalRecordNumber,
          reason,
          action: 'archive'
        }
      );

      return {
        success: true,
        message: 'Patient archived successfully'
      };

    } catch (error) {
      logger.error('Failed to archive patient', {
        error: error.message,
        patientId,
        userId: userContext.userId
      });
      throw error;
    }
  }

  /**
   * Build search criteria based on user role and filters
   */
  buildSearchCriteria(criteria, userContext) {
    const { 
      search, 
      category, 
      isActive = true,
      includeInactive = false,
      gender,
      dateFrom,
      dateTo
    } = criteria;

    const where = {
      ...(includeInactive ? {} : { isActive })
    };

    // Add category filter
    if (category) {
      where.patientCategory = category;
    }

    // Add gender filter
    if (gender) {
      where.gender = gender;
    }

    // Add date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // Add search functionality
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { medicalRecordNumber: { contains: search, mode: 'insensitive' } }
      ];

      // Only allow email/phone search for authorized roles
      if (['psychiatrist', 'admin'].includes(userContext.role)) {
        where.OR.push(
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        );
      }
    }

    // Apply role-based restrictions
    if (userContext.role === 'patient') {
      where.id = userContext.patientId; // Patients can only see their own data
    }

    return where;
  }

  /**
   * Get patient data projection based on user role
   */
  getPatientProjection(role) {
    const baseProjection = {
      id: true,
      medicalRecordNumber: true,
      firstName: true,
      lastName: true,
      gender: true,
      patientCategory: true,
      isActive: true,
      createdAt: true
    };

    const roleProjections = {
      patient: {
        ...baseProjection,
        dateOfBirth: true,
        email: true,
        phone: true
      },
      nurse: {
        ...baseProjection,
        dateOfBirth: true,
        emergencyContactName: true,
        emergencyContactPhone: true
      },
      psychologist: {
        ...baseProjection,
        dateOfBirth: true,
        email: true,
        phone: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        bloodType: true
      },
      psychiatrist: {
        ...baseProjection,
        dateOfBirth: true,
        email: true,
        phone: true,
        address: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        emergencyContactRelation: true,
        bloodType: true,
        allergies: true,
        curp: true,
        insuranceNumber: true,
        insuranceProvider: true
      },
      admin: {
        ...baseProjection,
        dateOfBirth: true,
        email: true,
        phone: true,
        address: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        emergencyContactRelation: true,
        bloodType: true,
        allergies: true,
        curp: true,
        insuranceNumber: true,
        insuranceProvider: true,
        createdBy: true,
        updatedAt: true
      }
    };

    return roleProjections[role] || baseProjection;
  }

  /**
   * Build include clause for patient details based on role and options
   */
  buildIncludeClause(role, options) {
    const include = {
      creator: {
        select: { id: true, name: true, email: true }
      }
    };

    // Add medical history if requested and authorized
    if (options.includeHistory && ['psychiatrist', 'psychologist', 'admin'].includes(role)) {
      include.medicalHistory = {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          creator: {
            select: { id: true, name: true }
          }
        }
      };
    }

    // Add consultations if requested and authorized
    if (options.includeConsultations && ['psychiatrist', 'psychologist', 'nurse', 'admin'].includes(role)) {
      include.consultations = {
        orderBy: { consultationDate: 'desc' },
        take: 10,
        include: {
          creator: {
            select: { id: true, name: true }
          }
        }
      };
    }

    // Add prescriptions if requested and authorized
    if (options.includePrescriptions && ['psychiatrist', 'nurse', 'admin'].includes(role)) {
      include.prescriptions = {
        where: { status: 'active' },
        include: {
          medication: {
            select: { 
              genericName: true, 
              brandNames: true,
              therapeuticClass: true 
            }
          },
          prescriber: {
            select: { id: true, name: true }
          }
        }
      };
    }

    // Add assessments if requested and authorized
    if (options.includeAssessments && ['psychiatrist', 'psychologist', 'admin'].includes(role)) {
      include.scaleAdministrations = {
        orderBy: { administrationDate: 'desc' },
        take: 10,
        include: {
          scale: {
            select: { 
              name: true, 
              abbreviation: true, 
              category: true 
            }
          }
        }
      };
    }

    return include;
  }

  /**
   * Apply data masking based on user role
   */
  applyDataMasking(patient, role) {
    const maskedPatient = { ...patient };

    // Mask sensitive fields for lower privilege roles
    if (role === 'nurse') {
      delete maskedPatient.curp;
      delete maskedPatient.insuranceNumber;
      delete maskedPatient.address;
    }

    if (role === 'patient') {
      // Patients see their own data but not creator info
      delete maskedPatient.creator;
      delete maskedPatient.createdBy;
    }

    return maskedPatient;
  }

  /**
   * Check patient access permissions
   */
  async checkPatientAccess(patientId, userContext, accessType = 'read') {
    // Admin has access to all patients
    if (userContext.role === 'admin') {
      return true;
    }

    // Patients can only access their own data
    if (userContext.role === 'patient') {
      return userContext.patientId === patientId;
    }

    // Healthcare professionals have access based on care relationship
    if (['psychiatrist', 'psychologist', 'nurse'].includes(userContext.role)) {
      // For read access, allow if they have any interaction with the patient
      if (accessType === 'read') {
        const hasInteraction = await executeQuery(
          (prisma) => prisma.consultation.findFirst({
            where: {
              patientId,
              createdBy: userContext.userId
            }
          }),
          `checkPatientInteraction(${patientId}, ${userContext.userId})`
        );
        
        return !!hasInteraction;
      }

      // For write access, check if they are primary care provider
      if (accessType === 'write') {
        const patient = await executeQuery(
          (prisma) => prisma.patient.findUnique({
            where: { id: patientId },
            select: { primaryCareProviderId: true }
          }),
          `checkPrimaryCareProvider(${patientId})`
        );

        return patient?.primaryCareProviderId === userContext.userId;
      }
    }

    return false;
  }

  /**
   * Check for duplicate patients
   */
  async checkDuplicatePatient(patientData) {
    const { firstName, lastName, dateOfBirth, curp } = patientData;

    // Check by CURP if provided
    if (curp) {
      const existing = await executeQuery(
        (prisma) => prisma.patient.findFirst({
          where: { curp }
        }),
        'checkDuplicateByCURP'
      );
      
      if (existing) return existing;
    }

    // Check by name and date of birth
    const existing = await executeQuery(
      (prisma) => prisma.patient.findFirst({
        where: {
          firstName: { equals: firstName, mode: 'insensitive' },
          lastName: { equals: lastName, mode: 'insensitive' },
          dateOfBirth: new Date(dateOfBirth)
        }
      }),
      'checkDuplicateByNameAndDOB'
    );

    return existing;
  }

  /**
   * Track changes for audit purposes
   */
  trackChanges(original, updated) {
    const changes = {};
    
    Object.keys(updated).forEach(key => {
      if (original[key] !== updated[key]) {
        changes[key] = {
          from: original[key],
          to: updated[key]
        };
      }
    });

    return changes;
  }

  /**
   * Validate patient data
   */
  validatePatientData(data) {
    const required = ['firstName', 'lastName', 'dateOfBirth', 'gender'];
    const missing = required.filter(field => !data[field]);

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // Validate date of birth
    const dob = new Date(data.dateOfBirth);
    if (isNaN(dob.getTime()) || dob > new Date()) {
      throw new Error('Invalid date of birth');
    }

    // Validate gender
    if (!['male', 'female', 'other', 'prefer_not_to_say'].includes(data.gender)) {
      throw new Error('Invalid gender value');
    }

    // Validate CURP format if provided
    if (data.curp && !/^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/.test(data.curp)) {
      throw new Error('Invalid CURP format');
    }
  }

  /**
   * Generate unique medical record number
   */
  async generateMedicalRecordNumber() {
    const year = new Date().getFullYear();
    const prefix = 'EXP';
    
    // Get the count of patients created this year
    const count = await executeQuery(
      (prisma) => prisma.patient.count({
        where: {
          createdAt: {
            gte: new Date(year, 0, 1),
            lt: new Date(year + 1, 0, 1)
          }
        }
      }),
      'getPatientCountForYear'
    );
    
    const sequence = (count + 1).toString().padStart(4, '0');
    return `${prefix}-${year}-${sequence}`;
  }

  /**
   * Generate patient code for internal use
   */
  generatePatientCode(patientData) {
    const { firstName, lastName, dateOfBirth } = patientData;
    const dob = new Date(dateOfBirth);
    
    const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();
    const year = dob.getFullYear().toString().slice(-2);
    const month = (dob.getMonth() + 1).toString().padStart(2, '0');
    const day = dob.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${initials}${year}${month}${day}${random}`;
  }
}

module.exports = PatientController;