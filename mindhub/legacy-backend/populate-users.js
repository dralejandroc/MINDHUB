/**
 * Script to populate users in Prisma database
 */

const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function populateUsers() {
  try {
    console.log('🔄 Creating users in Prisma database...');

    // Create basic roles first
    const doctorRole = await prisma.role.upsert({
      where: { name: 'doctor' },
      update: {},
      create: {
        name: 'doctor',
        description: 'Doctor/Medical Professional',
        isActive: true
      }
    });

    const adminRole = await prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        description: 'System Administrator',
        isActive: true
      }
    });

    const professionalRole = await prisma.role.upsert({
      where: { name: 'professional' },
      update: {},
      create: {
        name: 'professional',
        description: 'Healthcare Professional',
        isActive: true
      }
    });

    // Create users
    const users = [
      {
        id: 'user-admin-system',
        email: 'admin@mindhub.com',
        name: 'Administrador del Sistema',
        roleId: adminRole.id
      },
      {
        id: 'user-dr-alejandro',
        email: 'alejandro@mindhub.com',
        name: 'Dr. Alejandro Contreras',
        roleId: professionalRole.id
      },
      {
        id: 'user-dr-aleks',
        email: 'dr_aleks_c@hotmail.com',
        name: 'Dr. Alejandro Contreras',
        roleId: doctorRole.id
      }
    ];

    for (const userData of users) {
      // Create user
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          name: userData.name,
          lastLoginAt: null
        },
        create: {
          id: userData.id,
          auth0Id: userData.id, // Use same as id for now
          email: userData.email,
          name: userData.name,
          lastLoginAt: null,
          createdAt: new Date()
        }
      });

      // Assign role
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: userData.roleId
          }
        },
        update: {},
        create: {
          userId: user.id,
          roleId: userData.roleId
        }
      });

      console.log(`✅ Created/Updated user: ${userData.name} (${userData.email})`);
    }

    console.log('🎉 Users populated successfully!');

  } catch (error) {
    console.error('❌ Error populating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateUsers();