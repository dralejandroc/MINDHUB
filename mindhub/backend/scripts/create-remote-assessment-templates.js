/**
 * Script para crear plantillas de mensajes predefinidas para evaluaciones remotas
 */

const { PrismaClient } = require('../generated/prisma');
const { createSystemUser } = require('../create-system-user');

const prisma = new PrismaClient();

const messageTemplates = [
  {
    name: 'Seguimiento regular',
    category: 'followup',
    messageTemplate: 'Como parte del seguimiento acordado en su última consulta, le solicito complete esta evaluación que nos ayudará a monitorear su progreso y ajustar su tratamiento de ser necesario.'
  },
  {
    name: 'Pre-cita médica',
    category: 'pre_appointment',
    messageTemplate: 'Para tener mayor información disponible para su próxima cita, le agradecería completar esta evaluación. Esto nos permitirá optimizar el tiempo de consulta y brindarle mejor atención.'
  },
  {
    name: 'Evaluación inicial',
    category: 'initial',
    messageTemplate: 'Como parte de su proceso de evaluación inicial, es importante que complete este cuestionario que nos proporcionará información valiosa para establecer su plan de tratamiento.'
  },
  {
    name: 'Post-consulta',
    category: 'post_appointment',
    messageTemplate: 'Siguiendo lo acordado en nuestra sesión de hoy, le envío esta evaluación como parte de las evaluaciones pendientes que acordamos para completar su proceso diagnóstico.'
  },
  {
    name: 'Monitoreo de síntomas',
    category: 'followup',
    messageTemplate: 'Como parte del monitoreo continuo de su estado clínico, le solicito complete esta evaluación que nos ayudará a evaluar la evolución de sus síntomas.'
  },
  {
    name: 'Evaluación de tratamiento',
    category: 'followup',
    messageTemplate: 'Para evaluar la efectividad del tratamiento que está recibiendo, es importante que complete esta evaluación que nos permitirá hacer los ajustes necesarios.'
  }
];

async function createTemplates() {
  try {
    console.log('🚀 Creando plantillas de mensajes para evaluaciones remotas...');
    
    // Obtener o crear usuario del sistema
    const systemUserId = await createSystemUser();
    console.log(`✅ Usuario del sistema: ${systemUserId}`);
    
    // Verificar si ya existen plantillas
    const existingTemplates = await prisma.remoteAssessmentMessageTemplate.count();
    
    if (existingTemplates > 0) {
      console.log(`⚠️  Ya existen ${existingTemplates} plantillas. Omitiendo creación.`);
      return;
    }
    
    // Crear plantillas
    const results = await Promise.all(
      messageTemplates.map(template => 
        prisma.remoteAssessmentMessageTemplate.create({
          data: {
            ...template,
            createdBy: systemUserId,
            isActive: true
          }
        })
      )
    );
    
    console.log(`✅ ${results.length} plantillas de mensajes creadas exitosamente:`);
    results.forEach((template, index) => {
      console.log(`   ${index + 1}. ${template.name} (${template.category})`);
    });
    
    console.log('\n📋 Plantillas disponibles:');
    console.log('- Seguimiento regular');
    console.log('- Pre-cita médica');
    console.log('- Evaluación inicial');  
    console.log('- Post-consulta');
    console.log('- Monitoreo de síntomas');
    console.log('- Evaluación de tratamiento');
    
  } catch (error) {
    console.error('❌ Error creando plantillas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script si se llama directamente
if (require.main === module) {
  createTemplates()
    .then(() => {
      console.log('\n✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error ejecutando script:', error);
      process.exit(1);
    });
}

module.exports = { createTemplates };