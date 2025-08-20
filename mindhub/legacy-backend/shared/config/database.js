const { Pool } = require('pg');
const winston = require('winston');
const { getPrismaClient, testConnection, getDatabaseHealth } = require('./prisma');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});

// Database connection configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
};

// Create connection pool
const pool = new Pool(dbConfig);

// Pool event handlers
pool.on('connect', (client) => {
  logger.info('Database client connected', { 
    totalCount: pool.totalCount,
    idleCount: pool.idleCount 
  });
});

pool.on('error', (err, client) => {
  logger.error('Database pool error', { 
    error: err.message,
    stack: err.stack 
  });
});

pool.on('remove', (client) => {
  logger.info('Database client removed', { 
    totalCount: pool.totalCount,
    idleCount: pool.idleCount 
  });
});

/**
 * Execute a database query
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
const query = async (text, params) => {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.info('Database query executed', {
      duration,
      rows: result.rowCount,
      command: result.command
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    logger.error('Database query failed', {
      duration,
      error: error.message,
      query: text,
      params: params ? params.length : 0
    });
    
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<Object>} Database client
 */
const getClient = async () => {
  const client = await pool.connect();
  
  // Add query method to client
  const originalQuery = client.query;
  client.query = async (text, params) => {
    const start = Date.now();
    
    try {
      const result = await originalQuery.call(client, text, params);
      const duration = Date.now() - start;
      
      logger.info('Transaction query executed', {
        duration,
        rows: result.rowCount,
        command: result.command
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      logger.error('Transaction query failed', {
        duration,
        error: error.message,
        query: text,
        params: params ? params.length : 0
      });
      
      throw error;
    }
  };
  
  return client;
};

/**
 * Health check for database connection
 * @returns {Promise<boolean>} Connection status
 */
const healthCheck = async () => {
  try {
    // Use Prisma health check first
    const prismaHealthy = await testConnection();
    if (prismaHealthy) {
      return true;
    }
    
    // Fallback to raw pool query
    const result = await query('SELECT 1 as health_check');
    return result.rows[0].health_check === 1;
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    return false;
  }
};

/**
 * Get comprehensive database health information
 * @returns {Promise<Object>} Database health details
 */
const getDetailedHealth = async () => {
  return await getDatabaseHealth();
};

/**
 * Get Prisma client instance
 * @returns {PrismaClient} Prisma client
 */
const getPrisma = () => {
  return getPrismaClient();
};

/**
 * Close all database connections
 */
const closePool = async () => {
  try {
    await pool.end();
    logger.info('Database pool closed');
  } catch (error) {
    logger.error('Error closing database pool', { error: error.message });
  }
};

module.exports = {
  query,
  getClient,
  healthCheck,
  getDetailedHealth,
  getPrisma,
  closePool,
  pool
};