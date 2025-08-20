/**
 * Session Manager for MindHub Healthcare Platform
 * 
 * Comprehensive session management with healthcare-specific security requirements
 * including session timeout, concurrent session control, and audit logging
 */

const crypto = require('crypto');
const { promisify } = require('util');

class SessionManager {
  constructor() {
    this.sessions = new Map(); // In production, use Redis or database
    this.sessionTimeouts = {
      psychiatrist: 8 * 60 * 60 * 1000,    // 8 hours
      psychologist: 8 * 60 * 60 * 1000,   // 8 hours
      nurse: 6 * 60 * 60 * 1000,          // 6 hours
      admin: 4 * 60 * 60 * 1000,          // 4 hours
      patient: 2 * 60 * 60 * 1000,        // 2 hours
      system: 24 * 60 * 60 * 1000         // 24 hours
    };

    this.inactivityTimeouts = {
      psychiatrist: 30 * 60 * 1000,        // 30 minutes
      psychologist: 30 * 60 * 1000,       // 30 minutes
      nurse: 20 * 60 * 1000,              // 20 minutes
      admin: 15 * 60 * 1000,              // 15 minutes
      patient: 30 * 60 * 1000,            // 30 minutes
      system: 60 * 60 * 1000              // 60 minutes
    };

    this.maxConcurrentSessions = {
      psychiatrist: 3,
      psychologist: 3,
      nurse: 2,
      admin: 5,
      patient: 2,
      system: 10
    };

    // Start cleanup interval
    this.startSessionCleanup();
  }

  /**
   * Create a new session
   */
  async createSession(user, deviceInfo = {}) {
    try {
      const sessionId = this.generateSessionId();
      const now = Date.now();
      const userRole = user.role || 'patient';

      // Check concurrent session limits
      await this.enforeConcurrentSessionLimit(user.id, userRole);

      const session = {
        sessionId,
        userId: user.id,
        userRole,
        email: user.email,
        organizationId: user.organizationId,
        professionalLicense: user.professionalLicense,
        
        // Timestamps
        createdAt: now,
        lastActivity: now,
        expiresAt: now + this.sessionTimeouts[userRole],
        inactivityExpiresAt: now + this.inactivityTimeouts[userRole],
        
        // Device and security info
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        deviceFingerprint: deviceInfo.deviceFingerprint,
        location: deviceInfo.location,
        
        // Session state
        isActive: true,
        isAuthenticated: true,
        lastAuthenticationTime: now,
        
        // Security tracking
        loginAttempts: 0,
        securityFlags: [],
        
        // Healthcare-specific data
        currentPatientContext: null,
        accessLevel: this.getAccessLevel(userRole),
        sessionType: deviceInfo.sessionType || 'web'
      };

      // Store session
      this.sessions.set(sessionId, session);
      
      // Add to user session tracking
      await this.addUserSession(user.id, sessionId);

      // Log session creation
      await this.logSessionEvent('SESSION_CREATED', session);

      return {
        sessionId,
        expiresAt: session.expiresAt,
        inactivityTimeout: this.inactivityTimeouts[userRole],
        accessLevel: session.accessLevel
      };

    } catch (error) {
      await this.logSessionEvent('SESSION_CREATE_ERROR', { userId: user.id, error: error.message });
      throw error;
    }
  }

  /**
   * Validate and refresh session
   */
  async validateSession(sessionId, updateActivity = true) {
    try {
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      const now = Date.now();

      // Check if session has expired
      if (now > session.expiresAt) {
        await this.destroySession(sessionId, 'SESSION_EXPIRED');
        throw new Error('Session has expired');
      }

      // Check inactivity timeout
      if (now > session.inactivityExpiresAt) {
        await this.destroySession(sessionId, 'INACTIVITY_TIMEOUT');
        throw new Error('Session inactive for too long');
      }

      // Check if session is still active
      if (!session.isActive) {
        throw new Error('Session is not active');
      }

      // Update activity if requested
      if (updateActivity) {
        session.lastActivity = now;
        session.inactivityExpiresAt = now + this.inactivityTimeouts[session.userRole];
        this.sessions.set(sessionId, session);
      }

      return {
        userId: session.userId,
        userRole: session.userRole,
        email: session.email,
        organizationId: session.organizationId,
        professionalLicense: session.professionalLicense,
        accessLevel: session.accessLevel,
        sessionId: session.sessionId,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        currentPatientContext: session.currentPatientContext
      };

    } catch (error) {
      await this.logSessionEvent('SESSION_VALIDATION_ERROR', { sessionId, error: error.message });
      throw error;
    }
  }

  /**
   * Destroy a session
   */
  async destroySession(sessionId, reason = 'USER_LOGOUT') {
    try {
      const session = this.sessions.get(sessionId);
      
      if (session) {
        // Mark session as inactive
        session.isActive = false;
        session.destroyedAt = Date.now();
        session.destroyReason = reason;

        // Remove from user session tracking
        await this.removeUserSession(session.userId, sessionId);

        // Log session destruction
        await this.logSessionEvent('SESSION_DESTROYED', { ...session, reason });

        // Remove from session store
        this.sessions.delete(sessionId);

        return true;
      }

      return false;
    } catch (error) {
      await this.logSessionEvent('SESSION_DESTROY_ERROR', { sessionId, error: error.message });
      throw error;
    }
  }

  /**
   * Destroy all sessions for a user
   */
  async destroyAllUserSessions(userId, reason = 'ADMIN_ACTION') {
    try {
      const userSessions = await this.getUserSessions(userId);
      const destroyPromises = userSessions.map(sessionId => 
        this.destroySession(sessionId, reason)
      );

      await Promise.all(destroyPromises);

      await this.logSessionEvent('ALL_SESSIONS_DESTROYED', { userId, reason, count: userSessions.length });

      return userSessions.length;
    } catch (error) {
      await this.logSessionEvent('DESTROY_ALL_SESSIONS_ERROR', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Update session context (e.g., current patient)
   */
  async updateSessionContext(sessionId, context) {
    try {
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      // Update context
      session.currentPatientContext = context.patientId || null;
      session.lastActivity = Date.now();
      
      this.sessions.set(sessionId, session);

      await this.logSessionEvent('SESSION_CONTEXT_UPDATED', { 
        sessionId, 
        userId: session.userId,
        context 
      });

      return true;
    } catch (error) {
      await this.logSessionEvent('SESSION_CONTEXT_ERROR', { sessionId, error: error.message });
      throw error;
    }
  }

  /**
   * Get active sessions for a user
   */
  async getUserSessions(userId) {
    const userSessions = [];
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId && session.isActive) {
        userSessions.push(sessionId);
      }
    }

    return userSessions;
  }

  /**
   * Get session information
   */
  async getSessionInfo(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    return {
      sessionId: session.sessionId,
      userId: session.userId,
      userRole: session.userRole,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      isActive: session.isActive,
      currentPatientContext: session.currentPatientContext,
      sessionType: session.sessionType
    };
  }

  /**
   * Generate secure session ID
   */
  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get access level for user role
   */
  getAccessLevel(userRole) {
    const accessLevels = {
      patient: 1,
      nurse: 3,
      psychologist: 4,
      psychiatrist: 5,
      admin: 6,
      system: 7
    };

    return accessLevels[userRole] || 1;
  }

  /**
   * Enforce concurrent session limits
   */
  async enforeConcurrentSessionLimit(userId, userRole) {
    const userSessions = await this.getUserSessions(userId);
    const maxSessions = this.maxConcurrentSessions[userRole] || 1;

    if (userSessions.length >= maxSessions) {
      // Destroy oldest session
      const oldestSessionId = this.findOldestSession(userSessions);
      if (oldestSessionId) {
        await this.destroySession(oldestSessionId, 'CONCURRENT_SESSION_LIMIT');
      }
    }
  }

  /**
   * Find oldest session for a user
   */
  findOldestSession(sessionIds) {
    let oldestSessionId = null;
    let oldestTime = Date.now();

    for (const sessionId of sessionIds) {
      const session = this.sessions.get(sessionId);
      if (session && session.createdAt < oldestTime) {
        oldestTime = session.createdAt;
        oldestSessionId = sessionId;
      }
    }

    return oldestSessionId;
  }

  /**
   * Add session to user tracking
   */
  async addUserSession(userId, sessionId) {
    // In production, this would update a database or Redis
    // For now, this is handled by the in-memory sessions Map
    return true;
  }

  /**
   * Remove session from user tracking
   */
  async removeUserSession(userId, sessionId) {
    // In production, this would update a database or Redis
    return true;
  }

  /**
   * Start automatic session cleanup
   */
  startSessionCleanup() {
    // Clean up expired sessions every 5 minutes
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000);
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    try {
      const now = Date.now();
      const expiredSessions = [];

      for (const [sessionId, session] of this.sessions.entries()) {
        if (now > session.expiresAt || now > session.inactivityExpiresAt) {
          expiredSessions.push(sessionId);
        }
      }

      // Destroy expired sessions
      for (const sessionId of expiredSessions) {
        await this.destroySession(sessionId, 'AUTOMATIC_CLEANUP');
      }

      if (expiredSessions.length > 0) {
        await this.logSessionEvent('SESSION_CLEANUP', { 
          cleanedSessions: expiredSessions.length,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      await this.logSessionEvent('SESSION_CLEANUP_ERROR', { error: error.message });
    }
  }

  /**
   * Emergency session lockdown
   */
  async emergencyLockdown(reason = 'SECURITY_INCIDENT') {
    try {
      const allSessions = Array.from(this.sessions.keys());
      
      for (const sessionId of allSessions) {
        await this.destroySession(sessionId, `EMERGENCY_LOCKDOWN: ${reason}`);
      }

      await this.logSessionEvent('EMERGENCY_LOCKDOWN', { 
        reason,
        sessionsDestroyed: allSessions.length,
        timestamp: new Date().toISOString()
      });

      return allSessions.length;
    } catch (error) {
      await this.logSessionEvent('EMERGENCY_LOCKDOWN_ERROR', { error: error.message });
      throw error;
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStatistics() {
    const stats = {
      totalActiveSessions: 0,
      sessionsByRole: {},
      sessionsByType: {},
      averageSessionDuration: 0,
      oldestSession: null,
      newestSession: null
    };

    let totalDuration = 0;
    let oldestTime = Date.now();
    let newestTime = 0;

    for (const session of this.sessions.values()) {
      if (session.isActive) {
        stats.totalActiveSessions++;
        
        // Count by role
        stats.sessionsByRole[session.userRole] = (stats.sessionsByRole[session.userRole] || 0) + 1;
        
        // Count by type
        stats.sessionsByType[session.sessionType] = (stats.sessionsByType[session.sessionType] || 0) + 1;
        
        // Calculate duration
        const duration = Date.now() - session.createdAt;
        totalDuration += duration;
        
        // Track oldest and newest
        if (session.createdAt < oldestTime) {
          oldestTime = session.createdAt;
          stats.oldestSession = session.sessionId;
        }
        
        if (session.createdAt > newestTime) {
          newestTime = session.createdAt;
          stats.newestSession = session.sessionId;
        }
      }
    }

    if (stats.totalActiveSessions > 0) {
      stats.averageSessionDuration = totalDuration / stats.totalActiveSessions;
    }

    return stats;
  }

  /**
   * Log session events
   */
  async logSessionEvent(eventType, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      component: 'SessionManager',
      data
    };

    // In production, this would write to a secure audit log system
    try {
      console.log('SESSION_MANAGER_EVENT:', JSON.stringify(logEntry, null, 2));
    } catch (error) {
      // Handle circular reference by using util.inspect
      const util = require('util');
      console.log('SESSION_MANAGER_EVENT:', util.inspect(logEntry, { depth: 2, colors: false }));
    }
  }
}

module.exports = SessionManager;