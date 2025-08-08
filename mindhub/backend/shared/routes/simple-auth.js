const express = require('express');
const authService = require('../services/auth-service');
const { PrismaClient } = require('../../generated/prisma');

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
    const existingUser = await prisma.users.findUnique({
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
      password,
      professionalType, 
      city, 
      country, 
      howDidYouHear, 
      yearsOfPractice, 
      specialization, 
      expectations 
    } = req.body;

    // Basic validation
    if (!email || !name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, nombre y contraseña son requeridos'
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingresa un email válido'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres'
      });
    }

    if (!city || !country || !professionalType || !howDidYouHear || !yearsOfPractice) {
      return res.status(400).json({
        success: false,
        message: 'Por favor completa todos los campos obligatorios'
      });
    }

    // Check if email already exists
    const existingBeta = await prisma.beta_registrations.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingBeta) {
      return res.status(400).json({
        success: false,
        message: 'Este email ya está registrado en nuestra lista beta'
      });
    }

    const existingUser = await prisma.users.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Este email ya está registrado. Puedes iniciar sesión directamente.'
      });
    }

    const { v4: uuidv4 } = require('uuid');
    const bcrypt = require('bcryptjs');

    // Handle clinic registration - only save to beta_registrations, don't create user
    if (professionalType === 'clinica') {
      await prisma.beta_registrations.create({
        data: {
          id: uuidv4(),
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

      console.log(`New clinic beta registration: ${email} from ${city}, ${country}`);

      return res.status(201).json({
        success: true,
        isClinica: true,
        message: 'Muchas gracias por tu interés en MindHub. Durante nuestro periodo Beta, que esperamos dure un par de meses, por el momento no se soportan los Usuarios de Clínicas. Cuando nuestro Beta termine, tendremos planes que incluirán soporte para clínicas, desde 4 usuarios con una misma base de datos. Por el momento para empezar a probar MindHub y ayudarnos a mejorar, puedes inscribirte como Usuario individual'
      });
    }

    // Handle individual professional registration
    // 1. Create beta registration
    await prisma.beta_registrations.create({
      data: {
        id: uuidv4(),
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

    // 2. Create user account (inactive until email verification)
    const hashedPassword = await bcrypt.hash(password, 10);
    const emailVerificationToken = uuidv4();

    const user = await prisma.users.create({
      data: {
        id: uuidv4(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name: name.trim(),
        accountType: 'INDIVIDUAL',
        isBetaUser: true,
        isActive: false, // Will be activated after email verification
        emailVerified: false,
        emailVerificationToken,
        updatedAt: new Date()
      }
    });

    // 3. Send verification email
    const EmailService = require('../../services/EmailServiceZoho');
    try {
      const emailResult = await EmailService.sendVerificationEmail(
        email.toLowerCase().trim(),
        name.trim(),
        emailVerificationToken
      );
      
      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error);
        // Don't fail the registration if email fails, but log it
      }
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Continue with successful registration
    }

    console.log(`New individual beta registration with user account: ${email} from ${city}, ${country}`);

    res.status(201).json({
      success: true,
      isClinica: false,
      requiresVerification: true,
      message: 'Muchas gracias por suscribirte a MindHub, estás a unos clics de poder disfrutar de la plataforma y ayudarte a tener más tiempo para ti y liberarte del papel para realizar tus escalas clinimétricas. Por favor revisa el buzón o bandeja de entrada de tu correo para confirmarlo, y estarás listo para empezar'
    });

  } catch (error) {
    console.error('Beta registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar para beta'
    });
  }
});

// Email verification endpoint
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token de verificación requerido'
      });
    }

    // Find user with verification token
    const user = await prisma.users.findUnique({
      where: { emailVerificationToken: token }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token de verificación inválido o expirado'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Este email ya está verificado'
      });
    }

    // Update user - activate account and mark email as verified
    await prisma.users.update({
      where: { id: user.id },
      data: {
        isActive: true,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null, // Clear the token
        updatedAt: new Date()
      }
    });

    // Update beta registration to mark as joined
    await prisma.beta_registrations.updateMany({
      where: { email: user.email },
      data: { hasJoined: true }
    });

    console.log(`Email verified for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Email verificado exitosamente. Tu cuenta está ahora activa.',
      data: {
        email: user.email,
        name: user.name,
        verified: true
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar email'
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
    const professionalTypeStats = await prisma.beta_registrations.groupBy({
      by: ['professionalType'],
      _count: true
    });

    // Get breakdown by country
    const countryStats = await prisma.beta_registrations.groupBy({
      by: ['country'],
      _count: true
    });

    // Get breakdown by years of practice
    const yearsOfPracticeStats = await prisma.beta_registrations.groupBy({
      by: ['yearsOfPractice'],
      _count: true
    });

    // Get breakdown by how they heard about us
    const howDidYouHearStats = await prisma.beta_registrations.groupBy({
      by: ['howDidYouHear'],
      _count: true
    });

    const totalUsers = await prisma.users.count({
      where: { isBetaUser: true }
    });

    const totalRegistrations = await prisma.beta_registrations.count();

    // Get recent registrations with full details
    const recentRegistrations = await prisma.beta_registrations.findMany({
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

// Clean user for testing (temporary)
router.post('/clean-user-for-test', async (req, res) => {
  try {
    const { secret, email } = req.body;
    if (secret !== 'cleanup-test-2025') {
      return res.status(401).json({ success: false, message: 'Invalid secret' });
    }

    console.log('🧹 Cleaning user for testing:', email);
    
    // Delete from beta_registrations
    await prisma.beta_registrations.deleteMany({
      where: { email: email.toLowerCase().trim() }
    });
    
    // Delete from users
    await prisma.users.deleteMany({
      where: { email: email.toLowerCase().trim() }
    });
    
    console.log('✅ User cleaned successfully');
    
    res.json({
      success: true,
      message: 'Usuario limpiado para pruebas'
    });
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Email verification migration endpoint (temporary)
router.post('/run-email-migration', async (req, res) => {
  try {
    const { secret } = req.body;
    if (secret !== 'migration-email-2025') {
      return res.status(401).json({ success: false, message: 'Invalid secret' });
    }

    console.log('🔧 Starting email verification migration...');
    
    // Check if columns already exist
    const checkColumns = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME IN ('emailVerified', 'emailVerificationToken', 'emailVerifiedAt')
    `;
    
    if (checkColumns.length === 3) {
      return res.json({
        success: true,
        message: 'Email verification fields already exist',
        alreadyExists: true
      });
    }
    
    // Add emailVerified column
    await prisma.$queryRaw`
      ALTER TABLE users 
      ADD COLUMN emailVerified BOOLEAN DEFAULT FALSE AFTER password
    `;
    
    // Add emailVerificationToken column
    await prisma.$queryRaw`
      ALTER TABLE users 
      ADD COLUMN emailVerificationToken VARCHAR(255) NULL AFTER emailVerified
    `;
    
    // Add emailVerifiedAt column
    await prisma.$queryRaw`
      ALTER TABLE users 
      ADD COLUMN emailVerifiedAt DATETIME NULL AFTER emailVerificationToken
    `;
    
    // Add index for verification token
    await prisma.$queryRaw`
      CREATE INDEX idx_email_verification_token ON users(emailVerificationToken)
    `;
    
    // Set existing users as verified
    await prisma.$queryRaw`
      UPDATE users 
      SET emailVerified = TRUE, emailVerifiedAt = NOW() 
      WHERE emailVerified IS NULL OR emailVerified = FALSE
    `;
    
    console.log('✅ Email verification migration completed');
    
    res.json({
      success: true,
      message: 'Email verification migration completed successfully'
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
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
    const existing = await prisma.users.findUnique({
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