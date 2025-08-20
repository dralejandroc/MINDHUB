const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create roles
    const roles = await prisma.role.createMany({
      data: [
        { id: 'role-psychiatrist', name: 'psychiatrist', description: 'Psychiatrist role' },
        { id: 'role-psychologist', name: 'psychologist', description: 'Psychologist role' },
        { id: 'role-admin', name: 'admin', description: 'Administrator role' }
      ],
      skipDuplicates: true
    });
    console.log('✅ Roles created');

    // Create users
    const users = await prisma.user.createMany({
      data: [
        {
          id: 'user-psychiatrist',
          auth0Id: 'auth0|dev_psychiatrist',
          email: 'psychiatrist@mindhub.test',
          name: 'Dr. María González',
          picture: null
        },
        {
          id: 'user-psychologist',
          auth0Id: 'auth0|dev_psychologist',
          email: 'psychologist@mindhub.test',
          name: 'Dr. Carlos Rodríguez',
          picture: null
        },
        {
          id: 'user-admin',
          auth0Id: 'auth0|dev_admin',
          email: 'admin@mindhub.test',
          name: 'Admin Sistema',
          picture: null
        }
      ],
      skipDuplicates: true
    });
    console.log('✅ Users created');

    // Assign roles to users
    const userRoles = await prisma.userRole.createMany({
      data: [
        { userId: 'user-psychiatrist', roleId: 'role-psychiatrist' },
        { userId: 'user-psychologist', roleId: 'role-psychologist' },
        { userId: 'user-admin', roleId: 'role-admin' }
      ],
      skipDuplicates: true
    });
    console.log('✅ User roles assigned');

    // Create sample assessment scales
    const scales = await prisma.assessmentScale.createMany({
      data: [
        {
          id: 'phq9',
          name: 'Patient Health Questionnaire-9',
          abbreviation: 'PHQ-9',
          description: 'A 9-item depression screening tool',
          category: 'depression',
          targetPopulation: 'Adults',
          administrationMode: 'self-report',
          estimatedDurationMinutes: 5,
          totalItems: 9,
          isActive: true,
          hasSubscales: false,
          requiresTraining: false
        },
        {
          id: 'gad7',
          name: 'Generalized Anxiety Disorder Scale',
          abbreviation: 'GAD-7',
          description: 'A 7-item anxiety screening tool',
          category: 'anxiety',
          targetPopulation: 'Adults',
          administrationMode: 'self-report',
          estimatedDurationMinutes: 3,
          totalItems: 7,
          isActive: true,
          hasSubscales: false,
          requiresTraining: false
        }
      ],
      skipDuplicates: true
    });
    console.log('✅ Assessment scales created');

    console.log('✨ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });