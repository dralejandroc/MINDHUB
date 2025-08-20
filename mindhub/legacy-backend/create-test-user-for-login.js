#!/usr/bin/env node

/**
 * Script para crear un usuario de prueba para testing de login
 */

const { PrismaClient } = require('../generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🚀 Creando usuario de prueba...');

    // Datos del usuario de prueba
    const testUser = {
      email: 'test@mindhub.com',
      password: 'test123456',
      name: 'Usuario de Prueba',
      accountType: 'INDIVIDUAL'
    };

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: testUser.email }
    });

    if (existingUser) {
      console.log('✅ Usuario de prueba ya existe:', testUser.email);
      console.log('📧 Email:', testUser.email);
      console.log('🔑 Contraseña:', testUser.password);
      return;
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(testUser.password, 10);

    // Crear el usuario
    const user = await prisma.user.create({
      data: {
        email: testUser.email,
        password: hashedPassword,
        name: testUser.name,
        accountType: testUser.accountType,
        isBetaUser: true,
        isActive: true
      }
    });

    console.log('✅ Usuario de prueba creado exitosamente!');
    console.log('👤 ID:', user.id);
    console.log('📧 Email:', user.email);
    console.log('👨‍⚕️ Nombre:', user.name);
    console.log('🔑 Contraseña:', testUser.password);
    console.log('');
    console.log('🧪 Ahora puedes usar estas credenciales para hacer login:');
    console.log('   Email: test@mindhub.com');
    console.log('   Password: test123456');

  } catch (error) {
    console.error('❌ Error al crear usuario de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (require.main === module) {
  createTestUser();
}

module.exports = { createTestUser };