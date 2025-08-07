const express = require('express');
const { PrismaClient } = require('../../../generated/prisma');
const crypto = require('crypto');
const bcryptjs = require('bcryptjs');

const router = express.Router();
const prisma = new PrismaClient();

const authService = require('../services/auth-service');

// Middleware to authenticate user
const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token requerido'
      });
    }

    // Use auth service to get current user
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

// GET /organizations/my - Get user's organization info
router.get('/my', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        organization: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                accountType: true,
                isActive: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        organization: user.organization,
        userRole: user.accountType,
        isOwner: user.accountType === 'CLINIC' && user.organization && 
                user.organization.users.find(u => u.id === user.id && u.accountType === 'CLINIC')
      }
    });
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener información de la organización'
    });
  }
});

// POST /organizations - Create organization (for clinic owners)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, type = 'CLINIC' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de la organización es requerido'
      });
    }

    // Check if user already has an organization
    if (req.user.organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Ya perteneces a una organización'
      });
    }

    // Only allow CLINIC account types to create organizations
    if (req.user.accountType !== 'CLINIC') {
      return res.status(403).json({
        success: false,
        message: 'Solo las cuentas tipo clínica pueden crear organizaciones'
      });
    }

    // Create organization and update user
    const organization = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: name.trim(),
          type,
          maxUsers: 15
        }
      });

      await tx.user.update({
        where: { id: req.user.id },
        data: { organizationId: org.id }
      });

      return org;
    });

    res.status(201).json({
      success: true,
      message: 'Organización creada exitosamente',
      data: organization
    });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la organización'
    });
  }
});

// PUT /organizations/my - Update organization info
router.put('/my', requireAuth, async (req, res) => {
  try {
    const { name, type } = req.body;

    if (!req.user.organizationId) {
      return res.status(404).json({
        success: false,
        message: 'No perteneces a ninguna organización'
      });
    }

    // Only clinic owners can update organization
    if (req.user.accountType !== 'CLINIC') {
      return res.status(403).json({
        success: false,
        message: 'Solo el propietario puede actualizar la organización'
      });
    }

    const updatedOrg = await prisma.organization.update({
      where: { id: req.user.organizationId },
      data: {
        ...(name && name.trim() && { name: name.trim() }),
        ...(type && { type })
      }
    });

    res.json({
      success: true,
      message: 'Organización actualizada exitosamente',
      data: updatedOrg
    });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la organización'
    });
  }
});

// POST /organizations/invitations - Create invitation
router.post('/invitations', requireAuth, async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    if (!req.user.organizationId) {
      return res.status(400).json({
        success: false,
        message: 'No perteneces a ninguna organización'
      });
    }

    // Only clinic owners can invite
    if (req.user.accountType !== 'CLINIC') {
      return res.status(403).json({
        success: false,
        message: 'Solo el propietario puede enviar invitaciones'
      });
    }

    // Get organization info
    const organization = await prisma.organization.findUnique({
      where: { id: req.user.organizationId },
      include: { users: true }
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organización no encontrada'
      });
    }

    // Check if organization has reached max users
    if (organization.users.length >= organization.maxUsers) {
      return res.status(400).json({
        success: false,
        message: `La organización ha alcanzado el límite de ${organization.maxUsers} usuarios`
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      if (existingUser.organizationId === req.user.organizationId) {
        return res.status(400).json({
          success: false,
          message: 'Este usuario ya pertenece a tu organización'
        });
      } else if (existingUser.organizationId) {
        return res.status(400).json({
          success: false,
          message: 'Este usuario ya pertenece a otra organización'
        });
      } else {
        // Add existing user to organization
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { organizationId: req.user.organizationId }
        });

        return res.json({
          success: true,
          message: 'Usuario agregado a la organización exitosamente',
          data: { userAdded: true, email: existingUser.email }
        });
      }
    }

    // Generate invitation token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // Store invitation in a simple way (you might want to create a proper invitations table)
    const invitationData = {
      token: inviteToken,
      email: email.toLowerCase().trim(),
      name: name?.trim() || null,
      organizationId: req.user.organizationId,
      organizationName: organization.name,
      invitedBy: req.user.id,
      invitedByName: req.user.name,
      expiresAt,
      createdAt: new Date()
    };

    // For now, we'll store this in beta_registrations table with a special flag
    // In a real implementation, you'd want a proper invitations table
    await prisma.betaRegistration.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name?.trim() || 'Invitado',
        professionalType: 'invitacion',
        city: 'Pendiente',
        country: 'Pendiente',
        howDidYouHear: 'invitacion',
        yearsOfPractice: 'pendiente',
        expectations: JSON.stringify(invitationData),
        inviteCode: inviteToken
      }
    });

    // TODO: Send invitation email here
    console.log(`Invitation created for ${email} to join ${organization.name}`);

    res.status(201).json({
      success: true,
      message: 'Invitación creada exitosamente',
      data: {
        email: email.toLowerCase().trim(),
        organizationName: organization.name,
        inviteToken,
        expiresAt
      }
    });
  } catch (error) {
    console.error('Create invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la invitación'
    });
  }
});

