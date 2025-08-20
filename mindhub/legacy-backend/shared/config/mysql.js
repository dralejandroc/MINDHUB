const mysql = require('mysql2/promise');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});

// MySQL connection configuration for XAMPP
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'mindhub_mvp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection
pool.getConnection()
  .then(connection => {
    logger.info('MySQL connected successfully', {
      host: dbConfig.host,
      database: dbConfig.database
    });
    connection.release();
  })
  .catch(err => {
    logger.error('MySQL connection failed', {
      error: err.message,
      host: dbConfig.host,
      database: dbConfig.database
    });
  });

/**
 * Execute a database query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
const query = async (sql, params = []) => {
  const start = Date.now();
  
  try {
    const [rows, fields] = await pool.execute(sql, params);
    const duration = Date.now() - start;
    
    logger.info('MySQL query executed', {
      duration,
      affectedRows: rows.affectedRows || rows.length,
      sql: sql.substring(0, 100)
    });
    
    return { rows, fields };
  } catch (error) {
    const duration = Date.now() - start;
    
    logger.error('MySQL query failed', {
      duration,
      error: error.message,
      sql: sql.substring(0, 100),
      params: params.length
    });
    
    throw error;
  }
};

/**
 * Get a connection from the pool for transactions
 * @returns {Promise<Object>} Database connection
 */
const getConnection = async () => {
  return await pool.getConnection();
};

/**
 * Health check for database connection
 * @returns {Promise<boolean>} Connection status
 */
const healthCheck = async () => {
  try {
    const result = await query('SELECT 1 as health_check');
    return result.rows[0].health_check === 1;
  } catch (error) {
    logger.error('MySQL health check failed', { error: error.message });
    return false;
  }
};

/**
 * Initialize database schema
 */
const initializeSchema = async () => {
  try {
    // Create database if not exists
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await connection.end();
    
    logger.info('Database created/verified', { database: dbConfig.database });
    
    // Create tables
    await createTables();
    
  } catch (error) {
    logger.error('Schema initialization failed', { error: error.message });
    throw error;
  }
};

/**
 * Create all required tables
 */
const createTables = async () => {
  // Users table
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      role VARCHAR(50) DEFAULT 'professional',
      auth0_id VARCHAR(255) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_auth0_id (auth0_id)
    )
  `);

  // Patients table
  await query(`
    CREATE TABLE IF NOT EXISTS patients (
      id VARCHAR(36) PRIMARY KEY,
      professional_id VARCHAR(36) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      paternal_last_name VARCHAR(100) NOT NULL,
      maternal_last_name VARCHAR(100),
      birth_date DATE NOT NULL,
      gender ENUM('masculine', 'feminine', 'other') NOT NULL,
      email VARCHAR(255),
      cell_phone VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (professional_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_professional (professional_id),
      INDEX idx_name (paternal_last_name, first_name)
    )
  `);

  // Consultations table
  await query(`
    CREATE TABLE IF NOT EXISTS consultations (
      id VARCHAR(36) PRIMARY KEY,
      patient_id VARCHAR(36) NOT NULL,
      professional_id VARCHAR(36) NOT NULL,
      consultation_date DATETIME NOT NULL,
      chief_complaint TEXT,
      current_illness TEXT,
      diagnosis_code VARCHAR(10),
      diagnosis_text VARCHAR(500),
      treatment_plan TEXT,
      notes TEXT,
      status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (professional_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_patient_date (patient_id, consultation_date),
      INDEX idx_professional_date (professional_id, consultation_date)
    )
  `);

  // Vital signs table
  await query(`
    CREATE TABLE IF NOT EXISTS vital_signs (
      id VARCHAR(36) PRIMARY KEY,
      consultation_id VARCHAR(36) NOT NULL,
      blood_pressure_systolic INT,
      blood_pressure_diastolic INT,
      heart_rate INT,
      respiratory_rate INT,
      temperature DECIMAL(4,1),
      oxygen_saturation INT,
      weight DECIMAL(5,2),
      height DECIMAL(5,2),
      bmi DECIMAL(4,1),
      recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
      INDEX idx_consultation (consultation_id)
    )
  `);

  // Prescriptions table
  await query(`
    CREATE TABLE IF NOT EXISTS prescriptions (
      id VARCHAR(36) PRIMARY KEY,
      consultation_id VARCHAR(36) NOT NULL,
      medication_name VARCHAR(255) NOT NULL,
      presentation VARCHAR(100),
      concentration VARCHAR(100),
      substance VARCHAR(255),
      dosage_instructions TEXT NOT NULL,
      quantity VARCHAR(50),
      duration VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
      INDEX idx_consultation (consultation_id)
    )
  `);

  // PHQ-9 assessments table
  await query(`
    CREATE TABLE IF NOT EXISTS phq9_assessments (
      id VARCHAR(36) PRIMARY KEY,
      patient_id VARCHAR(36) NOT NULL,
      professional_id VARCHAR(36) NOT NULL,
      consultation_id VARCHAR(36),
      assessment_date DATETIME NOT NULL,
      
      -- PHQ-9 items (0-3 scale)
      item_1 TINYINT NOT NULL CHECK (item_1 >= 0 AND item_1 <= 3),
      item_2 TINYINT NOT NULL CHECK (item_2 >= 0 AND item_2 <= 3),
      item_3 TINYINT NOT NULL CHECK (item_3 >= 0 AND item_3 <= 3),
      item_4 TINYINT NOT NULL CHECK (item_4 >= 0 AND item_4 <= 3),
      item_5 TINYINT NOT NULL CHECK (item_5 >= 0 AND item_5 <= 3),
      item_6 TINYINT NOT NULL CHECK (item_6 >= 0 AND item_6 <= 3),
      item_7 TINYINT NOT NULL CHECK (item_7 >= 0 AND item_7 <= 3),
      item_8 TINYINT NOT NULL CHECK (item_8 >= 0 AND item_8 <= 3),
      item_9 TINYINT NOT NULL CHECK (item_9 >= 0 AND item_9 <= 3),
      
      -- Functional impact question
      functional_impact ENUM('not_difficult', 'somewhat_difficult', 'very_difficult', 'extremely_difficult'),
      
      -- Calculated scores
      total_score TINYINT NOT NULL,
      severity ENUM('minimal', 'mild', 'moderate', 'moderately_severe', 'severe') NOT NULL,
      suicide_risk BOOLEAN DEFAULT FALSE,
      
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (professional_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE SET NULL,
      INDEX idx_patient_date (patient_id, assessment_date),
      INDEX idx_severity (severity),
      INDEX idx_suicide_risk (suicide_risk)
    )
  `);

  // Resources table
  await query(`
    CREATE TABLE IF NOT EXISTS resources (
      id VARCHAR(36) PRIMARY KEY,
      professional_id VARCHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100) NOT NULL,
      subcategory VARCHAR(100),
      file_type VARCHAR(50) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size BIGINT,
      mime_type VARCHAR(100),
      is_public BOOLEAN DEFAULT FALSE,
      download_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (professional_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_professional (professional_id),
      INDEX idx_category (category),
      INDEX idx_title (title)
    )
  `);

  // Resource access log
  await query(`
    CREATE TABLE IF NOT EXISTS resource_access_log (
      id VARCHAR(36) PRIMARY KEY,
      resource_id VARCHAR(36) NOT NULL,
      accessed_by VARCHAR(36),
      patient_id VARCHAR(36),
      access_type ENUM('view', 'download', 'share') NOT NULL,
      access_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ip_address VARCHAR(45),
      FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
      FOREIGN KEY (accessed_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
      INDEX idx_resource (resource_id),
      INDEX idx_timestamp (access_timestamp)
    )
  `);

  logger.info('All tables created successfully');
};

/**
 * Close the connection pool
 */
const closePool = async () => {
  try {
    await pool.end();
    logger.info('MySQL pool closed');
  } catch (error) {
    logger.error('Error closing MySQL pool', { error: error.message });
  }
};

module.exports = {
  query,
  getConnection,
  healthCheck,
  initializeSchema,
  closePool,
  pool
};