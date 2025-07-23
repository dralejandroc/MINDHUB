/**
 * Schedule Configuration System for Expedix Hub
 * 
 * Comprehensive schedule configuration for medical practice management
 * with customizable working hours, appointment types, and visual settings
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const middleware = require('../../shared/middleware');
const { getPrismaClient, executeQuery, executeTransaction } = require('../../shared/config/prisma');
const { logger } = require('../../shared/config/logging');
const AuditLogger = require('../../shared/utils/audit-logger');

const router = express.Router();
const auditLogger = new AuditLogger();

/**
 * Default schedule configuration with optimal appointment types and durations
 */
const DEFAULT_SCHEDULE_CONFIG = {
  duration: {
    consultation: "PT30M",        // 30 minutes
    fconsultation: "PT1H",        // 1 hour (first consultation)
    congress: "PT24H",            // 24 hours (congress/event)
    vacation: "PT24H",            // 24 hours (vacation)
    personal: "PT1H",             // 1 hour (personal time)
    presurgery: "PT2H",           // 2 hours (pre-surgery)
    surgery: "PT3H"               // 3 hours (surgery)
  },
  working: {
    l: { init: 1491397200000, end: 1491440400000 },    // Monday
    m: { init: 1491397200000, end: 1491440400000 },    // Tuesday  
    mi: { init: 1491397200000, end: 1491440400000 },   // Wednesday
    j: { init: 1491397200000, end: 1491440400000 },    // Thursday
    v: { init: 1491397200000, end: 1491440400000 }     // Friday
  },
  colors: {
    consultation: { background: "#58BCB2" },           // Teal
    fconsultation: { background: "#D1EBA4" },          // Light green
    congress: { background: "#A3ABD0" },               // Light blue
    vacation: { background: "#F2E7BF" },               // Light yellow
    personal: { background: "#DED2F1" },               // Light purple
    surgery: { background: "#CBE6F2" },                // Light blue
    r_program: { background: "#FEBE87" },              // Orange
    notConfirmed: { background: "#E768D2" }            // Pink
  },
  notifications: {
    app: true,
    whats: {
      number: "",
      prefix: "",
      active: true
    },
    mail: {
      active: true,
      value: ""
    }
  },
  shareInClinic: true,
  timeZone: "America/Mexico_City"
};

/**
 * Appointment type definitions with duration and visual settings
 */
const APPOINTMENT_TYPES = {
  consultation: {
    name: "Consulta",
    duration: "PT30M",
    color: "#58BCB2",
    icon: "🩺",
    allowsPatientBooking: true,
    requiresConfirmation: true
  },
  fconsultation: {
    name: "Primera Consulta",
    duration: "PT1H",
    color: "#D1EBA4",
    icon: "👋",
    allowsPatientBooking: true,
    requiresConfirmation: true
  },
  congress: {
    name: "Congreso/Evento",
    duration: "PT24H",
    color: "#A3ABD0",
    icon: "🏛️",
    allowsPatientBooking: false,
    requiresConfirmation: false
  },
  vacation: {
    name: "Vacaciones",
    duration: "PT24H",
    color: "#F2E7BF",
    icon: "🏖️",
    allowsPatientBooking: false,
    requiresConfirmation: false
  },
  personal: {
    name: "Tiempo Personal",
    duration: "PT1H",
    color: "#DED2F1",
    icon: "👤",
    allowsPatientBooking: false,
    requiresConfirmation: false
  },
  presurgery: {
    name: "Pre-cirugía",
    duration: "PT2H",
    color: "#FFE0B2",
    icon: "🏥",
    allowsPatientBooking: false,
    requiresConfirmation: true
  },
  surgery: {
    name: "Cirugía",
    duration: "PT3H",
    color: "#CBE6F2",
    icon: "⚕️",
    allowsPatientBooking: false,
    requiresConfirmation: true
  }
};

/**
 * GET /api/v1/expedix/schedule-config/default
 * Get default schedule configuration
 */
router.get('/default',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:schedule']),
  async (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          scheduleConfig: DEFAULT_SCHEDULE_CONFIG,
          appointmentTypes: APPOINTMENT_TYPES,
          defaultWorkingHours: {
            start: "08:00",
            end: "18:00",
            timezone: "America/Mexico_City",
            daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"]
          }
        },
        message: 'Default schedule configuration retrieved successfully'
      });

    } catch (error) {
      logger.error('Failed to get default schedule configuration', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve default configuration',
        message: 'An error occurred while retrieving default schedule configuration'
      });
    }
  }
);

/**
 * GET /api/v1/expedix/schedule-config/provider/:providerId
 * Get schedule configuration for a specific provider
 */
router.get('/provider/:providerId',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:schedule']),
  [
    param('providerId').isUUID().withMessage('Invalid provider ID format')
  ],
  async (req, res) => {
    try {
      const { providerId } = req.params;

      // Get provider's custom schedule configuration
      const providerConfig = await executeQuery(
        (prisma) => prisma.providerScheduleConfig.findUnique({
          where: { providerId: providerId },
          include: {
            workingHours: {
              orderBy: { dayOfWeek: 'asc' }
            },
            appointmentTypeConfigs: {
              include: {
                appointmentType: true
              }
            }
          }
        }),
        `getProviderScheduleConfig(${providerId})`
      );

      // If no custom config exists, return default with provider ID
      if (!providerConfig) {
        return res.json({
          success: true,
          data: {
            providerId: providerId,
            isDefault: true,
            scheduleConfig: DEFAULT_SCHEDULE_CONFIG,
            appointmentTypes: APPOINTMENT_TYPES,
            workingHours: null,
            customizations: null
          },
          message: 'Provider uses default schedule configuration'
        });
      }

      // Process working hours
      const workingHours = providerConfig.workingHours.reduce((acc, wh) => {
        acc[wh.dayOfWeek] = {
          start: wh.startTime,
          end: wh.endTime,
          isActive: wh.isActive,
          breaks: wh.breaks || []
        };
        return acc;
      }, {});

      // Process appointment type configurations
      const appointmentTypes = providerConfig.appointmentTypeConfigs.reduce((acc, atc) => {
        acc[atc.appointmentType.code] = {
          ...atc.appointmentType,
          duration: atc.customDuration || atc.appointmentType.defaultDuration,
          color: atc.customColor || atc.appointmentType.defaultColor,
          isEnabled: atc.isEnabled,
          allowsPatientBooking: atc.allowsPatientBooking,
          requiresConfirmation: atc.requiresConfirmation
        };
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          providerId: providerId,
          isDefault: false,
          configId: providerConfig.id,
          scheduleConfig: {
            ...DEFAULT_SCHEDULE_CONFIG,
            ...providerConfig.configuration
          },
          workingHours: workingHours,
          appointmentTypes: appointmentTypes,
          notifications: providerConfig.notificationSettings,
          lastUpdated: providerConfig.updatedAt
        }
      });

    } catch (error) {
      logger.error('Failed to get provider schedule configuration', {
        error: error.message,
        providerId: req.params.providerId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve provider configuration',
        message: 'An error occurred while retrieving provider schedule configuration'
      });
    }
  }
);

/**
 * POST /api/v1/expedix/schedule-config/provider/:providerId
 * Create or update schedule configuration for a provider
 */