// POST /organizations/accept-invitation - Accept invitation
router.post('/accept-invitation', async (req, res) => {
  try {
    const { token, email, password, name } = req.body;

    if (!token || !email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    // Find invitation
    const invitation = await prisma.betaRegistration.findFirst({
      where: {
        inviteCode: token,
        email: email.toLowerCase().trim(),
        professionalType: 'invitacion'
      }
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitación no válida o expirada'
      });
    }

    // Parse invitation data
    let invitationData;
    try {
      invitationData = JSON.parse(invitation.expectations);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos de invitación corruptos'
      });
    }

    // Check if invitation is expired
    if (new Date() > new Date(invitationData.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'La invitación ha expirado'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Este email ya está registrado'
      });
    }

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { id: invitationData.organizationId },
      include: { users: true }
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organización no encontrada'
      });
    }

    // Check if organization has reached max users
    if (organization.users.length >= organization.maxUsers) {
      return res.status(400).json({
        success: false,
        message: `La organización ha alcanzado el límite de ${organization.maxUsers} usuarios`
      });
    }

    // Create user and add to organization
    const hashedPassword = await bcryptjs.hash(password, 10);

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          name: name.trim(),
          accountType: 'INDIVIDUAL',
          organizationId: organization.id,
          isBetaUser: true
        }
      });

      // Mark invitation as used by deleting it
      await tx.betaRegistration.delete({
        where: { id: invitation.id }
      });

      return user;
    });

    // Create auth session
    const sessionToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await prisma.authSession.create({
      data: {
        userId: newUser.id,
        token: sessionToken,
        expiresAt
      }
    });

    res.status(201).json({
      success: true,
      message: 'Te has unido exitosamente a la organización',
      data: {
        token: sessionToken,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          accountType: newUser.accountType,
          organizationName: organization.name
        }
      }
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aceptar la invitación'
    });
  }
});

// GET /organizations/stats - Get organization statistics
router.get('/stats', requireAuth, async (req, res) => {
  try {
    if (!req.user.organizationId) {
      return res.status(404).json({
        success: false,
        message: 'No perteneces a ninguna organización'
      });
    }

    // Only allow clinic owners to view stats
    if (req.user.accountType !== 'CLINIC') {
      return res.status(403).json({
        success: false,
        message: 'Solo el propietario puede ver las estadísticas'
      });
    }

    // Get organization with users
    const organization = await prisma.organization.findUnique({
      where: { id: req.user.organizationId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            accountType: true,
            isActive: true,
            createdAt: true,
            lastLoginAt: true
          }
        }
      }
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organización no encontrada'
      });
    }

    // Calculate statistics
    const stats = {
      totalUsers: organization.users.length,
      maxUsers: organization.maxUsers,
      availableSlots: organization.maxUsers - organization.users.length,
      activeUsers: organization.users.filter(u => u.isActive).length,
      recentUsers: organization.users.filter(u => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return u.createdAt > weekAgo;
      }).length,
      usersByType: organization.users.reduce((acc, user) => {
        acc[user.accountType] = (acc[user.accountType] || 0) + 1;
        return acc;
      }, {}),
      lastActivity: organization.users
        .filter(u => u.lastLoginAt)
        .sort((a, b) => new Date(b.lastLoginAt) - new Date(a.lastLoginAt))
        .slice(0, 5)
    };

    res.json({
      success: true,
      data: {
        organization,
        stats
      }
    });
  } catch (error) {
    console.error('Get organization stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
});

// DELETE /organizations/users/:userId - Remove user from organization
router.delete('/users/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!req.user.organizationId) {
      return res.status(404).json({
        success: false,
        message: 'No perteneces a ninguna organización'
      });
    }

    // Only allow clinic owners to remove users
    if (req.user.accountType !== 'CLINIC') {
      return res.status(403).json({
        success: false,
        message: 'Solo el propietario puede remover usuarios'
      });
    }

    // Can't remove yourself
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes removerte a ti mismo de la organización'
      });
    }

    // Check if user exists and belongs to the same organization
    const userToRemove = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId: req.user.organizationId
      }
    });

    if (!userToRemove) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado en tu organización'
      });
    }

    // Remove user from organization
    await prisma.user.update({
      where: { id: userId },
      data: { organizationId: null }
    });

    res.json({
      success: true,
      message: 'Usuario removido de la organización exitosamente',
      data: {
        removedUser: {
          id: userToRemove.id,
          name: userToRemove.name,
          email: userToRemove.email
        }
      }
    });
  } catch (error) {
    console.error('Remove user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al remover usuario'
    });
  }
});

module.exports = router;