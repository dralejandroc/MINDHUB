const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('../../generated/prisma');

const prisma = new PrismaClient();

class AuthService {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'mindhub-secret';
    this.JWT_EXPIRES_IN = '1h';
    this.REFRESH_TOKEN_EXPIRES_IN = '7d';
  }

  // Generate JWT token
  generateToken(userId, email, role) {
    return jwt.sign(
      { userId, email, role },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  // Generate refresh token
  generateRefreshToken(userId) {
    return jwt.sign(
      { userId },
      this.JWT_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN }
    );
  }

  // Verify token
  verifyToken(token) {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      throw new Error('Token inválido o expirado');
    }
  }

  // Hash password
  async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }

  // Compare password
  async comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  // Register new user
  async register({ email, password, name, accountType, organizationName }) {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new Error('El email ya está registrado');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create organization if clinic account
      let organizationId = null;
      if (accountType === 'CLINIC' && organizationName) {
        const organization = await prisma.organization.create({
          data: {
            name: organizationName,
            type: 'CLINIC',
            maxUsers: 15,
            isBetaOrg: true
          }
        });
        organizationId = organization.id;
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          accountType: accountType || 'INDIVIDUAL',
          organizationId,
          isBetaUser: true,
          isActive: true
        },
        include: {
          organization: true,
          userRoles: {
            include: {
              role: true
            }
          }
        }
      });

      // Create default role (optional - create if roles table exists)
      const defaultRole = accountType === 'CLINIC' ? 'clinic_admin' : 'professional';
      try {
        const role = await prisma.role.findFirst({
          where: { name: defaultRole }
        });

        if (role) {
          await prisma.userRole.create({
            data: {
              userId: user.id,
              roleId: role.id
            }
          });
        } else {
          console.log(`Role '${defaultRole}' not found, skipping role assignment`);
        }
      } catch (roleError) {
        console.log('Role system not available, skipping role assignment:', roleError.message);
      }

      // Generate tokens
      const token = this.generateToken(user.id, user.email, defaultRole);
      const refreshToken = this.generateRefreshToken(user.id);

      // Create session
      await prisma.authSession.create({
        data: {
          userId: user.id,
          token,
          refreshToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });

      // Update beta registration if exists
      await prisma.betaRegistration.updateMany({
        where: { email },
        data: { hasJoined: true }
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          accountType: user.accountType,
          organization: user.organization
        },
        token,
        refreshToken
      };
    } catch (error) {
      console.error('Error in register:', error);
      throw error;
    }
  }

  // Login user
  async login({ email, password }) {
    try {
      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user || !user.password) {
        throw new Error('Credenciales inválidas');
      }

      if (!user.isActive) {
        throw new Error('Cuenta desactivada');
      }

      // Verify password
      const validPassword = await this.comparePassword(password, user.password);
      if (!validPassword) {
        throw new Error('Credenciales inválidas');
      }

      // Get user role
      const userRole = 'professional';

      // Generate tokens
      const token = this.generateToken(user.id, user.email, userRole);
      const refreshToken = this.generateRefreshToken(user.id);

      // Create session with shorter session token
      const sessionToken = require('crypto').randomBytes(32).toString('hex'); // 64 chars
      await prisma.authSession.create({
        data: {
          userId: user.id,
          token: sessionToken,
          refreshToken: sessionToken + '-refresh',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          accountType: user.accountType,
          role: userRole
        },
        token,
        refreshToken
      };
    } catch (error) {
      console.error('Error in login:', error);
      throw error;
    }
  }

  // Logout user
  async logout(token) {
    try {
      await prisma.authSession.deleteMany({
        where: { token }
      });
      return { success: true };
    } catch (error) {
      console.error('Error in logout:', error);
      throw error;
    }
  }

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = this.verifyToken(refreshToken);
      
      // Find session
      const session = await prisma.authSession.findFirst({
        where: { 
          refreshToken,
          userId: decoded.userId
        }
      });

      if (!session) {
        throw new Error('Sesión inválida');
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          userRoles: {
            include: {
              role: true
            }
          }
        }
      });

      if (!user || !user.isActive) {
        throw new Error('Usuario no encontrado o inactivo');
      }

      const userRole = user.userRoles[0]?.role?.name || 'professional';

      // Generate new tokens
      const newToken = this.generateToken(user.id, user.email, userRole);
      const newRefreshToken = this.generateRefreshToken(user.id);

      // Update session
      await prisma.authSession.update({
        where: { id: session.id },
        data: {
          token: newToken,
          refreshToken: newRefreshToken,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });

      return {
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      console.error('Error in refreshToken:', error);
      throw error;
    }
  }

  // Get current user
  async getCurrentUser(token) {
    try {
      const decoded = this.verifyToken(token);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || !user.isActive) {
        throw new Error('Usuario no encontrado');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        accountType: user.accountType,
        role: 'professional',
        isBetaUser: user.isBetaUser
      };
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();