router.post('/provider/:providerId',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'admin'], ['write:schedule']),
  [
    param('providerId').isUUID().withMessage('Invalid provider ID format'),
    body('workingHours').isObject().withMessage('Working hours must be an object'),
    body('appointmentTypes').optional().isObject(),
    body('notifications').optional().isObject(),
    body('generalSettings').optional().isObject()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { providerId } = req.params;
      const {
        workingHours,
        appointmentTypes,
        notifications,
        generalSettings
      } = req.body;

      const userId = req.user?.id;

      // Verify provider exists
      const provider = await executeQuery(
        (prisma) => prisma.user.findUnique({
          where: { id: providerId },
          select: {
            id: true,
            name: true,
            specialization: true
          }
        }),
        `verifyProvider(${providerId})`
      );

      if (!provider) {
        return res.status(404).json({
          success: false,
          error: 'Provider not found'
        });
      }

      // Create or update provider schedule configuration
      const scheduleConfig = await executeTransaction([
        // Upsert main configuration
        (prisma) => prisma.providerScheduleConfig.upsert({
          where: { providerId: providerId },
          update: {
            configuration: {
              ...DEFAULT_SCHEDULE_CONFIG,
              ...generalSettings
            },
            notificationSettings: notifications || DEFAULT_SCHEDULE_CONFIG.notifications,
            timeZone: generalSettings?.timeZone || DEFAULT_SCHEDULE_CONFIG.timeZone,
            updatedBy: userId,
            updatedAt: new Date()
          },
          create: {
            id: uuidv4(),
            providerId: providerId,
            configuration: {
              ...DEFAULT_SCHEDULE_CONFIG,
              ...generalSettings
            },
            notificationSettings: notifications || DEFAULT_SCHEDULE_CONFIG.notifications,
            timeZone: generalSettings?.timeZone || DEFAULT_SCHEDULE_CONFIG.timeZone,
            createdBy: userId,
            updatedBy: userId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }),
        // Update working hours
        (prisma, results) => {
          const configId = results[0].id;
          
          return Promise.all(
            Object.entries(workingHours).map(([dayOfWeek, hours]) =>
              prisma.providerWorkingHours.upsert({
                where: {
                  configId_dayOfWeek: {
                    configId: configId,
                    dayOfWeek: dayOfWeek
                  }
                },
                update: {
                  startTime: hours.start,
                  endTime: hours.end,
                  isActive: hours.isActive !== false,
                  breaks: hours.breaks || [],
                  updatedAt: new Date()
                },
                create: {
                  id: uuidv4(),
                  configId: configId,
                  dayOfWeek: dayOfWeek,
                  startTime: hours.start,
                  endTime: hours.end,
                  isActive: hours.isActive !== false,
                  breaks: hours.breaks || [],
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              })
            )
          );
        }
      ], 'upsertProviderScheduleConfig');

      // Log configuration update
      logger.info('Provider schedule configuration updated', {
        providerId: providerId,
        providerName: provider.name,
        configId: scheduleConfig[0].id,
        updatedBy: userId,
        workingDays: Object.keys(workingHours).length,
        hasCustomAppointmentTypes: !!appointmentTypes,
        hasCustomNotifications: !!notifications
      });

      // Audit log
      await auditLogger.logDataModification(
        userId,
        'SCHEDULE_CONFIG_UPDATE',
        {
          providerId: providerId,
          providerName: provider.name,
          configurationChanges: {
            workingHours: Object.keys(workingHours),
            appointmentTypes: appointmentTypes ? Object.keys(appointmentTypes) : null,
            notifications: !!notifications,
            generalSettings: !!generalSettings
          }
        }
      );

      res.status(201).json({
        success: true,
        message: 'Schedule configuration updated successfully',
        data: {
          config: scheduleConfig[0],
          workingHours: scheduleConfig[1],
          provider: provider
        }
      });

    } catch (error) {
      logger.error('Failed to update provider schedule configuration', {
        error: error.message,
        stack: error.stack,
        providerId: req.params.providerId,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to update schedule configuration',
        message: 'An error occurred while updating the schedule configuration'
      });
    }
  }
);

/**
 * GET /api/v1/expedix/schedule-config/provider/:providerId/availability
 * Get provider availability for a specific date range
 */
router.get('/provider/:providerId/availability',
  ...middleware.utils.forRoles(['psychiatrist', 'psychologist', 'nurse', 'admin'], ['read:schedule']),
  [
    param('providerId').isUUID().withMessage('Invalid provider ID format'),
    query('startDate').isISO8601().withMessage('Invalid start date format'),
    query('endDate').isISO8601().withMessage('Invalid end date format'),
    query('appointmentType').optional().isString()
  ],
  async (req, res) => {
    try {
      const { providerId } = req.params;
      const { startDate, endDate, appointmentType = 'consultation' } = req.query;

      // Get provider's schedule configuration
      const providerConfig = await executeQuery(
        (prisma) => prisma.providerScheduleConfig.findUnique({
          where: { providerId: providerId },
          include: {
            workingHours: true
          }
        }),
        `getProviderConfigForAvailability(${providerId})`
      );

      // Get appointment duration for the specified type
      const appointmentDuration = appointmentType && APPOINTMENT_TYPES[appointmentType] 
        ? APPOINTMENT_TYPES[appointmentType].duration 
        : DEFAULT_SCHEDULE_CONFIG.duration.consultation;

      // Calculate availability slots
      const availabilitySlots = await calculateAvailabilitySlots(
        providerId,
        new Date(startDate),
        new Date(endDate),
        appointmentDuration,
        providerConfig
      );

      res.json({
        success: true,
        data: {
          providerId: providerId,
          dateRange: {
            start: startDate,
            end: endDate
          },
          appointmentType: appointmentType,
          appointmentDuration: appointmentDuration,
          availabilitySlots: availabilitySlots,
          totalSlots: availabilitySlots.length
        }
      });

    } catch (error) {
      logger.error('Failed to get provider availability', {
        error: error.message,
        providerId: req.params.providerId,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      });

      res.status(500).json({
        success: false,
        error: 'Failed to calculate availability',
        message: 'An error occurred while calculating provider availability'
      });
    }
  }
);

