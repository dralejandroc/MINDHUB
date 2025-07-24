/**
 * Script para verificar el estado actual de la base de datos
 * y mostrar qué datos ya existen
 */

const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function checkDatabaseStatus() {
  console.log('🔍 Verificando estado de la base de datos MindHub...\n');
  
  try {
    // 1. Verificar conexión
    await prisma.$connect();
    console.log('✅ Conexión establecida\n');

    // 2. Verificar usuarios existentes
    console.log('👥 USUARIOS EXISTENTES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            createdPatients: true,
            patientConsultations: true
          }
        }
      }
    });

    if (users.length === 0) {
      console.log('🚫 No hay usuarios en la base de datos');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'Sin nombre'}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🆔 ID: ${user.id}`);
        console.log(`   👥 Pacientes: ${user._count.createdPatients}`);
        console.log(`   💬 Consultas: ${user._count.patientConsultations}`);
        console.log(`   📅 Creado: ${user.createdAt.toLocaleDateString('es-MX')}`);
        console.log('');
      });
    }

    // 3. Verificar pacientes existentes
    console.log('🏥 PACIENTES EXISTENTES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━');
    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        medicalRecordNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        gender: true,
        isActive: true,
        createdAt: true,
        creator: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (patients.length === 0) {
      console.log('🚫 No hay pacientes en la base de datos');
    } else {
      patients.forEach((patient, index) => {
        console.log(`${index + 1}. ${patient.firstName} ${patient.lastName}`);
        console.log(`   📋 Expediente: ${patient.medicalRecordNumber}`);
        console.log(`   📧 Email: ${patient.email || 'No registrado'}`);
        console.log(`   📱 Teléfono: ${patient.phone || 'No registrado'}`);
        console.log(`   ⚧ Género: ${patient.gender}`);
        console.log(`   🟢 Activo: ${patient.isActive ? 'Sí' : 'No'}`);
        console.log(`   👨‍⚕️ Creado por: ${patient.creator?.name || 'Usuario eliminado'}`);
        console.log(`   📅 Fecha: ${patient.createdAt.toLocaleDateString('es-MX')}`);
        console.log('');
      });
    }

    // 4. Verificar consultas
    console.log('💬 CONSULTAS EXISTENTES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━');
    const consultations = await prisma.consultation.findMany({
      select: {
        id: true,
        consultationDate: true,
        reason: true,
        status: true,
        patient: {
          select: {
            firstName: true,
            lastName: true,
            medicalRecordNumber: true
          }
        },
        consultant: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        consultationDate: 'desc'
      },
      take: 10
    });

    if (consultations.length === 0) {
      console.log('🚫 No hay consultas registradas');
    } else {
      consultations.forEach((consultation, index) => {
        console.log(`${index + 1}. ${consultation.patient.firstName} ${consultation.patient.lastName}`);
        console.log(`   📋 Expediente: ${consultation.patient.medicalRecordNumber}`);
        console.log(`   📝 Motivo: ${consultation.reason}`);
        console.log(`   👨‍⚕️ Doctor: ${consultation.consultant.name}`);
        console.log(`   📅 Fecha: ${consultation.consultationDate.toLocaleDateString('es-MX')}`);
        console.log(`   🏷️ Estado: ${consultation.status}`);
        console.log('');
      });
    }

    // 5. Verificar escalas clínicas
    console.log('📊 ESCALAS CLÍNICAS:');
    console.log('━━━━━━━━━━━━━━━━━━━━');
    const scales = await prisma.scale.findMany({
      select: {
        id: true,
        name: true,
        abbreviation: true,
        category: true,
        isActive: true,
        _count: {
          select: {
            scaleAdministrations: true
          }
        }
      },
      take: 5
    });

    if (scales.length === 0) {
      console.log('🚫 No hay escalas clínicas configuradas');
    } else {
      scales.forEach((scale, index) => {
        console.log(`${index + 1}. ${scale.abbreviation} - ${scale.name}`);
        console.log(`   🏷️ Categoría: ${scale.category}`);
        console.log(`   📊 Aplicaciones: ${scale._count.scaleAdministrations}`);
        console.log(`   🟢 Activa: ${scale.isActive ? 'Sí' : 'No'}`);
        console.log('');
      });
    }

    // 6. Resumen general
    console.log('📈 RESUMEN GENERAL:');
    console.log('━━━━━━━━━━━━━━━━━━━');
    const summary = {
      users: await prisma.user.count(),
      patients: await prisma.patient.count(),
      activePatients: await prisma.patient.count({ where: { isActive: true } }),
      consultations: await prisma.consultation.count(),
      scales: await prisma.scale.count({ where: { isActive: true } }),
      scaleAdministrations: await prisma.scaleAdministration.count()
    };

    console.log(`👥 Total usuarios: ${summary.users}`);
    console.log(`🏥 Total pacientes: ${summary.patients} (${summary.activePatients} activos)`);
    console.log(`💬 Total consultas: ${summary.consultations}`);
    console.log(`📊 Escalas activas: ${summary.scales}`);
    console.log(`📋 Evaluaciones realizadas: ${summary.scaleAdministrations}`);

    // 7. Verificar si existe Dr. Alejandro Contreras
    console.log('\n🔍 VERIFICACIÓN ESPECÍFICA:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const drAlejandro = await prisma.user.findUnique({
      where: { email: 'dr_aleks_c@hotmail.com' },
      include: {
        _count: {
          select: {
            createdPatients: true,
            patientConsultations: true
          }
        }
      }
    });

    if (drAlejandro) {
      console.log('✅ Dr. Alejandro Contreras YA EXISTE');
      console.log(`   📧 Email: ${drAlejandro.email}`);
      console.log(`   🆔 ID: ${drAlejandro.id}`);
      console.log(`   👥 Pacientes creados: ${drAlejandro._count.createdPatients}`);
      console.log(`   💬 Consultas: ${drAlejandro._count.patientConsultations}`);
    } else {
      console.log('❌ Dr. Alejandro Contreras NO EXISTE - Se puede crear');
    }

    console.log('\n🎯 RECOMENDACIONES:');
    console.log('━━━━━━━━━━━━━━━━━━━━');
    if (summary.users === 0) {
      console.log('• Ejecuta create-minimal-test-data.js para crear datos básicos');
    } else if (!drAlejandro) {
      console.log('• Ejecuta create-test-data.js para agregar Dr. Alejandro y pacientes');
    } else {
      console.log('• Los datos básicos ya existen');
      console.log('• Puedes agregar más pacientes o consultas si es necesario');
    }

  } catch (error) {
    console.error('❌ Error verificando base de datos:', error.message);
    
    if (error.code === 'P1001') {
      console.error('🔌 No se puede conectar a la base de datos');
      console.error('💡 Verifica que MAMP esté ejecutándose en puerto 8889');
    } else if (error.code === 'P2021') {
      console.error('🗄️ La tabla no existe');
      console.error('💡 Ejecuta: npx prisma migrate dev');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar verificación
checkDatabaseStatus()
  .catch(console.error);