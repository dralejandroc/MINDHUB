const express = require('express');
const authService = require('../services/auth-service');
const { PrismaClient } = require('../../../generated/prisma');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to extract token from headers
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, accountType, organizationName, professionalType } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, contraseña y nombre son requeridos'
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingresa un email válido'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Este email ya está registrado'
      });
    }

    // Register user
    const result = await authService.register({
      email: email.toLowerCase().trim(),
      password,
      name: name.trim(),
      accountType: accountType || 'INDIVIDUAL',
      organizationName: organizationName ? organizationName.trim() : null
    });

    // Log registration for beta tracking
    console.log(`New beta user registered: ${email} (${accountType || 'INDIVIDUAL'})`);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: result
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al registrar usuario'
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    const result = await authService.login({ email, password });

    res.json({
      success: true,
      message: 'Login exitoso',
      data: result
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Error al iniciar sesión'
    });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token requerido'
      });
    }

    await authService.logout(token);

    res.json({
      success: true,
      message: 'Logout exitoso'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al cerrar sesión'
    });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token requerido'
      });
    }

    const result = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      message: 'Token actualizado',
      data: result
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Error al actualizar token'
    });
  }
});

// Get current user endpoint
router.get('/me', async (req, res) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token requerido'
      });
    }

    const user = await authService.getCurrentUser(token);

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Error al obtener usuario'
    });
  }
});

// Utility function for email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Beta registration endpoint (for landing page)
router.post('/beta-register', async (req, res) => {
  try {
    const { 
      email, 
      name, 
      professionalType, 
      city, 
      country, 
      howDidYouHear, 
      yearsOfPractice, 
      specialization, 
      expectations 
    } = req.body;

    // Basic validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingresa un email válido'
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nombre es requerido'
      });
    }

    if (!city || !country || !professionalType || !howDidYouHear || !yearsOfPractice) {
      return res.status(400).json({
        success: false,
        message: 'Por favor completa todos los campos obligatorios'
      });
    }

    // Check if email already exists in beta registrations
    const existingBeta = await prisma.betaRegistration.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingBeta) {
      return res.status(400).json({
        success: false,
        message: 'Este email ya está registrado en nuestra lista beta'
      });
    }

    // Check if email already exists in users table
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Este email ya está registrado. Puedes iniciar sesión directamente.'
      });
    }

    // Create beta registration
    await prisma.betaRegistration.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        professionalType,
        city: city.trim(),
        country,
        howDidYouHear,
        yearsOfPractice,
        specialization: specialization ? specialization.trim() : null,
        expectations: expectations ? expectations.trim() : null
      }
    });

    console.log(`New beta registration: ${email} from ${city}, ${country} (${professionalType}, ${yearsOfPractice} years, via ${howDidYouHear})`);

    res.status(201).json({
      success: true,
      message: 'Te has registrado exitosamente para el beta. Te contactaremos pronto con los detalles de acceso.'
    });
  } catch (error) {
    console.error('Beta registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar para beta'
    });
  }
});

// Auth middleware for protected routes
const requireAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token requerido'
      });
    }

    const user = await authService.getCurrentUser(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Token inválido'
    });
  }
};

// Beta stats endpoint (for admin)
router.get('/beta-stats', requireAuth, async (req, res) => {
  try {
    // Only allow admin users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado'
      });
    }

    // Get breakdown by professional type
    const professionalTypeStats = await prisma.betaRegistration.groupBy({
      by: ['professionalType'],
      _count: true
    });

    // Get breakdown by country
    const countryStats = await prisma.betaRegistration.groupBy({
      by: ['country'],
      _count: true
    });

    // Get breakdown by years of practice
    const yearsOfPracticeStats = await prisma.betaRegistration.groupBy({
      by: ['yearsOfPractice'],
      _count: true
    });

    // Get breakdown by how they heard about us
    const howDidYouHearStats = await prisma.betaRegistration.groupBy({
      by: ['howDidYouHear'],
      _count: true
    });

    const totalUsers = await prisma.user.count({
      where: { isBetaUser: true }
    });

    const totalRegistrations = await prisma.betaRegistration.count();

    // Get recent registrations with full details
    const recentRegistrations = await prisma.betaRegistration.findMany({
      take: 10,
      orderBy: { registeredAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        professionalType: true,
        city: true,
        country: true,
        yearsOfPractice: true,
        howDidYouHear: true,
        registeredAt: true
      }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalRegistrations,
        breakdown: {
          professionalType: professionalTypeStats,
          country: countryStats,
          yearsOfPractice: yearsOfPracticeStats,
          howDidYouHear: howDidYouHearStats
        },
        recentRegistrations
      }
    });
  } catch (error) {
    console.error('Beta stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
});

// TEMPORARY: Create test user endpoint - REMOVE IN PRODUCTION
router.post('/create-test-user', async (req, res) => {
  try {
    // Only allow in development/beta
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    const testUser = {
      email: 'test@mindhub.com',
      password: 'test123456',
      name: 'Usuario de Prueba',
      accountType: 'INDIVIDUAL'
    };

    // Check if test user already exists
    const existing = await prisma.user.findUnique({
      where: { email: testUser.email }
    });

    if (existing) {
      return res.json({
        success: true,
        message: 'Usuario de prueba ya existe',
        data: { email: testUser.email }
      });
    }

    // Create test user
    const result = await authService.register(testUser);

    res.json({
      success: true,
      message: 'Usuario de prueba creado exitosamente',
      data: {
        email: testUser.email,
        password: testUser.password,
        token: result.token
      }
    });
  } catch (error) {
    console.error('Error creating test user:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario de prueba',
      error: error.message
    });
  }
});

module.exports = { router, requireAuth };