/**
 * Helper functions
 */

async function calculateAvailabilitySlots(providerId, startDate, endDate, appointmentDuration, providerConfig) {
  const slots = [];
  const current = new Date(startDate);
  
  // Parse duration (e.g., "PT30M" = 30 minutes)
  const durationMinutes = parseDuration(appointmentDuration);
  
  while (current <= endDate) {
    const dayOfWeek = getDayOfWeekKey(current);
    
    // Get working hours for this day
    const workingHours = providerConfig?.workingHours?.find(wh => wh.dayOfWeek === dayOfWeek);
    
    if (workingHours && workingHours.isActive) {
      // Generate slots for this day
      const daySlots = await generateDaySlots(
        providerId,
        current,
        workingHours.startTime,
        workingHours.endTime,
        durationMinutes,
        workingHours.breaks || []
      );
      
      slots.push(...daySlots);
    }
    
    // Move to next day
    current.setDate(current.getDate() + 1);
  }
  
  return slots;
}

async function generateDaySlots(providerId, date, startTime, endTime, durationMinutes, breaks) {
  const slots = [];
  const dayStart = new Date(date);
  const [startHour, startMinute] = startTime.split(':').map(Number);
  dayStart.setHours(startHour, startMinute, 0, 0);
  
  const dayEnd = new Date(date);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  dayEnd.setHours(endHour, endMinute, 0, 0);
  
  const current = new Date(dayStart);
  
  while (current < dayEnd) {
    const slotEnd = new Date(current.getTime() + (durationMinutes * 60000));
    
    if (slotEnd <= dayEnd) {
      // Check if this slot conflicts with existing appointments
      const hasConflict = await checkSlotConflict(providerId, current, slotEnd);
      
      // Check if slot is during a break
      const isInBreak = breaks.some(breakPeriod => {
        const breakStart = new Date(date);
        const [bStartHour, bStartMinute] = breakPeriod.start.split(':').map(Number);
        breakStart.setHours(bStartHour, bStartMinute, 0, 0);
        
        const breakEnd = new Date(date);
        const [bEndHour, bEndMinute] = breakPeriod.end.split(':').map(Number);
        breakEnd.setHours(bEndHour, bEndMinute, 0, 0);
        
        return current >= breakStart && current < breakEnd;
      });
      
      if (!hasConflict && !isInBreak) {
        slots.push({
          start: current.toISOString(),
          end: slotEnd.toISOString(),
          available: true,
          duration: durationMinutes
        });
      }
    }
    
    // Move to next slot (15-minute intervals)
    current.setMinutes(current.getMinutes() + 15);
  }
  
  return slots;
}

async function checkSlotConflict(providerId, slotStart, slotEnd) {
  const prisma = getPrismaClient();
  
  const conflictingAppointment = await prisma.appointment.findFirst({
    where: {
      providerId: providerId,
      status: {
        in: ['scheduled', 'confirmed']
      },
      OR: [
        {
          AND: [
            { appointmentDate: { lte: slotStart } },
            { appointmentEndTime: { gt: slotStart } }
          ]
        },
        {
          AND: [
            { appointmentDate: { lt: slotEnd } },
            { appointmentEndTime: { gte: slotEnd } }
          ]
        },
        {
          AND: [
            { appointmentDate: { gte: slotStart } },
            { appointmentDate: { lt: slotEnd } }
          ]
        }
      ]
    }
  });
  
  return !!conflictingAppointment;
}

function parseDuration(duration) {
  // Parse ISO 8601 duration (e.g., "PT30M" = 30 minutes)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 30; // Default to 30 minutes
  
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  
  return (hours * 60) + minutes;
}

function getDayOfWeekKey(date) {
  const days = ['domingo', 'l', 'm', 'mi', 'j', 'v', 's'];
  return days[date.getDay()];
}

module.exports = router;