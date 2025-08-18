/**
 * =====================================================================
 * SUPABASE AUTH MIDDLEWARE
 * Sistema de autenticación único con Supabase
 * =====================================================================
 */

const { createClient } = require('@supabase/supabase-js');

// Inicializar cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log('✅ Supabase client initialized');
} else {
  console.warn('⚠️ Supabase credentials not configured - auth will be disabled');
}

/**
 * Middleware para verificar autenticación con Supabase
 */
async function requireAuth(req, res, next) {
  try {
    // Si Supabase no está configurado, permitir acceso (desarrollo)
    if (!supabase) {
      console.warn('⚠️ Auth bypass - Supabase not configured');
      req.user = { id: 'dev-user', email: 'dev@mindhub.com' };
      return next();
    }

    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided'
      });
    }

    const token = authHeader.substring(7);

    // Verificar token con Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authentication token'
      });
    }

    // Buscar o crear usuario en nuestra base de datos
    const { getPrismaClient } = require('../config/prisma');
    const prisma = getPrismaClient();

    let dbUser = await prisma.users.findUnique({
      where: { supabaseUserId: user.id }
    });

    if (!dbUser) {
      // Crear usuario si no existe
      dbUser = await prisma.users.create({
        data: {
          supabaseUserId: user.id,
          email: user.email,
          emailVerified: user.email_confirmed_at ? true : false,
          lastLoginAt: new Date()
        }
      });
    } else {
      // Actualizar último login
      await prisma.users.update({
        where: { id: dbUser.id },
        data: { lastLoginAt: new Date() }
      });
    }

    // Agregar usuario al request
    req.user = {
      id: dbUser.id,
      supabaseUserId: user.id,
      email: user.email,
      role: dbUser.role,
      organization: dbUser.organization
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication verification failed'
    });
  }
}

/**
 * Middleware opcional - permite acceso sin auth pero identifica usuario si está presente
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ') || !supabase) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (user && !error) {
      const { getPrismaClient } = require('../config/prisma');
      const prisma = getPrismaClient();

      const dbUser = await prisma.users.findUnique({
        where: { supabaseUserId: user.id }
      });

      if (dbUser) {
        req.user = {
          id: dbUser.id,
          supabaseUserId: user.id,
          email: user.email,
          role: dbUser.role
        };
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    req.user = null;
    next();
  }
}

/**
 * Middleware para verificar roles específicos
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  optionalAuth,
  requireRole,
  supabase
};