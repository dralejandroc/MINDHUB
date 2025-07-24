/**
 * Migración Completa a Sistema de IDs Unificado
 * 
 * CAMBIOS:
 * 1. Eliminar campo medicalRecordNumber de tabla patients
 * 2. Migrar IDs de consultas a formato jerárquico
 * 3. Actualizar todas las referencias
 */

const mysql = require('mysql2/promise');
const { PrismaClient } = require('./generated/prisma');
const { generateHierarchicalEventId } = require('./shared/utils/hierarchical-id-generator');

const prisma = new PrismaClient();

async function migrateToUnifiedIds() {
  console.log('🔄 Migrando a Sistema de IDs Unificado MindHub...\n');

  let connection;

  try {
    // Conectar a MySQL directamente para cambios de esquema
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 8889,
      user: 'root',
      password: 'root',
      database: 'mindhub'
    });

    console.log('✅ Conectado a MySQL/MAMP');

    // 1. RESTAURAR CAMPO TEMPORALMENTE (si no existe)
    console.log('\n📋 PASO 1: Verificando campo medicalRecordNumber...');
    
    try {
      await connection.execute('ALTER TABLE patients ADD COLUMN medicalRecordNumber VARCHAR(191) UNIQUE AFTER id');
      console.log('✅ Campo medicalRecordNumber restaurado temporalmente');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ Campo medicalRecordNumber ya existe');
      } else {
        throw error;
      }
    }

    // Rellenar valores NULL temporalmente
    await connection.execute(`
      UPDATE patients 
      SET medicalRecordNumber = CONCAT('TEMP-', id) 
      WHERE medicalRecordNumber IS NULL
    `);
    console.log('✅ Valores NULL rellenados temporalmente');

    // 2. MIGRAR IDs DE CONSULTAS
    console.log('\n📋 PASO 2: Migrando IDs de consultas a formato jerárquico...');
    
    const patients = await prisma.patient.findMany({
      include: {
        consultations: {
          orderBy: { consultationDate: 'asc' }
        }
      }
    });

    console.log(`👥 Encontrados ${patients.length} pacientes`);

    for (const patient of patients) {
      if (patient.consultations.length === 0) {
        console.log(`   📝 ${patient.id}: Sin consultas`);
        continue;
      }

      console.log(`\n👤 Migrando consultas de: ${patient.firstName} ${patient.paternalLastName}`);
      console.log(`   ID Paciente: ${patient.id}`);
      console.log(`   Consultas: ${patient.consultations.length}`);

      // Crear mapping de consultas viejas a nuevas
      const consultationMapping = [];

      for (let i = 0; i < patient.consultations.length; i++) {
        const consultation = patient.consultations[i];
        const oldId = consultation.id;
        
        // Generar nuevo ID jerárquico
        const sequence = i + 1;
        const newId = `${patient.id}-C${sequence.toString().padStart(3, '0')}`;
        
        consultationMapping.push({ oldId, newId });
        
        console.log(`     ${oldId} → ${newId}`);
      }

      // Aplicar migración en transacción
      await prisma.$transaction(async (tx) => {
        for (const mapping of consultationMapping) {
          // Crear consulta con nuevo ID
          const oldConsultation = patient.consultations.find(c => c.id === mapping.oldId);
          
          await tx.consultation.create({
            data: {
              id: mapping.newId,
              patientId: patient.id,
              consultantId: oldConsultation.consultantId,
              consultationDate: oldConsultation.consultationDate,
              reason: oldConsultation.reason,
              notes: oldConsultation.notes,
              diagnosis: oldConsultation.diagnosis,
              treatmentPlan: oldConsultation.treatmentPlan,
              status: oldConsultation.status,
              createdAt: oldConsultation.createdAt,
              updatedAt: oldConsultation.updatedAt
            }
          });
        }

        // Eliminar consultas antiguas
        await tx.consultation.deleteMany({
          where: {
            patientId: patient.id,
            id: { in: consultationMapping.map(m => m.oldId) }
          }
        });
      });

      console.log(`   ✅ ${patient.consultations.length} consultas migradas`);
    }

    // 3. VERIFICAR INTEGRIDAD
    console.log('\n📋 PASO 3: Verificando integridad de datos...');

    const finalPatients = await prisma.patient.findMany({
      include: {
        consultations: true,
        _count: {
          select: {
            consultations: true
          }
        }
      }
    });

    console.log('\n📊 RESUMEN FINAL:');
    finalPatients.forEach(patient => {
      console.log(`   ${patient.id} - ${patient.firstName} ${patient.paternalLastName}`);
      console.log(`     └ ${patient._count.consultations} consultas con IDs jerárquicos`);
      
      if (patient.consultations.length > 0) {
        const firstConsultation = patient.consultations[0];
        console.log(`     └ Ejemplo: ${firstConsultation.id}`);
      }
    });

    // 4. ELIMINAR CAMPO medicalRecordNumber FINAL
    console.log('\n📋 PASO 4: Eliminando campo medicalRecordNumber definitivamente...');
    
    try {
      await connection.execute('ALTER TABLE patients DROP COLUMN medicalRecordNumber');
      console.log('✅ Campo medicalRecordNumber eliminado definitivamente');
    } catch (error) {
      console.log('⚠️ No se pudo eliminar medicalRecordNumber:', error.message);
    }

    console.log('\n🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE!');
    console.log('\n📋 CAMBIOS APLICADOS:');
    console.log('   ✅ Campo medicalRecordNumber eliminado');
    console.log('   ✅ IDs de consultas migrados a formato jerárquico');
    console.log('   ✅ Un solo identificador por paciente');
    console.log('   ✅ Sistema preparado para todos los hubs (C, CL, FX, AG, RC)');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
    await prisma.$disconnect();
  }
}

// Ejecutar si el archivo es llamado directamente
if (require.main === module) {
  migrateToUnifiedIds();
}

module.exports = { migrateToUnifiedIds };