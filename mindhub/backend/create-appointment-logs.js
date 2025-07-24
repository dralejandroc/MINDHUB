const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();

async function createAppointmentLogsTables() {
  try {
    console.log('🔧 Creating appointment logs tables...');

    // Create appointment_logs table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS appointment_logs (
        id VARCHAR(255) PRIMARY KEY,
        appointment_id VARCHAR(255),
        patient_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        action VARCHAR(50) NOT NULL,
        previous_data TEXT,
        new_data TEXT,
        changes TEXT,
        reason TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_patient_id (patient_id),
        INDEX idx_appointment_id (appointment_id),
        INDEX idx_user_id (user_id),
        INDEX idx_action (action),
        INDEX idx_created_at (created_at)
      )
    `;

    // Create patient_alerts table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS patient_alerts (
        id VARCHAR(255) PRIMARY KEY,
        patient_id VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        metadata TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        acknowledged_by VARCHAR(255),
        acknowledged_at DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_patient_id (patient_id),
        INDEX idx_type (type),
        INDEX idx_severity (severity),
        INDEX idx_is_active (is_active),
        INDEX idx_created_at (created_at)
      )
    `;

    console.log('✅ Tables created successfully');

    // Insert sample logs
    const sampleLogs = [
      {
        id: 'log-sample-1',
        appointment_id: 'apt-001',
        patient_id: 'EXP-2025-0003',
        user_id: 'user-dr-alejandro',
        user_name: 'Dr. Alejandro Contreras',
        action: 'created',
        new_data: JSON.stringify({
          date: '2025-01-15',
          time: '10:00',
          type: 'Evaluación inicial',
          status: 'confirmed'
        }),
        created_at: new Date('2025-01-15T09:00:00')
      },
      {
        id: 'log-sample-2',
        appointment_id: 'apt-002',
        patient_id: 'EXP-2025-0004',
        user_id: 'user-dr-alejandro',
        user_name: 'Dr. Alejandro Contreras',
        action: 'created',
        new_data: JSON.stringify({
          date: '2025-01-20',
          time: '14:30',
          type: 'Seguimiento',
          status: 'confirmed'
        }),
        created_at: new Date('2025-01-20T13:30:00')
      }
    ];

    // Insert sample logs using raw SQL to avoid Prisma schema issues
    for (const log of sampleLogs) {
      await prisma.$executeRaw`
        INSERT IGNORE INTO appointment_logs 
        (id, appointment_id, patient_id, user_id, user_name, action, new_data, created_at) 
        VALUES (${log.id}, ${log.appointment_id}, ${log.patient_id}, ${log.user_id}, ${log.user_name}, ${log.action}, ${log.new_data}, ${log.created_at})
      `;
    }

    console.log('✅ Sample data inserted');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAppointmentLogsTables();