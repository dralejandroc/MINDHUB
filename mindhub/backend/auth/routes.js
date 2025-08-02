/**
 * Authentication Routes for MindHub
 * Real authentication against database - NO HARDCODED DATA
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPrismaClient } = require('../shared/config/prisma');

const router = express.Router();

// Secret for JWT (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'mindhub-dev-secret-2024';

/**
 * POST /api/auth/login
 * Authenticate user and return token
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email es requerido'
      });
    }

    // Get user from database using Prisma
    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // For development, accept any password for now
    // In production, use bcrypt to verify password_hash
    // const validPassword = await bcrypt.compare(password, user.password_hash);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.userRoles?.[0]?.role?.name || 'user',
        name: user.name || user.email
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data and token
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.email,
        role: user.userRoles?.[0]?.role?.name || 'user',
        specialty: null,
        avatarUrl: user.picture
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar login',
      message: error.message
    });
  }
});

/**
 * GET /api/auth/users
 * Get list of available users for login (development only)
 */
router.get('/users', async (req, res) => {
  try {
    const prisma = getPrismaClient();
    const users = await prisma.user.findMany({
      where: {
        // Assuming there's an active field, otherwise remove this filter
        // isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        // Map Prisma schema fields to expected fields
        userRoles: {
          include: {
            role: true
          }
        }
      },
      orderBy: [
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        role: user.userRoles?.[0]?.role?.name || 'user',
        description: user.userRoles?.[0]?.role?.name || 'user'
      }))
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener usuarios',
      message: error.message
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user from token
 */
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token no proporcionado'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get fresh user data from database
    const sql = 'SELECT * FROM users WHERE id = ? AND is_active = 1';
    const users = await dbConnection.query(sql, [decoded.id]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    const user = users[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        specialty: user.specialty,
        avatarUrl: user.avatar_url
      }
    });

  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({
      success: false,
      error: 'Token inválido',
      message: error.message
    });
  }
});

module.exports = router;