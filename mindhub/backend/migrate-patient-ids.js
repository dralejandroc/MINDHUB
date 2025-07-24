/**
 * Script para migrar IDs de pacientes existentes al nuevo formato legible
 * - Convierte Roberto de cmdfjy7hn000n10ff6aha0slj a SAR19800315-2507A
 * - Actualiza todas las relaciones (consultas, etc.)
 */

const { PrismaClient } = require('./generated/prisma');
const { generateReadablePatientId } = require('./shared/utils/patient-id-generator');
const prisma = new PrismaClient();

async function migratePatientIds() {
  console.log('🔄 Migrando IDs de pacientes al formato legible...\n');

  try {
    // Obtener todos los pacientes existentes
    const patients = await prisma.patient.findMany({
      include: {
        consultations: true,
        medicalHistory: true,
        prescriptions: true
      }
    });

    console.log(`📋 Encontrados ${patients.length} pacientes para migrar`);

    for (const patient of patients) {
      console.log(`\n👤 Migrando: ${patient.firstName} ${patient.paternalLastName} ${patient.maternalLastName}`);
      console.log(`   ID actual: ${patient.id}`);

      // Generar nuevo ID legible
      const newId = await generateReadablePatientId({
        firstName: patient.firstName,
        paternalLastName: patient.paternalLastName,
        dateOfBirth: patient.dateOfBirth
      }, patient.createdAt);

      console.log(`   Nuevo ID: ${newId}`);

      // Verificar si el nuevo ID ya existe (muy improbable)
      const existingPatient = await prisma.patient.findUnique({
        where: { id: newId }
      });

      if (existingPatient && existingPatient.id !== patient.id) {
        console.log(`   ⚠️ COLISIÓN: ${newId} ya existe, saltando...`);
        continue;
      }

      // Realizar migración en transacción
      await prisma.$transaction(async (tx) => {
        // 1. Crear paciente con nuevo ID
        await tx.patient.create({
          data: {
            id: newId,
            medicalRecordNumber: patient.medicalRecordNumber + '_NEW',
            firstName: patient.firstName,
            lastName: patient.lastName,
            paternalLastName: patient.paternalLastName,
            maternalLastName: patient.maternalLastName,
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            email: patient.email,
            phone: patient.phone,
            address: patient.address,
            city: patient.city,
            state: patient.state,
            postalCode: patient.postalCode,
            curp: patient.curp ? patient.curp + '_NEW' : null,
            rfc: patient.rfc,
            bloodType: patient.bloodType,
            allergies: patient.allergies,
            emergencyContact: patient.emergencyContact,
            emergencyContactName: patient.emergencyContactName,
            emergencyContactPhone: patient.emergencyContactPhone,
            consentToTreatment: patient.consentToTreatment,
            consentToDataProcessing: patient.consentToDataProcessing,
            isActive: patient.isActive,
            createdBy: patient.createdBy,
            createdAt: patient.createdAt,
            updatedAt: patient.updatedAt
          }
        });

        // 2. Migrar consultas
        if (patient.consultations.length > 0) {
          console.log(`   📅 Migrando ${patient.consultations.length} consultas...`);
          
          for (const consultation of patient.consultations) {
            await tx.consultation.create({
              data: {
                id: consultation.id + '_NEW',
                patientId: newId,
                consultantId: consultation.consultantId,
                consultationDate: consultation.consultationDate,
                reason: consultation.reason,
                notes: consultation.notes,
                diagnosis: consultation.diagnosis,
                treatmentPlan: consultation.treatmentPlan,
                status: consultation.status,
                createdAt: consultation.createdAt,
                updatedAt: consultation.updatedAt
              }
            });
          }
        }

        // 3. Migrar historia médica
        if (patient.medicalHistory.length > 0) {
          console.log(`   📋 Migrando ${patient.medicalHistory.length} registros de historia médica...`);
          
          for (const history of patient.medicalHistory) {
            await tx.medicalHistory.create({
              data: {
                id: history.id + '_NEW',
                patientId: newId,
                condition: history.condition,
                diagnosedAt: history.diagnosedAt,
                status: history.status,
                notes: history.notes,
                createdAt: history.createdAt,
                updatedAt: history.updatedAt
              }
            });
          }
        }

        // 4. Migrar prescripciones
        if (patient.prescriptions.length > 0) {
          console.log(`   💊 Migrando ${patient.prescriptions.length} prescripciones...`);
          
          for (const prescription of patient.prescriptions) {
            await tx.prescription.create({
              data: {
                id: prescription.id + '_NEW',
                patientId: newId,
                doctorId: prescription.doctorId,
                medicationId: prescription.medicationId,
                dosage: prescription.dosage,
                frequency: prescription.frequency,
                duration: prescription.duration,
                instructions: prescription.instructions,
                startDate: prescription.startDate,
                endDate: prescription.endDate,
                status: prescription.status,
                createdAt: prescription.createdAt,
                updatedAt: prescription.updatedAt
              }
            });
          }
        }

        console.log(`   ✅ Datos migrados exitosamente`);
      });

      console.log(`   🗑️ Limpiando datos antiguos...`);

      // Eliminar datos antiguos en orden correcto
      await prisma.$transaction(async (tx) => {
        // Eliminar consultas antiguas
        await tx.consultation.deleteMany({
          where: { patientId: patient.id }
        });

        // Eliminar historia médica antigua
        await tx.medicalHistory.deleteMany({
          where: { patientId: patient.id }
        });

        // Eliminar prescripciones antiguas
        await tx.prescription.deleteMany({
          where: { patientId: patient.id }
        });

        // Eliminar paciente antiguo
        await tx.patient.delete({
          where: { id: patient.id }
        });
      });

      // Actualizar referencias temporales
      await prisma.$transaction(async (tx) => {
        // Actualizar medicalRecordNumber y CURP
        await tx.patient.update({
          where: { id: newId },
          data: {
            medicalRecordNumber: patient.medicalRecordNumber,
            curp: patient.curp
          }
        });

        // Actualizar IDs de consultas
        const newConsultations = await tx.consultation.findMany({
          where: { patientId: newId }
        });

        for (const consultation of newConsultations) {
          const originalId = consultation.id.replace('_NEW', '');
          await tx.consultation.update({
            where: { id: consultation.id },
            data: { id: originalId }
          });
        }

        // Actualizar IDs de historia médica
        const newHistory = await tx.medicalHistory.findMany({
          where: { patientId: newId }
        });

        for (const history of newHistory) {
          const originalId = history.id.replace('_NEW', '');
          await tx.medicalHistory.update({
            where: { id: history.id },
            data: { id: originalId }
          });
        }

        // Actualizar IDs de prescripciones
        const newPrescriptions = await tx.prescription.findMany({
          where: { patientId: newId }
        });

        for (const prescription of newPrescriptions) {
          const originalId = prescription.id.replace('_NEW', '');
          await tx.prescription.update({
            where: { id: prescription.id },
            data: { id: originalId }
          });
        }
      });

      console.log(`   ✅ Migración completa: ${patient.id} → ${newId}`);
    }

    console.log('\n🎉 Migración de IDs completada exitosamente!');
    
    // Mostrar resumen final
    const migratedPatients = await prisma.patient.findMany({
      select: {
        id: true,
        firstName: true,
        paternalLastName: true,
        _count: {
          select: {
            consultations: true,
            medicalHistory: true,
            prescriptions: true
          }
        }
      }
    });

    console.log('\n📊 Resumen de pacientes migrados:');
    migratedPatients.forEach(patient => {
      console.log(`   ${patient.id} - ${patient.firstName} ${patient.paternalLastName}`);
      console.log(`     └ ${patient._count.consultations} consultas, ${patient._count.medicalHistory} historiales, ${patient._count.prescriptions} prescripciones`);
    });

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si el archivo es llamado directamente
if (require.main === module) {
  migratePatientIds();
}

module.exports = { migratePatientIds };