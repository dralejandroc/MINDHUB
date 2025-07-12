/**
 * Database Seeding Script for MindHub
 * 
 * Seeds the database with initial data for development and testing.
 * This script uses Prisma to populate all schemas with sample data.
 */

const { getPrismaClient, logger } = require('../backend/shared/config/prisma');
const { v4: uuidv4 } = require('uuid');

async function seedDatabase() {
  const prisma = getPrismaClient();
  
  try {
    logger.info('Starting database seeding...');

    // =======================================================================
    // AUTH SCHEMA - Roles, Permissions, and Users
    // =======================================================================

    logger.info('Seeding auth schema...');

    // Create roles
    const roles = await prisma.role.createMany({
      data: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'psychiatrist',
          description: 'Licensed psychiatrist with full clinical access'
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'psychologist',
          description: 'Licensed psychologist with assessment and therapy access'
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          name: 'healthcare_admin',
          description: 'Healthcare administrator with system management access'
        },
        {
          id: '44444444-4444-4444-4444-444444444444',
          name: 'support_staff',
          description: 'Support staff with limited access'
        }
      ],
      skipDuplicates: true
    });

    // Create permissions
    const permissions = await prisma.permission.createMany({
      data: [
        { id: 'a1111111-1111-1111-1111-111111111111', name: 'read:profile', description: 'Read user profile data', resource: 'profile', action: 'read' },
        { id: 'a2222222-2222-2222-2222-222222222222', name: 'write:profile', description: 'Update user profile data', resource: 'profile', action: 'write' },
        { id: 'a3333333-3333-3333-3333-333333333333', name: 'read:patients', description: 'Read patient information', resource: 'patients', action: 'read' },
        { id: 'a4444444-4444-4444-4444-444444444444', name: 'write:patients', description: 'Create/update patient records', resource: 'patients', action: 'write' },
        { id: 'a5555555-5555-5555-5555-555555555555', name: 'read:assessments', description: 'Access clinical assessments', resource: 'assessments', action: 'read' },
        { id: 'a6666666-6666-6666-6666-666666666666', name: 'write:assessments', description: 'Create/modify assessments', resource: 'assessments', action: 'write' },
        { id: 'a7777777-7777-7777-7777-777777777777', name: 'read:prescriptions', description: 'View prescriptions', resource: 'prescriptions', action: 'read' },
        { id: 'a8888888-8888-8888-8888-888888888888', name: 'write:prescriptions', description: 'Create/update prescriptions', resource: 'prescriptions', action: 'write' },
        { id: 'a9999999-9999-9999-9999-999999999999', name: 'read:forms', description: 'Access forms and questionnaires', resource: 'forms', action: 'read' },
        { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'write:forms', description: 'Create/modify forms', resource: 'forms', action: 'write' },
        { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'read:resources', description: 'Access educational resources', resource: 'resources', action: 'read' },
        { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', name: 'write:resources', description: 'Manage educational content', resource: 'resources', action: 'write' },
        { id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', name: 'admin:all', description: 'Administrative access to all resources', resource: 'all', action: 'admin' }
      ],
      skipDuplicates: true
    });

    // Assign permissions to roles
    const rolePermissions = [
      // Psychiatrist permissions (full access)
      { roleId: '11111111-1111-1111-1111-111111111111', permissionId: 'a1111111-1111-1111-1111-111111111111' },
      { roleId: '11111111-1111-1111-1111-111111111111', permissionId: 'a2222222-2222-2222-2222-222222222222' },
      { roleId: '11111111-1111-1111-1111-111111111111', permissionId: 'a3333333-3333-3333-3333-333333333333' },
      { roleId: '11111111-1111-1111-1111-111111111111', permissionId: 'a4444444-4444-4444-4444-444444444444' },
      { roleId: '11111111-1111-1111-1111-111111111111', permissionId: 'a5555555-5555-5555-5555-555555555555' },
      { roleId: '11111111-1111-1111-1111-111111111111', permissionId: 'a6666666-6666-6666-6666-666666666666' },
      { roleId: '11111111-1111-1111-1111-111111111111', permissionId: 'a7777777-7777-7777-7777-777777777777' },
      { roleId: '11111111-1111-1111-1111-111111111111', permissionId: 'a8888888-8888-8888-8888-888888888888' },
      { roleId: '11111111-1111-1111-1111-111111111111', permissionId: 'a9999999-9999-9999-9999-999999999999' },
      { roleId: '11111111-1111-1111-1111-111111111111', permissionId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
      { roleId: '11111111-1111-1111-1111-111111111111', permissionId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' },
      { roleId: '11111111-1111-1111-1111-111111111111', permissionId: 'cccccccc-cccc-cccc-cccc-cccccccccccc' },
      
      // Psychologist permissions (no prescription access)
      { roleId: '22222222-2222-2222-2222-222222222222', permissionId: 'a1111111-1111-1111-1111-111111111111' },
      { roleId: '22222222-2222-2222-2222-222222222222', permissionId: 'a2222222-2222-2222-2222-222222222222' },
      { roleId: '22222222-2222-2222-2222-222222222222', permissionId: 'a3333333-3333-3333-3333-333333333333' },
      { roleId: '22222222-2222-2222-2222-222222222222', permissionId: 'a4444444-4444-4444-4444-444444444444' },
      { roleId: '22222222-2222-2222-2222-222222222222', permissionId: 'a5555555-5555-5555-5555-555555555555' },
      { roleId: '22222222-2222-2222-2222-222222222222', permissionId: 'a6666666-6666-6666-6666-666666666666' },
      { roleId: '22222222-2222-2222-2222-222222222222', permissionId: 'a7777777-7777-7777-7777-777777777777' },
      { roleId: '22222222-2222-2222-2222-222222222222', permissionId: 'a9999999-9999-9999-9999-999999999999' },
      { roleId: '22222222-2222-2222-2222-222222222222', permissionId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
      { roleId: '22222222-2222-2222-2222-222222222222', permissionId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' },
      { roleId: '22222222-2222-2222-2222-222222222222', permissionId: 'cccccccc-cccc-cccc-cccc-cccccccccccc' },
      
      // Healthcare admin permissions
      { roleId: '33333333-3333-3333-3333-333333333333', permissionId: 'dddddddd-dddd-dddd-dddd-dddddddddddd' },
      
      // Support staff permissions (limited)
      { roleId: '44444444-4444-4444-4444-444444444444', permissionId: 'a1111111-1111-1111-1111-111111111111' },
      { roleId: '44444444-4444-4444-4444-444444444444', permissionId: 'a3333333-3333-3333-3333-333333333333' },
      { roleId: '44444444-4444-4444-4444-444444444444', permissionId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' }
    ];

    for (const rp of rolePermissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: rp },
        update: {},
        create: rp
      });
    }

    // Create sample users
    const users = await prisma.user.createMany({
      data: [
        {
          id: 'u1111111-1111-1111-1111-111111111111',
          auth0Id: 'auth0|dev_psychiatrist',
          email: 'doctor.psiquiatra@mindhub.cloud',
          name: 'Dr. María González Pérez',
          licenseNumber: 'PSQ-2024-001',
          licenseType: 'psychiatrist',
          specialty: 'Psiquiatría General',
          isActive: true
        },
        {
          id: 'u2222222-2222-2222-2222-222222222222',
          auth0Id: 'auth0|dev_psychologist',
          email: 'doctor.psicologo@mindhub.cloud',
          name: 'Dr. Carlos Rodríguez López',
          licenseNumber: 'PSY-2024-001',
          licenseType: 'psychologist',
          specialty: 'Psicología Clínica',
          isActive: true
        },
        {
          id: 'u3333333-3333-3333-3333-333333333333',
          auth0Id: 'auth0|dev_admin',
          email: 'admin@mindhub.cloud',
          name: 'Admin Sistema',
          licenseNumber: 'ADM-2024-001',
          licenseType: 'admin',
          specialty: 'Administración',
          isActive: true
        }
      ],
      skipDuplicates: true
    });

    // Assign roles to users
    const userRoles = [
      { userId: 'u1111111-1111-1111-1111-111111111111', roleId: '11111111-1111-1111-1111-111111111111' },
      { userId: 'u2222222-2222-2222-2222-222222222222', roleId: '22222222-2222-2222-2222-222222222222' },
      { userId: 'u3333333-3333-3333-3333-333333333333', roleId: '33333333-3333-3333-3333-333333333333' }
    ];

    for (const ur of userRoles) {
      await prisma.userRole.upsert({
        where: { userId_roleId: ur },
        update: {},
        create: ur
      });
    }

    logger.info(`Auth schema seeded: ${roles.count} roles, ${permissions.count} permissions, ${users.count} users`);

    // =======================================================================
    // EXPEDIX SCHEMA - Patients and Medical Data
    // =======================================================================

    logger.info('Seeding expedix schema...');

    // Create medications
    const medications = await prisma.medication.createMany({
      data: [
        {
          id: 'm1111111-1111-1111-1111-111111111111',
          genericName: 'Sertralina',
          brandNames: ['Zoloft', 'Altruline'],
          therapeuticClass: 'Antidepresivo ISRS',
          availableStrengths: ['25mg', '50mg', '100mg'],
          availableForms: ['tablet'],
          createdBy: 'u1111111-1111-1111-1111-111111111111'
        },
        {
          id: 'm2222222-2222-2222-2222-222222222222',
          genericName: 'Lorazepam',
          brandNames: ['Ativan'],
          therapeuticClass: 'Benzodiacepina',
          availableStrengths: ['0.5mg', '1mg', '2mg'],
          availableForms: ['tablet'],
          createdBy: 'u1111111-1111-1111-1111-111111111111'
        },
        {
          id: 'm3333333-3333-3333-3333-333333333333',
          genericName: 'Risperidona',
          brandNames: ['Risperdal'],
          therapeuticClass: 'Antipsicótico atípico',
          availableStrengths: ['1mg', '2mg', '3mg', '4mg'],
          availableForms: ['tablet'],
          createdBy: 'u1111111-1111-1111-1111-111111111111'
        }
      ],
      skipDuplicates: true
    });

    logger.info(`Expedix medications seeded: ${medications.count} medications`);

    // =======================================================================
    // CLINIMETRIX SCHEMA - Assessment Scales
    // =======================================================================

    logger.info('Seeding clinimetrix schema...');

    // Create assessment scales
    const assessmentScales = await prisma.assessmentScale.createMany({
      data: [
        {
          id: 's1111111-1111-1111-1111-111111111111',
          name: 'Inventario de Depresión de Beck II',
          abbreviation: 'BDI-II',
          description: 'Cuestionario de autoevaluación para medir la severidad de síntomas depresivos',
          targetPopulation: 'adults',
          administrationMode: 'self_report',
          estimatedDurationMinutes: 10,
          category: 'depression',
          subcategory: 'screening',
          availableLanguages: ['es', 'en'],
          createdBy: 'u1111111-1111-1111-1111-111111111111'
        },
        {
          id: 's2222222-2222-2222-2222-222222222222',
          name: 'Inventario de Ansiedad de Beck',
          abbreviation: 'BAI',
          description: 'Escala de autoevaluación para síntomas de ansiedad',
          targetPopulation: 'adults',
          administrationMode: 'self_report',
          estimatedDurationMinutes: 8,
          category: 'anxiety',
          subcategory: 'screening',
          availableLanguages: ['es', 'en'],
          createdBy: 'u1111111-1111-1111-1111-111111111111'
        },
        {
          id: 's3333333-3333-3333-3333-333333333333',
          name: 'Escala de Evaluación de la Depresión de Hamilton',
          abbreviation: 'HDRS',
          description: 'Escala administrada por el clínico para evaluar severidad de depresión',
          targetPopulation: 'adults',
          administrationMode: 'clinician_administered',
          estimatedDurationMinutes: 20,
          category: 'depression',
          subcategory: 'severity',
          availableLanguages: ['es', 'en'],
          createdBy: 'u1111111-1111-1111-1111-111111111111'
        }
      ],
      skipDuplicates: true
    });

    logger.info(`Clinimetrix assessment scales seeded: ${assessmentScales.count} scales`);

    // =======================================================================
    // FORMX SCHEMA - Form Templates and Field Types
    // =======================================================================

    logger.info('Seeding formx schema...');

    // Create field types
    const fieldTypes = await prisma.fieldType.createMany({
      data: [
        {
          id: 'ft111111-1111-1111-1111-111111111111',
          typeName: 'text_input',
          displayName: 'Texto',
          description: 'Campo de texto simple',
          category: 'input',
          dataType: 'text',
          supportsValidation: true,
          isInteractive: true,
          createdBy: 'u3333333-3333-3333-3333-333333333333'
        },
        {
          id: 'ft222222-2222-2222-2222-222222222222',
          typeName: 'textarea',
          displayName: 'Área de texto',
          description: 'Campo de texto multilínea',
          category: 'input',
          dataType: 'text',
          supportsValidation: true,
          isInteractive: true,
          createdBy: 'u3333333-3333-3333-3333-333333333333'
        },
        {
          id: 'ft333333-3333-3333-3333-333333333333',
          typeName: 'radio_group',
          displayName: 'Opción múltiple',
          description: 'Selección de una opción',
          category: 'selection',
          dataType: 'text',
          supportsValidation: true,
          isInteractive: true,
          createdBy: 'u3333333-3333-3333-3333-333333333333'
        }
      ],
      skipDuplicates: true
    });

    logger.info(`Formx field types seeded: ${fieldTypes.count} field types`);

    // =======================================================================
    // RESOURCES SCHEMA - Educational Materials
    // =======================================================================

    logger.info('Seeding resources schema...');

    // Create categories
    const categories = await prisma.category.createMany({
      data: [
        {
          id: 'cat11111-1111-1111-1111-111111111111',
          name: 'Trastornos del Estado de Ánimo',
          slug: 'trastornos-animo',
          description: 'Recursos sobre depresión, bipolaridad y trastornos relacionados',
          displayOrder: 1,
          level: 0,
          path: 'trastornos-animo',
          createdBy: 'u3333333-3333-3333-3333-333333333333'
        },
        {
          id: 'cat22222-2222-2222-2222-222222222222',
          name: 'Trastornos de Ansiedad',
          slug: 'trastornos-ansiedad',
          description: 'Información y recursos sobre ansiedad y fobias',
          displayOrder: 2,
          level: 0,
          path: 'trastornos-ansiedad',
          createdBy: 'u3333333-3333-3333-3333-333333333333'
        }
      ],
      skipDuplicates: true
    });

    // Create tags
    const tags = await prisma.tag.createMany({
      data: [
        {
          id: 'tag11111-1111-1111-1111-111111111111',
          name: 'Depresión',
          slug: 'depresion',
          description: 'Recursos relacionados con trastornos depresivos',
          tagType: 'condition',
          createdBy: 'u3333333-3333-3333-3333-333333333333'
        },
        {
          id: 'tag22222-2222-2222-2222-222222222222',
          name: 'Ansiedad',
          slug: 'ansiedad',
          description: 'Recursos sobre trastornos de ansiedad',
          tagType: 'condition',
          createdBy: 'u3333333-3333-3333-3333-333333333333'
        }
      ],
      skipDuplicates: true
    });

    // Create sample resources
    const resources = await prisma.resource.createMany({
      data: [
        {
          id: 'res11111-1111-1111-1111-111111111111',
          title: 'Entendiendo la Depresión: Guía para Pacientes',
          slug: 'entendiendo-depresion-guia-pacientes',
          description: 'Guía completa que explica qué es la depresión, sus síntomas, causas y opciones de tratamiento disponibles.',
          summary: 'Guía educativa sobre depresión para pacientes y familias',
          resourceType: 'document',
          format: 'pdf',
          targetAudience: 'patients',
          ageGroup: 'adults',
          clinicalConditions: ['depression', 'mood_disorders'],
          therapeuticApproaches: ['psychoeducation', 'cognitive_behavioral'],
          status: 'published',
          createdBy: 'u1111111-1111-1111-1111-111111111111'
        },
        {
          id: 'res22222-2222-2222-2222-222222222222',
          title: 'Técnicas de Respiración para la Ansiedad',
          slug: 'tecnicas-respiracion-ansiedad',
          description: 'Video instructivo que enseña diferentes técnicas de respiración para manejar crisis de ansiedad.',
          summary: 'Video con ejercicios de respiración para ansiedad',
          resourceType: 'video',
          format: 'mp4',
          targetAudience: 'all',
          ageGroup: 'all',
          clinicalConditions: ['anxiety', 'panic_disorder'],
          therapeuticApproaches: ['relaxation', 'mindfulness'],
          status: 'published',
          createdBy: 'u2222222-2222-2222-2222-222222222222'
        }
      ],
      skipDuplicates: true
    });

    logger.info(`Resources seeded: ${categories.count} categories, ${tags.count} tags, ${resources.count} resources`);

    logger.info('Database seeding completed successfully!');
    
    // Print summary
    console.log('\n✅ Database seeded successfully!');
    console.log('\nSeeded data summary:');
    console.log(`- ${roles.count} roles and ${permissions.count} permissions`);
    console.log(`- ${users.count} users with role assignments`);
    console.log(`- ${medications.count} medications`);
    console.log(`- ${assessmentScales.count} assessment scales`);
    console.log(`- ${fieldTypes.count} form field types`);
    console.log(`- ${categories.count} resource categories and ${tags.count} tags`);
    console.log(`- ${resources.count} educational resources`);
    console.log('\nSample login credentials:');
    console.log('- Psychiatrist: doctor.psiquiatra@mindhub.cloud');
    console.log('- Psychologist: doctor.psicologo@mindhub.cloud');
    console.log('- Admin: admin@mindhub.cloud');

  } catch (error) {
    logger.error('Database seeding failed', { error: error.message, stack: error.stack });
    console.error('\n❌ Database seeding failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };