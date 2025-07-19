/**
 * CONEXIÓN UNIVERSAL DE BASE DE DATOS
 * Soporte para SQLite (desarrollo) y MySQL (producción)
 */

const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const path = require('path');

class DatabaseConnection {
  constructor() {
    this.connection = null;
    this.dbType = process.env.DB_TYPE || 'sqlite';
    this.isConnected = false;
  }

  async connect() {
    try {
      if (this.dbType === 'sqlite') {
        await this.connectSQLite();
      } else if (this.dbType === 'mysql') {
        await this.connectMySQL();
      }
      
      this.isConnected = true;
      console.log(`✅ Database connected successfully (${this.dbType})`);
      return this.connection;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async connectSQLite() {
    const dbPath = path.join(__dirname, 'universal_scales.db');
    
    return new Promise((resolve, reject) => {
      this.connection = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          // Habilitar claves foráneas en SQLite
          this.connection.run('PRAGMA foreign_keys = ON');
          resolve(this.connection);
        }
      });
    });
  }

  async connectMySQL() {
    this.connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'mindhub',
      port: process.env.DB_PORT || 3306,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });
  }

  async query(sql, params = []) {
    if (!this.isConnected) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      if (this.dbType === 'sqlite') {
        this.connection.all(sql, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      } else if (this.dbType === 'mysql') {
        this.connection.execute(sql, params)
          .then(([rows]) => resolve(rows))
          .catch(reject);
      }
    });
  }

  async run(sql, params = []) {
    if (!this.isConnected) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      if (this.dbType === 'sqlite') {
        this.connection.run(sql, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ lastID: this.lastID, changes: this.changes });
          }
        });
      } else if (this.dbType === 'mysql') {
        this.connection.execute(sql, params)
          .then(([result]) => resolve(result))
          .catch(reject);
      }
    });
  }

  async close() {
    if (this.connection) {
      if (this.dbType === 'sqlite') {
        return new Promise((resolve) => {
          this.connection.close(resolve);
        });
      } else if (this.dbType === 'mysql') {
        await this.connection.end();
      }
      this.isConnected = false;
    }
  }

  /**
   * Ejecuta migraciones SQL
   * @param {string} migrationSQL - Contenido del archivo de migración
   */
  async runMigration(migrationSQL) {
    const statements = migrationSQL
      .split(';')
      .filter(statement => statement.trim().length > 0)
      .filter(statement => !statement.trim().startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        await this.run(statement.trim());
      }
    }
  }

  /**
   * Verifica si las tablas del sistema universal existen
   */
  async verifyUniversalScalesSchema() {
    try {
      const tables = ['scales', 'scale_items', 'scale_response_options', 'scale_interpretation_rules', 'scale_subscales'];
      
      for (const table of tables) {
        const result = await this.query(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`);
        if (result.length === 0) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error verifying schema:', error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas de la base de datos
   */
  async getStats() {
    try {
      const stats = {
        scales: await this.query('SELECT COUNT(*) as count FROM scales WHERE is_active = 1'),
        items: await this.query('SELECT COUNT(*) as count FROM scale_items WHERE is_active = 1'),
        assessments: await this.query('SELECT COUNT(*) as count FROM assessments')
      };

      return {
        activeScales: stats.scales[0]?.count || 0,
        totalItems: stats.items[0]?.count || 0,
        totalAssessments: stats.assessments[0]?.count || 0
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { activeScales: 0, totalItems: 0, totalAssessments: 0 };
    }
  }
}

// Singleton instance
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;