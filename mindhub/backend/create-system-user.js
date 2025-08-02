/**
 * Script para crear usuario de sistema para evaluaciones automatizadas
 */

const { PrismaClient } = require('./generated/prisma');

async function createSystemUser() {
  const prisma = new PrismaClient();
  
  try {
    // Verificar si ya existe el usuario de sistema
    const existingUser = await prisma.user.findUnique({
      where: { auth0Id: 'system' }
    });

    if (existingUser) {
      console.log('✅ Usuario de sistema ya existe:', existingUser.id);
      return existingUser.id;
    }

    // Crear usuario de sistema
    const systemUser = await prisma.user.create({
      data: {
        auth0Id: 'system',
        email: 'system@mindhub.local',
        name: 'Sistema MindHub',
        picture: null
      }
    });

    console.log('✅ Usuario de sistema creado:', systemUser.id);
    return systemUser.id;

  } catch (error) {
    console.error('❌ Error creando usuario de sistema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  createSystemUser();
}

module.exports = { createSystemUser };