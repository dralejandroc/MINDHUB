/**
 * Create schedule_configurations table and migrate existing data
 */

const { PrismaClient } = require('./generated/prisma');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function createScheduleTable() {
  try {
    console.log('🔧 Creating schedule_configurations table...');
    
    // Create the table using raw SQL
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS \`schedule_configurations\` (
        \`id\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`userId\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`workingHoursStart\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`workingHoursEnd\` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`lunchBreakEnabled\` tinyint(1) NOT NULL DEFAULT '0',
        \`lunchBreakStart\` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        \`lunchBreakEnd\` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        \`workingDays\` json NOT NULL,
        \`defaultAppointmentDuration\` int NOT NULL DEFAULT '60',
        \`consultationTypes\` json NOT NULL,
        \`blockedDates\` json NOT NULL DEFAULT (json_array()),
        \`maxDailyAppointments\` int NOT NULL DEFAULT '20',
        \`bufferTime\` int NOT NULL DEFAULT '0',
        \`reminders\` json NOT NULL,
        \`createdAt\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`schedule_configurations_userId_key\` (\`userId\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    console.log('✅ Table created successfully');
    
    // Migrate existing file-based configurations
    console.log('📁 Migrating existing file-based configurations...');
    
    const configDir = path.join(process.cwd(), 'data', 'schedule-configs');
    
    try {
      const files = await fs.readdir(configDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(configDir, file);
          const configData = JSON.parse(await fs.readFile(filePath, 'utf-8'));
          
          const userId = file.replace('.json', '');
          
          const config = {
            id: uuidv4(),
            userId: userId,
            workingHoursStart: configData.workingHours?.start || '09:00',
            workingHoursEnd: configData.workingHours?.end || '18:00',
            lunchBreakEnabled: configData.lunchBreak?.enabled || false,
            lunchBreakStart: configData.lunchBreak?.start || null,
            lunchBreakEnd: configData.lunchBreak?.end || null,
            workingDays: configData.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            defaultAppointmentDuration: configData.defaultAppointmentDuration || 60,
            consultationTypes: configData.consultationTypes || [],
            blockedDates: configData.blockedDates || [],
            maxDailyAppointments: configData.maxDailyAppointments || 20,
            bufferTime: configData.bufferTime || 0,
            reminders: configData.reminders || {
              whatsapp: { enabled: false, template: "", hoursBeforeAppointment: 24 },
              email: { enabled: false, template: "", hoursBeforeAppointment: 24 }
            }
          };
          
          // Insert configuration
          await prisma.scheduleConfiguration.create({
            data: config
          });
          
          console.log(`✅ Migrated configuration for user: ${userId}`);
        }
      }
    } catch (migrationError) {
      console.log('⚠️  No existing configurations to migrate or migration failed:', migrationError.message);
    }
    
    console.log('🎉 Schedule configurations table setup complete!');
    
  } catch (error) {
    console.error('❌ Error creating schedule table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  createScheduleTable().catch(console.error);
}

module.exports = { createScheduleTable };