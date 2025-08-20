const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function checkAppointments() {
  try {
    // Find user by email
    const user = await prisma.user.findFirst({
      where: { email: 'dr_aleks_c@hotmail.com' }
    });
    
    if (!user) {
      console.log('User not found with email dr_aleks_c@hotmail.com');
      
      // Let's see what users exist
      const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true }
      });
      console.log('Available users:', users);
      return;
    }
    
    console.log('User found:', user.email, user.name, 'ID:', user.id);
    
    // Check consultations for this user
    const consultations = await prisma.consultation.findMany({
      where: { consultantId: user.id },
      include: {
        patient: {
          select: { firstName: true, lastName: true }
        }
      }
    });
    
    console.log('Consultations found:', consultations.length);
    consultations.forEach(c => {
      console.log('- Date:', c.consultationDate, 'Patient:', c.patient.firstName, c.patient.lastName, 'Status:', c.status);
    });
    
    // Also check if there are any consultations at all
    const allConsultations = await prisma.consultation.findMany({
      include: {
        patient: { select: { firstName: true, lastName: true } },
        consultant: { select: { email: true, name: true } }
      }
    });
    
    console.log('\nAll consultations in system:', allConsultations.length);
    allConsultations.forEach(c => {
      console.log('- Date:', c.consultationDate, 
                  'Patient:', c.patient.firstName, c.patient.lastName,
                  'Doctor:', c.consultant.email,
                  'Status:', c.status);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAppointments();