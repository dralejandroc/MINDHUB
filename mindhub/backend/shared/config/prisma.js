/**
 * Prisma Database Client Configuration
 * 
 * Provides a singleton Prisma client instance with proper connection management
 * for the MindHub healthcare platform.
 */

// Try to import PrismaClient with better error handling
let PrismaClient;
try {
  ({ PrismaClient } = require('../../generated/prisma'));
  console.log('✅ Prisma client imported successfully');
} catch (error) {
  console.error('❌ Failed to import Prisma client:', error.message);
  console.error('Trying alternative import paths...');
  try {
    ({ PrismaClient } = require('@prisma/client'));
    console.log('✅ Prisma client imported from @prisma/client');
  } catch (altError) {
    console.error('❌ Alternative import failed:', altError.message);
    throw new Error(`Failed to import PrismaClient: ${error.message}`);
  }
}

const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'error', // Changed to error level
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/database.log',
      maxsize: 5242880, // 5MB
      maxFiles: 2
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Prisma Client Configuration
const prismaConfig = {
  log: [
    // {
    //   emit: 'event',
    //   level: 'query',
    // },
    {
      emit: 'event',
      level: 'error',
    },
    // {
    //   emit: 'event',
    //   level: 'info',
    // },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
  errorFormat: 'pretty',
};

// Singleton Prisma Client
let prisma;

/**
 * Get or create Prisma client instance
 * @returns {PrismaClient} Prisma client instance
 */
function getPrismaClient() {
  if (!prisma) {
    if (!PrismaClient) {
      throw new Error('PrismaClient is not available. Make sure prisma generate has been run.');
    }
    
    try {
      prisma = new PrismaClient(prismaConfig);
      console.log('✅ Prisma client instance created successfully');
    } catch (error) {
      console.error('❌ Failed to create Prisma client:', error.message);
      throw error;
    }

    // Setup event listeners for logging
    // prisma.$on('query', (e) => {
    //   logger.debug('Database Query', {
    //     query: e.query,
    //     params: e.params,
    //     duration: e.duration,
    //     target: e.target
    //   });
    // });

    prisma.$on('error', (e) => {
      logger.error('Database Error', {
        message: e.message,
        target: e.target
      });
    });

    // prisma.$on('info', (e) => {
    //   logger.info('Database Info', {
    //     message: e.message,
    //     target: e.target
    //   });
    // });

    prisma.$on('warn', (e) => {
      logger.warn('Database Warning', {
        message: e.message,
        target: e.target
      });
    });

    // Handle process termination gracefully
    let disconnectHandled = false;
    
    const gracefulDisconnect = async (signal) => {
      if (disconnectHandled) return;
      disconnectHandled = true;
      
      try {
        await prisma.$disconnect();
        logger.info(`Database connection closed (${signal})`);
      } catch (error) {
        logger.error('Error disconnecting from database', { error: error.message });
      }
    };

    process.on('SIGINT', async () => {
      await gracefulDisconnect('SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await gracefulDisconnect('SIGTERM');
      process.exit(0);
    });

    logger.info('Prisma client initialized');
  }

  return prisma;
}

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
async function testConnection() {
  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
    logger.info('Database connection test successful');
    return true;
  } catch (error) {
    logger.error('Database connection test failed', { error: error.message });
    return false;
  }
}

/**
 * Get database health information
 * @returns {Promise<Object>} Database health status
 */
async function getDatabaseHealth() {
  try {
    const client = getPrismaClient();
    const startTime = Date.now();
    
    // Test basic connectivity
    await client.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    // Get database version
    const versionResult = await client.$queryRaw`SELECT version()`;
    const version = versionResult[0]?.version || 'Unknown';

    // Get connection count (MySQL version)
    const connectionResult = await client.$queryRaw`
      SELECT count(*) as active_connections 
      FROM information_schema.PROCESSLIST 
      WHERE COMMAND != 'Sleep'
    `;
    const activeConnections = parseInt(connectionResult[0]?.active_connections || 0);

    return {
      status: 'healthy',
      responseTime,
      version,
      activeConnections,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Execute database queries with error handling and logging
 * @param {Function} queryFunction - Function that returns a Prisma query
 * @param {string} operationName - Name of the operation for logging
 * @returns {Promise<any>} Query result
 */
async function executeQuery(queryFunction, operationName = 'Unknown Operation') {
  const startTime = Date.now();
  
  try {
    logger.debug(`Starting ${operationName}`);
    const result = await queryFunction(getPrismaClient());
    const duration = Date.now() - startTime;
    
    logger.debug(`Completed ${operationName}`, { duration });
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Failed ${operationName}`, { 
      error: error.message, 
      duration,
      stack: error.stack 
    });
    throw error;
  }
}

/**
 * Execute multiple queries in a transaction
 * @param {Function[]} queries - Array of query functions
 * @param {string} transactionName - Name of the transaction for logging
 * @returns {Promise<any[]>} Array of query results
 */
async function executeTransaction(queries, transactionName = 'Unknown Transaction') {
  const startTime = Date.now();
  
  try {
    logger.debug(`Starting transaction: ${transactionName}`);
    const client = getPrismaClient();
    
    const results = await client.$transaction(
      queries.map(queryFn => queryFn(client))
    );
    
    const duration = Date.now() - startTime;
    logger.debug(`Completed transaction: ${transactionName}`, { duration });
    
    return results;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Failed transaction: ${transactionName}`, { 
      error: error.message, 
      duration,
      stack: error.stack 
    });
    throw error;
  }
}

/**
 * Schema-specific database utilities
 */
const schemas = {
  auth: {
    /**
     * Get user by Auth0 ID
     * @param {string} auth0Id - Auth0 user ID
     * @returns {Promise<Object|null>} User object or null
     */
    getUserByAuth0Id: async (auth0Id) => {
      return executeQuery(
        (prisma) => prisma.users.findUnique({
          where: { auth0Id },
          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true
                      }
                    }
                  }
                }
              }
            }
          }
        }),
        `getUserByAuth0Id(${auth0Id})`
      );
    },

    /**
     * Create or update user from Auth0 profile
     * @param {Object} profile - Auth0 user profile
     * @returns {Promise<Object>} User object
     */
    upsertUserFromAuth0: async (profile) => {
      return executeQuery(
        (prisma) => prisma.users.upsert({
          where: { auth0Id: profile.sub },
          update: {
            email: profile.email,
            name: profile.name || profile.nickname,
            picture: profile.picture,
            lastLoginAt: new Date()
          },
          create: {
            auth0Id: profile.sub,
            email: profile.email,
            name: profile.name || profile.nickname,
            picture: profile.picture,
            lastLoginAt: new Date()
          }
        }),
        `upsertUserFromAuth0(${profile.sub})`
      );
    }
  },

  expedix: {
    /**
     * Get patient with medical history
     * @param {string} patientId - Patient ID
     * @returns {Promise<Object|null>} Patient with medical history
     */
    getPatientWithHistory: async (patientId) => {
      return executeQuery(
        (prisma) => prisma.patients.findUnique({
          where: { id: patientId },
          include: {
            medicalHistory: true,
            consultations: {
              orderBy: { consultationDate: 'desc' },
              take: 10
            },
            prescriptions: {
              where: { status: 'active' },
              include: {
                medication: true
              }
            }
          }
        }),
        `getPatientWithHistory(${patientId})`
      );
    }
  },

  clinimetrix: {
    /**
     * Get assessment scales by category
     * @param {string} category - Assessment category
     * @returns {Promise<Object[]>} Array of assessment scales
     */
    getScalesByCategory: async (category) => {
      return executeQuery(
        (prisma) => prisma.assessmentScale.findMany({
          where: { 
            category,
            isActive: true
          },
          include: {
            scaleItems: {
              orderBy: { displayOrder: 'asc' }
            }
          }
        }),
        `getScalesByCategory(${category})`
      );
    }
  },

  formx: {
    /**
     * Get form template with field types
     * @param {string} slug - Form template slug
     * @returns {Promise<Object|null>} Form template
     */
    getFormTemplate: async (slug) => {
      return executeQuery(
        (prisma) => prisma.formTemplate.findUnique({
          where: { slug },
          include: {
            formInstances: {
              where: { status: 'active' }
            }
          }
        }),
        `getFormTemplate(${slug})`
      );
    }
  },

  resources: {
    /**
     * Get resources by category with pagination
     * @param {string} categorySlug - Category slug
     * @param {number} page - Page number (1-based)
     * @param {number} limit - Items per page
     * @returns {Promise<Object>} Paginated resources
     */
    getResourcesByCategory: async (categorySlug, page = 1, limit = 20) => {
      const skip = (page - 1) * limit;
      
      return executeTransaction([
        (prisma) => prisma.resource.findMany({
          where: {
            resourceCategories: {
              some: {
                category: {
                  slug: categorySlug
                }
              }
            },
            status: 'published'
          },
          include: {
            resourceCategories: {
              include: {
                category: true
              }
            },
            resourceTags: {
              include: {
                tag: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        (prisma) => prisma.resource.count({
          where: {
            resourceCategories: {
              some: {
                category: {
                  slug: categorySlug
                }
              }
            },
            status: 'published'
          }
        })
      ], `getResourcesByCategory(${categorySlug}, ${page}, ${limit})`);
    }
  }
};

module.exports = {
  getPrismaClient,
  testConnection,
  getDatabaseHealth,
  executeQuery,
  executeTransaction,
  schemas,
  logger
};